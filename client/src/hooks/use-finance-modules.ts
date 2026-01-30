import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type {
    Program, InsertProgram,
    Department, InsertDepartment,
    Donor, InsertDonor,
    Donation, InsertDonation,
    EndowmentFund, InsertEndowmentFund,
    Investment, InsertInvestment,
    InvestmentTransaction, InsertInvestmentTransaction,
    DepreciationSchedule, InsertDepreciationSchedule,
    DepreciationEntry,
    AssetDisposal, InsertAssetDisposal
} from "@shared/schema";

// ========================================
// PROGRAMS HOOKS
// ========================================

export function usePrograms(isActive?: boolean) {
    return useQuery<Program[]>({
        queryKey: ["/api/finance/programs", isActive],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (isActive !== undefined) params.append("isActive", isActive.toString());
            const res = await apiRequest("GET", `/api/finance/programs?${params}`);
            return res.json();
        },
    });
}

export function useProgram(id: number) {
    return useQuery<Program>({
        queryKey: ["/api/finance/programs", id],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/finance/programs/${id}`);
            return res.json();
        },
        enabled: !!id,
    });
}

export function useCreateProgram() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertProgram) => {
            const res = await apiRequest("POST", "/api/finance/programs", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/programs"] });
            toast({ title: "Program Created", description: "Program has been added successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useUpdateProgram() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<InsertProgram> }) => {
            const res = await apiRequest("PATCH", `/api/finance/programs/${id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/programs"] });
            toast({ title: "Program Updated", description: "Program has been updated successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

// ========================================
// DEPARTMENTS HOOKS
// ========================================

export function useDepartments(isActive?: boolean) {
    return useQuery<Department[]>({
        queryKey: ["/api/finance/departments", isActive],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (isActive !== undefined) params.append("isActive", isActive.toString());
            const res = await apiRequest("GET", `/api/finance/departments?${params}`);
            return res.json();
        },
    });
}

export function useDepartment(id: number) {
    return useQuery<Department>({
        queryKey: ["/api/finance/departments", id],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/finance/departments/${id}`);
            return res.json();
        },
        enabled: !!id,
    });
}

export function useDepartmentBudgetVariance(id: number) {
    return useQuery<{ budgeted: number; actual: number; variance: number }>({
        queryKey: ["/api/finance/departments", id, "budget-variance"],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/finance/departments/${id}/budget-variance`);
            return res.json();
        },
        enabled: !!id,
    });
}

export function useCreateDepartment() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertDepartment) => {
            const res = await apiRequest("POST", "/api/finance/departments", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/departments"] });
            toast({ title: "Department Created", description: "Department has been added successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useUpdateDepartment() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<InsertDepartment> }) => {
            const res = await apiRequest("PATCH", `/api/finance/departments/${id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/departments"] });
            toast({ title: "Department Updated", description: "Department has been updated successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

// ========================================
// DONORS HOOKS
// ========================================

export function useDonors(isActive?: boolean) {
    return useQuery<Donor[]>({
        queryKey: ["/api/finance/donors", isActive],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (isActive !== undefined) params.append("isActive", isActive.toString());
            const res = await apiRequest("GET", `/api/finance/donors?${params}`);
            return res.json();
        },
    });
}

export function useDonor(id: number) {
    return useQuery<Donor & { donations: Donation[] }>({
        queryKey: ["/api/finance/donors", id],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/finance/donors/${id}`);
            return res.json();
        },
        enabled: !!id,
    });
}

export function useCreateDonor() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertDonor) => {
            const res = await apiRequest("POST", "/api/finance/donors", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/donors"] });
            toast({ title: "Donor Added", description: "Donor profile has been created successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useUpdateDonor() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<InsertDonor> }) => {
            const res = await apiRequest("PATCH", `/api/finance/donors/${id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/donors"] });
            toast({ title: "Donor Updated", description: "Donor profile has been updated." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

// ========================================
// DONATIONS HOOKS
// ========================================

export function useDonations(donorId?: number, startDate?: string, endDate?: string) {
    return useQuery<Donation[]>({
        queryKey: ["/api/finance/donations", donorId, startDate, endDate],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (donorId) params.append("donorId", donorId.toString());
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);
            const res = await apiRequest("GET", `/api/finance/donations?${params}`);
            return res.json();
        },
    });
}

export function useCreateDonation() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertDonation) => {
            const res = await apiRequest("POST", "/api/finance/donations", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/donations"] });
            queryClient.invalidateQueries({ queryKey: ["/api/finance/donors"] });
            toast({ title: "Donation Recorded", description: "Donation has been recorded successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function usePostDonationToGL() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (donationId: number) => {
            const res = await apiRequest("POST", `/api/finance/donations/${donationId}/post-to-gl`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/donations"] });
            toast({ title: "Posted to GL", description: "Donation has been posted to General Ledger." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

// ========================================
// ENDOWMENT HOOKS
// ========================================

export function useEndowmentFunds(isActive?: boolean) {
    return useQuery<EndowmentFund[]>({
        queryKey: ["/api/finance/endowments", isActive],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (isActive !== undefined) params.append("isActive", isActive.toString());
            const res = await apiRequest("GET", `/api/finance/endowments?${params}`);
            return res.json();
        },
    });
}

export function useEndowmentFund(id: number) {
    return useQuery<EndowmentFund & { investments: Investment[] }>({
        queryKey: ["/api/finance/endowments", id],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/finance/endowments/${id}`);
            return res.json();
        },
        enabled: !!id,
    });
}

export function useCreateEndowmentFund() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertEndowmentFund) => {
            const res = await apiRequest("POST", "/api/finance/endowments", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/endowments"] });
            toast({ title: "Endowment Fund Created", description: "Fund has been created successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useUpdateEndowmentFund() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<InsertEndowmentFund> }) => {
            const res = await apiRequest("PATCH", `/api/finance/endowments/${id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/endowments"] });
            toast({ title: "Endowment Updated", description: "Fund has been updated successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useCalculateSpendableAmount(fundId: number) {
    return useQuery<{ spendableAmount: number }>({
        queryKey: ["/api/finance/endowments", fundId, "spendable"],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/finance/endowments/${fundId}/spendable`);
            return res.json();
        },
        enabled: !!fundId,
    });
}

