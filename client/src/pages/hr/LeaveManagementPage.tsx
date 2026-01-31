import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Calendar, Clock, CheckCircle, XCircle, Plus, Plane, Stethoscope, Baby, Users } from "lucide-react";

interface LeaveRequest {
    id: number;
    employeeId: number;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string | null;
    status: string;
    approvedBy: number | null;
    createdAt: string;
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem("token");
    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

const leaveTypes = [
    { value: "sick", label: "Sick Leave", icon: Stethoscope, color: "text-red-400" },
    { value: "vacation", label: "Vacation", icon: Plane, color: "text-blue-400" },
    { value: "personal", label: "Personal", icon: Users, color: "text-purple-400" },
    { value: "maternity", label: "Maternity", icon: Baby, color: "text-pink-400" },
    { value: "paternity", label: "Paternity", icon: Baby, color: "text-cyan-400" },
    { value: "unpaid", label: "Unpaid Leave", icon: Clock, color: "text-gray-400" },
];

const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    approved: "bg-green-500/20 text-green-400 border-green-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function LeaveManagementPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [requestOpen, setRequestOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("requests");

    const isAdmin = user?.role && ['main_admin', 'admin', 'principal', 'hr'].includes(user.role);

    // Fetch leave requests
    const { data: requests = [], isLoading } = useQuery<LeaveRequest[]>({
        queryKey: ["/api/leave/requests"],
        queryFn: () => fetchWithAuth("/api/leave/requests"),
    });

    // Create request mutation
    const createRequestMutation = useMutation({
        mutationFn: (data: Partial<LeaveRequest>) => fetchWithAuth("/api/leave/requests", {
            method: "POST",
            body: JSON.stringify(data),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/leave/requests"] });
            setRequestOpen(false);
            toast({ title: "Success", description: "Leave request submitted" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    // Stats
    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    const approvedRequests = requests.filter(r => r.status === 'approved').length;
    const rejectedRequests = requests.filter(r => r.status === 'rejected').length;

    const handleSubmitRequest = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        createRequestMutation.mutate({
            leaveType: formData.get("leaveType") as string,
            startDate: formData.get("startDate") as string,
            endDate: formData.get("endDate") as string,
            reason: formData.get("reason") as string,
        });
    };

    const calculateDays = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                        Leave Management
                    </h1>
                    <p className="text-slate-400 mt-1">
                        {isAdmin ? "Review and manage staff leave requests" : "Submit and track your leave requests"}
                    </p>
                </div>
                <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600">
                            <Plus className="h-4 w-4 mr-2" /> Request Leave
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-800">
                        <DialogHeader>
                            <DialogTitle>Submit Leave Request</DialogTitle>
                            <DialogDescription>Fill in the details for your leave request</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmitRequest} className="space-y-4">
                            <div>
                                <Label>Leave Type</Label>
                                <Select name="leaveType" required>
                                    <SelectTrigger className="bg-slate-800 border-slate-700">
                                        <SelectValue placeholder="Select leave type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {leaveTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                <div className="flex items-center gap-2">
                                                    <type.icon className={`h-4 w-4 ${type.color}`} />
                                                    {type.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Start Date</Label>
                                    <Input name="startDate" type="date" required className="bg-slate-800 border-slate-700" />
                                </div>
                                <div>
                                    <Label>End Date</Label>
                                    <Input name="endDate" type="date" required className="bg-slate-800 border-slate-700" />
                                </div>
                            </div>
                            <div>
                                <Label>Reason</Label>
                                <Textarea
                                    name="reason"
                                    placeholder="Provide a brief reason for your leave request..."
                                    className="bg-slate-800 border-slate-700 min-h-[100px]"
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={createRequestMutation.isPending}>
                                {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-violet-500/20">
                                <Calendar className="h-6 w-6 text-violet-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{requests.length}</p>
                                <p className="text-sm text-slate-400">Total Requests</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-yellow-500/20">
                                <Clock className="h-6 w-6 text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{pendingRequests}</p>
                                <p className="text-sm text-slate-400">Pending</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/20">
                                <CheckCircle className="h-6 w-6 text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{approvedRequests}</p>
                                <p className="text-sm text-slate-400">Approved</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-red-500/20">
                                <XCircle className="h-6 w-6 text-red-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{rejectedRequests}</p>
                                <p className="text-sm text-slate-400">Rejected</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Leave Type Quick Stats */}
            <Card className="border-slate-800">
                <CardHeader>
                    <CardTitle className="text-lg">Leave Types Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        {leaveTypes.map((type) => {
                            const count = requests.filter(r => r.leaveType === type.value).length;
                            return (
                                <div key={type.value} className="text-center p-4 rounded-lg bg-slate-800/50">
                                    <type.icon className={`h-8 w-8 mx-auto mb-2 ${type.color}`} />
                                    <p className="text-lg font-bold text-white">{count}</p>
                                    <p className="text-xs text-slate-400">{type.label}</p>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Requests Table */}
            <Card className="border-slate-800">
                <CardHeader>
                    <CardTitle className="text-lg">
                        {isAdmin ? "All Leave Requests" : "My Leave Requests"}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-800">
                                {isAdmin && <TableHead>Employee ID</TableHead>}
                                <TableHead>Type</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>End Date</TableHead>
                                <TableHead>Days</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Submitted</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map((request) => {
                                const leaveType = leaveTypes.find(t => t.value === request.leaveType);
                                return (
                                    <TableRow key={request.id} className="border-slate-800">
                                        {isAdmin && (
                                            <TableCell className="font-medium">#{request.employeeId}</TableCell>
                                        )}
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {leaveType && <leaveType.icon className={`h-4 w-4 ${leaveType.color}`} />}
                                                <span className="capitalize">{request.leaveType}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{new Date(request.startDate).toLocaleDateString()}</TableCell>
                                        <TableCell>{new Date(request.endDate).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {calculateDays(request.startDate, request.endDate)} days
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate">
                                            {request.reason || "—"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[request.status] || ""}>
                                                {request.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-400 text-sm">
                                            {new Date(request.createdAt).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {requests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={isAdmin ? 8 : 7} className="text-center text-slate-400 py-8">
                                        No leave requests found
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
