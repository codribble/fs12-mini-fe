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
import {
  useReviews,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
} from "@/hooks/queries/useReview";
import { getProductImageUrl } from "@/services/product";
import { QUERY_KEYS } from "@/constants/queryKeys";

// 별점 선택 버튼 5개(★/☆ 토글)를 리뷰 등록 폼과 수정 폼 두 곳에서 똑같이 써서 함수로 뺐다.
// 별도 라이브러리 없이 이 프로젝트의 다른 폼들(products/new 등)과 같은 순수 controlled input 스타일을 유지한다.
function RatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n}점`}
        >
          {n <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);

  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoggedIn, isInitialized } = useAuth();

  const { data: product, isLoading, isError } = useProduct(productId);
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();

  const { data: reviews, isLoading: isReviewsLoading } =
    useReviews(productId);
  const { mutate: createReview, isPending: isCreatingReview } =
    useCreateReview();
  const { mutate: updateReview, isPending: isUpdatingReview } =
    useUpdateReview();
  const { mutate: deleteReview } = useDeleteReview();

  // 리뷰 등록 폼 state
  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState(0);

  // 리뷰 수정도 product 상세와 동일하게 별도 라우트 없이 목록 안에서 인라인으로 토글한다.
  // 여러 리뷰 중 "지금 수정 중인 것"을 id로 구분해야 하므로 boolean이 아니라 id | null로 관리한다.
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editRating, setEditRating] = useState(0);

  // 리뷰 등록/수정/삭제는 avgRating·reviewCount를 바꾸는 BE 트랜잭션(updateProductRatingStats)을
  // 함께 실행하므로, 리뷰 목록 캐시뿐 아니라 상품 상세 캐시도 같이 무효화해야 화면 상단의
  // "★ avgRating (reviewCount)"가 즉시 갱신된다. 세 핸들러가 공통으로 필요해서 함수로 뺐다.
  const invalidateReviewRelated = () => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.review.list(productId),
    });
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.product.detail(productId),
    });
  };

  const handleCreateReview = (e: React.FormEvent) => {
    e.preventDefault();
    createReview(
      { productId, body: { content: reviewContent, rating: reviewRating } },
      {
        onSuccess: () => {
          invalidateReviewRelated();
          setReviewContent("");
          setReviewRating(0);
        },
      },
    );
  };

  const startEditingReview = (
    reviewId: number,
    content: string,
    rating: number,
  ) => {
    setEditingReviewId(reviewId);
    setEditContent(content);
    setEditRating(rating);
  };

  const handleUpdateReview = (e: React.FormEvent, reviewId: number) => {
    e.preventDefault();
    updateReview(
      {
        productId,
        reviewId,
        body: { content: editContent, rating: editRating },
      },
      {
        onSuccess: () => {
          invalidateReviewRelated();
          setEditingReviewId(null);
        },
      },
    );
  };

  const handleDeleteReview = (reviewId: number) => {
    if (!window.confirm("이 리뷰를 정말 삭제하시겠습니까?")) return;
    deleteReview(
      { productId, reviewId },
      { onSuccess: invalidateReviewRelated },
    );
  };

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
    //
    // link는 undefined가 아니라 null로 보내야 한다: JSON.stringify는 값이 undefined인
    // 키를 요청 바디에서 아예 빼버리는데, PATCH는 부분 수정이라 "키가 없음 = 이 필드는
    // 건드리지 말라"로 해석한다(BE도 동일하게 Prisma가 undefined면 필드를 그대로 둔다).
    // 그래서 link를 비워서 지우려는 의도로 undefined를 보내면 서버는 "손대지 마라"로
    // 받아들여서 기존 값이 그대로 남는다 — null을 명시적으로 보내야 실제로 지워진다.
    updateProduct(
      {
        id: productId,
        body: { name, price: Number(price), category, link: link || null },
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

      <section>
        <h2>리뷰</h2>

        {isReviewsLoading && <p>리뷰 불러오는 중...</p>}

        <ul>
          {reviews?.map((review) => {
            // BE PATCH/DELETE도 403으로 소유자를 검증하지만, 상품 수정/삭제와 동일하게
            // FE에서도 미리 버튼 자체를 숨겨준다.
            const isReviewOwner = isLoggedIn && user?.id === review.userId;
            const isEditingThisReview = editingReviewId === review.id;

            return (
              <li key={review.id}>
                {isEditingThisReview ? (
                  <form onSubmit={(e) => handleUpdateReview(e, review.id)}>
                    <RatingInput value={editRating} onChange={setEditRating} />
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      required
                    />
                    <button type="submit" disabled={isUpdatingReview}>
                      {isUpdatingReview ? "저장 중..." : "저장"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingReviewId(null)}
                    >
                      취소
                    </button>
                  </form>
                ) : (
                  <>
                    {/* review.user는 목록 조회에서만 include되므로(review.repository.ts 참고)
                        optional이다 — 항상 값이 있어야 정상이지만 타입상 대비해 폴백을 둔다. */}
                    <p>
                      {review.user?.name ?? "알 수 없음"} · {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </p>
                    <p>{review.content}</p>
                    {isReviewOwner && (
                      <div>
                        <button
                          onClick={() =>
                            startEditingReview(
                              review.id,
                              review.content,
                              review.rating,
                            )
                          }
                        >
                          수정
                        </button>
                        <button onClick={() => handleDeleteReview(review.id)}>
                          삭제
                        </button>
                      </div>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>

        {/* 이 페이지는 비로그인 사용자도 상품/리뷰를 볼 수 있어야 하는 공개 페이지라
            products/new처럼 페이지 전체를 /login으로 리다이렉트하지 않는다. 대신 쓰기
            UI(등록 폼)만 로그인 여부에 따라 조건부로 렌더링한다. isInitialized 체크가
            필요한 이유는 AuthContext의 isInitialized 주석과 동일(복원 타이밍 이슈). */}
        {isInitialized && isLoggedIn ? (
          <form onSubmit={handleCreateReview}>
            <h3>리뷰 작성</h3>
            <RatingInput value={reviewRating} onChange={setReviewRating} />
            <textarea
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              placeholder="리뷰 내용을 입력하세요"
              required
            />
            <button
              type="submit"
              disabled={isCreatingReview || reviewRating === 0}
            >
              {isCreatingReview ? "등록 중..." : "리뷰 등록"}
            </button>
          </form>
        ) : (
          isInitialized && <p>리뷰를 작성하려면 로그인이 필요합니다.</p>
        )}
      </section>
    </main>
  );
}
