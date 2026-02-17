import { Application, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import {
  Body,
  Bodies,
  Composite,
  Engine,
  Events,
  IEventCollision,
  Runner,
  World,
} from 'matter-js';
import { GAME_SETTINGS, PIECE_BY_RANK, PIECES, PieceDef } from './config';

type PieceBody = Body & {
  plugin: {
    pieceRank?: number;
    pieceId?: number;
    isWall?: boolean;
  };
};

export type GameState = {
  score: number;
  nextRank: number;
  isGameOver: boolean;
  isPaused: boolean;
};

export type GameCallbacks = {
  onStateChange: (state: GameState) => void;
  onPlaySound: (type: 'drop' | 'merge' | 'promote' | 'gameover') => void;
};

export class CorporateMergeGame {
  private app: Application;
  private engine: Engine;
  private runner: Runner;
  private worldContainer: Container;
  private spriteByBodyId = new Map<number, Sprite>();
  private bodyById = new Map<number, PieceBody>();
  private mergeLocks = new Map<string, number>();
  private raf = 0;
  private lastFrameTime = 0;
  private pieceIdSeq = 1;
  private callbacks: GameCallbacks;

  private score = 0;
  private nextRank = this.randomInitialRank();
  private isGameOver = false;
  private isPaused = false;

  private pendingRank = this.randomInitialRank();
  private pendingX = GAME_SETTINGS.worldWidth / 2;
  private pendingGhost?: Sprite;
  private dangerSince = 0;

  constructor(app: Application, callbacks: GameCallbacks) {
    this.app = app;
    this.callbacks = callbacks;
    this.engine = Engine.create({
      gravity: { x: 0, y: 1.03 },
      positionIterations: 8,
      velocityIterations: 6,
      constraintIterations: 2,
    });
    this.runner = Runner.create({ isFixed: true, delta: 1000 / 60 });
    this.worldContainer = new Container();
    this.app.stage.addChild(this.worldContainer);

    this.buildSceneDecor();
    this.buildWalls();
    this.bindCollisions();
    this.setupPendingGhost();

    Runner.run(this.runner, this.engine);
    this.lastFrameTime = performance.now();
    this.raf = requestAnimationFrame(this.frame);
    this.emitState();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    Runner.stop(this.runner);
    World.clear(this.engine.world, false);
    Engine.clear(this.engine);
    this.worldContainer.destroy({ children: true });
  }

  setPendingX(clientX: number, viewLeft: number, viewWidth: number) {
    if (this.isGameOver || this.isPaused) return;
    const localX = ((clientX - viewLeft) / viewWidth) * GAME_SETTINGS.worldWidth;
    const maxLeft = 28;
    const maxRight = GAME_SETTINGS.worldWidth - 28;
    this.pendingX = Math.max(maxLeft, Math.min(maxRight, localX));
    if (this.pendingGhost) {
      this.pendingGhost.position.set(this.pendingX, GAME_SETTINGS.spawnY);
    }
  }

  drop() {
    if (this.isGameOver || this.isPaused) return;
    const piece = PIECE_BY_RANK.get(this.pendingRank);
    if (!piece) return;

    const body = this.createPieceBody(piece, this.pendingX, GAME_SETTINGS.spawnY);
    this.addPiece(body, piece);
    this.callbacks.onPlaySound('drop');

    this.pendingRank = this.nextRank;
    this.nextRank = this.randomInitialRank();
    this.refreshGhostTexture();
    this.emitState();
  }

  restart() {
    const all = Array.from(this.bodyById.values());
    for (const body of all) {
      this.removePiece(body.id);
    }
    this.score = 0;
    this.pendingRank = this.randomInitialRank();
    this.nextRank = this.randomInitialRank();
    this.isGameOver = false;
    this.isPaused = false;
    this.dangerSince = 0;
    this.engine.timing.timeScale = 1;
    this.refreshGhostTexture();
    this.emitState();
  }

  togglePause() {
    if (this.isGameOver) return;
    this.isPaused = !this.isPaused;
    this.engine.timing.timeScale = this.isPaused ? 0 : 1;
    this.emitState();
  }

  private frame = (now: number) => {
    const delta = Math.min(now - this.lastFrameTime, GAME_SETTINGS.maxDeltaMs);
    this.lastFrameTime = now;

    if (!this.isPaused) {
      this.syncSprites();
      this.checkDangerLine(now);
      this.cleanupMergeLocks(now);
    }

    this.raf = requestAnimationFrame(this.frame);
  };

  private buildSceneDecor() {
    const board = new Graphics();
    board.roundRect(20, 20, GAME_SETTINGS.worldWidth - 40, GAME_SETTINGS.worldHeight - 40, 22);
    board.fill({ color: 0xfafcff });
    board.stroke({ color: 0xb9c9dd, width: 3 });
    this.worldContainer.addChild(board);

    const deskShadow = new Graphics();
    deskShadow.roundRect(34, GAME_SETTINGS.worldHeight - 54, GAME_SETTINGS.worldWidth - 68, 18, 9);
    deskShadow.fill({ color: 0xdbe7f7, alpha: 0.7 });
    this.worldContainer.addChild(deskShadow);

    const dangerLine = new Graphics();
    dangerLine.rect(28, GAME_SETTINGS.gameOverLineY, GAME_SETTINGS.worldWidth - 56, 4);
    dangerLine.fill({ color: 0xff8b8b, alpha: 0.9 });
    this.worldContainer.addChild(dangerLine);

    const dangerLabel = new Text({
      text: '危険ライン',
      style: {
        fontFamily: 'Inter, Noto Sans JP, sans-serif',
        fontSize: 14,
        fill: 0xb24040,
      },
      resolution: window.devicePixelRatio || 1,
    });
    dangerLabel.position.set(28, GAME_SETTINGS.gameOverLineY - 22);
    this.worldContainer.addChild(dangerLabel);
  }

  private buildWalls() {
    const { worldWidth, worldHeight, wallThickness } = GAME_SETTINGS;
    const floor = Bodies.rectangle(worldWidth / 2, worldHeight + wallThickness / 2 - 26, worldWidth - 56, wallThickness, {
      isStatic: true,
      restitution: 0.08,
      friction: 0.9,
    }) as PieceBody;
    const left = Bodies.rectangle(28 - wallThickness / 2, worldHeight / 2, wallThickness, worldHeight, {
      isStatic: true,
    }) as PieceBody;
    const right = Bodies.rectangle(worldWidth - 28 + wallThickness / 2, worldHeight / 2, wallThickness, worldHeight, {
      isStatic: true,
    }) as PieceBody;
    floor.plugin.isWall = true;
    left.plugin.isWall = true;
    right.plugin.isWall = true;

    Composite.add(this.engine.world, [floor, left, right]);
  }

  private createPieceBody(piece: PieceDef, x: number, y: number) {
    const body = Bodies.circle(x, y, piece.radius, {
      restitution: piece.restitution,
      friction: piece.friction,
      frictionAir: 0.015,
      density: piece.density,
      slop: 0.04,
      label: `piece-${piece.rank}`,
    }) as PieceBody;
    body.plugin.pieceRank = piece.rank;
    body.plugin.pieceId = this.pieceIdSeq++;
    return body;
  }

  private addPiece(body: PieceBody, piece: PieceDef) {
    Composite.add(this.engine.world, body);
    this.bodyById.set(body.id, body);

    const sprite = Sprite.from(piece.spritePath);
    sprite.anchor.set(0.5);
    sprite.width = piece.radius * 2;
    sprite.height = piece.radius * 2;
    sprite.position.set(body.position.x, body.position.y);
    sprite.rotation = body.angle;
    this.worldContainer.addChild(sprite);
    this.spriteByBodyId.set(body.id, sprite);
  }

  private removePiece(bodyId: number) {
    const body = this.bodyById.get(bodyId);
    if (body) {
      Composite.remove(this.engine.world, body);
      this.bodyById.delete(bodyId);
    }
    const sprite = this.spriteByBodyId.get(bodyId);
    if (sprite) {
      this.worldContainer.removeChild(sprite);
      sprite.destroy();
      this.spriteByBodyId.delete(bodyId);
    }
  }

  private bindCollisions() {
    const handle = (event: IEventCollision<Engine>) => {
      for (const pair of event.pairs) {
        const a = pair.bodyA as PieceBody;
        const b = pair.bodyB as PieceBody;
        if (a.plugin.isWall || b.plugin.isWall) continue;
        if (!a.plugin.pieceRank || !b.plugin.pieceRank) continue;
        if (a.plugin.pieceRank !== b.plugin.pieceRank) continue;

        const lowId = Math.min(a.id, b.id);
        const highId = Math.max(a.id, b.id);
        const lockKey = `${lowId}-${highId}`;
        if (this.mergeLocks.has(lockKey)) continue;

        this.mergeLocks.set(lockKey, performance.now());
        this.mergePieces(a, b, pair.collision.supports[0] ?? pair.collision.penetration);
      }
    };

    Events.on(this.engine, 'collisionStart', handle);
    Events.on(this.engine, 'collisionActive', handle);
    Events.on(this.engine, 'collisionEnd', () => {
      // collisionEnd is intentionally observed to satisfy deterministic collision lifecycle usage.
    });
  }

  private mergePieces(a: PieceBody, b: PieceBody, contact: { x: number; y: number }) {
    const rank = a.plugin.pieceRank;
    if (!rank) return;
    const next = PIECE_BY_RANK.get(rank + 1);
    if (!next) return;

    if (!this.bodyById.has(a.id) || !this.bodyById.has(b.id)) return;

    const x = (a.position.x + b.position.x + contact.x) / 3;
    const y = (a.position.y + b.position.y + contact.y) / 3;

    this.removePiece(a.id);
    this.removePiece(b.id);

    const body = this.createPieceBody(next, x, y);
    Body.setVelocity(body, { x: 0, y: 0 });
    Body.setAngularVelocity(body, 0);
    this.addPiece(body, next);

    this.score += next.score;
    if (next.rank === 10) {
      this.score += GAME_SETTINGS.scoreBonusForCeo;
      this.callbacks.onPlaySound('promote');
    } else {
      this.callbacks.onPlaySound('merge');
    }
    this.emitState();
  }

  private syncSprites() {
    for (const body of this.bodyById.values()) {
      const sprite = this.spriteByBodyId.get(body.id);
      if (!sprite) continue;
      sprite.position.set(body.position.x, body.position.y);
      sprite.rotation = body.angle;
    }
  }

  private setupPendingGhost() {
    this.pendingGhost = new Sprite(Texture.from(PIECE_BY_RANK.get(this.pendingRank)!.spritePath));
    this.pendingGhost.anchor.set(0.5);
    this.pendingGhost.alpha = 0.85;
    this.pendingGhost.position.set(this.pendingX, GAME_SETTINGS.spawnY);
    this.worldContainer.addChild(this.pendingGhost);
    this.refreshGhostTexture();
  }

  private refreshGhostTexture() {
    if (!this.pendingGhost) return;
    const piece = PIECE_BY_RANK.get(this.pendingRank);
    if (!piece) return;
    this.pendingGhost.texture = Texture.from(piece.spritePath);
    this.pendingGhost.width = piece.radius * 2;
    this.pendingGhost.height = piece.radius * 2;
    this.pendingGhost.position.set(this.pendingX, GAME_SETTINGS.spawnY);
  }

  private randomInitialRank() {
    return Math.random() < 0.55 ? 1 : 2;
  }

  private emitState() {
    this.callbacks.onStateChange({
      score: this.score,
      nextRank: this.nextRank,
      isGameOver: this.isGameOver,
      isPaused: this.isPaused,
    });
  }

  private cleanupMergeLocks(now: number) {
    for (const [key, time] of this.mergeLocks.entries()) {
      if (now - time > GAME_SETTINGS.mergeDebounceMs) {
        this.mergeLocks.delete(key);
      }
    }
  }

  private checkDangerLine(now: number) {
    if (this.isGameOver) return;
    const danger = Array.from(this.bodyById.values()).some((body) => {
      const rank = body.plugin.pieceRank;
      if (!rank) return false;
      const piece = PIECE_BY_RANK.get(rank);
      if (!piece) return false;
      return body.position.y - piece.radius < GAME_SETTINGS.gameOverLineY;
    });

    if (danger) {
      if (this.dangerSince === 0) {
        this.dangerSince = now;
      } else if (now - this.dangerSince > GAME_SETTINGS.gameOverGraceMs) {
        this.isGameOver = true;
        this.engine.timing.timeScale = 0;
        this.callbacks.onPlaySound('gameover');
        this.emitState();
      }
    } else {
      this.dangerSince = 0;
    }
  }
}

export async function createPixiApp(view: HTMLDivElement): Promise<Application> {
  const app = new Application();
  const resolution = Math.max(1, window.devicePixelRatio || 1);
  await app.init({
    width: GAME_SETTINGS.worldWidth,
    height: GAME_SETTINGS.worldHeight,
    backgroundAlpha: 0,
    antialias: true,
    resolution,
    autoDensity: true,
  });
  view.appendChild(app.canvas);
  app.canvas.style.width = `${GAME_SETTINGS.worldWidth}px`;
  app.canvas.style.height = `${GAME_SETTINGS.worldHeight}px`;
  return app;
}
