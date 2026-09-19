'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { usePlatform } from '@/components/provider';
import { Empty, MatchCard, PageHeading, statusLabels } from '@/components/ui';
export default function Matches() {
  return (
    <Suspense fallback={<p>경기를 불러오는 중입니다.</p>}>
      <MatchList />
    </Suspense>
  );
}
function MatchList() {
  const { data } = usePlatform();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(searchParams.get('status') ?? 'ALL');
  const [query, setQuery] = useState('');
  const matches = data.matches.filter(
    (m) =>
      (status === 'ALL' || m.status === status) &&
      m.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="MATCH ROOM"
        title="내전 경기"
        description="다음 경기를 준비하고, 함께한 한 판을 기록하세요."
        action={
          <Link href="/matches/create" className="button primary">
            <Plus size={18} />
            내전 만들기
          </Link>
        }
      />
      <div className="toolbar">
        <div className="tabs" aria-label="경기 상태">
          {[['ALL', '전체'], ...Object.entries(statusLabels)].map(([value, label]) => (
            <button
              key={value}
              className={status === value ? 'selected' : ''}
              onClick={() => setStatus(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          className="match-search"
          aria-label="경기 검색"
          placeholder="경기 이름 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="match-grid three">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
        {!matches.length && <Empty text="해당하는 경기가 없습니다. 새 내전을 만들어보세요." />}
      </div>
    </>
  );
}
