'use client';
import Link from 'next/link';
import { usePlatform } from '@/components/provider';
import { PageHeading } from '@/components/ui';
export default function Admin() {
  const { data } = usePlatform();
  return (
    <>
      <PageHeading
        eyebrow="ADMINISTRATION"
        title="운영자 워크스페이스"
        description="선수 정보를 조정하고 커뮤니티 경기를 관리하세요."
        action={
          <Link href="/owner" className="button">
            시스템 설정
          </Link>
        }
      />
      <div className="info-note">
        개발용 운영 화면입니다. 실제 로그인이나 권한 검증은 적용되어 있지 않습니다.
      </div>
      <div className="management-grid section">
        {[
          {
            title: '선수 및 레이팅',
            description: `등록 선수 ${data.players.length}명 · Riot Tier, 내부 레이팅, 운영자 보정`,
            href: '/admin/players',
          },
          {
            title: '경기 관리',
            description: `전체 ${data.matches.length}경기 · 참가자와 결과 확인`,
            href: '/matches',
          },
          {
            title: '이벤트 및 출석',
            description: '참가 신청, 대기 명단, 출석 상태 관리',
            href: '/events',
          },
        ].map((c) => (
          <Link href={c.href} className="panel padded" key={c.href}>
            <h2>{c.title} ↗</h2>
            <p className="muted">{c.description}</p>
          </Link>
        ))}
      </div>
      <section className="panel padded">
        <h2>향후 운영 기능</h2>
        <p className="muted">결과 정정 · 포지션 레이팅 · 페널티 관리는 이후 버전에 추가됩니다.</p>
      </section>
    </>
  );
}
