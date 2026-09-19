import type { Metadata } from 'next';
import './globals.css';
import { PlatformProvider } from '@/components/provider';
import { Shell } from '@/components/shell';
import { EntryGate } from '@/components/entry-gate';
export const metadata: Metadata = {
  title: 'RIFTHOUSE | 우리들의 내전',
  description: '선수 관리부터 균형 잡힌 팀 구성, 시리즈 결과까지. LoL 커뮤니티 내전 관리 플랫폼.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <PlatformProvider>
          <EntryGate>
            <Shell>{children}</Shell>
          </EntryGate>
        </PlatformProvider>
      </body>
    </html>
  );
}
