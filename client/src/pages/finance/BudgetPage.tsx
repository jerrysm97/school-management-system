import { useState } from "react";
import { useFinBudgets, useCreateFinBudget } from "@/hooks/use-finance";
import { insertFinBudgetSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Loader2, PieChart, Plus } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

const formSchema = insertFinBudgetSchema.extend({
    budgetedAmount: z.coerce.number().min(0),
    startDate: z.string().transform((str) => new Date(str).toISOString()),
    endDate: z.string().transform((str) => new Date(str).toISOString()),
});

export default function BudgetPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { data: budgets, isLoading } = useFinBudgets();
    const createBudget = useCreateFinBudget();

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            category: "expense",
            budgetedAmount: 0,
            startDate: format(new Date(), "yyyy-MM-dd"),
            endDate: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), "yyyy-MM-dd"),
            subCategory: "",
        },
    });

    const onSubmit = (data: any) => {
        const payload = {
            ...data,
            budgetedAmount: Math.round(data.budgetedAmount * 100),
        };

        createBudget.mutate(payload, {
            onSuccess: () => {
                setIsDialogOpen(false);
                form.reset();
            },
        });
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    const totalBudget = budgets?.reduce((sum, item) => sum + item.budgetedAmount, 0) || 0;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Budget Planning</h1>
                    <p className="text-muted-foreground mt-1">
                        Define and track financial targets.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-purple-600 hover:bg-purple-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Set Budget
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Set New Budget</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Budget Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Science Dept 2026" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

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
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="income">Income</SelectItem>
                                                            <SelectItem value="expense">Expense</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="budgetedAmount"
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

                                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={createBudget.isPending}>
                                        {createBudget.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Budget
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-purple-50 border-purple-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-purple-700">Total Planned</CardTitle>
                        <PieChart className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-700">
                            ${(totalBudget / 100).toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-md border bg-white">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b hover:bg-slate-100/50">
                            <th className="h-12 px-4 text-left font-medium text-slate-500">Name</th>
                            <th className="h-12 px-4 text-left font-medium text-slate-500">Category</th>
                            <th className="h-12 px-4 text-left font-medium text-slate-500">Start Date</th>
                            <th className="h-12 px-4 text-right font-medium text-slate-500">Budgeted</th>
                            <th className="h-12 px-4 text-right font-medium text-slate-500">Actual</th>
                        </tr>
                    </thead>
                    <tbody>
                        {budgets?.length === 0 ? (
                            <tr><td colSpan={5} className="h-24 text-center">No budgets set.</td></tr>
                        ) : (
                            budgets?.map((budget) => (
                                <tr key={budget.id} className="border-b hover:bg-slate-100/50">
                                    <td className="p-4 font-medium">{budget.name}</td>
                                    <td className="p-4 capitalize">{budget.category}</td>
                                    <td className="p-4">{format(new Date(budget.startDate), "MMM d, yyyy")}</td>
                                    <td className="p-4 text-right font-medium text-purple-700">
                                        ${(budget.budgetedAmount / 100).toFixed(2)}
                                    </td>
                                    <td className="p-4 text-right">
                                        ${((budget.actualAmount || 0) / 100).toFixed(2)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
