import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    useTimesheets,
    useCreateTimesheet,
    useApproveTimesheet,
    useW2Records,
    useGenerateW2Records
} from "@/hooks/use-payroll";
import { Clock, Plus, CheckCircle, DollarSign, Users, FileText, CalendarDays, Timer } from "lucide-react";
import type { InsertTimesheet } from "@shared/schema";

export default function PayrollTimesheetsPage() {
    const { user } = useAuth();
    const isFinance = user?.role === "accountant" || user?.role === "main_admin" || user?.role === "principal";
    const isAdmin = user?.role === "main_admin" || user?.role === "admin";

    const [activeTab, setActiveTab] = useState("timesheets");
    const [isTimesheetDialogOpen, setIsTimesheetDialogOpen] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const [newTimesheet, setNewTimesheet] = useState<Partial<InsertTimesheet>>({
        workDate: new Date().toISOString().split('T')[0],
        hoursWorked: 800, // 8.00 hours stored as integer
    });

    const { data: timesheets, isLoading: loadingTimesheets } = useTimesheets();
    const { data: w2Records, isLoading: loadingW2s } = useW2Records(selectedYear);
    const createTimesheet = useCreateTimesheet();
    const approveTimesheet = useApproveTimesheet();
    const generateW2s = useGenerateW2Records();

    if (!isFinance) {
        return (
            <div className="p-8 text-center text-red-500">
                Restricted Access: Financial Personnel Only
            </div>
        );
    }

    const handleCreateTimesheet = async () => {
        if (!newTimesheet.employeeId || !newTimesheet.workDate || !newTimesheet.hoursWorked) return;
        await createTimesheet.mutateAsync(newTimesheet as InsertTimesheet);
        setIsTimesheetDialogOpen(false);
        setNewTimesheet({
            workDate: new Date().toISOString().split('T')[0],
            hoursWorked: 800,
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100);
    };

    const formatHours = (hours: number) => {
        return (hours / 100).toFixed(2);
    };

    const totalHours = timesheets?.reduce((sum, t) => sum + t.hoursWorked, 0) || 0;
    const pendingApproval = timesheets?.filter(t => !t.approvedAt).length || 0;
    const approvedTimesheets = timesheets?.filter(t => t.approvedAt).length || 0;

    const statusColors: Record<string, string> = {
        pending: "bg-yellow-100 text-yellow-800",
        approved: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                        Payroll & Timesheets
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage employee time tracking and payroll processing
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isTimesheetDialogOpen} onOpenChange={setIsTimesheetDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Clock className="w-4 h-4 mr-2" />
                                Log Time
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Log Time Entry</DialogTitle>
                                <DialogDescription>
                                    Record work hours for an employee
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Employee ID</Label>
                                    <Input
                                        type="number"
                                        placeholder="Employee ID"
                                        onChange={(e) => setNewTimesheet({ ...newTimesheet, employeeId: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Work Date</Label>
                                    <Input
                                        type="date"
                                        value={newTimesheet.workDate}
                                        onChange={(e) => setNewTimesheet({ ...newTimesheet, workDate: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Hours Worked</Label>
                                        <Input
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            max="24"
                                            defaultValue="8"
                                            onChange={(e) => setNewTimesheet({ ...newTimesheet, hoursWorked: Math.round(parseFloat(e.target.value) * 100) })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Overtime Hours</Label>
                                        <Input
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            placeholder="0"
                                            onChange={(e) => setNewTimesheet({ ...newTimesheet, overtimeHours: Math.round(parseFloat(e.target.value) * 100) })}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Description (Optional)</Label>
                                    <Input
                                        placeholder="e.g., Project work description"
                                        value={newTimesheet.description || ""}
                                        onChange={(e) => setNewTimesheet({ ...newTimesheet, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsTimesheetDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateTimesheet} disabled={createTimesheet.isPending}>
                                    {createTimesheet.isPending ? "Saving..." : "Save Entry"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{timesheets?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Timesheet entries</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                        <Timer className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatHours(totalHours)}</div>
                        <p className="text-xs text-muted-foreground">Hours logged</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingApproval}</div>
                        <p className="text-xs text-muted-foreground">Awaiting review</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{approvedTimesheets}</div>
                        <p className="text-xs text-muted-foreground">Approved entries</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
                    <TabsTrigger value="w2-records">W-2 Records</TabsTrigger>
                </TabsList>

                <TabsContent value="timesheets" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Timesheet Entries</CardTitle>
                                    <CardDescription>
                                        Review and approve employee time entries
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loadingTimesheets ? (
                                <div className="text-center py-8">Loading timesheets...</div>
                            ) : !timesheets || timesheets.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No timesheet entries found.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Employee ID</TableHead>
                                            <TableHead className="text-right">Regular Hours</TableHead>
                                            <TableHead className="text-right">Overtime</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {timesheets.map((ts) => (
                                            <TableRow key={ts.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDays className="w-4 h-4 text-muted-foreground" />
                                                        {new Date(ts.workDate).toLocaleDateString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">#{ts.employeeId}</TableCell>
                                                <TableCell className="text-right">{formatHours(ts.hoursWorked)}h</TableCell>
                                                <TableCell className="text-right">
                                                    {ts.overtimeHours ? `${formatHours(ts.overtimeHours)}h` : '-'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground max-w-xs truncate">
                                                    {ts.description || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={ts.approvedAt ? statusColors.approved : statusColors.pending}>
                                                        {ts.approvedAt ? 'Approved' : 'Pending'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {!ts.approvedAt && isFinance && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => approveTimesheet.mutate(ts.id)}
                                                            disabled={approveTimesheet.isPending}
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-1" />
                                                            Approve
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="w2-records" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>W-2 Tax Records</CardTitle>
                                    <CardDescription>
                                        Generate and view annual W-2 records for employees
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        className="rounded-md border border-input bg-background px-3 py-2"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    >
                                        {[2024, 2023, 2022, 2021].map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                    {isAdmin && (
                                        <Button
                                            onClick={() => generateW2s.mutate(selectedYear)}
                                            disabled={generateW2s.isPending}
                                        >
                                            <FileText className="w-4 h-4 mr-2" />
                                            {generateW2s.isPending ? "Generating..." : "Generate W-2s"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loadingW2s ? (
                                <div className="text-center py-8">Loading W-2 records...</div>
                            ) : !w2Records || w2Records.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No W-2 records found for {selectedYear}. Click "Generate W-2s" to create them.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Employee ID</TableHead>
                                            <TableHead className="text-right">Total Wages</TableHead>
                                            <TableHead className="text-right">Federal Tax Withheld</TableHead>
                                            <TableHead className="text-right">SS Wages</TableHead>
                                            <TableHead className="text-right">SS Tax</TableHead>
                                            <TableHead className="text-right">Medicare Wages</TableHead>
                                            <TableHead className="text-right">Medicare Tax</TableHead>
                                            <TableHead>Generated</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {w2Records.map((w2) => (
                                            <TableRow key={w2.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-muted-foreground" />
                                                        #{w2.employeeId}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-medium">
                                                    {formatCurrency(w2.totalWages)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {formatCurrency(w2.federalTaxWithheld)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {formatCurrency(w2.socialSecurityWages)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {formatCurrency(w2.socialSecurityTax)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {formatCurrency(w2.medicareWages)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {formatCurrency(w2.medicareTax)}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {w2.generatedAt ? new Date(w2.generatedAt).toLocaleDateString() : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
