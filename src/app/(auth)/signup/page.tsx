"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSignup } from "@/hooks/queries/useAuth";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();
  const { mutate, isPending, isError, error } = useSignup();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    mutate(
      { name, email, password },
      {
        // 회원가입 응답에는 user 정보가 없어(types/auth.ts 참고) 바로 로그인시킬 수 없으므로
        // 로그인 페이지로 보내 별도로 로그인하게 한다.
        onSuccess: () => {
          router.push("/login");
        },
      }
    );
  };

  return (
    <main>
      <h1>회원가입</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">이름</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
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
          {isPending ? "가입 중..." : "회원가입"}
        </button>
      </form>

      <p>
        이미 계정이 있으신가요? <Link href="/login">로그인</Link>
      </p>
    </main>
  );
}
