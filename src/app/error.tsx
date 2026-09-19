'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty">
      <h1>화면을 불러오지 못했습니다.</h1>
      <p>다시 시도하거나 저장된 개발 데이터를 확인해 주세요.</p>
      <button onClick={reset}>다시 시도</button>
    </div>
  );
}
