import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="empty">
      <h1>페이지를 찾을 수 없습니다.</h1>
      <Link href="/" className="button">
        대시보드로 돌아가기
      </Link>
    </div>
  );
}
