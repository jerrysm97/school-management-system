import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useFees, useFeeStats, useCreateFee, useUpdateFeeStatus } from "@/hooks/use-fees";
import { useStudents } from "@/hooks/use-students";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Search, Plus, DollarSign, CheckCircle, AlertTriangle, Clock,
    TrendingUp, ArrowUpRight, ArrowDownRight, Receipt, CreditCard,
    Calendar, User, FileText, Banknote, Loader2
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const FEE_TYPES = [
    { value: "tuition", label: "Tuition Fee", icon: "🎓" },
    { value: "lab", label: "Lab Fee", icon: "🔬" },
    { value: "library", label: "Library Fee", icon: "📚" },
    { value: "transport", label: "Transport Fee", icon: "🚌" },
    { value: "exam", label: "Examination Fee", icon: "📝" },
    { value: "sports", label: "Sports Fee", icon: "⚽" },
    { value: "technology", label: "Technology Fee", icon: "💻" },
    { value: "late", label: "Late Payment Fee", icon: "⏰" },
    { value: "other", label: "Other", icon: "📋" },
];

const createFeeSchema = z.object({
    studentId: z.coerce.number().min(1, "Select a student"),
    amount: z.coerce.number().min(0.01, "Amount must be positive"),
    dueDate: z.string().min(1, "Due date is required"),
    description: z.string().min(1, "Fee type is required"),
    notes: z.string().optional(),
});

