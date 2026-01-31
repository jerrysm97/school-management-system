import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileDown, BarChart3, PieChart, TrendingUp, Users, DollarSign, Calendar, GraduationCap, BookOpen, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, LineChart, Line, Legend, Area, AreaChart } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// API hooks
const useAdminStats = () => useQuery({
    queryKey: ['/api/stats/admin'],
    queryFn: async () => {
        const res = await fetch('/api/stats/admin', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return res.json();
    }
});

const useStudents = () => useQuery({
    queryKey: ['/api/students'],
    queryFn: async () => {
        const res = await fetch('/api/students', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return res.json();
    }
});

const useFees = () => useQuery({
    queryKey: ['/api/fees'],
    queryFn: async () => {
        const res = await fetch('/api/fees', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return res.json();
    }
});

const useAttendance = () => useQuery({
    queryKey: ['/api/attendance'],
    queryFn: async () => {
        const res = await fetch('/api/attendance', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return res.json();
    }
});

const useClasses = () => useQuery({
    queryKey: ['/api/classes'],
    queryFn: async () => {
        const res = await fetch('/api/classes', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return res.json();
    }
});

export default function ReportsPage() {
    const [dateRange, setDateRange] = useState({ from: new Date(new Date().getFullYear(), 0, 1), to: new Date() });

    const { data: stats, isLoading: statsLoading } = useAdminStats();
    const { data: students, isLoading: studentsLoading } = useStudents();
    const { data: fees, isLoading: feesLoading } = useFees();
    const { data: attendance, isLoading: attendanceLoading } = useAttendance();
    const { data: classes, isLoading: classesLoading } = useClasses();

    // Process student data for charts
    const genderDistribution = students ? [
        { name: 'Male', value: students.filter((s: any) => s.gender === 'male').length },
        { name: 'Female', value: students.filter((s: any) => s.gender === 'female').length },
        { name: 'Other', value: students.filter((s: any) => !s.gender || (s.gender !== 'male' && s.gender !== 'female')).length },
    ].filter(d => d.value > 0) : [];

    const statusDistribution = students ? [
        { name: 'Active', value: students.filter((s: any) => s.status === 'active' || s.status === 'approved').length, color: '#00C49F' },
        { name: 'Pending', value: students.filter((s: any) => s.status === 'pending').length, color: '#FFBB28' },
        { name: 'Rejected', value: students.filter((s: any) => s.status === 'rejected').length, color: '#FF8042' },
    ].filter(d => d.value > 0) : [];

    // Process fee data
    const feeStats = fees ? {
        total: fees.reduce((sum: number, f: any) => sum + (f.amount || 0), 0),
        paid: fees.filter((f: any) => f.status === 'paid').reduce((sum: number, f: any) => sum + (f.amount || 0), 0),
        pending: fees.filter((f: any) => f.status === 'pending').reduce((sum: number, f: any) => sum + (f.amount || 0), 0),
        overdue: fees.filter((f: any) => f.status === 'overdue').reduce((sum: number, f: any) => sum + (f.amount || 0), 0),
    } : { total: 0, paid: 0, pending: 0, overdue: 0 };

    const feeDistribution = [
        { name: 'Paid', value: feeStats.paid, color: '#00C49F' },
        { name: 'Pending', value: feeStats.pending, color: '#FFBB28' },
        { name: 'Overdue', value: feeStats.overdue, color: '#FF8042' },
    ].filter(d => d.value > 0);

    // Process attendance data
    const attendanceStats = attendance ? {
        present: attendance.filter((a: any) => a.status === 'present').length,
        absent: attendance.filter((a: any) => a.status === 'absent').length,
        late: attendance.filter((a: any) => a.status === 'late').length,
        excused: attendance.filter((a: any) => a.status === 'excused').length,
    } : { present: 0, absent: 0, late: 0, excused: 0 };

    const attendanceTotal = attendanceStats.present + attendanceStats.absent + attendanceStats.late + attendanceStats.excused;
    const attendanceRate = attendanceTotal > 0 ? ((attendanceStats.present + attendanceStats.late) / attendanceTotal * 100).toFixed(1) : 0;

    const attendanceDistribution = [
        { name: 'Present', value: attendanceStats.present, color: '#00C49F' },
        { name: 'Absent', value: attendanceStats.absent, color: '#FF8042' },
        { name: 'Late', value: attendanceStats.late, color: '#FFBB28' },
        { name: 'Excused', value: attendanceStats.excused, color: '#0088FE' },
    ].filter(d => d.value > 0);

    // Class-wise data
    const classWiseData = classes?.map((cls: any) => ({
        name: cls.name,
        students: students?.filter((s: any) => s.classId === cls.id).length || 0,
    })) || [];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
                        <BarChart3 className="h-8 w-8 text-indigo-600" />
                        Enterprise Reports
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Access comprehensive analytics across all institution modules.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <FileDown className="mr-2 h-4 w-4" />
                        Export All
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="students">Students</TabsTrigger>
                    <TabsTrigger value="finance">Finance</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                                <Users className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                {statsLoading ? <Skeleton className="h-8 w-16" /> : (
                                    <div className="text-2xl font-bold text-blue-700">{stats?.totalStudents || students?.length || 0}</div>
                                )}
                                <p className="text-xs text-muted-foreground">Active enrollments</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                                <GraduationCap className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                {statsLoading ? <Skeleton className="h-8 w-16" /> : (
                                    <div className="text-2xl font-bold text-green-700">{stats?.totalTeachers || 0}</div>
                                )}
                                <p className="text-xs text-muted-foreground">Active faculty</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                                <BookOpen className="h-4 w-4 text-purple-600" />
                            </CardHeader>
                            <CardContent>
                                {statsLoading ? <Skeleton className="h-8 w-16" /> : (
                                    <div className="text-2xl font-bold text-purple-700">{stats?.totalClasses || classes?.length || 0}</div>
                                )}
                                <p className="text-xs text-muted-foreground">Active classes</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                                <Clock className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                {statsLoading ? <Skeleton className="h-8 w-16" /> : (
                                    <div className="text-2xl font-bold text-orange-700">{stats?.attendanceRate || attendanceRate}%</div>
                                )}
                                <p className="text-xs text-muted-foreground">This semester</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Students by Class</CardTitle>
                                <CardDescription>Distribution of students across classes</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {classesLoading || studentsLoading ? (
                                    <Skeleton className="h-[250px] w-full" />
                                ) : classWiseData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={classWiseData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="students" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                        No class data available
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Fee Collection Overview</CardTitle>
                                <CardDescription>Current fee status distribution</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {feesLoading ? (
                                    <Skeleton className="h-[250px] w-full" />
                                ) : feeDistribution.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <RechartsPie>
                                            <Pie
                                                data={feeDistribution}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {feeDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </RechartsPie>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                        No fee data available
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Students Tab */}
                <TabsContent value="students" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Gender Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {studentsLoading ? (
                                    <Skeleton className="h-[200px] w-full" />
                                ) : genderDistribution.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <RechartsPie>
                                            <Pie
                                                data={genderDistribution}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={70}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({ name, value }) => `${name}: ${value}`}
                                            >
                                                {genderDistribution.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </RechartsPie>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                                        No student data
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Enrollment Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {studentsLoading ? (
                                    <Skeleton className="h-[200px] w-full" />
                                ) : statusDistribution.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <RechartsPie>
                                            <Pie
                                                data={statusDistribution}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={70}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({ name, value }) => `${name}: ${value}`}
                                            >
                                                {statusDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </RechartsPie>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                                        No status data
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Total Students</span>
                                    <Badge variant="secondary">{students?.length || 0}</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Male</span>
                                    <Badge className="bg-blue-100 text-blue-700">{genderDistribution.find(g => g.name === 'Male')?.value || 0}</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Female</span>
                                    <Badge className="bg-pink-100 text-pink-700">{genderDistribution.find(g => g.name === 'Female')?.value || 0}</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Active</span>
                                    <Badge className="bg-green-100 text-green-700">{statusDistribution.find(s => s.name === 'Active')?.value || 0}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Student Enrollments</CardTitle>
                            <CardDescription>Latest student registrations</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {studentsLoading ? (
                                <Skeleton className="h-[200px] w-full" />
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Admission No</TableHead>
                                            <TableHead>Class</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students?.slice(0, 5).map((student: any) => (
                                            <TableRow key={student.id}>
                                                <TableCell className="font-medium">{student.user?.name || 'N/A'}</TableCell>
                                                <TableCell>{student.admissionNo}</TableCell>
                                                <TableCell>{student.class?.name || 'Unassigned'}</TableCell>
                                                <TableCell>
                                                    <Badge variant={student.status === 'active' || student.status === 'approved' ? 'default' : 'secondary'}>
                                                        {student.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Finance Tab */}
                <TabsContent value="finance" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className="bg-gradient-to-br from-green-50 to-green-100/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-700">
                                    ${(feeStats.paid / 100).toLocaleString()}
                                </div>
                                <Progress value={(feeStats.paid / (feeStats.total || 1)) * 100} className="mt-2 h-2" />
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-700">
                                    ${(feeStats.pending / 100).toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-red-50 to-red-100/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-700">
                                    ${(feeStats.overdue / 100).toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Past due date</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-700">
                                    ${(feeStats.total / 100).toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">All invoices</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Fee Status Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {feesLoading ? (
                                    <Skeleton className="h-[250px] w-full" />
                                ) : feeDistribution.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <RechartsPie>
                                            <Pie
                                                data={feeDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {feeDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => `$${(value / 100).toLocaleString()}`} />
                                        </RechartsPie>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                        No fee data available
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Transactions</CardTitle>
                                <CardDescription>Latest fee records</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {feesLoading ? (
                                    <Skeleton className="h-[250px] w-full" />
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Student</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {fees?.slice(0, 5).map((fee: any) => (
                                                <TableRow key={fee.id}>
                                                    <TableCell className="font-medium">{fee.student?.user?.name || 'N/A'}</TableCell>
                                                    <TableCell>${(fee.amount / 100).toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={
                                                            fee.status === 'paid' ? 'default' :
                                                                fee.status === 'pending' ? 'secondary' : 'destructive'
                                                        }>
                                                            {fee.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Attendance Tab */}
                <TabsContent value="attendance" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className="bg-gradient-to-br from-green-50 to-green-100/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Present</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-700">{attendanceStats.present}</div>
                                <p className="text-xs text-muted-foreground">Total records</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-red-50 to-red-100/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Absent</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-700">{attendanceStats.absent}</div>
                                <p className="text-xs text-muted-foreground">Total records</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Late</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-700">{attendanceStats.late}</div>
                                <p className="text-xs text-muted-foreground">Total records</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-700">{attendanceRate}%</div>
                                <Progress value={Number(attendanceRate)} className="mt-2 h-2" />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Attendance Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {attendanceLoading ? (
                                    <Skeleton className="h-[250px] w-full" />
                                ) : attendanceDistribution.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <RechartsPie>
                                            <Pie
                                                data={attendanceDistribution}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={90}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {attendanceDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </RechartsPie>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                        No attendance data available
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Class-wise Attendance</CardTitle>
                                <CardDescription>Attendance summary by class</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {classesLoading || attendanceLoading ? (
                                    <Skeleton className="h-[250px] w-full" />
                                ) : classes && classes.length > 0 ? (
                                    <div className="space-y-4">
                                        {classes.slice(0, 5).map((cls: any) => {
                                            const classAttendance = attendance?.filter((a: any) => {
                                                const student = students?.find((s: any) => s.id === a.studentId);
                                                return student?.classId === cls.id;
                                            }) || [];
                                            const present = classAttendance.filter((a: any) => a.status === 'present').length;
                                            const total = classAttendance.length;
                                            const rate = total > 0 ? (present / total * 100).toFixed(0) : 0;

                                            return (
                                                <div key={cls.id} className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-medium">{cls.name}</span>
                                                        <span className="text-muted-foreground">{rate}%</span>
                                                    </div>
                                                    <Progress value={Number(rate)} className="h-2" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                        No class data available
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

            </Tabs>
        </div>
    );
}
