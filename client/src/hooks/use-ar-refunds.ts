import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/api";

// ========================================
// REFUND QUERIES
// ========================================

export function useRefundRequests(status?: string, studentId?: number) {
    return useQuery({
        queryKey: ["refunds", status, studentId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (status) params.append("status", status);
            if (studentId) params.append("studentId", studentId.toString());
            return await apiRequest(`/api/ar/refunds?${params.toString()}`);
        }
    });
}

// ========================================
// REFUND MUTATIONS
// ========================================

export function useCreateRefund() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (refund: any) => {
            return await apiRequest("/api/ar/refunds", "POST", refund);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["refunds"] });
        }
    });
}

export function useApproveRefund() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            return await apiRequest(`/api/ar/refunds/${id}/approve`, "POST");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["refunds"] });
        }
    });
}

export function useRejectRefund() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
            return await apiRequest(`/api/ar/refunds/${id}/reject`, "POST", { reason });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["refunds"] });
        }
    });
}

export function useProcessRefund() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, checkNumber }: { id: number; checkNumber: string }) => {
            return await apiRequest(`/api/ar/refunds/${id}/process`, "POST", { checkNumber });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["refunds"] });
        }
    });
}

export function usePostRefundToGL() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            return await apiRequest(`/api/ar/refunds/${id}/post-to-gl`, "POST");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["refunds"] });
        }
    });
}

// ========================================
// DUNNING QUERIES
// ========================================

export function useOverdueBills(daysOverdue?: number) {
    return useQuery({
        queryKey: ["dunning", "overdue-bills", daysOverdue],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (daysOverdue !== undefined) params.append("daysOverdue", daysOverdue.toString());
            return await apiRequest(`/api/ar/dunning/overdue-bills?${params.toString()}`);
        }
    });
}

export function useDunningHistory(studentId?: number, billId?: number) {
    return useQuery({
        queryKey: ["dunning", "history", studentId, billId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (studentId) params.append("studentId", studentId.toString());
            if (billId) params.append("billId", billId.toString());
            return await apiRequest(`/api/ar/dunning/history?${params.toString()}`);
        }
    });
}

// ========================================
// DUNNING MUTATIONS
// ========================================

export function useSendDunningNotice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ studentId, billId, level }: { studentId: number; billId: number; level: number }) => {
            return await apiRequest("/api/ar/dunning/send-notice", "POST", { studentId, billId, level });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["dunning"] });
        }
    });
}
