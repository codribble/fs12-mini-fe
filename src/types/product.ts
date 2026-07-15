// GET /products, GET /products/:id 등의 응답 형태를 손으로 mirror한 타입이다.
// FE는 be와 별도 npm 패키지라 @prisma/client를 import할 수 없다.
// BE Product 모델에는 createdAt/updatedAt도 있지만, FE 어느 화면에서도 쓰지 않아
// 타입에는 포함하지 않았다(응답 객체엔 여전히 존재함 — 타입에서만 안 보일 뿐).
export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  s3Key: string;
  link: string | null;
  avgRating: number;
  reviewCount: number;
  userId: number;
}

// POST /products 요청 바디. avgRating/reviewCount는 서버가 리뷰 등록/수정/삭제 시
// 트랜잭션으로 자동 계산하는 값이라 클라이언트가 보내지 않는다.
export interface CreateProductRequest {
  name: string;
  price: number;
  category: string;
  s3Key: string;
  link?: string;
}

// GET /products 쿼리 파라미터. cursor는 "마지막으로 받은 항목의 id"를 넘기면
// 그 다음 페이지를 반환하는 방식(BE product.repository.ts findAll 참고).
export interface GetProductsParams {
  cursor?: number;
  limit?: number;
  category?: string;
}
