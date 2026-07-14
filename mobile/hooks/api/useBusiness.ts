import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export interface Business {
  id: number;
  name: string;
  mpesaShortcode?: string | null;
  ownerName: string;
  ownerEmail: string;
  whatsappNumber?: string | null;
  ownerPhone?: string | null;
  businessType?: string | null;
  yearsInBusiness?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export function useBusiness() {
  return useQuery({
    queryKey: ["business"],
    queryFn: async () => {
      const response = await api.get<Business>("/business");
      return response.data;
    },
  });
}
