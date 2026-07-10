import { fetchWithAuth } from "./api";
import { Sample } from "@/types/sample";

export const getSamples = async (): Promise<Sample[]> => {
  const res = await fetchWithAuth("/samples");
  if (!res.ok) throw new Error("샘플 목록 조회 실패");
  return res.json();
};

export const getSample = async (id: number): Promise<Sample> => {
  const res = await fetchWithAuth(`/samples/${id}`);
  if (!res.ok) throw new Error("샘플 조회 실패");
  return res.json();
};
