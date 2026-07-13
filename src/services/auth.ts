import { AuthResponse, LoginRequest, SignupRequest } from "@/types/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// 로그인/회원가입 시점엔 아직 accessToken이 없으므로 fetchWithAuth(services/api.ts) 대신
// 일반 fetch를 사용한다. credentials:"include"는 프로덕션에서 BE가 내려주는
// httpOnly refreshToken 쿠키를 받기 위함 (개발 환경은 body의 refreshToken을 그대로 씀).
export const signup = async (body: SignupRequest): Promise<AuthResponse> => {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = await res.json();
  // BE(auth.controller)는 에러를 { message } 형태로 내려줌
  if (!res.ok) throw new Error(data.message ?? "회원가입에 실패했습니다");
  return data;
};

export const login = async (body: LoginRequest): Promise<AuthResponse> => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "로그인에 실패했습니다");
  return data;
};
