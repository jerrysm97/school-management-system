import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { insertFeeStructureSchema, type FeeStructure } from "@shared/schema";
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
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function FeeStructuresPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch Data
    const { data: feeStructures, isLoading } = useQuery<FeeStructure[]>({
        queryKey: ["/api/fee-structures"],
    });

    const { data: academicPeriods } = useQuery<any[]>({
        queryKey: ["/api/academic-periods"],
    });

    const { data: programs } = useQuery<any[]>({
        queryKey: ["/api/finance/programs"], // Assuming this endpoint exists based on earlier checks
    });

    const form = useForm({
        resolver: zodResolver(insertFeeStructureSchema),
        defaultValues: {
            feeType: "tuition",
            amount: 0,
            currency: "USD",
            academicPeriodId: undefined, // Will be set by select
            isPerCredit: false,
            description: "",
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            // Amount is in cents in DB
            const payload = { ...data, amount: Math.round(data.amount * 100) };
            await apiRequest("POST", "/api/fee-structures", payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/fee-structures"] });
            setIsDialogOpen(false);
            form.reset();
            toast({ title: "Success", description: "Fee structure created successfully" });
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const onSubmit = (data: any) => {
        // If editing, handle update logic here (TODO: Add update endpoint if missing)
        createMutation.mutate(data);
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Fee Structures</h1>
                    <p className="text-muted-foreground mt-1">
                        Define tuition and fee rates for academic programs.
                    </p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Fee Structure
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Fee Structure</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="feeType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fee Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="tuition">Tuition</SelectItem>
                                                <SelectItem value="hostel">Hostel</SelectItem>
                                                <SelectItem value="transport">Transport</SelectItem>
                                                <SelectItem value="library">Library</SelectItem>
                                                <SelectItem value="exam">Exam</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
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
                                                <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="currency"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Currency</FormLabel>
                                            <FormControl>
                                                <Input {...field} readOnly />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="academicPeriodId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Academic Period</FormLabel>
                                        <Select
                                            onValueChange={(val) => field.onChange(val ? parseInt(val) : undefined)}
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Period" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {academicPeriods?.map((period) => (
                                                    <SelectItem key={period.id} value={period.id.toString()}>
                                                        {period.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex items-center space-x-2">
                                <FormField
                                    control={form.control}
                                    name="isPerCredit"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <input
                                                    type="checkbox"
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                    className="h-4 w-4 rounded border-gray-300"
                                                />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                                Per Credit Fee?
                                            </FormLabel>
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
                                            <Input {...field} placeholder="e.g. Fall 2026 Tuition" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Fee Structure
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <div className="rounded-md border bg-white">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b hover:bg-slate-100/50">
                            <th className="h-12 px-4 text-left font-medium text-slate-500">Description</th>
                            <th className="h-12 px-4 text-left font-medium text-slate-500">Type</th>
                            <th className="h-12 px-4 text-right font-medium text-slate-500">Amount</th>
                            <th className="h-12 px-4 text-center font-medium text-slate-500">Per Credit</th>
                            <th className="h-12 px-4 text-center font-medium text-slate-500">Period</th>
                            {/* <th className="h-12 px-4 text-right font-medium text-slate-500">Actions</th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {!feeStructures || feeStructures.length === 0 ? (
                            <tr><td colSpan={5} className="h-24 text-center text-muted-foreground">No fee structures defined.</td></tr>
                        ) : (
                            feeStructures.map((fee) => (
                                <tr key={fee.id} className="border-b hover:bg-slate-100/50">
                                    <td className="p-4 font-medium">{fee.description || "-"}</td>
                                    <td className="p-4 capitalize badge">{fee.feeType}</td>
                                    <td className="p-4 text-right font-bold text-slate-700">
                                        {(fee.amount / 100).toLocaleString('en-US', { style: 'currency', currency: fee.currency || 'USD' })}
                                    </td>
                                    <td className="p-4 text-center">
                                        {fee.isPerCredit ? <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Yes</span> : "-"}
                                    </td>
                                    <td className="p-4 text-center">
                                        {academicPeriods?.find(p => p.id === fee.academicPeriodId)?.name || "-"}
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
