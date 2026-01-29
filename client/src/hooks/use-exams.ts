import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
    };
}

export function useExams(classId?: number) {
    return useQuery({
        queryKey: ["exams", classId],
        queryFn: async () => {
            const url = classId ? `${api.exams.list.path}?classId=${classId}` : api.exams.list.path;
            const res = await fetch(url, { headers: getAuthHeaders() });
            if (!res.ok) throw new Error("Failed to fetch exams");
            return res.json();
        },
    });
}

export function useCreateExam() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { name: string; classId: number; subjectId: number; date: string; totalMarks?: number }) => {
            const res = await fetch(api.exams.create.path, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to create exam");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exams"] });
        },
    });
}

export function useMarks(examId?: number, studentId?: number) {
    return useQuery({
        queryKey: ["marks", examId, studentId],
        queryFn: async () => {
            let url = api.marks.list.path;
            const params = new URLSearchParams();
            if (examId) params.append("examId", String(examId));
            if (studentId) params.append("studentId", String(studentId));
            if (params.toString()) url += `?${params.toString()}`;

            const res = await fetch(url, { headers: getAuthHeaders() });
            if (!res.ok) throw new Error("Failed to fetch marks");
            return res.json();
        },
        enabled: !!examId || !!studentId,
    });
}

export function useCreateMark() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { examId: number; studentId: number; score: number }) => {
            const res = await fetch(api.marks.create.path, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to create mark");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["marks"] });
        },
    });
}
