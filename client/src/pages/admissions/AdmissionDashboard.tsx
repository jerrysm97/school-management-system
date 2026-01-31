import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function AdmissionDashboard() {
    const { toast } = useToast();

    // Fetch Pending Students (Applicants)
    const { data: applicants, isLoading } = useQuery({
        queryKey: ["/api/students", { status: "pending" }],
        queryFn: async () => {
            const res = await fetch("/api/students?status=pending");
            if (!res.ok) throw new Error("Failed");
            return res.json();
        }
    });

    const approveMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number, status: string }) => {
            const res = await fetch(`/api/students/${id}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error((await res.json()).message);
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Success", description: "Applicant status updated" });
            queryClient.invalidateQueries({ queryKey: ["/api/students"] });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-display font-bold">Admission Dashboard</h1>
                <p className="text-muted-foreground">Review and process student applications</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {(applicants as any[])?.length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>New Applications</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Applicant Name</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Applied Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(applicants as any[])?.map((student) => (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium">
                                        {student.user.name}
                                        <div className="text-xs text-muted-foreground">ID: {student.admissionNo}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">{student.user.email}</div>
                                        <div className="text-xs text-muted-foreground">{student.phone}</div>
                                    </TableCell>
                                    <TableCell>
                                        {/* Using created_at from user or similar if available, else just 'Recent' */}
                                        Recent
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                            Pending
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700"
                                            onClick={() => approveMutation.mutate({ id: student.id, status: 'approved' })}>
                                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                                        </Button>
                                        <Button size="sm" variant="destructive"
                                            onClick={() => approveMutation.mutate({ id: student.id, status: 'rejected' })}>
                                            <XCircle className="h-4 w-4 mr-1" /> Reject
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(applicants as any[])?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No pending applications
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Approved Students Section - Where Hostel Link is active */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Admissions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student Name</TableHead>
                                <TableHead>Admission No</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Fetch approved students would go here, simplified logic for now: */}
                            {/* If we want to show approved students to link hostel, we'd need another query here. */}
                            {/* FOR NOW: Let's assume the user wants to link hostel even if pending? No, usually after approval. */}
                            {/* Let's redirect to Hostel Page from the main Student list or add a new section here called 'Recent Admissions' */}
                        </TableBody>
                    </Table>
                    <div className="mt-4 text-center">
                        <Button variant="outline" onClick={() => window.location.href = '/students'}>
                            View All Students to Assign Hostel
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
