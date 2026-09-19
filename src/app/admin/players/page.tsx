import PlayerList from '@/components/player-list';
export default function AdminPlayers() {
  return (
    <>
      <div className="info-note section">
        개발용 운영자 편집 화면입니다. 실제 운영자 권한 검증은 아직 적용되지 않았습니다.
      </div>
      <PlayerList administrative />
    </>
  );
}
