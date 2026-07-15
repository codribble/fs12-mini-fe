import { useQuery, useMutation } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
} from "@/services/review";
import { CreateReviewRequest } from "@/types/review";

// BE가 페이지네이션 없이 리뷰 전체 배열을 한 번에 반환하므로(review.repository.ts의
// findAllByProductId), product 목록과 달리 useInfiniteQuery가 아닌 단순 useQuery로 충분하다.
export const useReviews = (productId: number) =>
  useQuery({
    queryKey: QUERY_KEYS.review.list(productId),
    queryFn: () => getReviews(productId),
    enabled: !!productId,
  });

// 이 프로젝트 컨벤션: 훅은 mutationFn만 갖고, 성공 후 캐시 무효화/폼 초기화는
// 호출하는 페이지의 mutate() 콜백에서 처리한다(useProduct.ts와 동일한 관심사 분리).
export const useCreateReview = () =>
  useMutation({
    mutationFn: ({
      productId,
      body,
    }: {
      productId: number;
      body: CreateReviewRequest;
    }) => createReview(productId, body),
  });

export const useUpdateReview = () =>
  useMutation({
    mutationFn: ({
      productId,
      reviewId,
      body,
    }: {
      productId: number;
      reviewId: number;
      body: Partial<CreateReviewRequest>;
    }) => updateReview(productId, reviewId, body),
  });

export const useDeleteReview = () =>
  useMutation({
    mutationFn: ({
      productId,
      reviewId,
    }: {
      productId: number;
      reviewId: number;
    }) => deleteReview(productId, reviewId),
  });
