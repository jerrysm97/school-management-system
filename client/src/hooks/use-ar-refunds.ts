import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
            const res = await apiRequest("GET", `/api/ar/refunds?${params.toString()}`);
            return res.json();
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
            const res = await apiRequest("POST", "/api/ar/refunds", refund);
            return res.json();
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
            const res = await apiRequest("POST", `/api/ar/refunds/${id}/approve`);
            return res.json();
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
            const res = await apiRequest("POST", `/api/ar/refunds/${id}/reject`, { reason });
            return res.json();
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
            const res = await apiRequest("POST", `/api/ar/refunds/${id}/process`, { checkNumber });
            return res.json();
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
            const res = await apiRequest("POST", `/api/ar/refunds/${id}/post-to-gl`);
            return res.json();
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
            const res = await apiRequest("GET", `/api/ar/dunning/overdue-bills?${params.toString()}`);
            return res.json();
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
            const res = await apiRequest("GET", `/api/ar/dunning/history?${params.toString()}`);
            return res.json();
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
            const res = await apiRequest("POST", "/api/ar/dunning/send-notice", { studentId, billId, level });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["dunning"] });
        }
    });
}
