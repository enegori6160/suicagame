'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPixiApp, CorporateMergeGame, GameState } from '@/game/engine';
import { PIECE_BY_RANK } from '@/game/config';

const initialState: GameState = {
  score: 0,
  nextRank: 1,
  isGameOver: false,
  isPaused: false,
};

function useOfficeSfx() {
  return useMemo(
    () => ({
      play(type: 'drop' | 'merge' | 'promote' | 'gameover') {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        if (type === 'drop') osc.frequency.value = 340;
        if (type === 'merge') osc.frequency.value = 480;
        if (type === 'promote') osc.frequency.value = 680;
        if (type === 'gameover') osc.frequency.value = 180;
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      },
    }),
    []
  );
}

export default function GameCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<CorporateMergeGame | null>(null);
  const [state, setState] = useState<GameState>(initialState);
  const sfx = useOfficeSfx();

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    createPixiApp(mount).then((app) => {
      if (disposed) {
        app.destroy(true);
        return;
      }
      gameRef.current = new CorporateMergeGame(app, {
        onStateChange: setState,
        onPlaySound: (type) => sfx.play(type),
      });
    });

    return () => {
      disposed = true;
      gameRef.current?.destroy();
      gameRef.current = null;
      mount.innerHTML = '';
    };
  }, [sfx]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        gameRef.current?.drop();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    gameRef.current?.setPendingX(event.clientX, rect.left, rect.width);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') {
      event.preventDefault();
    }
    gameRef.current?.drop();
  };

  const nextPiece = PIECE_BY_RANK.get(state.nextRank);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 240px', gap: 16 }}>
      <div
        style={{
          borderRadius: 24,
          border: '1px solid #b6c8df',
          background: 'linear-gradient(180deg, #f9fcff 0%, #eef4fc 100%)',
          boxShadow: '0 18px 32px rgba(33, 59, 90, 0.15)',
          padding: 12,
          touchAction: 'none',
          userSelect: 'none',
        }}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
      >
        <div ref={mountRef} style={{ width: 440, height: 720, margin: '0 auto' }} />
      </div>

      <aside className="card" style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Office Orbit</h2>
        <p style={{ margin: 0, color: '#47607d' }}>同じ役職をぶつけて昇進させよう。</p>

        <section style={{ border: '1px solid #d2deeb', borderRadius: 14, padding: 12 }}>
          <div style={{ fontSize: 13, color: '#5e728d' }}>SCORE</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{state.score.toLocaleString()}</div>
        </section>

        <section style={{ border: '1px solid #d2deeb', borderRadius: 14, padding: 12 }}>
          <div style={{ fontSize: 13, color: '#5e728d', marginBottom: 8 }}>NEXT</div>
          {nextPiece ? (
            <div style={{ display: 'grid', placeItems: 'center', gap: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={nextPiece.spritePath} alt={nextPiece.name} width={64} height={64} />
              <strong>{nextPiece.name}</strong>
            </div>
          ) : null}
        </section>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn secondary" onClick={() => gameRef.current?.togglePause()}>
            {state.isPaused ? '再開' : '一時停止'}
          </button>
          <button className="btn" onClick={() => gameRef.current?.restart()}>
            リスタート
          </button>
        </div>

        {state.isGameOver ? (
          <div style={{ padding: 12, borderRadius: 12, background: '#ffe7e7', color: '#a13030', fontWeight: 700 }}>
            会議室が満員です。リスタートしてください。
          </div>
        ) : null}
      </aside>
    </div>
  );
}
