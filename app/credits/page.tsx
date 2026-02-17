import Link from 'next/link';

export default function CreditsPage() {
  return (
    <main className="page">
      <section className="card" style={{ display: 'grid', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Credits</h1>
        <p style={{ margin: 0 }}>このゲームは以下のライブラリを利用しています。</p>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          <li>Next.js (App Router)</li>
          <li>PixiJS</li>
          <li>Matter.js</li>
        </ul>
        <Link href="/" className="btn secondary" style={{ textDecoration: 'none', width: 'fit-content' }}>
          戻る
        </Link>
      </section>
    </main>
  );
}
