import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Calendar, DollarSign, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { addMonths, format } from "date-fns";

// Zod schema for the form
const createPlanSchema = z.object({
    studentId: z.coerce.number().min(1, "Select a student"),
    totalAmount: z.coerce.number().min(1, "Amount must be positive"),
    startDate: z.string().min(1, "Start date is required"),
    frequency: z.enum(["monthly", "quarterly"]),
    installmentsCount: z.coerce.number().min(1).max(12),
});

export default function PaymentPlansPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: plans, isLoading } = useQuery<any[]>({
        queryKey: ["/api/payment-plans"],
    });

    const { data: students } = useQuery<any[]>({
        queryKey: ["/api/students"],
    });

    const form = useForm({
        resolver: zodResolver(createPlanSchema),
        defaultValues: {
            studentId: 0,
            totalAmount: 0,
            startDate: format(new Date(), "yyyy-MM-dd"),
            frequency: "monthly" as const,
            installmentsCount: 3,
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: z.infer<typeof createPlanSchema>) => {
            // Calculate installments
            const amountPerInstallment = Math.floor((data.totalAmount * 100) / data.installmentsCount);
            const remainder = (data.totalAmount * 100) % data.installmentsCount;

            const installments = Array.from({ length: data.installmentsCount }).map((_, index) => {
                const dueDate = addMonths(new Date(data.startDate), index * (data.frequency === 'quarterly' ? 3 : 1));
                return {
                    dueDate: dueDate.toISOString(),
                    amount: index === 0 ? amountPerInstallment + remainder : amountPerInstallment,
                    status: 'pending'
                };
            });

            const payload = {
                studentId: data.studentId,
                totalAmount: data.totalAmount * 100, // stored in cents
                startDate: new Date(data.startDate).toISOString(),
                endDate: installments[installments.length - 1].dueDate,
                frequency: data.frequency,
                status: 'active',
                installments
            };

            await apiRequest("POST", "/api/payment-plans", payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/payment-plans"] });
            setIsDialogOpen(false);
            form.reset();
            toast({ title: "Success", description: "Payment plan created successfully" });
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const onSubmit = (data: any) => {
        createMutation.mutate(data);
    };

    const getStudentName = (id: number) => {
        return students?.find(s => s.id === id)?.user?.name || "Unknown Student";
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Payment Plans</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage tuition installment plans for students.
                    </p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Plan
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create Payment Plan</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="studentId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Student</FormLabel>
                                        <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={field.value?.toString()}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Student" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {students?.map((s) => (
                                                    <SelectItem key={s.id} value={s.id.toString()}>
                                                        {s.user.name} ({s.admissionNo})
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
                                    name="totalAmount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Total Amount ($)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input type="number" className="pl-9" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Start Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="installmentsCount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>No. of Installments</FormLabel>
                                            <FormControl>
                                                <Input type="number" min={2} max={12} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="frequency"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Frequency</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">
                                <p>
                                    Estimated installment:
                                    <span className="font-bold text-slate-700 ml-1">
                                        ${((form.watch("totalAmount") || 0) / (form.watch("installmentsCount") || 1)).toFixed(2)}
                                    </span>
                                </p>
                            </div>

                            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Plan
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans?.map((plan) => (
                    <Card key={plan.id}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        {getStudentName(plan.studentId)}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">Start: {format(new Date(plan.startDate), 'MMM d, yyyy')}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${plan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                                    }`}>
                                    {plan.status}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-end mt-2">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Amount</p>
                                    <p className="text-2xl font-bold text-primary">${(plan.totalAmount / 100).toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium capitalize">{plan.frequency}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {(!plans || plans.length === 0) && (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                        No payment plans found. Create one to get started.
                    </div>
                )}
            </div>
        </div>
    );
}
