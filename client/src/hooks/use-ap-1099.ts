import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "./use-toast";

export function use1099Records(taxYear: number) {
    return useQuery({
        queryKey: ["ap-1099-records", taxYear],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/ap/1099/records?taxYear=${taxYear}`);
            return res.json();
        }
    });
}

export function useGenerate1099Records() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (taxYear: number) => {
            const res = await apiRequest("POST", "/api/ap/1099/generate", { taxYear });
            return res.json();
        },
        onSuccess: (_, taxYear) => {
            queryClient.invalidateQueries({ queryKey: ["ap-1099-records", taxYear] });
            toast({
                title: "Success",
                description: "1099 records generated successfully",
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
