import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="page">
      <section className="card" style={{ display: 'grid', gap: 20 }}>
        <h1 style={{ margin: 0, fontSize: 42 }}>Office Orbit Merge</h1>
        <p style={{ margin: 0, lineHeight: 1.8 }}>
          社内アイコンを落として、同じランク同士を合体。昇進を重ねて「社長」まで育てる
          オリジナル会社テーマの落下パズルです。
        </p>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          <li>PC: マウス左右移動 + クリック / スペースで落下</li>
          <li>スマホ: 左右ドラッグ + タップで落下</li>
          <li>危険ラインを超え続けるとゲームオーバー</li>
        </ul>
        <div className="menu">
          <Link href="/play" className="btn" style={{ textDecoration: 'none' }}>
            Start
          </Link>
          <Link href="/credits" className="btn secondary" style={{ textDecoration: 'none' }}>
            Credits
          </Link>
        </div>
      </section>
    </main>
  );
}
