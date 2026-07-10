const IS_DEV =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// refresh 중복 방지
let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

const refreshAccessToken = async (): Promise<string> => {
  const body = IS_DEV
    ? JSON.stringify({ refreshToken: localStorage.getItem("refreshToken") })
    : undefined;

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body,
  });

  if (!res.ok) throw new Error("refresh 실패");

  const data = await res.json();
  localStorage.setItem("accessToken", data.accessToken);
  return data.accessToken;
};

const clearAuth = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  if (IS_DEV) localStorage.removeItem("refreshToken");
  window.location.href = "/login";
};

export const fetchWithAuth = async (
  path: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = localStorage.getItem("accessToken");

  const makeRequest = (accessToken: string | null) =>
    fetch(`${BASE_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });

  const res = await makeRequest(token);

  if (res.status !== 401) return res;

  // 401 처리: accessToken 갱신 후 재시도
  if (isRefreshing) {
    return new Promise((resolve) => {
      pendingRequests.push(async (newToken) => {
        resolve(makeRequest(newToken));
      });
    });
  }

  isRefreshing = true;
  try {
    const newToken = await refreshAccessToken();
    pendingRequests.forEach((cb) => cb(newToken));
    pendingRequests = [];
    return makeRequest(newToken);
  } catch {
    clearAuth();
    throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
  } finally {
    isRefreshing = false;
  }
};
