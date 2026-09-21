import { PageHeading } from '@/components/ui';
import { OwnerGuard } from '@/components/admin-auth';
export default function Owner() {
  return (
    <OwnerGuard>
      <PageHeading
        eyebrow="OWNER SETTINGS"
        title="시스템 설정"
        description="전체 서비스 설정을 위한 확장 공간입니다."
      />
      <div className="info-note">시스템 관리는 OWNER 계정만 사용할 수 있습니다.</div>
      <div className="management-grid section">
        {['운영자 계정', '밸런스 설정', '출석 정책', '감사 로그', '유지보수'].map((label) => (
          <section className="panel padded" key={label}>
            <h2>{label}</h2>
            <p className="muted">향후 버전에서 제공 예정</p>
          </section>
        ))}
      </div>
    </OwnerGuard>
  );
}
