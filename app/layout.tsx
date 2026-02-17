import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Office Orbit Merge',
  description: '会社テーマの合体・昇進パズルゲーム',
};

import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
