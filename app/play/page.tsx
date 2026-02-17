import Link from 'next/link';
import GameCanvas from '@/components/GameCanvas';

export default function PlayPage() {
  return (
    <main className="page" style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 32 }}>Play</h1>
        <Link href="/" className="btn secondary" style={{ textDecoration: 'none' }}>
          タイトルへ
        </Link>
      </div>
      <GameCanvas />
    </main>
  );
}
