import { useState, useRef } from "react";
import { useFinIncomes, useCreateFinIncome } from "@/hooks/use-finance";
import { useStudents } from "@/hooks/use-students";
import { insertFinIncomeSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
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
import { Loader2, TrendingUp, Plus, Search, Filter, FileText, Printer, Building2 } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { useReactToPrint } from "react-to-print";

// ... (schema remains same)
const formSchema = insertFinIncomeSchema.extend({
    amount: z.coerce.number().min(1, "Amount must be greater than 0"),
    date: z.string().transform((str) => new Date(str).toISOString()), // simple date string handling
    payerId: z.coerce.number().optional(), // Make payerId optional but coerced number
});

export default function IncomePage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null); // State for selected invoice

    // Print handling
    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Invoice-${selectedInvoice?.id}`,
    });

    const { data: incomes, isLoading } = useFinIncomes();
    const { data: students } = useStudents();
    const createIncome = useCreateFinIncome();

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            sourceType: "other",
            amount: 0,
            date: format(new Date(), "yyyy-MM-dd"),
            description: "",
            status: "paid",
            paymentMethod: "cash",
            payerId: undefined,
        },
    });

    const onSubmit = (data: any) => {
        const payload = {
            ...data,
            amount: Math.round(data.amount * 100),
            payerId: data.payerId || null,
        };

        createIncome.mutate(payload, {
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

    const totalIncome = incomes?.reduce((sum, item) => sum + item.amount, 0) || 0;

    const getPayerName = (id: number | null) => {
        if (!id) return "-";
        const student = students?.find(s => s.id === id);
        return student ? (student as any).user?.name || `Student #${id}` : `User #${id}`;
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Income Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Track and manage all institutional revenue streams.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-green-600 hover:bg-green-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Record Income
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Record New Income</DialogTitle>
                                <DialogDescription>
                                    Enter details for the new revenue entry.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="sourceType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Source Type</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="fee">Fee</SelectItem>
                                                            <SelectItem value="scholarship">Scholarship</SelectItem>
                                                            <SelectItem value="donation">Donation</SelectItem>
                                                            <SelectItem value="fund">Fund</SelectItem>
                                                            <SelectItem value="sponsorship">Sponsorship</SelectItem>
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
                                        name="payerId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Payer (Optional)</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value ? String(field.value) : undefined}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select student (if applicable)" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="0">None</SelectItem>
                                                        {students?.map((student) => (
                                                            <SelectItem key={student.id} value={String(student.id)}>
                                                                {(student as any).user?.name || `Student #${student.id}`} ({(student as any).user?.username || student.admissionNo})
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
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Alumni Donation 2026" {...field} />
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
                                            name="paymentMethod"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Payment Method</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select method" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="cash">Cash</SelectItem>
                                                            <SelectItem value="check">Check</SelectItem>
                                                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                                            <SelectItem value="online">Online</SelectItem>
                                                            <SelectItem value="card">Card</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={createIncome.isPending}>
                                        {createIncome.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Record
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-green-50 border-green-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-green-700">Total Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">
                            ${(totalIncome / 100).toFixed(2)}
                        </div>
                        <p className="text-xs text-green-600">All sources combined</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search incomes..." className="pl-8" />
                </div>
                <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-slate-100/50 data-[state=selected]:bg-slate-100">
                                <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Date</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Description</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Payer</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Source</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Method</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Status</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-slate-500">Amount</th>
                                <th className="h-12 px-4 text-center align-middle font-medium text-slate-500">Action</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {incomes?.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="h-24 text-center text-slate-500">
                                        No income records found.
                                    </td>
                                </tr>
                            ) : (
                                incomes?.map((income) => (
                                    <tr key={income.id} className="border-b transition-colors hover:bg-slate-100/50">
                                        <td className="p-4 align-middle">{format(new Date(income.date), "MMM d, yyyy")}</td>
                                        <td className="p-4 align-middle font-medium">{income.description}</td>
                                        <td className="p-4 align-middle text-muted-foreground">{getPayerName(income.payerId)}</td>
                                        <td className="p-4 align-middle capitalize">{income.sourceType}</td>
                                        <td className="p-4 align-middle capitalize">{income.paymentMethod?.replace('_', ' ')}</td>
                                        <td className="p-4 align-middle">
                                            <Badge variant={income.status === 'paid' ? 'default' : 'secondary'} className={income.status === 'paid' ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>
                                                {income.status}
                                            </Badge>
                                        </td>
                                        <td className="p-4 align-middle text-right font-medium text-green-700">
                                            +${(income.amount / 100).toFixed(2)}
                                        </td>
                                        <td className="p-4 align-middle text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedInvoice(income)}
                                            >
                                                <FileText className="w-4 h-4 text-slate-500 mb-1" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invoice Modal */}
            <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Details</DialogTitle>
                    </DialogHeader>

                    {/* Invoice Content */}
                    <div ref={printRef} className="p-8 bg-white text-black print:p-0">
                        <div className="border-b pb-6 mb-6 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Building2 className="w-6 h-6 text-green-700" />
                                    <h2 className="text-xl font-bold">UMS Institute</h2>
                                </div>
                                <p className="text-sm text-gray-500">123 Academic Way</p>
                                <p className="text-sm text-gray-500">Knowledge City, ED 4000</p>
                                <p className="text-sm text-gray-500">contact@ums.edu</p>
                            </div>
                            <div className="text-right">
                                <h1 className="text-3xl font-light text-gray-800 mb-2">INVOICE</h1>
                                <p className="text-sm text-gray-500">Invoice #: <strong>INV-{selectedInvoice?.id.toString().padStart(6, '0')}</strong></p>
                                <p className="text-sm text-gray-500">Date: {selectedInvoice && format(new Date(selectedInvoice.date), "MMM d, yyyy")}</p>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Bill To:</h3>
                            <p className="font-medium text-lg">{getPayerName(selectedInvoice?.payerId)}</p>
                            <p className="text-sm text-gray-500">Student ID: {selectedInvoice?.payerId || "N/A"}</p>
                        </div>

                        <table className="w-full mb-8">
                            <thead>
                                <tr className="border-b-2 border-gray-100">
                                    <th className="text-left py-2 font-semibold text-gray-600">Description</th>
                                    <th className="text-left py-2 font-semibold text-gray-600">Type</th>
                                    <th className="text-right py-2 font-semibold text-gray-600">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-50">
                                    <td className="py-4">{selectedInvoice?.description}</td>
                                    <td className="py-4 capitalize">{selectedInvoice?.sourceType}</td>
                                    <td className="py-4 text-right font-medium">${(selectedInvoice?.amount / 100).toFixed(2)}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={2} className="pt-4 text-right font-bold text-gray-700">Total:</td>
                                    <td className="pt-4 text-right font-bold text-xl text-green-700">${(selectedInvoice?.amount / 100).toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>

                        <div className="border-t pt-6 flex justify-between items-center">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Payment Status:</p>
                                <Badge variant={selectedInvoice?.status === 'paid' ? 'default' : 'secondary'} className="mt-1">
                                    {selectedInvoice?.status?.toUpperCase()}
                                </Badge>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400">Authorized Signature</p>
                                <div className="h-10 border-b border-gray-300 w-48 mt-2"></div>
                            </div>
                        </div>

                        <div className="mt-8 text-center text-xs text-gray-400">
                            <p>Thank you for your payment!</p>
                            <p>This is a system generated invoice.</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedInvoice(null)}>Close</Button>
                        <Button onClick={handlePrint} className="gap-2">
                            <Printer className="w-4 h-4" />
                            Print Invoice
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
