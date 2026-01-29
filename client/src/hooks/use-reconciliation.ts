import { useQuery, useMutation, UseQueryResult } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
    GlReconciliation,
    InsertGlReconciliation,
} from "@shared/schema";

// =========================================
// GL RECONCILIATION HOOKS
// =========================================

export function useReconciliations(accountId?: number, status?: string) {
    return useQuery({
        queryKey: ['reconciliations', accountId, status],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (accountId) params.append('accountId', String(accountId));
            if (status) params.append('status', status);
            const res = await apiRequest('GET', `/api/gl/reconciliations?${params}`);
            return await res.json();
        }
    });
}

export function useReconciliation(id: number) {
    return useQuery({
        queryKey: ['reconciliation', id],
        queryFn: async () => {
            const res = await apiRequest('GET', `/api/gl/reconciliations/${id}`);
            return await res.json();
        },
        enabled: !!id
    });
}

export function useReconciliationSummary(id: number) {
    return useQuery({
        queryKey: ['reconciliation-summary', id],
        queryFn: async () => {
            const res = await apiRequest('GET', `/api/gl/reconciliations/${id}/summary`);
            return await res.json();
        },
        enabled: !!id
    });
}

export function useUnclearedTransactions(accountId: number, asOfDate: string) {
    return useQuery({
        queryKey: ['uncleared-transactions', accountId, asOfDate],
        queryFn: async () => {
            const params = new URLSearchParams({ asOfDate });
            const res = await apiRequest('GET', `/api/gl/accounts/${accountId}/uncleared?${params}`);
            return await res.json();
        },
        enabled: !!accountId && !!asOfDate
    });
}

export function useCreateReconciliation() {
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: InsertGlReconciliation) => {
            return await apiRequest('/api/gl/reconciliations', 'POST', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
            toast({
                title: "Success",
                description: "Reconciliation created successfully"
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    });
}

export function useUpdateReconciliation() {
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number, data: Partial<InsertGlReconciliation> }) => {
            return await apiRequest(`/api/gl/reconciliations/${id}`, 'PUT', data);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
            queryClient.invalidateQueries({ queryKey: ['reconciliation', variables.id] });
            toast({
                title: "Success",
                description: "Reconciliation updated successfully"
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    });
}

export function useCompleteReconciliation() {
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: number) => {
            return await apiRequest(`/api/gl/reconciliations/${id}/complete`, 'POST');
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
            queryClient.invalidateQueries({ queryKey: ['reconciliation', id] });
            toast({
                title: "Success",
                description: "Reconciliation completed successfully"
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    });
}

export function useToggleTransactionCleared() {
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({
            reconciliationId,
            transactionId,
            isCleared
        }: {
            reconciliationId: number,
            transactionId: number,
            isCleared: boolean
        }) => {
            return await apiRequest(`/api/gl/reconciliations/${reconciliationId}/items/${transactionId}/toggle`, 'POST', { isCleared });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['reconciliation', variables.reconciliationId] });
            queryClient.invalidateQueries({ queryKey: ['reconciliation-summary', variables.reconciliationId] });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    });
}
