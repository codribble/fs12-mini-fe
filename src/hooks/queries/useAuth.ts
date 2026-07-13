import { useMutation } from "@tanstack/react-query";
import { signup, login } from "@/services/auth";
import { LoginRequest, SignupRequest } from "@/types/auth";

// 회원가입: 목록성 데이터가 아니라 1회성 액션이므로 useQuery가 아닌 useMutation 사용
export const useSignup = () =>
  useMutation({
    mutationFn: (body: SignupRequest) => signup(body),
  });

// 로그인: 성공 시 응답(accessToken, user, refreshToken)을 페이지에서 AuthContext.login()에 넘겨줘야 하므로
// 여기서는 mutationFn만 정의하고, 후처리(onSuccess)는 로그인 페이지 쪽 mutate 호출부에서 처리한다.
export const useLogin = () =>
  useMutation({
    mutationFn: (body: LoginRequest) => login(body),
  });
