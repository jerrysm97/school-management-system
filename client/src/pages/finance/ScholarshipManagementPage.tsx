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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, GraduationCap, DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
    useScholarshipTypes, useCreateScholarshipType,
    useStudentScholarships, useAwardScholarship
} from "@/hooks/use-scholarships";
import { useStudents } from "@/hooks/use-students";
import { insertScholarshipTypeSchema, insertStudentScholarshipSchema } from "@shared/schema";

// Form Schemas
const createTypeSchema = insertScholarshipTypeSchema.extend({
    amount: z.coerce.number().min(0),
    percentage: z.coerce.number().min(0).max(10000).optional(), // basis points
    totalBudget: z.coerce.number().optional(),
    totalSlots: z.coerce.number().optional(),
});

const createAwardSchema = insertStudentScholarshipSchema.extend({
    studentId: z.coerce.number().min(1, "Select a student"),
    scholarshipTypeId: z.coerce.number().min(1, "Select a scholarship type"),
    awardedAmount: z.coerce.number().min(1, "Amount must be positive"),
});

export default function ScholarshipManagementPage() {
    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Scholarship Management</h1>
                <p className="text-muted-foreground mt-1">
                    Manage scholarship programs, applications, and student awards.
                </p>
            </div>

            <Tabs defaultValue="awards" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="awards">Student Awards</TabsTrigger>
                    <TabsTrigger value="types">Scholarship Types</TabsTrigger>
                </TabsList>

                <TabsContent value="awards">
                    <AwardsTab />
                </TabsContent>

                <TabsContent value="types">
                    <TypesTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function TypesTab() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { data: types, isLoading } = useScholarshipTypes();
    const createType = useCreateScholarshipType();

    const form = useForm({
        resolver: zodResolver(createTypeSchema),
        defaultValues: {
            name: "",
            code: "",
            amountType: "fixed",
            amount: 0,
            description: "",
            isActive: true,
        },
    });

    const onSubmit = (data: any) => {
        const payload = {
            ...data,
            amount: data.amountType === 'fixed' ? Math.round(data.amount * 100) : undefined, // cents
            percentage: data.amountType === 'percentage' ? Math.round(data.amount * 100) : undefined, // re-using amount field for percentage input (e.g. 50.00 -> 5000)
            // Wait, logic above is simplified. Let's make it robust.
            // If amountType is percentage, data.amount is the percentage value (e.g. 50).
        };

        if (data.amountType === 'fixed') {
            payload.amount = Math.round(data.amount * 100);
            payload.percentage = undefined;
        } else if (data.amountType === 'percentage') {
            payload.percentage = Math.round(data.amount * 100); // 50.00% -> 5000
            payload.amount = undefined;
        }

        createType.mutate(payload, {
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
                        <Button><Plus className="mr-2 h-4 w-4" /> Create Scholarship Type</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Scholarship Type</DialogTitle>
                        </DialogHeader>
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
                                        name="amountType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                        <SelectItem value="percentage">Percentage</SelectItem>
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
                                                <FormLabel>{form.watch("amountType") === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}</FormLabel>
                                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" disabled={createType.isPending} className="w-full">
                                    {createType.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                                    Create Type
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Scholarship Programs</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {types?.map(type => (
                                <TableRow key={type.id}>
                                    <TableCell className="font-medium">{type.name}</TableCell>
                                    <TableCell>{type.code}</TableCell>
                                    <TableCell>
                                        {type.amountType === 'fixed'
                                            ? `$${(type.amount / 100).toFixed(2)}`
                                            : `${(type.percentage / 100).toFixed(2)}%`}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={type.isActive ? "default" : "secondary"}>
                                            {type.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function AwardsTab() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    // Call with undefined to get ALL awards (requires updated server)
    const { data: awards, isLoading } = useStudentScholarships(undefined as any);
    const { data: types } = useScholarshipTypes();
    const { data: students } = useStudents();
    const createAward = useAwardScholarship();

    const form = useForm({
        resolver: zodResolver(createAwardSchema),
        defaultValues: {
            studentId: 0,
            scholarshipTypeId: 0,
            awardedAmount: 0,
            disbursementType: "one_time",
            status: "approved",
        },
    });

    const onSubmit = (data: any) => {
        const payload = {
            ...data,
            awardedAmount: Math.round(data.awardedAmount * 100),
        };
        createAward.mutate(payload, {
            onSuccess: () => {
                setIsDialogOpen(false);
                form.reset();
            }
        });
    };

    // Watch scholarship type to auto-fill amount
    const selectedTypeId = form.watch("scholarshipTypeId");
    // Effect to update amount if fixed type selected? 
    // Simplified for now.

    const getStudentName = (id: number) => students?.find(s => s.id === id)?.user?.name || `Student #${id}`;
    const getTypeName = (id: number) => types?.find(t => t.id === id)?.name || `Type #${id}`;

    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Grant Award</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Grant Scholarship</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="studentId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Student</FormLabel>
                                            <Select onValueChange={(val) => field.onChange(Number(val))}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue placeholder="Select Student" /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {students?.map(s => (
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
                                <FormField
                                    control={form.control}
                                    name="scholarshipTypeId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Scholarship Type</FormLabel>
                                            <Select onValueChange={(val) => {
                                                const typeId = Number(val);
                                                field.onChange(typeId);
                                                // Auto-fill amount if fixed
                                                const type = types?.find(t => t.id === typeId);
                                                if (type && type.amountType === 'fixed' && type.amount) {
                                                    form.setValue("awardedAmount", type.amount / 100);
                                                }
                                            }}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {types?.filter(t => t.isActive).map(t => (
                                                        <SelectItem key={t.id} value={t.id.toString()}>
                                                            {t.name} ({t.code})
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
                                    name="awardedAmount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Awarded Amount ($)</FormLabel>
                                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={createAward.isPending} className="w-full">
                                    {createAward.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                                    Grant Award
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader><CardTitle>Awarded Scholarships</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Scholarship</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {awards?.map(award => (
                                <TableRow key={award.id}>
                                    <TableCell>{getStudentName(award.studentId)}</TableCell>
                                    <TableCell>{getTypeName(award.scholarshipTypeId)}</TableCell>
                                    <TableCell>${(award.awardedAmount / 100).toFixed(2)}</TableCell>
                                    <TableCell><Badge>{award.status}</Badge></TableCell>
                                    <TableCell>{new Date(award.createdAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                            {!awards?.length && <TableRow><TableCell colSpan={5} className="text-center">No awards found</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
