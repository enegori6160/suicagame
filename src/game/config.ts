export type PieceDef = {
  rank: number;
  id: string;
  name: string;
  radius: number;
  density: number;
  restitution: number;
  friction: number;
  spritePath: string;
  score: number;
};

export const PIECES: PieceDef[] = [
  { rank: 1, id: 'junior', name: '新入社員', radius: 24, density: 0.0012, restitution: 0.16, friction: 0.05, spritePath: '/assets/rank-1.svg', score: 10 },
  { rank: 2, id: 'associate', name: '若手', radius: 27, density: 0.0013, restitution: 0.15, friction: 0.05, spritePath: '/assets/rank-2.svg', score: 20 },
  { rank: 3, id: 'core', name: '中堅', radius: 30, density: 0.00135, restitution: 0.14, friction: 0.055, spritePath: '/assets/rank-3.svg', score: 35 },
  { rank: 4, id: 'leader', name: 'リーダー', radius: 33, density: 0.0014, restitution: 0.14, friction: 0.06, spritePath: '/assets/rank-4.svg', score: 55 },
  { rank: 5, id: 'chief', name: '係長', radius: 36, density: 0.00145, restitution: 0.13, friction: 0.065, spritePath: '/assets/rank-5.svg', score: 80 },
  { rank: 6, id: 'manager', name: '課長', radius: 39, density: 0.0015, restitution: 0.12, friction: 0.07, spritePath: '/assets/rank-6.svg', score: 120 },
  { rank: 7, id: 'director', name: '部長', radius: 42, density: 0.00155, restitution: 0.11, friction: 0.075, spritePath: '/assets/rank-7.svg', score: 180 },
  { rank: 8, id: 'vp', name: '本部長', radius: 45, density: 0.0016, restitution: 0.11, friction: 0.08, spritePath: '/assets/rank-8.svg', score: 260 },
  { rank: 9, id: 'executive', name: '役員', radius: 48, density: 0.0017, restitution: 0.1, friction: 0.085, spritePath: '/assets/rank-9.svg', score: 360 },
  { rank: 10, id: 'ceo', name: '社長', radius: 52, density: 0.0018, restitution: 0.1, friction: 0.09, spritePath: '/assets/rank-10.svg', score: 500 },
];

export const PIECE_BY_RANK = new Map(PIECES.map((piece) => [piece.rank, piece]));

export const GAME_SETTINGS = {
  worldWidth: 440,
  worldHeight: 720,
  wallThickness: 36,
  spawnY: 76,
  dropCooldownMs: 240,
  mergeDebounceMs: 120,
  gameOverLineY: 132,
  gameOverGraceMs: 2500,
  maxDeltaMs: 1000 / 30,
  scoreBonusForCeo: 1200,
};
