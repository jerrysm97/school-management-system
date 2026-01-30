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
    DialogDescription
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, DollarSign, FileText, Briefcase, Tag, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
    useExpenses, useCreateExpense,
    useExpenseCategories, useCreateExpenseCategory,
    useVendors, useCreateVendor,
    usePurchaseOrders, useCreatePurchaseOrder
} from "@/hooks/use-expenses";
import {
    insertExpenseSchema, insertExpenseCategorySchema,
    insertVendorSchema, insertPurchaseOrderSchema
} from "@shared/schema";

// --- Form Schemas ---
const createExpenseSchema = insertExpenseSchema.extend({
    vendorId: z.coerce.number().min(1, "Select a vendor"),
    expenseCategoryId: z.coerce.number().min(1, "Select a category"),
    amount: z.coerce.number().min(0.01, "Amount must be positive"),
    expenseDate: z.string().transform(str => new Date(str).toISOString()),
});

const createVendorSchema = insertVendorSchema;
const createCategorySchema = insertExpenseCategorySchema;
const createPOSchema = insertPurchaseOrderSchema.extend({
    vendorId: z.coerce.number().min(1, "Select a vendor"),
    totalAmount: z.coerce.number().min(0),
    poDate: z.string().transform(str => new Date(str).toISOString()),
    deliveryDate: z.string().optional().transform(str => str ? new Date(str).toISOString() : undefined),
});

