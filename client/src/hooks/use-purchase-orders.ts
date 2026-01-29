import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "./use-toast";
import type { PurchaseOrder, InsertPurchaseOrder } from "@shared/schema";

export function usePurchaseOrders(vendorId?: number, status?: string) {
    const query = new URLSearchParams();
    if (vendorId) query.append("vendorId", vendorId.toString());
    if (status) query.append("status", status);

    return useQuery<PurchaseOrder[]>({
        queryKey: ["purchase-orders", vendorId, status],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/ap/purchase-orders?${query.toString()}`);
            return res.json();
        }
    });
}

export function useCreatePurchaseOrder() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: { po: InsertPurchaseOrder; items: any[] }) => {
            // Deconstruct to match API expectation: body = { ...po, items: [] }
            const { po, items } = data;
            const res = await apiRequest("POST", "/api/ap/purchase-orders", { ...po, items });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
            toast({
                title: "Success",
                description: "Purchase Order created successfully",
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

export function useReceivePO() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: { id: number; items: any[] }) => {
            const res = await apiRequest("POST", `/api/ap/purchase-orders/${data.id}/receive`, { items: data.items });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
            toast({
                title: "Success",
                description: "PO items received successfully",
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
