"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateProduct } from "@/hooks/queries/useProduct";
import { getPresignedUploadUrl, uploadFileToS3 } from "@/services/product";

// BE upload.service.ts의 ALLOWED_CONTENT_TYPES와 동일한 목록이다. fe/be가 별도
// npm 패키지라 import로 공유할 수 없어 값만 그대로 복제해 FE에서도 선제 검증한다.
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function NewProductPage() {
  const { isLoggedIn, isInitialized } = useAuth();
  const router = useRouter();

  // 이 프로젝트에는 재사용 가능한 로그인 가드(미들웨어/공용 훅)가 아직 없다.
  // 체크리스트에 없는 새 추상화(useRequireAuth 등)를 만들지 않고, 이 페이지에만
  // 인라인으로 리다이렉트를 건다.
  //
  // isInitialized를 반드시 같이 확인해야 한다: AuthContext가 마운트 시
  // localStorage에서 로그인 상태를 복원하는 동안에는 isLoggedIn이 항상 false다.
  // isInitialized 체크 없이 !isLoggedIn만 보고 리다이렉트하면, 하드 리로드로
  // 이 페이지에 바로 들어온 "실제로 로그인된" 사용자까지 /login으로 튕겨나간다
  // (AuthContext의 복원 effect가 이 페이지의 effect보다 늦게 실행되기 때문).
  useEffect(() => {
    if (isInitialized && !isLoggedIn) router.push("/login");
  }, [isInitialized, isLoggedIn, router]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { mutate: createProduct, isPending: isCreating, isError, error } =
    useCreateProduct();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadError("이미지를 선택해주세요");
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("지원하지 않는 이미지 형식입니다");
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    try {
      // presigned URL은 발급 후 10초 안에 PUT해야 만료되지 않는다(upload.service.ts
      // UPLOAD_URL_EXPIRES_IN 참고). 그래서 발급과 업로드 사이에 다른 비동기 작업을
      // 두지 않고 바로 이어서 실행한다.
      const { uploadUrl, key } = await getPresignedUploadUrl({
        filename: file.name,
        contentType: file.type,
      });
      await uploadFileToS3(uploadUrl, file);

      // S3 업로드가 끝난 뒤에만 그 key를 s3Key로 실어 상품을 등록한다.
      createProduct(
        {
          name,
          price: Number(price),
          category,
          s3Key: key,
          link: link || undefined,
        },
        {
          onSuccess: (product) => {
            router.push(`/products/${product.id}`);
          },
        },
      );
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  // AuthContext가 아직 localStorage 복원 중이면(위 useEffect의 리다이렉트 여부를
  // 아직 판단하지 못한 상태) 로딩 문구만 보여준다. 복원이 끝났는데 비로그인이면
  // 위 useEffect가 곧 /login으로 보낼 것이므로, 그 사이 폼이 잠깐 보이는 것만 막는다.
  if (!isInitialized) return <p>로딩 중...</p>;
  if (!isLoggedIn) return null;

  return (
    <main>
      <h1>상품 등록</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">상품명</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="price">가격</label>
          <input
            id="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="category">카테고리</label>
          <input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="link">링크</label>
          <input id="link" value={link} onChange={(e) => setLink(e.target.value)} />
        </div>
        <div>
          <label htmlFor="image">이미지</label>
          <input
            id="image"
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
        </div>

        {uploadError && <p>{uploadError}</p>}
        {isError && <p>{(error as Error).message}</p>}

        <button type="submit" disabled={isUploading || isCreating}>
          {isUploading ? "업로드 중..." : isCreating ? "등록 중..." : "등록"}
        </button>
      </form>
    </main>
  );
}
