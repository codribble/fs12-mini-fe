"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  useProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/hooks/queries/useProduct";
import { getProductImageUrl } from "@/services/product";
import { QUERY_KEYS } from "@/constants/queryKeys";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);

  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoggedIn } = useAuth();

  const { data: product, isLoading, isError } = useProduct(productId);
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();

  // 별도 /products/[id]/edit 라우트를 만들지 않고, 이 페이지 안에서 폼을 토글하는
  // 방식으로 수정 UI를 구현한다(체크리스트에 별도 edit 페이지가 명시되지 않음).
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [link, setLink] = useState("");

  if (isLoading) return <p>로딩 중...</p>;
  if (isError || !product) return <p>에러 발생</p>;

  // 본인이 등록한 상품일 때만 수정/삭제 UI를 노출한다(BE도 PATCH/DELETE에서
  // 소유자가 아니면 403을 내려주지만, FE에서도 미리 버튼 자체를 숨겨준다).
  const isOwner = isLoggedIn && user?.id === product.userId;

  const startEditing = () => {
    setName(product.name);
    setPrice(String(product.price));
    setCategory(product.category);
    setLink(product.link ?? "");
    setIsEditing(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // 이미지(s3Key) 재업로드는 이번 Phase 범위 밖이라 수정 바디에 포함하지 않는다.
    updateProduct(
      {
        id: productId,
        body: { name, price: Number(price), category, link: link || undefined },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.product.detail(productId),
          });
          setIsEditing(false);
        },
      },
    );
  };

  const handleDelete = () => {
    if (!window.confirm(`"${product.name}"을(를) 정말 삭제하시겠습니까?`)) return;
    deleteProduct(productId, {
      onSuccess: () => {
        // 목록 캐시(모든 카테고리 필터 조합)를 통째로 무효화해 삭제된 상품이
        // 다음 목록 조회에서 빠지도록 한다.
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.product.all() });
        router.push("/products");
      },
    });
  };

  return (
    <main>
      <img
        src={getProductImageUrl(product.s3Key)}
        alt={product.name}
        width={300}
        height={300}
      />

      {isEditing ? (
        <form onSubmit={handleUpdate}>
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
            <input
              id="link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>
          <button type="submit" disabled={isUpdating}>
            {isUpdating ? "저장 중..." : "저장"}
          </button>
          <button type="button" onClick={() => setIsEditing(false)}>
            취소
          </button>
        </form>
      ) : (
        <>
          <h1>{product.name}</h1>
          <p>{product.price.toLocaleString()}원</p>
          <p>{product.category}</p>
          <p>
            ★ {product.avgRating.toFixed(1)} ({product.reviewCount})
          </p>
          {product.link && (
            <p>
              <a href={product.link} target="_blank" rel="noreferrer">
                상품 링크
              </a>
            </p>
          )}
        </>
      )}

      {isOwner && !isEditing && (
        <div>
          <button onClick={startEditing}>수정</button>
          <button onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "삭제 중..." : "삭제"}
          </button>
        </div>
      )}
    </main>
  );
}
