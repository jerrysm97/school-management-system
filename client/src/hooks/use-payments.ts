import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
    Payment, InsertPayment,
    PaymentAllocation, InsertPaymentAllocation,
    Refund, InsertRefund
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// --- Payments ---
export function usePayments(studentId?: number) {
    return useQuery<Payment[]>({
        queryKey: ["/api/finance/payments", studentId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (studentId) params.append("studentId", studentId.toString());
            const res = await apiRequest("GET", `/api/finance/payments?${params}`);
            return res.json();
        },
    });
}

export function useCreatePayment() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertPayment) => {
            const res = await apiRequest("POST", "/api/finance/payments", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/payments"] });
            toast({ title: "Success", description: "Payment recorded successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

// --- Allocations ---
export function useCreatePaymentAllocation() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertPaymentAllocation) => {
            const res = await apiRequest("POST", "/api/finance/payments/allocations", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/payments"] });
            // Also invalidate fees if we had a query for them
            queryClient.invalidateQueries({ queryKey: ["fees"] });
            toast({ title: "Success", description: "Payment allocated to fee." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

// --- Refunds ---
export function useRefunds() {
    return useQuery<Refund[]>({
        queryKey: ["/api/finance/refunds"],
    });
}

export function useCreateRefund() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertRefund) => {
            const res = await apiRequest("POST", "/api/finance/refunds", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/refunds"] });
            toast({ title: "Success", description: "Refund request submitted." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}
