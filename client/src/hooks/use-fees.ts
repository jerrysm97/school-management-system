import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
    };
}

export function useFees(studentId?: number) {
    return useQuery({
        queryKey: ["fees", studentId],
        queryFn: async () => {
            const url = studentId ? `${api.fees.list.path}?studentId=${studentId}` : api.fees.list.path;
            const res = await fetch(url, { headers: getAuthHeaders() });
            if (!res.ok) throw new Error("Failed to fetch fees");
            return res.json();
        },
    });
}

export function useFeeStats() {
    return useQuery({
        queryKey: ["feeStats"],
        queryFn: async () => {
            const res = await fetch(api.fees.stats.path, { headers: getAuthHeaders() });
            if (!res.ok) throw new Error("Failed to fetch fee stats");
            return res.json();
        },
    });
}

export function useCreateFee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { studentId: number; amount: number; dueDate: string; description?: string }) => {
            const res = await fetch(api.fees.create.path, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to create fee");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fees"] });
            queryClient.invalidateQueries({ queryKey: ["feeStats"] });
        },
    });
}

export function useUpdateFeeStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: number; status: 'paid' | 'pending' | 'overdue' }) => {
            const res = await fetch(`/api/fees/${id}`, {
                method: "PATCH",
                headers: getAuthHeaders(),
                body: JSON.stringify({ status }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to update fee");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fees"] });
            queryClient.invalidateQueries({ queryKey: ["feeStats"] });
        },
    });
}
