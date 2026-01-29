import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useAdminStats() {
  return useQuery({
    queryKey: [api.stats.admin.path],
    queryFn: async () => {
      const res = await fetch(api.stats.admin.path);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.stats.admin.responses[200].parse(await res.json());
    },
  });
}
