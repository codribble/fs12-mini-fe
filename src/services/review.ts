import { fetchWithAuth } from "./api";
import { Review, CreateReviewRequest } from "@/types/review";

// GET은 인증이 필요 없는 공개 엔드포인트지만(review.router.ts에 authMiddleware 없음),
// fetchWithAuth를 그대로 써도 무방하다 — 토큰이 없으면 그냥 Authorization 헤더 없이 요청될 뿐이고,
// product.ts의 getProducts/getProduct와 동일한 컨벤션을 유지하기 위함이다.
export const getReviews = async (productId: number): Promise<Review[]> => {
  const res = await fetchWithAuth(`/products/${productId}/reviews`);
  if (!res.ok) throw new Error("리뷰 목록 조회 실패");
  return res.json();
};

export const createReview = async (
  productId: number,
  body: CreateReviewRequest,
): Promise<Review> => {
  const res = await fetchWithAuth(`/products/${productId}/reviews`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "리뷰 등록 실패");
  return data;
};

// 수정 전용 named 타입을 새로 만들지 않고 CreateReviewRequest에서 Partial로 인라인 파생한다
// (product.ts의 updateProduct와 동일한 컨벤션).
export const updateReview = async (
  productId: number,
  reviewId: number,
  body: Partial<CreateReviewRequest>,
): Promise<Review> => {
  const res = await fetchWithAuth(
    `/products/${productId}/reviews/${reviewId}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "리뷰 수정 실패");
  return data;
};

export const deleteReview = async (
  productId: number,
  reviewId: number,
): Promise<{ message: string }> => {
  const res = await fetchWithAuth(
    `/products/${productId}/reviews/${reviewId}`,
    { method: "DELETE" },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "리뷰 삭제 실패");
  return data;
};
