import { useQuery, useMutation, UseQueryResult } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
    ArStudentBill,
    InsertArStudentBill,
    ArBillLineItem,
    InsertArBillLineItem,
    ArPayment,
    InsertArPayment,
    ApVendor,
    InsertApVendor,
    ApInvoice,
    InsertApInvoice,
} from "@shared/schema";

// =========================================
// ACCOUNTS RECEIVABLE (AR)
// =========================================

export function useStudentBills(studentId?: number, status?: string): UseQueryResult<ArStudentBill[]> {
    return useQuery({
        queryKey: ["/api/ar/bills", studentId, status],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (studentId) params.append("studentId", String(studentId));
            if (status) params.append("status", status);
            const res = await apiRequest("GET", `/api/ar/bills?${params}`);
            return res.json();
        },
    });
}

export function useStudentBill(billId: number | undefined): UseQueryResult<any> {
    return useQuery({
        queryKey: ["/api/ar/bills", billId],
        queryFn: async () => {
            if (!billId) return null;
            const res = await apiRequest("GET", `/api/ar/bills/${billId}`);
            return res.json();
        },
        enabled: !!billId,
    });
}

export function useCreateStudentBill() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async ({ bill, lineItems }: { bill: InsertArStudentBill; lineItems: InsertArBillLineItem[] }) => {
            const res = await apiRequest("POST", "/api/ar/bills", { bill, lineItems });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/ar/bills"] });
            toast({ title: "Bill Created", description: "Student bill created successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function usePostBillToGL() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (billId: number) => {
            const res = await apiRequest("POST", `/api/ar/bills/${billId}/post-to-gl`, {});
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/ar/bills"] });
            toast({ title: "Bill Posted", description: "Bill posted to GL successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useArPayments(studentId?: number): UseQueryResult<ArPayment[]> {
    return useQuery({
        queryKey: ["/api/ar/payments", studentId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (studentId) params.append("studentId", String(studentId));
            const res = await apiRequest("GET", `/api/ar/payments?${params}`);
            return res.json();
        },
    });
}

export function useCreateArPayment() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async ({ payment, allocations }: { payment: InsertArPayment; allocations: { billId: number; amount: number }[] }) => {
            const res = await apiRequest("POST", "/api/ar/payments", { payment, allocations });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/ar/payments"] });
            queryClient.invalidateQueries({ queryKey: ["/api/ar/bills"] });
            toast({ title: "Payment Created", description: "Payment recorded successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function usePostPaymentToGL() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (paymentId: number) => {
            const res = await apiRequest("POST", `/api/ar/payments/${paymentId}/post-to-gl`, {});
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/ar/payments"] });
            toast({ title: "Payment Posted", description: "Payment posted to GL successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useAgingReport(): UseQueryResult<any[]> {
    return useQuery({
        queryKey: ["/api/ar/reports/aging"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/ar/reports/aging");
            return res.json();
        },
    });
}

// =========================================
// ACCOUNTS PAYABLE (AP)
// =========================================

export function useApVendors(isActive?: boolean): UseQueryResult<ApVendor[]> {
    return useQuery({
        queryKey: ["/api/ap/vendors", isActive],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (isActive !== undefined) params.append("isActive", String(isActive));
            const res = await apiRequest("GET", `/api/ap/vendors?${params}`);
            return res.json();
        },
    });
}

export function useCreateApVendor() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (vendor: InsertApVendor) => {
            const res = await apiRequest("POST", "/api/ap/vendors", vendor);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/ap/vendors"] });
            toast({ title: "Vendor Created", description: "Vendor created successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useApInvoices(vendorId?: number, status?: string): UseQueryResult<ApInvoice[]> {
    return useQuery({
        queryKey: ["/api/ap/invoices", vendorId, status],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (vendorId) params.append("vendorId", String(vendorId));
            if (status) params.append("status", status);
            const res = await apiRequest("GET", `/api/ap/invoices?${params}`);
            return res.json();
        },
    });
}

export function useCreateApInvoice() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async ({ invoice, lineItems }: { invoice: InsertApInvoice; lineItems: any[] }) => {
            const res = await apiRequest("POST", "/api/ap/invoices", { invoice, lineItems });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/ap/invoices"] });
            toast({ title: "Invoice Created", description: "AP invoice created successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useApproveApInvoice() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (invoiceId: number) => {
            const res = await apiRequest("POST", `/api/ap/invoices/${invoiceId}/approve`, {});
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/ap/invoices"] });
            toast({ title: "Invoice Approved", description: "Invoice approved successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function usePostApInvoiceToGL() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (invoiceId: number) => {
            const res = await apiRequest("POST", `/api/ap/invoices/${invoiceId}/post-to-gl`, {});
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/ap/invoices"] });
            toast({ title: "Invoice Posted", description: "Invoice posted to GL successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}
