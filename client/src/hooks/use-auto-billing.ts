import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ArAutoBillRule, InsertArAutoBillRule } from "@shared/schema";

// =========================================
// AUTO-BILLING RULES HOOKS
// =========================================

export function useAutoBillRules(periodId?: number) {
    return useQuery<ArAutoBillRule[]>({
        queryKey: ['ar-billing-rules', periodId],
        queryFn: async () => {
            const params = periodId ? `?periodId=${periodId}` : '';
            const res = await apiRequest('GET', `/api/ar/billing-rules${params}`);
            return await res.json();
        }
    });
}

export function useCreateAutoBillRule() {
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (rule: InsertArAutoBillRule) => {
            const res = await apiRequest('POST', '/api/ar/billing-rules', rule);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ar-billing-rules'] });
            toast({
                title: "Success",
                description: "Billing rule created successfully"
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

// =========================================
// BILL GENERATION HOOKS
// =========================================

export function useGenerateBillFromEnrollment() {
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ studentId, enrollmentId }: { studentId: number, enrollmentId: number }) => {
            const res = await apiRequest('POST', `/api/ar/generate-bill/${studentId}`, { enrollmentId });
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ar-student-bills'] });
            toast({
                title: "Bill Generated",
                description: "Student bill has been generated from enrollment."
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
