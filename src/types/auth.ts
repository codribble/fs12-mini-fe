// 회원가입 요청 바디: BE auth.controller의 signup이 받는 필드와 동일해야 함
export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

// 로그인 요청 바디
export interface LoginRequest {
  email: string;
  password: string;
}

// 회원가입/로그인 공통 응답 타입
// - accessToken: 항상 응답 body로 내려옴
// - refreshToken: 개발 환경(localhost)에서만 body로 내려옴, 프로덕션은 httpOnly 쿠키로 전달되어 body에 없음
// - user: 로그인 응답에만 포함됨 (회원가입 응답에는 없음 → signup 후에는 로그인 페이지로 보내야 함)
export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}
