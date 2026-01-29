import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
    };
}

export function useTimetable(classId?: number) {
    return useQuery({
        queryKey: ["timetable", classId],
        queryFn: async () => {
            const url = classId ? `${api.timetable.list.path}?classId=${classId}` : api.timetable.list.path;
            const res = await fetch(url, { headers: getAuthHeaders() });
            if (!res.ok) throw new Error("Failed to fetch timetable");
            return res.json();
        },
    });
}

export function useCreateTimetableSlot() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { classId: number; subjectId: number; dayOfWeek: number; startTime: string; endTime: string }) => {
            const res = await fetch(api.timetable.create.path, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to create slot");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timetable"] });
        },
    });
}

export function useDeleteTimetableSlot() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/timetable/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to delete slot");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timetable"] });
        },
    });
}