// ========================================
// INVESTMENT HOOKS
// ========================================

export function useInvestments(fundId?: number) {
    return useQuery<Investment[]>({
        queryKey: ["/api/finance/investments", fundId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (fundId) params.append("fundId", fundId.toString());
            const res = await apiRequest("GET", `/api/finance/investments?${params}`);
            return res.json();
        },
    });
}

export function useCreateInvestment() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertInvestment) => {
            const res = await apiRequest("POST", "/api/finance/investments", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/investments"] });
            toast({ title: "Investment Added", description: "Investment has been added to portfolio." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useUpdateInvestmentValue() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async ({ id, currentPrice }: { id: number; currentPrice: number }) => {
            const res = await apiRequest("PATCH", `/api/finance/investments/${id}/value`, { currentPrice });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/investments"] });
            queryClient.invalidateQueries({ queryKey: ["/api/finance/endowments"] });
            toast({ title: "Value Updated", description: "Investment value has been updated." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

// ========================================
// DEPRECIATION HOOKS
// ========================================

export function useDepreciationSchedules(assetId?: number) {
    return useQuery<DepreciationSchedule[]>({
        queryKey: ["/api/finance/depreciation-schedules", assetId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (assetId) params.append("assetId", assetId.toString());
            const res = await apiRequest("GET", `/api/finance/depreciation-schedules?${params}`);
            return res.json();
        },
    });
}

export function useCreateDepreciationSchedule() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertDepreciationSchedule) => {
            const res = await apiRequest("POST", "/api/finance/depreciation-schedules", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/depreciation-schedules"] });
            toast({ title: "Schedule Created", description: "Depreciation schedule has been created." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useRunMonthlyDepreciation() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/finance/depreciation/run-monthly");
            return res.json();
        },
        onSuccess: (data: { message: string; entries: DepreciationEntry[] }) => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/depreciation-schedules"] });
            queryClient.invalidateQueries({ queryKey: ["/api/finance/assets"] });
            toast({ title: "Depreciation Complete", description: data.message });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useDepreciationEntries(scheduleId?: number) {
    return useQuery<DepreciationEntry[]>({
        queryKey: ["/api/finance/depreciation-entries", scheduleId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (scheduleId) params.append("scheduleId", scheduleId.toString());
            const res = await apiRequest("GET", `/api/finance/depreciation-entries?${params}`);
            return res.json();
        },
    });
}

// ========================================
// ASSET DISPOSAL HOOKS
// ========================================

export function useAssetDisposals(assetId?: number) {
    return useQuery<AssetDisposal[]>({
        queryKey: ["/api/finance/asset-disposals", assetId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (assetId) params.append("assetId", assetId.toString());
            const res = await apiRequest("GET", `/api/finance/asset-disposals?${params}`);
            return res.json();
        },
    });
}

export function useCreateAssetDisposal() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertAssetDisposal) => {
            const res = await apiRequest("POST", "/api/finance/asset-disposals", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/asset-disposals"] });
            queryClient.invalidateQueries({ queryKey: ["/api/finance/depreciation-schedules"] });
            toast({ title: "Asset Disposed", description: "Asset disposal has been recorded." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function usePostDisposalToGL() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (disposalId: number) => {
            const res = await apiRequest("POST", `/api/finance/asset-disposals/${disposalId}/post-to-gl`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/asset-disposals"] });
            toast({ title: "Posted to GL", description: "Asset disposal has been posted to General Ledger." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}
