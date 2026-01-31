import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AuditLog {
    id: number;
    userId: number | null;
    action: string;
    tableName: string;
    recordId: number | null;
    oldValue: Record<string, any> | null;
    newValue: Record<string, any> | null;
    ipAddress: string | null;
    userAgent: string | null;
    metadata: Record<string, any>;
    createdAt: string;
}

interface FiscalPeriod {
    id: number;
    periodName: string;
    startDate: string;
    endDate: string;
    isLocked: boolean;
    lockedBy: number | null;
    lockedAt: string | null;
    notes: string | null;
}

interface AuditLogParams {
    tableName?: string;
    recordId?: number;
    userId?: number;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}

export function useAuditLogs(params: AuditLogParams = {}) {
    const queryString = new URLSearchParams();
    if (params.tableName) queryString.set("tableName", params.tableName);
    if (params.recordId) queryString.set("recordId", params.recordId.toString());
    if (params.userId) queryString.set("userId", params.userId.toString());
    if (params.action) queryString.set("action", params.action);
    if (params.startDate) queryString.set("startDate", params.startDate);
    if (params.endDate) queryString.set("endDate", params.endDate);
    if (params.limit) queryString.set("limit", params.limit.toString());
    if (params.offset) queryString.set("offset", params.offset.toString());

    return useQuery<AuditLog[]>({
        queryKey: ["/api/audit-logs", params],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/audit-logs?${queryString.toString()}`);
            return res.json();
        },
    });
}

export function useRecordHistory(tableName: string, recordId: number) {
    return useQuery<AuditLog[]>({
        queryKey: ["/api/audit-logs", tableName, recordId],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/audit-logs/${tableName}/${recordId}`);
            return res.json();
        },
        enabled: !!tableName && !!recordId,
    });
}

export function useFiscalPeriods() {
    return useQuery<FiscalPeriod[]>({
        queryKey: ["/api/fiscal-periods"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/fiscal-periods");
            return res.json();
        },
    });
}
