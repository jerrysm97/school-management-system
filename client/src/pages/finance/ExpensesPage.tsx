import { useState } from "react";
import { useFinExpenses, useCreateFinExpense } from "@/hooks/use-finance";
import { insertFinExpenseSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingDown, Plus, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

const formSchema = insertFinExpenseSchema.extend({
    amount: z.coerce.number().min(1, "Amount must be greater than 0"),
    date: z.string().transform((str) => new Date(str).toISOString()),
});

export default function ExpensesPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { data: expenses, isLoading } = useFinExpenses();
    const createExpense = useCreateFinExpense();

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            category: "operations",
            amount: 0,
            date: format(new Date(), "yyyy-MM-dd"),
            description: "",
            status: "pending",
            payeeName: "",
        },
    });

    const onSubmit = (data: any) => {
        const payload = {
            ...data,
            amount: Math.round(data.amount * 100),
        };

        createExpense.mutate(payload, {
            onSuccess: () => {
                setIsDialogOpen(false);
                form.reset();
            },
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const totalExpenses = expenses?.reduce((sum, item) => sum + item.amount, 0) || 0;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Expense Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Track and approve all institutional outflows.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-red-600 hover:bg-red-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Record Expense
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Record New Expense</DialogTitle>
                                <DialogDescription>
                                    Enter details for the new expenditure.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="category"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Category</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select category" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="salary">Salary</SelectItem>
                                                            <SelectItem value="operations">Operations</SelectItem>
                                                            <SelectItem value="aid">Financial Aid</SelectItem>
                                                            <SelectItem value="academic">Academic</SelectItem>
                                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                                            <SelectItem value="other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="amount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Amount ($)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Science Lab Equipment" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="payeeName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Payee Name (Vendor/Person)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. ABC Supply Co." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="date"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Date</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="status"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Status</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select status" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="pending">Pending</SelectItem>
                                                            <SelectItem value="approved">Approved</SelectItem>
                                                            <SelectItem value="paid">Paid</SelectItem>
                                                            <SelectItem value="rejected">Rejected</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={createExpense.isPending}>
                                        {createExpense.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Expense
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-red-50 border-red-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-red-700">Total Expenses</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">
                            ${(totalExpenses / 100).toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-slate-100/50 data-[state=selected]:bg-slate-100">
                                <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Date</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Category</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Description</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Payee</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Status</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-slate-500">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {expenses?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="h-24 text-center text-slate-500">
                                        No expenses recorded.
                                    </td>
                                </tr>
                            ) : (
                                expenses?.map((expense) => (
                                    <tr key={expense.id} className="border-b transition-colors hover:bg-slate-100/50">
                                        <td className="p-4 align-middle">{format(new Date(expense.date), "MMM d, yyyy")}</td>
                                        <td className="p-4 align-middle capitalize">{expense.category}</td>
                                        <td className="p-4 align-middle font-medium">{expense.description}</td>
                                        <td className="p-4 align-middle">{expense.payeeName || "-"}</td>
                                        <td className="p-4 align-middle">
                                            <Badge variant={expense.status === 'paid' ? 'default' : 'outline'} className={expense.status === 'pending' ? 'bg-orange-100 text-orange-700' : ''}>
                                                {expense.status}
                                            </Badge>
                                        </td>
                                        <td className="p-4 align-middle text-right font-medium text-red-700">
                                            -${(expense.amount / 100).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
