'use client';
import Link from 'next/link';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { usePlatform } from '@/components/provider';
import { Empty, formatDate, PageHeading } from '@/components/ui';
export default function Events() {
  const { data } = usePlatform();
  return (
    <>
      <PageHeading
        eyebrow="COMMUNITY EVENTS"
        title="함께 모이는 날"
        description="대규모 내전의 참가 신청과 경기 일정을 한곳에서 확인하세요."
      />
      <div className="match-grid three">
        {data.events.map((e) => (
          <Link href={`/events/${e.id}`} className="panel event-card" key={e.id}>
            <CalendarDays size={30} />
            <span className="tag">참가 신청</span>
            <h2>{e.name}</h2>
            <p>{e.description}</p>
            <small>{formatDate(e.scheduledAt)}</small>
            <div className="card-footer">
              <span>
                {e.registrations.length}명 신청 · 정원 {e.capacity}명
              </span>
              <ArrowUpRight size={20} />
            </div>
          </Link>
        ))}
      </div>
      {!data.events.length && <Empty text="등록된 이벤트가 없습니다." />}
    </>
  );
}
