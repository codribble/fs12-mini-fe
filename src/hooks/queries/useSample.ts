import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { getSamples, getSample } from "@/services/sample";

export const useSamples = () =>
  useQuery({
    queryKey: QUERY_KEYS.sample.list(),
    queryFn: getSamples,
  });

export const useSample = (id: number) =>
  useQuery({
    queryKey: QUERY_KEYS.sample.detail(id),
    queryFn: () => getSample(id),
    enabled: !!id,
  });
