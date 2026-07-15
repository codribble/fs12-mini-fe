export const QUERY_KEYS = {
  sample: {
    all: () => ["sample"] as const,
    list: () => [...QUERY_KEYS.sample.all(), "list"] as const,
    detail: (id: number) => [...QUERY_KEYS.sample.all(), "detail", id] as const,
  },
  // TODO: 필요한 queryKey를 여기에 추가하세요
  product: {
    all: () => ["product"] as const,
    // 카테고리 필터가 바뀌면 별도 캐시로 분리되어야 하므로 list 키에 포함시킨다.
    // cursor는 페이지 파라미터일 뿐이라 키에 넣지 않고 useInfiniteQuery가 내부에서 관리한다.
    list: (category?: string) =>
      [...QUERY_KEYS.product.all(), "list", category ?? "all"] as const,
    detail: (id: number) =>
      [...QUERY_KEYS.product.all(), "detail", id] as const,
  },
  review: {
    all: () => ["review"] as const,
    // 리뷰는 상품별로만 조회하므로(전체 리뷰 목록 화면이 없음) productId를 키에 포함시킨다.
    list: (productId: number) =>
      [...QUERY_KEYS.review.all(), "list", productId] as const,
  },
};
