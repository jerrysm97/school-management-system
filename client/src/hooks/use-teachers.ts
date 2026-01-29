import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// Helper to get headers with token
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : "",
  };
};

export function useTeachers() {
  return useQuery({
    queryKey: [api.teachers.list.path],
    queryFn: async () => {
      const res = await fetch(api.teachers.list.path, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch teachers");
      return api.teachers.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.teachers.create.path, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        // Try to parse the error message from the server
        let errorMessage = "Failed to create teacher";
        try {
          const error = await res.json();
          errorMessage = error.message || errorMessage;
        } catch (e) {
          // Ignore json parse errors, use default message
        }
        throw new Error(errorMessage);
      }
      return api.teachers.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.teachers.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.admin.path] });
      toast({ title: "Success", description: "Teacher created successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}