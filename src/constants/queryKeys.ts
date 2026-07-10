export const QUERY_KEYS = {
  sample: {
    all: () => ["sample"] as const,
    list: () => [...QUERY_KEYS.sample.all(), "list"] as const,
    detail: (id: number) => [...QUERY_KEYS.sample.all(), "detail", id] as const,
  },
  // TODO: 필요한 queryKey를 여기에 추가하세요
};
