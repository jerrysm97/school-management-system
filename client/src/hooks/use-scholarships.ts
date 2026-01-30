import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
    ScholarshipType, InsertScholarshipType,
    ScholarshipApplication, InsertScholarshipApplication,
    StudentScholarship, InsertStudentScholarship
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// --- Scholarship Types ---
export function useScholarshipTypes() {
    return useQuery<ScholarshipType[]>({
        queryKey: ["/api/finance/scholarships/types"],
    });
}

export function useCreateScholarshipType() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertScholarshipType) => {
            const res = await apiRequest("POST", "/api/finance/scholarships/types", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/scholarships/types"] });
            toast({ title: "Success", description: "Scholarship type created successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

// --- Applications ---
export function useScholarshipApplications(studentId?: number) {
    return useQuery<ScholarshipApplication[]>({
        queryKey: ["/api/finance/scholarships/applications", studentId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (studentId) params.append("studentId", studentId.toString());
            const res = await apiRequest("GET", `/api/finance/scholarships/applications?${params}`);
            return res.json();
        },
    });
}

export function useCreateScholarshipApplication() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertScholarshipApplication) => {
            const res = await apiRequest("POST", "/api/finance/scholarships/applications", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/scholarships/applications"] });
            toast({ title: "Success", description: "Application submitted successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

// --- Awards ---
export function useStudentScholarships(studentId: number) {
    return useQuery<StudentScholarship[]>({
        queryKey: ["/api/finance/scholarships/student", studentId],
        queryFn: async () => {
            if (!studentId) return [];
            const res = await apiRequest("GET", `/api/finance/scholarships/student/${studentId}`);
            return res.json();
        },
        enabled: !!studentId,
    });
}

export function useAwardScholarship() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertStudentScholarship) => {
            const res = await apiRequest("POST", "/api/finance/scholarships/awards", data);
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["/api/finance/scholarships/student", variables.studentId] });
            toast({ title: "Success", description: "Scholarship awarded successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}
