import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
    };
}

export function useAcademicPeriods() {
    return useQuery({
        queryKey: ["academic-periods"],
        queryFn: async () => {
            const res = await fetch("/api/academic-periods", { headers: getAuthHeaders() });
            if (!res.ok) throw new Error("Failed to fetch academic periods");
            return res.json();
        },
    });
}

export function useCreateAcademicPeriod() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { name: string; startDate: string; endDate: string }) => {
            const res = await fetch("/api/academic-periods", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to create period");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["academic-periods"] });
        },
    });
}

export function useToggleAcademicPeriod() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
            const res = await fetch(`/api/academic-periods/${id}/toggle`, {
                method: "PATCH",
                headers: getAuthHeaders(),
                body: JSON.stringify({ isActive }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to update period");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["academic-periods"] });
        },
    });
}
