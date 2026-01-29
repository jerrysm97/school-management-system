import { useQuery, useMutation, UseQueryResult } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
    ChartOfAccount,
    InsertChartOfAccount,
    GlFund,
    InsertGlFund,
    FiscalPeriod,
    InsertFiscalPeriod,
    GlJournalEntry,
    InsertGlJournalEntry,
    GlTransaction,
    InsertGlTransaction,
} from "@shared/schema";

// =========================================
// CHART OF ACCOUNTS
// =========================================

export function useChartOfAccounts(isActive?: boolean): UseQueryResult<ChartOfAccount[]> {
    return useQuery({
        queryKey: ["/api/gl/chart-of-accounts", isActive],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (isActive !== undefined) params.append("isActive", String(isActive));
            const res = await apiRequest("GET", `/api/gl/chart-of-accounts?${params}`);
            return res.json();
        },
    });
}

export function useCreateChartOfAccount() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertChartOfAccount) => {
            const res = await apiRequest("POST", "/api/gl/chart-of-accounts", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/gl/chart-of-accounts"] });
            toast({ title: "Account Created", description: "Chart of Account created successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useUpdateChartOfAccount() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<InsertChartOfAccount> }) => {
            const res = await apiRequest("PUT", `/api/gl/chart-of-accounts/${id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/gl/chart-of-accounts"] });
            toast({ title: "Account Updated", description: "Chart of Account updated successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

// =========================================
// FUNDS
// =========================================

export function useGlFunds(isActive?: boolean): UseQueryResult<GlFund[]> {
    return useQuery({
        queryKey: ["/api/gl/funds", isActive],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (isActive !== undefined) params.append("isActive", String(isActive));
            const res = await apiRequest("GET", `/api/gl/funds?${params}`);
            return res.json();
        },
    });
}

export function useCreateGlFund() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertGlFund) => {
            const res = await apiRequest("POST", "/api/gl/funds", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/gl/funds"] });
            toast({ title: "Fund Created", description: "GL Fund created successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

// =========================================
// FISCAL PERIODS
// =========================================

export function useFiscalPeriods(year?: number): UseQueryResult<FiscalPeriod[]> {
    return useQuery({
        queryKey: ["/api/gl/fiscal-periods", year],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (year) params.append("year", String(year));
            const res = await apiRequest("GET", `/api/gl/fiscal-periods?${params}`);
            return res.json();
        },
    });
}

export function useCurrentFiscalPeriod(): UseQueryResult<FiscalPeriod | null> {
    return useQuery({
        queryKey: ["/api/gl/fiscal-periods/current"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/gl/fiscal-periods/current");
            return res.json();
        },
    });
}

export function useCreateFiscalPeriod() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertFiscalPeriod) => {
            const res = await apiRequest("POST", "/api/gl/fiscal-periods", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/gl/fiscal-periods"] });
            toast({ title: "Fiscal Period Created", description: "Fiscal period created successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useCloseFiscalPeriod() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (periodId: number) => {
            const res = await apiRequest("POST", `/api/gl/fiscal-periods/${periodId}/close`, {});
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/gl/fiscal-periods"] });
            toast({ title: "Period Closed", description: "Fiscal period closed successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

// =========================================
// JOURNAL ENTRIES
// =========================================

export function useJournalEntries(periodId?: number, status?: string): UseQueryResult<
    (GlJournalEntry & { transactions: GlTransaction[] })[]
> {
    return useQuery({
        queryKey: ["/api/gl/journal-entries", periodId, status],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (periodId) params.append("periodId", String(periodId));
            if (status) params.append("status", status);
            const res = await apiRequest("GET", `/api/gl/journal-entries?${params}`);
            return res.json();
        },
    });
}

export function useJournalEntry(id: number | undefined): UseQueryResult<
    (GlJournalEntry & { transactions: GlTransaction[] }) | null
> {
    return useQuery({
        queryKey: ["/api/gl/journal-entries", id],
        queryFn: async () => {
            if (!id) return null;
            const res = await apiRequest("GET", `/api/gl/journal-entries/${id}`);
            return res.json();
        },
        enabled: !!id,
    });
}

export function useCreateJournalEntry() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async ({ entry, transactions }: { entry: InsertGlJournalEntry; transactions: InsertGlTransaction[] }) => {
            const res = await apiRequest("POST", "/api/gl/journal-entries", { entry, transactions });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/gl/journal-entries"] });
            toast({ title: "Journal Entry Created", description: "Journal entry created successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function usePostJournalEntry() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (entryId: number) => {
            const res = await apiRequest("POST", `/api/gl/journal-entries/${entryId}/post`, {});
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/gl/journal-entries"] });
            toast({ title: "Entry Posted", description: "Journal entry posted to GL successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useReverseJournalEntry() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async ({ entryId, reason }: { entryId: number; reason: string }) => {
            const res = await apiRequest("POST", `/api/gl/journal-entries/${entryId}/reverse`, { reason });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/gl/journal-entries"] });
            toast({ title: "Entry Reversed", description: "Journal entry reversed successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

// =========================================
// GL REPORTS
// =========================================

export function useTrialBalance(periodId: number | undefined): UseQueryResult<any[]> {
    return useQuery({
        queryKey: ["/api/gl/reports/trial-balance", periodId],
        queryFn: async () => {
            if (!periodId) return [];
            const res = await apiRequest("GET", `/api/gl/reports/trial-balance?periodId=${periodId}`);
            return res.json();
        },
        enabled: !!periodId,
    });
}

export function useBalanceSheet(asOfDate?: string): UseQueryResult<any> {
    return useQuery({
        queryKey: ["/api/gl/reports/balance-sheet", asOfDate],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (asOfDate) params.append("asOfDate", asOfDate);
            const res = await apiRequest("GET", `/api/gl/reports/balance-sheet?${params}`);
            return res.json();
        },
    });
}

export function useIncomeStatement(startDate?: string, endDate?: string): UseQueryResult<any> {
    return useQuery({
        queryKey: ["/api/gl/reports/income-statement", startDate, endDate],
        queryFn: async () => {
            if (!startDate || !endDate) return null;
            const res = await apiRequest("GET", `/api/gl/reports/income-statement?startDate=${startDate}&endDate=${endDate}`);
            return res.json();
        },
        enabled: !!startDate && !!endDate,
    });
}
