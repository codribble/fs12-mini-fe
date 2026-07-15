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
  // s3Key와 하는 일이 다르다 — s3Key는 상품 이미지가 S3 어디에 있는지(내부 저장 위치)이고,
  // link는 사용자가 직접 입력하는 임의의 외부 참조 링크(원 판매처 등)다. "S3 업로드 후
  // 리졸브된 이미지 URL을 여기에 저장"하는 용도로 쓸 수도 있다고 스펙 작성자가 언급했지만,
  // 이 프로젝트는 이미지 URL을 getProductImageUrl(s3Key)로 그때그때 계산해서 쓰기 때문에
  // (services/product.ts) link에 이미지 URL을 중복 저장하지 않기로 했다 — s3Key만으로
  // 충분하고, link 자체를 지우는 것도 검토했으나 Notion이 제공한 스키마에 있는 필드라 유지.
  link: string | null;
  avgRating: number;
  reviewCount: number;
  userId: number;
}

// POST /products 요청 바디. avgRating/reviewCount는 서버가 리뷰 등록/수정/삭제 시
// 트랜잭션으로 자동 계산하는 값이라 클라이언트가 보내지 않는다.
//
// link가 string뿐 아니라 null도 받는 이유: 이 타입은 PATCH(Partial<CreateProductRequest>)
// 바디로도 재사용되는데, 상품 수정 화면에서 link를 지우려면 undefined(필드를 안 보냄 = 서버가
// 기존 값을 유지)가 아니라 null(명시적으로 지움)을 보내야 한다(products/[id]/page.tsx 참고).
export interface CreateProductRequest {
  name: string;
  price: number;
  category: string;
  s3Key: string;
  link?: string | null;
}

// GET /products 쿼리 파라미터. cursor는 "마지막으로 받은 항목의 id"를 넘기면
// 그 다음 페이지를 반환하는 방식(BE product.repository.ts findAll 참고).
export interface GetProductsParams {
  cursor?: number;
  limit?: number;
  category?: string;
}
