import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PayrollRun, PayrollDetail, Timesheet, InsertTimesheet, W2Record } from "@shared/schema";

// ========================================
// PAYROLL RUN HOOKS
// ========================================

export function usePayrollRun(id: number) {
    return useQuery<PayrollRun & { details: PayrollDetail[] }>({
        queryKey: ["/api/finance/payroll-runs", id],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/finance/payroll-runs/${id}`);
            return res.json();
        },
        enabled: !!id,
    });
}

export function useCalculatePayroll() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (runId: number) => {
            const res = await apiRequest("POST", `/api/finance/payroll-runs/${runId}/calculate`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/payroll-runs"] });
            toast({ title: "Payroll Calculated", description: "Payroll totals have been calculated." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useProcessPayroll() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (runId: number) => {
            const res = await apiRequest("POST", `/api/finance/payroll-runs/${runId}/process`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/payroll-runs"] });
            toast({ title: "Payroll Processed", description: "Payroll has been processed successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

// ========================================
// TIMESHEET HOOKS
// ========================================

export function useTimesheets(employeeId?: number, startDate?: string, endDate?: string) {
    return useQuery<Timesheet[]>({
        queryKey: ["/api/finance/timesheets", employeeId, startDate, endDate],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (employeeId) params.append("employeeId", employeeId.toString());
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);
            const res = await apiRequest("GET", `/api/finance/timesheets?${params}`);
            return res.json();
        },
    });
}

export function useCreateTimesheet() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertTimesheet) => {
            const res = await apiRequest("POST", "/api/finance/timesheets", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/timesheets"] });
            toast({ title: "Timesheet Recorded", description: "Time entry has been saved." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useApproveTimesheet() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (timesheetId: number) => {
            const res = await apiRequest("POST", `/api/finance/timesheets/${timesheetId}/approve`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/timesheets"] });
            toast({ title: "Timesheet Approved", description: "Timesheet has been approved." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

// ========================================
// W-2/TAX RECORD HOOKS
// ========================================

export function useGenerateW2Records() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (taxYear: number) => {
            const res = await apiRequest("POST", `/api/finance/w2-records/generate/${taxYear}`);
            return res.json();
        },
        onSuccess: (data: { message: string; records: W2Record[] }) => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/w2-records"] });
            toast({ title: "W-2s Generated", description: data.message });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useW2Records(taxYear: number, employeeId?: number) {
    return useQuery<W2Record[]>({
        queryKey: ["/api/finance/w2-records", taxYear, employeeId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (employeeId) params.append("employeeId", employeeId.toString());
            const res = await apiRequest("GET", `/api/finance/w2-records/${taxYear}?${params}`);
            return res.json();
        },
        enabled: !!taxYear,
    });
}