export default function ExpensesPage() {
    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Expense Management</h1>
                <p className="text-muted-foreground mt-1">
                    Track expenses, manage vendors, and process purchase orders.
                </p>
            </div>

            <Tabs defaultValue="expenses" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="expenses">Expenses</TabsTrigger>
                    <TabsTrigger value="pos">Purchase Orders</TabsTrigger>
                    <TabsTrigger value="vendors">Vendors</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                </TabsList>

                <TabsContent value="expenses">
                    <ExpensesTab />
                </TabsContent>
                <TabsContent value="pos">
                    <PurchaseOrdersTab />
                </TabsContent>
                <TabsContent value="vendors">
                    <VendorsTab />
                </TabsContent>
                <TabsContent value="categories">
                    <CategoriesTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function ExpensesTab() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { data: expenses, isLoading } = useExpenses();
    const { data: vendors } = useVendors();
    const { data: categories } = useExpenseCategories();
    const createExpense = useCreateExpense();

    const form = useForm({
        resolver: zodResolver(createExpenseSchema),
        defaultValues: {
            expenseNumber: `EXP-${Date.now()}`,
            amount: 0,
            expenseDate: format(new Date(), "yyyy-MM-dd"),
            status: "pending",
            description: "",
            vendorId: 0,
            expenseCategoryId: 0,
            departmentId: 1, // Default to 1 for now or fetch depts
        },
    });

    const onSubmit = (data: any) => {
        const payload = {
            ...data,
            amount: Math.round(data.amount * 100), // cents
            totalAmount: Math.round(data.amount * 100), // simplistic for now
        };
        createExpense.mutate(payload, {
            onSuccess: () => {
                setIsDialogOpen(false);
                form.reset({ ...form.getValues(), expenseNumber: `EXP-${Date.now()}` });
            }
        });
    };

    const getVendorName = (id: number) => vendors?.find(v => v.id === id)?.name || "-";
    const getCategoryName = (id: number) => categories?.find(c => c.id === id)?.name || "-";

    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                <div>
                    <h3 className="font-semibold text-lg">Expense Records</h3>
                    <p className="text-sm text-muted-foreground">Recent transactions and requests.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-red-600 hover:bg-red-700">
                            <Plus className="w-4 h-4 mr-2" /> Record Expense
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader><DialogTitle>Record New Expense</DialogTitle></DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="expenseNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Reference #</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="expenseDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Date</FormLabel>
                                                <FormControl><Input type="date" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="vendorId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Vendor</FormLabel>
                                                <Select onValueChange={(val) => field.onChange(Number(val))}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select Vendor" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {vendors?.filter(v => v.isActive).map(v => (
                                                            <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="expenseCategoryId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category</FormLabel>
                                                <Select onValueChange={(val) => field.onChange(Number(val))}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {categories?.filter(c => c.isActive).map(c => (
                                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Amount ($)</FormLabel>
                                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
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
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={createExpense.isPending}>
                                    {createExpense.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                                    Save Expense
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Ref #</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses?.map(expense => (
                                <TableRow key={expense.id}>
                                    <TableCell>{format(new Date(expense.expenseDate), "MMM d, yyyy")}</TableCell>
                                    <TableCell>{expense.expenseNumber}</TableCell>
                                    <TableCell>{getVendorName(expense.vendorId!)}</TableCell>
                                    <TableCell>{getCategoryName(expense.expenseCategoryId!)}</TableCell>
                                    <TableCell>{expense.description}</TableCell>
                                    <TableCell className="text-right font-medium">${(expense.totalAmount / 100).toFixed(2)}</TableCell>
                                    <TableCell><Badge variant={expense.status === 'paid' ? 'default' : 'outline'}>{expense.status}</Badge></TableCell>
                                </TableRow>
                            ))}
                            {!expenses?.length && <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No expenses found</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function VendorsTab() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { data: vendors, isLoading } = useVendors();
    const createVendor = useCreateVendor();

    const form = useForm({
        resolver: zodResolver(createVendorSchema),
        defaultValues: {
            name: "",
            vendorCode: "",
            contactPerson: "",
            email: "",
            phone: "",
            isActive: true,
            isApproved: true,
        },
    });

    const onSubmit = (data: any) => {
        createVendor.mutate(data, {
            onSuccess: () => {
                setIsDialogOpen(false);
                form.reset();
            }
        });
    };

    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Vendor</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add New Vendor</DialogTitle></DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vendor Name</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="vendorCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Code</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="contactPerson"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Contact Person</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" className="w-full">Save Vendor</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
            <Card>
                <CardHeader><CardTitle>Vendors</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vendors?.map(vendor => (
                                <TableRow key={vendor.id}>
                                    <TableCell className="font-medium">{vendor.name}</TableCell>
                                    <TableCell>{vendor.vendorCode}</TableCell>
                                    <TableCell>
                                        <div className="text-sm">{vendor.contactPerson}</div>
                                        <div className="text-xs text-muted-foreground">{vendor.email}</div>
                                    </TableCell>
                                    <TableCell><Badge variant={vendor.isActive ? "default" : "secondary"}>{vendor.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function CategoriesTab() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { data: categories, isLoading } = useExpenseCategories();
    const createCategory = useCreateExpenseCategory();

    const form = useForm({
        resolver: zodResolver(createCategorySchema),
        defaultValues: {
            name: "",
            code: "",
            description: "",
            isActive: true,
            requiresApproval: true,
            approvalLimit: 0,
        },
    });

    const onSubmit = (data: any) => {
        const payload = { ...data, approvalLimit: Math.round(data.approvalLimit * 100) };
        createCategory.mutate(payload, {
            onSuccess: () => {
                setIsDialogOpen(false);
                form.reset();
            }
        });
    };

    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Category</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add Expense Category</DialogTitle></DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Code</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="approvalLimit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Approval Limit ($)</FormLabel>
                                                <FormControl><Input type="number" {...field} /></FormControl>
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
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" className="w-full">Save Category</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
            <Card>
                <CardHeader><CardTitle>Expense Categories</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Approval Limit</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories?.map(cat => (
                                <TableRow key={cat.id}>
                                    <TableCell className="font-medium">{cat.name}</TableCell>
                                    <TableCell>{cat.code}</TableCell>
                                    <TableCell>${(cat.approvalLimit! / 100).toFixed(2)}</TableCell>
                                    <TableCell><Badge variant={cat.isActive ? "default" : "secondary"}>{cat.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function PurchaseOrdersTab() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { data: pos, isLoading } = usePurchaseOrders();
    const { data: vendors } = useVendors();
    const createPO = useCreatePurchaseOrder();

    const form = useForm({
        resolver: zodResolver(createPOSchema),
        defaultValues: {
            poNumber: `PO-${Date.now()}`,
            vendorId: 0,
            departmentId: 1,
            totalAmount: 0,
            status: "draft",
            poDate: format(new Date(), "yyyy-MM-dd"),
        },
    });

    const onSubmit = (data: any) => {
        const payload = { ...data, totalAmount: Math.round(data.totalAmount * 100) };
        createPO.mutate(payload, {
            onSuccess: () => {
                setIsDialogOpen(false);
                form.reset({ ...form.getValues(), poNumber: `PO-${Date.now()}` });
            }
        });
    };

    const getVendorName = (id: number) => vendors?.find(v => v.id === id)?.name || "-";

    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Create PO</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="poNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>PO Number</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="vendorId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vendor</FormLabel>
                                            <Select onValueChange={(val) => field.onChange(Number(val))}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select Vendor" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {vendors?.filter(v => v.isActive).map(v => (
                                                        <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="totalAmount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Total Amount ($)</FormLabel>
                                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="poDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Date</FormLabel>
                                            <FormControl><Input type="date" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full">Create PO</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
            <Card>
                <CardHeader><CardTitle>Purchase Orders</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ref #</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pos?.map(po => (
                                <TableRow key={po.id}>
                                    <TableCell className="font-medium">{po.poNumber}</TableCell>
                                    <TableCell>{getVendorName(po.vendorId!)}</TableCell>
                                    <TableCell>{format(new Date(po.poDate!), "MMM d, yyyy")}</TableCell>
                                    <TableCell>${(po.totalAmount / 100).toFixed(2)}</TableCell>
                                    <TableCell><Badge>{po.status}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
