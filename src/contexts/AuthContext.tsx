"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (accessToken: string, user: User, refreshToken?: string) => void;
  logout: () => void;
  isLoggedIn: boolean;
  // localStorage에서 로그인 상태를 복원하는 마운트 useEffect가 끝났는지 여부.
  // React는 자식의 useEffect를 부모(AuthProvider)보다 먼저 실행하므로, 하드 리로드 시
  // "로그인 안 했으면 /login으로" 같은 가드를 자식 페이지의 useEffect에 그대로 넣으면
  // 이 복원이 끝나기 전(아직 isLoggedIn이 초기값 false인) 순간에 먼저 실행되어,
  // 실제로는 로그인된 사용자도 로그인 페이지로 튕겨나가는 문제가 생긴다.
  // 가드를 쓰는 페이지는 이 값이 true가 될 때까지 리다이렉트 판단을 보류해야 한다.
  isInitialized: boolean;
}

// localhost 포함 개발 환경이면 true
const IS_DEV =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const accessToken = localStorage.getItem("accessToken");
    if (savedUser && accessToken) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
    // 로그인 상태든 아니든, 복원 시도가 끝났다는 것만 알려주면 된다.
    setIsInitialized(true);
  }, []);

  const login = (accessToken: string, user: User, refreshToken?: string) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("user", JSON.stringify(user));

    // 개발(localhost): refreshToken도 localStorage에
    // 프로덕션: BE가 httpOnly 쿠키로 설정하므로 FE에서 별도 저장 불필요
    if (IS_DEV && refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }

    setUser(user);
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include", // 프로덕션에서 쿠키 전송
    });

    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    if (IS_DEV) localStorage.removeItem("refreshToken");

    setUser(null);
    setIsLoggedIn(false);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isLoggedIn, isInitialized }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
