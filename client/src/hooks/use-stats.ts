import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : "",
  };
};

export function useAdminStats() {
  return useQuery({
    queryKey: [api.stats.admin.path],
    queryFn: async () => {
      const res = await fetch(api.stats.admin.path, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.stats.admin.responses[200].parse(await res.json());
    },
  });
}