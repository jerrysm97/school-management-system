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
import {
    Loader2, CheckCircle, XCircle, GraduationCap, Users, Clock,
    FileCheck, UserPlus, TrendingUp, Sparkles, ArrowRight, Mail,
    Phone, Calendar, Building2, FileText
} from "lucide-react";

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

    // Fetch counts for stats
    const { data: allStudents } = useQuery({
        queryKey: ["/api/students"],
        queryFn: async () => {
            const res = await fetch("/api/students");
            if (!res.ok) return [];
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

    // Calculate stats
    const pendingCount = (applicants as any[])?.length || 0;
    const approvedCount = (allStudents as any[])?.filter((s: any) => s.status === 'approved' || s.status === 'active')?.length || 0;
    const totalApplications = (allStudents as any[])?.length || 0;
    const thisWeekCount = 0; // Placeholder for new applications this week

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
                        <GraduationCap className="absolute inset-0 m-auto h-6 w-6 text-violet-400" />
                    </div>
                    <p className="text-slate-400 animate-pulse">Loading Admissions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-purple-600/10 to-fuchsia-600/20" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNHMtNi4yNjggMTQtMTQgMTR6IiBmaWxsPSIjOGI1Y2Y2IiBmaWxsLW9wYWNpdHk9Ii4wMyIvPjwvZz48L3N2Zz4=')] opacity-40" />

                <div className="relative px-6 py-12 lg:py-16">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm">
                                    <Sparkles className="h-4 w-4" />
                                    <span>Admissions Portal</span>
                                </div>
                                <h1 className="text-4xl lg:text-5xl font-bold">
                                    <span className="bg-gradient-to-r from-white via-violet-100 to-purple-200 bg-clip-text text-transparent">
                                        Admission
                                    </span>
                                    <span className="text-white"> Dashboard</span>
                                </h1>
                                <p className="text-lg text-slate-400 max-w-xl">
                                    Review, process, and manage student applications. Track enrollment progress and admission statistics.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Button
                                    size="lg"
                                    className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-violet-500/25 transition-all"
                                    onClick={() => window.location.href = '/admissions/new'}
                                >
                                    <UserPlus className="h-5 w-5 mr-2" />
                                    New Application
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="px-6 -mt-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Total Applications", value: totalApplications, icon: FileText, color: "violet", gradient: "from-violet-500 to-violet-600" },
                            { label: "Pending Review", value: pendingCount, icon: Clock, color: "amber", gradient: "from-amber-500 to-amber-600" },
                            { label: "Approved", value: approvedCount, icon: CheckCircle, color: "emerald", gradient: "from-emerald-500 to-emerald-600" },
                            { label: "This Week", value: thisWeekCount, icon: TrendingUp, color: "cyan", gradient: "from-cyan-500 to-cyan-600" },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className="group relative bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5 overflow-hidden transition-all duration-300 hover:border-slate-600 hover:shadow-lg"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                                <div className="relative flex items-center gap-4">
                                    <div className={`p-3 rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/20`}>
                                        <stat.icon className={`h-5 w-5 text-${stat.color}-400`} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
                                        <p className="text-xs text-slate-400">{stat.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-6 py-10">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* Pending Applications Section */}
                    <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
                        <div className="p-6 border-b border-slate-700/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                        <Clock className="h-5 w-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">Pending Applications</h2>
                                        <p className="text-sm text-slate-400">Review and approve new student applications</p>
                                    </div>
                                </div>
                                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 px-3 py-1">
                                    {pendingCount} pending
                                </Badge>
                            </div>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-700/50 hover:bg-transparent">
                                    <TableHead className="text-slate-300">Applicant</TableHead>
                                    <TableHead className="text-slate-300">Contact Information</TableHead>
                                    <TableHead className="text-slate-300">Applied Date</TableHead>
                                    <TableHead className="text-slate-300">Status</TableHead>
                                    <TableHead className="text-right text-slate-300">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(applicants as any[])?.map((student) => (
                                    <TableRow key={student.id} className="border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center">
                                                    <span className="text-violet-400 font-semibold text-sm">
                                                        {student.user?.name?.charAt(0)?.toUpperCase() || 'A'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{student.user?.name || 'Unknown'}</p>
                                                    <p className="text-xs text-slate-500">ID: {student.admissionNo || 'Pending'}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                                    <Mail className="h-3.5 w-3.5 text-slate-500" />
                                                    {student.user?.email || '—'}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Phone className="h-3 w-3" />
                                                    {student.phone || '—'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <Calendar className="h-4 w-4 text-slate-500" />
                                                <span className="text-sm">Recent</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                                                <Clock className="h-3 w-3 mr-1" />
                                                Pending
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                                                    onClick={() => approveMutation.mutate({ id: student.id, status: 'approved' })}
                                                    disabled={approveMutation.isPending}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-400 hover:bg-red-500/20 hover:text-red-400"
                                                    onClick={() => approveMutation.mutate({ id: student.id, status: 'rejected' })}
                                                    disabled={approveMutation.isPending}
                                                >
                                                    <XCircle className="h-4 w-4 mr-1" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {pendingCount === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12">
                                            <div className="flex flex-col items-center">
                                                <div className="p-4 rounded-full bg-slate-800/50 mb-4">
                                                    <FileCheck className="h-10 w-10 text-emerald-400" />
                                                </div>
                                                <p className="text-lg font-medium text-white">All Caught Up!</p>
                                                <p className="text-sm text-slate-400 mt-1">No pending applications to review</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Recent Admissions Section */}
                    <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
                        <div className="p-6 border-b border-slate-700/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                        <GraduationCap className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">Recent Admissions</h2>
                                        <p className="text-sm text-slate-400">Recently approved students ready for enrollment</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-slate-600 hover:bg-slate-700/50 text-slate-300"
                                    onClick={() => window.location.href = '/students'}
                                >
                                    View All Students
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-700/50 hover:bg-transparent">
                                    <TableHead className="text-slate-300">Student Name</TableHead>
                                    <TableHead className="text-slate-300">Admission No</TableHead>
                                    <TableHead className="text-slate-300">Class</TableHead>
                                    <TableHead className="text-right text-slate-300">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* Show approved students */}
                                {(allStudents as any[])?.filter((s: any) => s.status === 'approved' || s.status === 'active')?.slice(0, 5)?.map((student: any) => (
                                    <TableRow key={student.id} className="border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
                                                    <span className="text-emerald-400 font-semibold text-sm">
                                                        {student.user?.name?.charAt(0)?.toUpperCase() || 'S'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{student.user?.name || 'Student'}</p>
                                                    <p className="text-xs text-slate-500">{student.user?.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <code className="px-2 py-1 rounded bg-slate-700/50 text-slate-300 text-sm font-mono">
                                                {student.admissionNo || '—'}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-slate-600 text-slate-300">
                                                {student.class?.name || 'Unassigned'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
                                                    onClick={() => window.location.href = `/campus/hostel?studentId=${student.id}&action=allocate`}
                                                >
                                                    <Building2 className="h-4 w-4 mr-1" />
                                                    Assign Hostel
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )) || null}
                                {((allStudents as any[])?.filter((s: any) => s.status === 'approved' || s.status === 'active')?.length || 0) === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12">
                                            <div className="flex flex-col items-center">
                                                <div className="p-4 rounded-full bg-slate-800/50 mb-4">
                                                    <Users className="h-10 w-10 text-slate-500" />
                                                </div>
                                                <p className="text-lg font-medium text-white">No Recent Admissions</p>
                                                <p className="text-sm text-slate-400 mt-1">Approved students will appear here</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            {
                                title: "View All Students",
                                description: "Browse complete student directory",
                                icon: Users,
                                color: "violet",
                                href: "/students"
                            },
                            {
                                title: "Hostel Management",
                                description: "Allocate rooms and manage housing",
                                icon: Building2,
                                color: "emerald",
                                href: "/campus/hostel"
                            },
                            {
                                title: "Fee Assignment",
                                description: "Configure fees for new admissions",
                                icon: FileText,
                                color: "amber",
                                href: "/finance/fee-assignment"
                            },
                        ].map((action, i) => (
                            <button
                                key={i}
                                onClick={() => window.location.href = action.href}
                                className={`group relative bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 text-left overflow-hidden transition-all duration-300 hover:border-${action.color}-500/30 hover:shadow-lg hover:shadow-${action.color}-500/5`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br from-${action.color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                                <div className="relative flex items-start gap-4">
                                    <div className={`p-3 rounded-xl bg-${action.color}-500/10 border border-${action.color}-500/20 group-hover:scale-110 transition-transform`}>
                                        <action.icon className={`h-6 w-6 text-${action.color}-400`} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors">{action.title}</h3>
                                        <p className="text-sm text-slate-400 mt-1">{action.description}</p>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-slate-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
