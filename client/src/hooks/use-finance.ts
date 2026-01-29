import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { FinIncome, InsertFinIncome, FinExpense, InsertFinExpense, FinAsset, InsertFinAsset, FinBudget, InsertFinBudget, FinCompliance, InsertFinCompliance } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// --- Income Hooks ---
export function useFinIncomes(periodId?: number, type?: string) {
    return useQuery<FinIncome[]>({
        queryKey: ["/api/finance/income", periodId, type],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (periodId) params.append("periodId", periodId.toString());
            if (type) params.append("type", type);
            const res = await apiRequest("GET", `/api/finance/income?${params}`);
            return res.json();
        },
    });
}

export function useCreateFinIncome() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertFinIncome) => {
            const res = await apiRequest("POST", "/api/finance/income", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/income"] });
            toast({ title: "Income Recorded", description: "Financial record created successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

// --- Expense Hooks ---
export function useFinExpenses(periodId?: number, category?: string) {
    return useQuery<FinExpense[]>({
        queryKey: ["/api/finance/expenses", periodId, category],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (periodId) params.append("periodId", periodId.toString());
            if (category) params.append("category", category);
            const res = await apiRequest("GET", `/api/finance/expenses?${params}`);
            return res.json();
        },
    });
}

export function useCreateFinExpense() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertFinExpense) => {
            const res = await apiRequest("POST", "/api/finance/expenses", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/expenses"] });
            toast({ title: "Expense Recorded", description: "Expense record created successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

// --- Asset Hooks ---
export function useFinAssets(type?: string) {
    return useQuery<FinAsset[]>({
        queryKey: ["/api/finance/assets", type],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (type) params.append("type", type);
            const res = await apiRequest("GET", `/api/finance/assets?${params}`);
            return res.json();
        },
    });
}

export function useCreateFinAsset() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertFinAsset) => {
            const res = await apiRequest("POST", "/api/finance/assets", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/assets"] });
            toast({ title: "Asset Registered", description: "Asset has been added to registry." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

// --- Budget Hooks ---
export function useFinBudgets(periodId?: number) {
    return useQuery<FinBudget[]>({
        queryKey: ["/api/finance/budgets", periodId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (periodId) params.append("periodId", periodId.toString());
            const res = await apiRequest("GET", `/api/finance/budgets?${params}`);
            return res.json();
        },
    });
}

export function useCreateFinBudget() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertFinBudget) => {
            const res = await apiRequest("POST", "/api/finance/budgets", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/budgets"] });
            toast({ title: "Budget Set", description: "Budget entry created successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}
