// GET /products/:productId/reviews 응답 형태를 손으로 mirror한 타입이다.
// user는 optional이다 — BE의 findAllByProductId(목록 조회)만 user.name을 include하고,
// POST/PATCH 응답(review.repository.ts의 create/update)은 user를 포함하지 않는다.
// 후자는 "방금 로그인한 내가 쓴/고친 리뷰"라 화면에 바로 렌더링하지 않고 캐시 무효화 후
// 목록을 다시 받아오는 방식으로 처리하므로, 이 타입 하나로 두 응답 모양을 모두 표현해도 문제없다.
export interface Review {
  id: number;
  content: string;
  rating: number;
  productId: number;
  userId: number;
  user?: { name: string };
}

// POST /products/:productId/reviews 요청 바디.
export interface CreateReviewRequest {
  content: string;
  rating: number;
}
