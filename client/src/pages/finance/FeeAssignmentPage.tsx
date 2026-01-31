import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DollarSign, Users, AlertTriangle, CheckCircle, Clock, Search } from "lucide-react";

export default function FeeAssignmentPage() {
    const [selectedClassId, setSelectedClassId] = useState<string>("all");
    const [search, setSearch] = useState("");

    const { data: classes } = useQuery<any[]>({
        queryKey: ["/api/classes"],
    });

    const { data: students, isLoading } = useQuery<any[]>({
        queryKey: ["/api/students"],
    });

    const { data: fees } = useQuery<any[]>({
        queryKey: ["/api/fees"],
    });

    // Filter students by class
    const filteredStudents = students?.filter((s: any) => {
        const matchesClass = selectedClassId === "all" || String(s.classId) === selectedClassId;
        const matchesSearch = s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            s.admissionNo?.toLowerCase().includes(search.toLowerCase());
        return matchesClass && matchesSearch;
    }) || [];

    // Get fee summary for a student
    const getStudentFees = (studentId: number) => {
        const studentFees = fees?.filter((f: any) => f.studentId === studentId) || [];
        const total = studentFees.reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
        const paid = studentFees.filter((f: any) => f.status === 'paid').reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
        const pending = studentFees.filter((f: any) => f.status === 'pending').reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
        const overdue = studentFees.filter((f: any) => f.status === 'overdue').reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
        return { total, paid, pending, overdue, count: studentFees.length };
    };

    // Calculate totals
    const totalStudentsWithFees = filteredStudents.filter(s => getStudentFees(s.id).count > 0).length;
    const totalFeesAssigned = fees?.length || 0;
    const totalPending = fees?.filter((f: any) => f.status === 'pending').length || 0;
    const totalOverdue = fees?.filter((f: any) => f.status === 'overdue').length || 0;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Paid</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>;
            case 'overdue':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Overdue</Badge>;
            default:
                return <Badge variant="secondary">No Fees</Badge>;
        }
    };

    const getOverallStatus = (studentId: number) => {
        const { overdue, pending, paid, count } = getStudentFees(studentId);
        if (count === 0) return 'none';
        if (overdue > 0) return 'overdue';
        if (pending > 0) return 'pending';
        return 'paid';
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <DollarSign className="h-8 w-8 text-primary" />
                    Fee Overview
                </h1>
                <p className="text-muted-foreground mt-1">
                    View fee status for enrolled students. Fees are assigned during student enrollment.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1">
                            <Users className="h-4 w-4" /> Students with Fees
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-blue-700">{totalStudentsWithFees}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" /> Total Fees Assigned
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-green-700">{totalFeesAssigned}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-200">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1">
                            <Clock className="h-4 w-4" /> Pending Payments
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-yellow-700">{totalPending}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" /> Overdue
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-red-700">{totalOverdue}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search students..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by Class" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes?.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                                {c.name} - {c.section}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Students Fee Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Student Fee Status</CardTitle>
                    <CardDescription>
                        Showing {filteredStudents.length} students
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>Admission No</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead className="text-right">Total Fees</TableHead>
                                    <TableHead className="text-right">Paid</TableHead>
                                    <TableHead className="text-right">Pending</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell>
                                    </TableRow>
                                ) : filteredStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            No students found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStudents.map((student: any) => {
                                        const feeData = getStudentFees(student.id);
                                        const status = getOverallStatus(student.id);
                                        return (
                                            <TableRow key={student.id}>
                                                <TableCell className="font-medium">{student.user?.name}</TableCell>
                                                <TableCell>{student.admissionNo}</TableCell>
                                                <TableCell>{student.class?.name || '-'}</TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    ${(feeData.total / 100).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right text-green-600">
                                                    ${(feeData.paid / 100).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right text-orange-600">
                                                    ${((feeData.pending + feeData.overdue) / 100).toFixed(2)}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(status)}</TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
