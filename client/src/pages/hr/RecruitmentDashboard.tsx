import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
    Card,
    CardContent,
    CardDescription,
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
import { Loader2, CheckCircle, XCircle, UserPlus, FileText } from "lucide-react";
import { JobApplication } from "@shared/schema";

export default function RecruitmentDashboard() {
    const { toast } = useToast();

    // Fetch Applications
    const { data: applications, isLoading } = useQuery<JobApplication[]>({
        queryKey: ["/api/hr/applications"],
    });

    // Hiring Mutation
    const hireMutation = useMutation({
        mutationFn: async ({ id, role, department }: { id: number, role: string, department: string }) => {
            const res = await fetch(`/api/hr/hire/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role, department, designation: "New Hire" }),
            });
            if (!res.ok) throw new Error((await res.json()).message);
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Success", description: "Applicant hired successfully" });
            queryClient.invalidateQueries({ queryKey: ["/api/hr/applications"] });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const handleHire = (id: number) => {
        // Simple prompt for now, could be a dialog
        if (confirm("Hire this applicant as a Teacher?")) {
            hireMutation.mutate({ id, role: "teacher", department: "General" });
        }
    };

    const statusColors: Record<string, string> = {
        applied: "bg-blue-100 text-blue-800",
        review: "bg-yellow-100 text-yellow-800",
        interviewed: "bg-purple-100 text-purple-800",
        hired: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-display font-bold">Recruitment Dashboard</h1>
                    <p className="text-muted-foreground">Manage job applications and hiring pipeline</p>
                </div>
                <Button>
                    <FileText className="mr-2 h-4 w-4" /> Post New Job
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{applications?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {applications?.filter(a => a.status === 'applied').length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Hired This Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {applications?.filter(a => a.status === 'hired').length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Applications</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Candidate</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Applied</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {applications?.map((app) => (
                                <TableRow key={app.id}>
                                    <TableCell className="font-medium">{app.firstName} {app.lastName}</TableCell>
                                    <TableCell>{app.email}</TableCell>
                                    <TableCell>{app.phone}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={statusColors[app.status as string] || "bg-gray-100"}>
                                            {app.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(app.appliedAt || "").toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        {app.status !== 'hired' && app.status !== 'rejected' && (
                                            <>
                                                <Button size="sm" variant="outline" onClick={() => handleHire(app.id)}>
                                                    <UserPlus className="h-4 w-4 mr-1" /> Hire
                                                </Button>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {applications?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No applications found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
