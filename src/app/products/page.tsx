"use client";

import { useState } from "react";
import Link from "next/link";
import { useProducts } from "@/hooks/queries/useProduct";
import { getProductImageUrl } from "@/services/product";

export default function ProductsPage() {
  // BE가 category를 optional 쿼리로 그대로 받으므로, 빈 문자열이면 undefined로
  // 바꿔서 넘긴다("전체" 상태를 필터 없음으로 취급).
  const [category, setCategory] = useState("");

  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useProducts(category || undefined);

  // useInfiniteQuery의 data.pages는 페이지별 { data, nextCursor } 배열이라
  // 화면에 뿌리기 전에 상품 배열 하나로 평탄화한다.
  const products = data?.pages.flatMap((page) => page.data) ?? [];

  if (isLoading) return <p>로딩 중...</p>;
  if (isError) return <p>에러 발생</p>;

  return (
    <main>
      <h1>상품 목록</h1>
      <Link href="/products/new">상품 등록</Link>

      <div>
        <label htmlFor="category">카테고리</label>
        <input
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="카테고리로 필터링"
        />
      </div>

      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <Link href={`/products/${product.id}`}>
              <img
                src={getProductImageUrl(product.s3Key)}
                alt={product.name}
                width={120}
                height={120}
              />
              <p>{product.name}</p>
              <p>{product.price.toLocaleString()}원</p>
              <p>{product.category}</p>
              <p>
                ★ {product.avgRating.toFixed(1)} ({product.reviewCount})
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? "불러오는 중..." : "더 보기"}
        </button>
      )}
    </main>
  );
}
