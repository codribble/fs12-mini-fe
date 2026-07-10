import api from "./api";
import { Sample } from "@/types/sample";

export const getSamples = async (): Promise<Sample[]> => {
  const res = await api.get<Sample[]>("/samples");
  return res.data;
};

export const getSample = async (id: number): Promise<Sample> => {
  const res = await api.get<Sample>(`/samples/${id}`);
  return res.data;
};
