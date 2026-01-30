import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
    Expense, InsertExpense,
    ExpenseCategory, InsertExpenseCategory,
    Vendor, InsertVendor,
    PurchaseOrder, InsertPurchaseOrder, PurchaseOrderItem, InsertPurchaseOrderItem
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// --- Expenses ---
export function useExpenses(departmentId?: number) {
    return useQuery<Expense[]>({
        queryKey: ["/api/finance/expenses", departmentId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (departmentId) params.append("departmentId", departmentId.toString());
            const res = await apiRequest("GET", `/api/finance/expenses?${params}`);
            return res.json();
        },
    });
}

export function useCreateExpense() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertExpense) => {
            const res = await apiRequest("POST", "/api/finance/expenses", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/expenses"] });
            toast({ title: "Success", description: "Expense created successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

// --- Categories ---
export function useExpenseCategories() {
    return useQuery<ExpenseCategory[]>({
        queryKey: ["/api/finance/expenses/categories"],
    });
}

export function useCreateExpenseCategory() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertExpenseCategory) => {
            const res = await apiRequest("POST", "/api/finance/expenses/categories", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/expenses/categories"] });
            toast({ title: "Success", description: "Category created successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

// --- Vendors ---
export function useVendors() {
    return useQuery<Vendor[]>({
        queryKey: ["/api/finance/expenses/vendors"],
    });
}

export function useCreateVendor() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertVendor) => {
            const res = await apiRequest("POST", "/api/finance/expenses/vendors", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/expenses/vendors"] });
            toast({ title: "Success", description: "Vendor created successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

// --- Purchase Orders ---
export function usePurchaseOrders(departmentId?: number) {
    return useQuery<PurchaseOrder[]>({
        queryKey: ["/api/finance/expenses/purchase-orders", departmentId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (departmentId) params.append("departmentId", departmentId.toString());
            const res = await apiRequest("GET", `/api/finance/expenses/purchase-orders?${params}`);
            return res.json();
        },
    });
}

export function useCreatePurchaseOrder() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertPurchaseOrder) => {
            const res = await apiRequest("POST", "/api/finance/expenses/purchase-orders", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/expenses/purchase-orders"] });
            toast({ title: "Success", description: "Purchase Order created successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useCreatePurchaseOrderItem() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertPurchaseOrderItem) => {
            const res = await apiRequest("POST", "/api/finance/expenses/purchase-orders/items", data);
            return res.json();
        },
        onSuccess: () => {
            // Invalidate POs maybe? Or a specific PO details query if we had one.
            queryClient.invalidateQueries({ queryKey: ["/api/finance/expenses/purchase-orders"] });
            toast({ title: "Success", description: "Item added to PO." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}
