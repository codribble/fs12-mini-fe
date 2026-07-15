import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/services/product";
import { CreateProductRequest } from "@/types/product";

// BE가 커서(마지막으로 받은 항목의 id) 기반 페이지네이션이라 useInfiniteQuery로 매핑한다.
// "더 보기" 버튼을 누르면 fetchNextPage()가 직전 페이지의 nextCursor를 pageParam으로
// 넘겨 다음 페이지를 이어붙여준다 — 페이지 번호를 직접 관리할 필요가 없다.
export const useProducts = (category?: string) =>
  useInfiniteQuery({
    queryKey: QUERY_KEYS.product.list(category),
    queryFn: ({ pageParam }) => getProducts({ cursor: pageParam, category }),
    initialPageParam: undefined as number | undefined,
    // nextCursor가 null이면(마지막 페이지) undefined를 반환해 hasNextPage를 false로 만든다.
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

export const useProduct = (id: number) =>
  useQuery({
    queryKey: QUERY_KEYS.product.detail(id),
    queryFn: () => getProduct(id),
    enabled: !!id,
  });

// 이 프로젝트 컨벤션: 훅은 mutationFn만 갖고, 성공 후 캐시 무효화/페이지 이동은
// 호출하는 페이지의 mutate() 콜백에서 처리한다(useAuth.ts와 동일한 관심사 분리).
export const useCreateProduct = () =>
  useMutation({
    mutationFn: (body: CreateProductRequest) => createProduct(body),
  });

export const useUpdateProduct = () =>
  useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: Partial<CreateProductRequest>;
    }) => updateProduct(id, body),
  });

export const useDeleteProduct = () =>
  useMutation({
    mutationFn: (id: number) => deleteProduct(id),
  });
