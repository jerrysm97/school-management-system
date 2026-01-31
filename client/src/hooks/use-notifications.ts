import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Notification {
    id: number;
    userId: number;
    type: string;
    title: string;
    message: string;
    link?: string;
    channel: string;
    status: string;
    sentAt?: string;
    readAt?: string;
    metadata: Record<string, any>;
    createdAt: string;
}

export function useNotifications(limit = 20, offset = 0) {
    return useQuery<Notification[]>({
        queryKey: ["/api/notifications", limit, offset],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/notifications?limit=${limit}&offset=${offset}`);
            return res.json();
        },
        refetchInterval: 30000, // Poll every 30 seconds
    });
}

export function useUnreadCount() {
    return useQuery<{ count: number }>({
        queryKey: ["/api/notifications/unread-count"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/notifications/unread-count");
            return res.json();
        },
        refetchInterval: 15000, // Poll every 15 seconds
    });
}

export function useMarkAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notificationId: number) => {
            const res = await apiRequest("POST", `/api/notifications/${notificationId}/read`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
            queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
        },
    });
}

export function useMarkAllAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/notifications/read-all");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
            queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
        },
    });
}

export function useTriggerFeeReminders() {
    return useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/notifications/trigger-fee-reminders");
            return res.json();
        },
    });
}

export function useTriggerOverdueAlerts() {
    return useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/notifications/trigger-overdue-alerts");
            return res.json();
        },
    });
}
