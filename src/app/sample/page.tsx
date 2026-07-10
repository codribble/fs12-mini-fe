// 이 파일은 참고용 샘플입니다. 실제 구현 시 이 패턴을 따라 작성하세요.
"use client";

import { useSamples, useSample } from "@/hooks/queries/useSample";
import { useAuth } from "@/contexts/AuthContext";

export default function SamplePage() {
  // ✅ 목록 조회
  const {
    data: samples,
    isLoading: isSamplesLoading,
    isError: isSamplesError,
  } = useSamples();

  // ✅ 단건 조회
  const { data: sample, isLoading: isSampleLoading } = useSample(1);

  // ✅ AuthContext 사용
  const { user, isLoggedIn, logout } = useAuth();

  if (isSamplesLoading || isSampleLoading) return <p>로딩 중...</p>;
  if (isSamplesError) return <p>에러 발생</p>;

  return (
    <main>
      <h1>샘플 페이지</h1>

      {/* 로그인 정보 */}
      {isLoggedIn ? (
        <div>
          <p>안녕하세요, {user?.name}님</p>
          <button onClick={logout}>로그아웃</button>
        </div>
      ) : (
        <a href="/login">로그인</a>
      )}

      {/* 목록 */}
      <ul>
        {samples?.map((s) => (
          <li key={s.id}>{s.name}</li>
        ))}
      </ul>

      {/* 단건 */}
      {sample && <p>선택된 샘플: {sample.name}</p>}
    </main>
  );
}
