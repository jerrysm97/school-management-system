import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : "",
  };
};

export function useStudents(classId?: number) {
  const queryUrl = classId
    ? buildUrl(api.students.list.path) + `?classId=${classId}`
    : api.students.list.path;

  return useQuery({
    queryKey: [api.students.list.path, classId],
    queryFn: async () => {
      const res = await fetch(queryUrl, {
        headers: getAuthHeaders(), // <--- ADDED
      });
      if (!res.ok) throw new Error("Failed to fetch students");
      return api.students.list.responses[200].parse(await res.json());
    },
  });
}

export function useStudent(id: number) {
  return useQuery({
    queryKey: [api.students.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.students.get.path, { id });
      const res = await fetch(url, {
        headers: getAuthHeaders(), // <--- ADDED
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch student");
      return api.students.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.students.create.path, {
        method: "POST",
        headers: getAuthHeaders(), // <--- ADDED
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        // Try to parse the error message from the server
        let errorMessage = "Failed to create student";
        try {
          const error = await res.json();
          errorMessage = error.message || errorMessage;
        } catch (e) {
          // Ignore json parse errors, use default message
        }
        throw new Error(errorMessage);
      }
      return api.students.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.students.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.admin.path] });
      toast({ title: "Success", description: "Student created successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}

export function useApproveStudent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number, status: 'approved' | 'rejected' }) => {
      const url = buildUrl(api.students.approve.path, { id });
      const res = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update status");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.students.list.path] });
      toast({
        title: "Status Updated",
        description: `Student has been ${variables.status}`
      });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}