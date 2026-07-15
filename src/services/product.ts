import { fetchWithAuth } from "./api";
import { Product, CreateProductRequest, GetProductsParams } from "@/types/product";

const S3_BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;
const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION;

// 커서 기반 목록 조회. cursor/limit/category는 전부 optional이라 값이 있는 것만
// 쿼리스트링에 실어 보낸다(예: 첫 페이지는 cursor 없이 요청).
export const getProducts = async (
  params: GetProductsParams,
): Promise<{ data: Product[]; nextCursor: number | null }> => {
  const qs = new URLSearchParams();
  if (params.cursor !== undefined) qs.set("cursor", String(params.cursor));
  if (params.limit !== undefined) qs.set("limit", String(params.limit));
  if (params.category) qs.set("category", params.category);
  const query = qs.toString();

  const res = await fetchWithAuth(`/products${query ? `?${query}` : ""}`);
  if (!res.ok) throw new Error("상품 목록 조회 실패");
  return res.json();
};

export const getProduct = async (id: number): Promise<Product> => {
  const res = await fetchWithAuth(`/products/${id}`);
  if (!res.ok) throw new Error("상품 조회 실패");
  return res.json();
};

export const createProduct = async (
  body: CreateProductRequest,
): Promise<Product> => {
  const res = await fetchWithAuth("/products", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "상품 등록 실패");
  return data;
};

// 수정 전용 named 타입을 새로 만들지 않고 CreateProductRequest에서 Partial로 인라인 파생한다.
export const updateProduct = async (
  id: number,
  body: Partial<CreateProductRequest>,
): Promise<Product> => {
  const res = await fetchWithAuth(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "상품 수정 실패");
  return data;
};

export const deleteProduct = async (id: number): Promise<{ message: string }> => {
  const res = await fetchWithAuth(`/products/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "상품 삭제 실패");
  return data;
};

// presigned URL 발급은 인증이 필요한 BE 엔드포인트(upload.router.ts에 authMiddleware)라
// fetchWithAuth를 쓴다. 주의: 응답 필드명은 `key`이지만, 상품 등록 시에는 이 값을
// CreateProductRequest.s3Key 자리에 그대로 넣어 보내야 한다(BE가 발급/등록 두 API에서
// 필드명을 다르게 쓰고 있음 — upload.service.ts는 key, product는 s3Key).
export const getPresignedUploadUrl = async (body: {
  filename: string;
  contentType: string;
}): Promise<{ uploadUrl: string; key: string }> => {
  const res = await fetchWithAuth("/uploads/presigned-url", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "업로드 URL 발급 실패");
  return data;
};

// S3로의 PUT은 우리 BE가 아니라 AWS로 직접 보내는 요청이므로 이 파일에서 유일하게
// fetchWithAuth를 쓰지 않는다 — presigned URL 자체가 임시 인증서 역할을 하기 때문에
// Authorization 헤더나 credentials가 필요 없다. Content-Type 헤더는 presigned URL
// 발급 시 넘긴 contentType과 정확히 같아야 하며(다르면 S3가 SignatureDoesNotMatch로 거부),
// 이 URL의 유효시간은 10초뿐이라(be/src/upload/upload.service.ts UPLOAD_URL_EXPIRES_IN)
// 호출부(products/new 페이지)는 발급 직후 지연 없이 바로 이 함수를 호출해야 한다.
export const uploadFileToS3 = async (
  uploadUrl: string,
  file: File,
): Promise<void> => {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error("이미지 업로드에 실패했습니다");
};

// s3Key로부터 실제 화면 표시용 이미지 URL을 조합한다. presigned URL은 업로드 전용이라
// 별도 방식이 필요해서, S3 버킷이 public-read라는 전제로 버킷/리전을 FE 환경변수로
// 받아 URL을 직접 만든다. product 도메인 전용 함수라 별도 utils 폴더 대신 이 파일에 둔다.
export const getProductImageUrl = (s3Key: string): string =>
  `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
