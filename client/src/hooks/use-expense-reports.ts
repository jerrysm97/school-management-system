import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "./use-toast";
import { InsertApExpenseReport, ApExpenseReport, ApExpenseReportItem } from "@shared/schema";

export function useExpenseReports(userId?: number, status?: string) {
    const queryKey = ["expense-reports", userId, status].filter(Boolean);

    return useQuery<ApExpenseReport[]>({
        queryKey,
        queryFn: async () => {
            const params = new URLSearchParams();
            if (status) params.append("status", status);

            const res = await apiRequest("GET", `/api/ap/expense-reports?${params.toString()}`);
            return res.json();
        }
    });
}

export function useCreateExpenseReport() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: InsertApExpenseReport & { items: any[] }) => {
            const res = await apiRequest("POST", "/api/ap/expense-reports", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expense-reports"] });
            toast({
                title: "Success",
                description: "Expense report created successfully",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    });
}

export function useSubmitExpenseReport() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (reportId: number) => {
            await apiRequest("POST", `/api/ap/expense-reports/${reportId}/submit`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expense-reports"] });
            toast({
                title: "Success",
                description: "Expense report submitted for approval",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    });
}

export function useApproveExpenseReport() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (reportId: number) => {
            await apiRequest("POST", `/api/ap/expense-reports/${reportId}/approve`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expense-reports"] });
            toast({
                title: "Success",
                description: "Expense report approved",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    });
}

export function useRejectExpenseReport() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
            await apiRequest("POST", `/api/ap/expense-reports/${id}/reject`, { reason });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expense-reports"] });
            toast({
                title: "Success",
                description: "Expense report rejected",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    });
}

export function usePostExpenseReportToGL() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (reportId: number) => {
            await apiRequest("POST", `/api/ap/expense-reports/${reportId}/post-gl`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expense-reports"] });
            toast({
                title: "Success",
                description: "Expense report posted to General Ledger",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    });
}
