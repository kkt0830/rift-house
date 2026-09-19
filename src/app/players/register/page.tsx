'use client';
import { useRouter } from 'next/navigation';
import { usePlatform } from '@/components/provider';
import { PlayerForm } from '@/components/player-form';
import { PageHeading } from '@/components/ui';
export default function Register() {
  const { pendingName, selectProfile } = usePlatform();
  const router = useRouter();
  return (
    <div className="registration-page">
      <PageHeading
        eyebrow="JOIN THE COMMUNITY"
        title="내 선수 프로필 등록"
        description="티어와 포지션을 알려주세요. 시작 레이팅은 티어에 맞춰 자동으로 설정됩니다."
      />
      <section className="panel padded">
        <PlayerForm
          initialName={pendingName ?? undefined}
          onDone={(player) => {
            if (player) {
              selectProfile(player.id);
              router.replace(`/players/${player.id}`);
            } else router.replace('/');
          }}
        />
      </section>
    </div>
  );
}
