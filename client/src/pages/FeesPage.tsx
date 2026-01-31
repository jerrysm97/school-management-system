import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useFees, useFeeStats, useCreateFee, useUpdateFeeStatus, useBulkActionFee } from "@/hooks/use-fees";
import { useStudents } from "@/hooks/use-students";
import { useAuth } from "@/hooks/use-auth";
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
import { Checkbox } from "@/components/ui/checkbox";
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
    const { user } = useAuth();
    const isStudent = user?.role === "student" || user?.role === "parent";

    // For students, the backend filters fees automatically
    const { data: fees, isLoading } = useFees();
    const { data: stats } = useFeeStats();
    const { data: students } = useStudents();
    const createFeeMutation = useCreateFee();
    const updateStatusMutation = useUpdateFeeStatus();

    const bulkActionMutation = useBulkActionFee();
    const queryClient = useQueryClient();

    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const filteredFees = fees?.filter((fee: any) => {
        const matchesSearch =
            fee.student?.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            fee.description?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || fee.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const ids = filteredFees?.map((f: any) => f.id) || [];
            setSelectedIds(ids);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(pid => pid !== id));
        }
    };

    const handleBulkAction = (action: 'paid' | 'delete') => {
        bulkActionMutation.mutate({ action, ids: selectedIds }, {
            onSuccess: () => setSelectedIds([])
        });
    };

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
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Banknote className="h-8 w-8 text-primary" />
                        {isStudent ? "My Fees" : "Fees Management"}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {isStudent
                            ? "View your fee invoices and payment status."
                            : "Track student fee payments, invoices, and collection."}
                    </p>
                </div>
                {!isStudent && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Scan Late Fees
                        </Button>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Create Invoice
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Create New Fee Invoice</DialogTitle>
                                    <DialogDescription>
                                        Assign a fee to a specific student.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                                        <FormField
                                            control={form.control}
                                            name="studentId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Student</FormLabel>
                                                    <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={field.value?.toString()}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select student" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {students?.map((student: any) => (
                                                                <SelectItem key={student.id} value={student.id.toString()}>
                                                                    {student.user.name} ({student.admissionNo})
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
                                                                <SelectValue placeholder="Select fee type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {FEE_TYPES.map((type) => (
                                                                <SelectItem key={type.value} value={type.label}>
                                                                    <span className="flex items-center gap-2">
                                                                        <span>{type.icon}</span>
                                                                        <span>{type.label}</span>
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
                                                        <FormLabel>Amount</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                <Input type="number" step="0.01" className="pl-9" {...field} />
                                                            </div>
                                                        </FormControl>
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
                                                            <Input type="date" {...field} />
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
                                                        <Input placeholder="Additional details..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                            <Button type="submit" disabled={createFeeMutation.isPending}>
                                                {createFeeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Create Invoice
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>

            {/* Stats Cards - Only visible to admin/accountant unless we adapt it for personalized stats */}
            {!isStudent && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in-50 duration-500">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(stats?.totalCollected || 0)}</div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-600 font-medium">{paidCount} invoices paid</span>
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                                <Clock className="h-4 w-4 text-amber-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">{formatCurrency(stats?.totalPending || 0)}</div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <span className="text-amber-600 font-medium">{pendingCount} invoices awaiting payment</span>
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats?.totalOverdue || 0)}</div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <ArrowDownRight className="h-3 w-3 text-red-600" />
                                <span className="text-red-600 font-medium">{overdueCount} invoices overdue</span>
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <FileText className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{totalFees}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {students?.length || 0} students enrolled
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card className="border-t-4 border-t-primary">
                <CardHeader>
                    <CardTitle>
                        {isStudent ? "My Fee Records" : "Fee Records"}
                    </CardTitle>
                    <CardDescription>
                        {isStudent ? "A history of your payments and pending invoices." : "View and manage all fee invoices"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={isStudent ? "Search by description..." : "Search by student name..."}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="overdue">Overdue</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {!isStudent && (
                                        <TableHead className="w-[50px]">
                                            <Checkbox
                                                checked={filteredFees?.length! > 0 && selectedIds.length === filteredFees?.length}
                                                onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                            />
                                        </TableHead>
                                    )}
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
                                        <TableCell colSpan={7} className="h-24 text-center">Loading records...</TableCell>
                                    </TableRow>
                                ) : filteredFees?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <Receipt className="h-8 w-8 text-muted-foreground/50" />
                                                No fee records found.
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredFees?.map((fee: any) => (
                                        <TableRow key={fee.id} className="hover:bg-muted/50">
                                            {!isStudent && (
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedIds.includes(fee.id)}
                                                        onCheckedChange={(checked) => handleSelectOne(fee.id, !!checked)}
                                                    />
                                                </TableCell>
                                            )}
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
                    </div>
                </CardContent>
            </Card>

            {/* Bulk Action Bar */}
            {!isStudent && selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-6 py-3 rounded-full shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-5 z-50">
                    <span className="font-medium whitespace-nowrap">{selectedIds.length} selected</span>
                    <div className="h-4 w-px bg-background/20" />
                    <Button variant="secondary" size="sm" onClick={() => handleBulkAction('paid')}>Mark Paid</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleBulkAction('delete')}>
                        {bulkActionMutation.isPending ? "Deleting..." : "Delete"}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-background hover:text-background/80" onClick={() => setSelectedIds([])}>Cancel</Button>
                </div>
            )}
        </div>
    );
}
