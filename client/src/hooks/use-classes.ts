import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type InsertClass } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : "",
  };
};

export function useClasses() {
  return useQuery({
    queryKey: [api.classes.list.path],
    queryFn: async () => {
      const res = await fetch(api.classes.list.path, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch classes");
      return api.classes.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertClass) => {
      const res = await fetch(api.classes.create.path, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create class");
      return api.classes.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.classes.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.admin.path] });
      toast({ title: "Success", description: "Class created successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}