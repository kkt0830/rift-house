'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, CalendarDays, Plus } from 'lucide-react';
import { usePlatform } from '@/components/provider';
import { Empty, formatDate, Modal, PageHeading } from '@/components/ui';
export default function Events() {
  const { data, isAdmin, services, run, busy } = usePlatform();
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  return (
    <>
      <PageHeading
        eyebrow="COMMUNITY EVENTS"
        title="함께 모이는 날"
        description="대규모 내전의 참가 신청과 경기 일정을 한곳에서 확인하세요."
        action={isAdmin ? <button className="primary" onClick={() => setCreating(true)}><Plus size={18} /> 이벤트 생성</button> : undefined}
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
      {creating && (
        <Modal title="새 이벤트 생성" onClose={() => setCreating(false)}>
          <form onSubmit={async (formEvent) => {
            formEvent.preventDefault();
            const values = new FormData(formEvent.currentTarget);
            const event = await run(() => services.events.create({
              name: String(values.get('name') ?? ''),
              description: String(values.get('description') ?? ''),
              scheduledAt: String(values.get('scheduledAt') ?? ''),
              capacity: Number(values.get('capacity')),
            }), '이벤트를 생성했습니다.');
            if (event) {
              setCreating(false);
              router.push(`/events/${event.id}`);
            }
          }}>
            <div className="form-grid">
              <label className="full">이벤트 이름<input name="name" required maxLength={100} /></label>
              <label className="full">설명<textarea name="description" maxLength={500} rows={4} /></label>
              <label>일정<input name="scheduledAt" type="datetime-local" required /></label>
              <label>정원<input name="capacity" type="number" min={1} max={500} defaultValue={20} required /></label>
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setCreating(false)}>취소</button>
              <button className="primary" disabled={busy}>{busy ? '생성 중…' : '이벤트 생성'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
