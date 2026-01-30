import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { type InsertAttendance } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useAttendance(filters?: { date?: string; classId?: number; studentId?: number }) {
  const params = new URLSearchParams();
  if (filters?.date) params.append("date", filters.date);
  if (filters?.classId) params.append("classId", filters.classId.toString());
  if (filters?.studentId) params.append("studentId", filters.studentId.toString());

  const queryUrl = `${api.attendance.list.path}?${params.toString()}`;

  return useQuery({
    queryKey: [api.attendance.list.path, filters],
    queryFn: async () => {
      const res = await apiRequest("GET", queryUrl);
      return api.attendance.list.responses[200].parse(await res.json());
    },
    enabled: !!filters, // Only fetch if filters are present (avoid massive list)
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertAttendance[]) => {
      const res = await apiRequest("POST", api.attendance.mark.path, data);
      return api.attendance.mark.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.attendance.list.path] });
      toast({ title: "Success", description: "Attendance marked successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}
