import PlayerList from '@/components/player-list';
import { AdminGuard } from '@/components/admin-auth';
export default function AdminPlayers() {
  return (
    <AdminGuard>
      <PlayerList administrative />
    </AdminGuard>
  );
}
