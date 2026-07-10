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
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const accessToken = localStorage.getItem("accessToken");
    if (savedUser && accessToken) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
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
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
