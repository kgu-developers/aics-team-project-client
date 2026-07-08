import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { QueryProvider } from './providers/query-provider';

import './globals.css';

export const metadata: Metadata = {
  title: 'AICS OOP Team Project',
  description: 'OOP 강의 팀 프로젝트 운영 도구',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='ko'>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
