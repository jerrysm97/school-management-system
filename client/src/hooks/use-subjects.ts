import { useQuery } from "@tanstack/react-query";
import { type Subject } from "@shared/schema";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
    };
};

export function useSubjects() {
    return useQuery({
        queryKey: ["/api/subjects"],
        queryFn: async () => {
            const res = await fetch("/api/subjects", {
                headers: getAuthHeaders(),
            });
            if (!res.ok) throw new Error("Failed to fetch subjects");
            return await res.json() as Subject[];
        },
    });
}