export default function FeesPage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    const { data: fees, isLoading } = useFees();
    const { data: stats } = useFeeStats();
    const { data: students } = useStudents();
    const createFeeMutation = useCreateFee();
    const updateStatusMutation = useUpdateFeeStatus();
    const queryClient = useQueryClient();

    const calculatePenaltiesMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/fees/calculate-penalties");
            return res.json();
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ["/api/fees"] });
            queryClient.invalidateQueries({ queryKey: ["/api/fee-stats"] });
            toast({
                title: "Late Fee Check Complete",
                description: `Processed ${data.processed} overdue fees. Applied ${data.applied} penalties.`
            });
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    });

    const form = useForm({
        resolver: zodResolver(createFeeSchema),
        defaultValues: {
            studentId: 0,
            amount: 0,
            dueDate: "",
            description: "",
            notes: "",
        },
    });

    function onSubmit(data: z.infer<typeof createFeeSchema>) {
        // Convert amount to cents for storage
        const feeData = {
            ...data,
            amount: Math.round(data.amount * 100),
        };

        createFeeMutation.mutate(feeData, {
            onSuccess: () => {
                toast({ title: "Fee created successfully" });
                setIsDialogOpen(false);
                form.reset();
            },
            onError: (err) => {
                toast({ title: "Error", description: err.message, variant: "destructive" });
            },
        });
    }

    function handleMarkPaid(id: number) {
        updateStatusMutation.mutate({ id, status: 'paid' }, {
            onSuccess: () => toast({ title: "Fee marked as paid" }),
            onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
        });
    }

    const filteredFees = fees?.filter((fee: any) => {
        const matchesSearch =
            fee.student?.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            fee.description?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || fee.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(cents / 100);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle className="mr-1 h-3 w-3" /> Paid</Badge>;
            case 'overdue':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><AlertTriangle className="mr-1 h-3 w-3" /> Overdue</Badge>;
            default:
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
        }
    };

    const getFeeTypeIcon = (description: string) => {
        const feeType = FEE_TYPES.find(ft => ft.value === description || ft.label === description);
        return feeType?.icon || "📋";
    };

    // Calculate additional stats
    const totalFees = fees?.length || 0;
    const paidCount = fees?.filter((f: any) => f.status === 'paid').length || 0;
    const pendingCount = fees?.filter((f: any) => f.status === 'pending').length || 0;
    const overdueCount = fees?.filter((f: any) => f.status === 'overdue').length || 0;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
                        <Banknote className="h-8 w-8 text-primary" />
                        Fees Management
                    </h1>
                    <p className="text-muted-foreground mt-1">Track student fee payments, invoices, and collection.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="shadow-lg shadow-primary/20">
                            <Plus className="mr-2 h-4 w-4" /> Create Invoice
                        </Button>
                    </DialogTrigger>

                    <Button
                        variant="outline"
                        className="ml-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                        onClick={() => calculatePenaltiesMutation.mutate()}
                        disabled={calculatePenaltiesMutation.isPending}
                    >
                        {calculatePenaltiesMutation.isPending ? <Clock className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
                        Scan Late Fees
                    </Button>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-primary" />
                                Create New Invoice
                            </DialogTitle>
                            <DialogDescription>Assign a new fee to a student account.</DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                <FormField
                                    control={form.control}
                                    name="studentId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Student</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Student" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {students?.map((s: any) => (
                                                        <SelectItem key={s.id} value={s.id.toString()}>
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarFallback className="text-xs">{s.user.name.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                {s.user.name}
                                                                <span className="text-muted-foreground text-xs">({s.admissionNo})</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fee Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Fee Type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {FEE_TYPES.map((ft) => (
                                                        <SelectItem key={ft.value} value={ft.label}>
                                                            <span className="flex items-center gap-2">
                                                                <span>{ft.icon}</span>
                                                                {ft.label}
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Amount ($)</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="500.00"
                                                            className="pl-9"
                                                            {...field}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormDescription>Enter amount in dollars</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="dueDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Due Date</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input type="date" className="pl-9" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Notes (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Additional notes..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={createFeeMutation.isPending}>
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        {createFeeMutation.isPending ? "Creating..." : "Create Invoice"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardDescription className="text-green-700">Total Collected</CardDescription>
                        <div className="p-2 bg-green-200 rounded-full">
                            <TrendingUp className="h-4 w-4 text-green-700" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-green-700">{formatCurrency(stats?.totalCollected || 0)}</p>
                        <p className="text-xs text-green-600 mt-1 flex items-center">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            {paidCount} invoices paid
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardDescription className="text-yellow-700">Pending</CardDescription>
                        <div className="p-2 bg-yellow-200 rounded-full">
                            <Clock className="h-4 w-4 text-yellow-700" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-yellow-700">{formatCurrency(stats?.totalPending || 0)}</p>
                        <p className="text-xs text-yellow-600 mt-1">
                            {pendingCount} invoices awaiting payment
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardDescription className="text-red-700">Overdue</CardDescription>
                        <div className="p-2 bg-red-200 rounded-full">
                            <AlertTriangle className="h-4 w-4 text-red-700" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-red-700">{formatCurrency(stats?.totalOverdue || 0)}</p>
                        <p className="text-xs text-red-600 mt-1 flex items-center">
                            <ArrowDownRight className="h-3 w-3 mr-1" />
                            {overdueCount} invoices overdue
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardDescription className="text-blue-700">Total Invoices</CardDescription>
                        <div className="p-2 bg-blue-200 rounded-full">
                            <FileText className="h-4 w-4 text-blue-700" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-blue-700">{totalFees}</p>
                        <p className="text-xs text-blue-600 mt-1">
                            {students?.length || 0} students enrolled
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Table Section */}
            <Card>
                <CardHeader className="border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Fee Records</CardTitle>
                            <CardDescription>View and manage all fee invoices</CardDescription>
                        </div>
                        <div className="flex gap-3">
                            <div className="relative max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by student name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 w-64"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="overdue">Overdue</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Fee Type</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">Loading records...</TableCell>
                                </TableRow>
                            ) : filteredFees?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <Receipt className="h-8 w-8 text-muted-foreground/50" />
                                            No fee records found.
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredFees?.map((fee: any) => (
                                    <TableRow key={fee.id} className="hover:bg-muted/50">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                                        {fee.student?.user?.name?.charAt(0) || "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{fee.student?.user?.name || "N/A"}</p>
                                                    <p className="text-xs text-muted-foreground">{fee.student?.admissionNo}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{getFeeTypeIcon(fee.description)}</span>
                                                <span>{fee.description || "General Fee"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold">{formatCurrency(fee.amount)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(fee.dueDate).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(fee.status)}</TableCell>
                                        <TableCell className="text-right">
                                            {fee.status !== 'paid' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleMarkPaid(fee.id)}
                                                    disabled={updateStatusMutation.isPending}
                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                >
                                                    <CheckCircle className="mr-1 h-4 w-4" /> Mark Paid
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
