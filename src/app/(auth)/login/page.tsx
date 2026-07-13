"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLogin } from "@/hooks/queries/useAuth";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();
  const { login } = useAuth();
  const { mutate, isPending, isError, error } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    mutate(
      { email, password },
      {
        onSuccess: (data) => {
          // 로그인 응답에만 user가 포함됨(타입상 optional) → AuthContext에 로그인 상태 반영
          if (data.user) {
            login(data.accessToken, data.user, data.refreshToken);
          }
          router.push("/products");
        },
      }
    );
  };

  return (
    <main>
      <h1>로그인</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">이메일</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {isError && <p>{(error as Error).message}</p>}

        <button type="submit" disabled={isPending}>
          {isPending ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <p>
        계정이 없으신가요? <Link href="/signup">회원가입</Link>
      </p>
    </main>
  );
}
