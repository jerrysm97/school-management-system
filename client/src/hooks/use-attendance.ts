import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { type InsertAttendance } from "@shared/schema";

export function useAttendance(filters?: { date?: string; classId?: number; studentId?: number }) {
  const params = new URLSearchParams();
  if (filters?.date) params.append("date", filters.date);
  if (filters?.classId) params.append("classId", filters.classId.toString());
  if (filters?.studentId) params.append("studentId", filters.studentId.toString());

  const queryUrl = `${api.attendance.list.path}?${params.toString()}`;

  return useQuery({
    queryKey: [api.attendance.list.path, filters],
    queryFn: async () => {
      const res = await fetch(queryUrl);
      if (!res.ok) throw new Error("Failed to fetch attendance");
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
      const res = await fetch(api.attendance.mark.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to mark attendance");
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
