import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Users, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const assignFeeSchema = z.object({
    feeStructureId: z.coerce.number().min(1, "Select a fee structure"),
    classId: z.string().optional(), // Used for filtering, not sending
    dueDate: z.string().min(1, "Due date is required"),
});

export default function FeeAssignmentPage() {
    const { toast } = useToast();
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>("all");

    const { data: feeStructures } = useQuery<any[]>({
        queryKey: ["/api/fee-structures"],
    });

    const { data: classes } = useQuery<any[]>({
        queryKey: ["/api/classes"],
    });

    const { data: students, isLoading: isLoadingStudents } = useQuery<any[]>({
        queryKey: ["/api/students", { classId: selectedClassId !== "all" ? selectedClassId : undefined }],
    });

    const form = useForm({
        resolver: zodResolver(assignFeeSchema),
        defaultValues: {
            feeStructureId: undefined,
            classId: "all",
            dueDate: "",
        },
    });

    const assignMutation = useMutation({
        mutationFn: async (data: any) => {
            const payload = {
                feeStructureId: data.feeStructureId,
                studentIds: selectedStudentIds,
                dueDate: data.dueDate,
            };
            await apiRequest("POST", "/api/fees/assign-bulk", payload);
        },
        onSuccess: (data: any) => {
            toast({ title: "Success", description: "Fees assigned successfully" });
            setSelectedStudentIds([]);
            form.reset();
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const filteredStudents = useMemo(() => {
        if (!students) return [];
        if (selectedClassId === "all") return students;
        return students.filter((s: any) => s.classId?.toString() === selectedClassId);
    }, [students, selectedClassId]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedStudentIds(filteredStudents.map((s: any) => s.id));
        } else {
            setSelectedStudentIds([]);
        }
    };

    const handleSelectStudent = (studentId: number, checked: boolean) => {
        if (checked) {
            setSelectedStudentIds([...selectedStudentIds, studentId]);
        } else {
            setSelectedStudentIds(selectedStudentIds.filter((id) => id !== studentId));
        }
    };

    const onSubmit = (data: any) => {
        if (selectedStudentIds.length === 0) {
            toast({ title: "Error", description: "Select at least one student", variant: "destructive" });
            return;
        }
        assignMutation.mutate(data);
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Fee Assignment</h1>
                <p className="text-muted-foreground mt-1">
                    Bulk assign fees to students based on classes or programs.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Assignment Details</CardTitle>
                        <CardDescription>Select fee and target group</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Fee Structure</Label>
                                <Select
                                    onValueChange={(val) => form.setValue("feeStructureId", parseInt(val))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Fee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {feeStructures?.map((fs) => (
                                            <SelectItem key={fs.id} value={fs.id.toString()}>
                                                {fs.description} - ${(fs.amount / 100).toFixed(2)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.feeStructureId && (
                                    <p className="text-sm text-red-500">{form.formState.errors.feeStructureId.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Filter by Class</Label>
                                <Select
                                    value={selectedClassId}
                                    onValueChange={(val) => setSelectedClassId(val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Classes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Classes</SelectItem>
                                        {classes?.map((c) => (
                                            <SelectItem key={c.id} value={c.id.toString()}>
                                                {c.name} - {c.section}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input type="date" {...form.register("dueDate")} />
                                {form.formState.errors.dueDate && (
                                    <p className="text-sm text-red-500">{form.formState.errors.dueDate.message}</p>
                                )}
                            </div>

                            <div className="pt-4">
                                <Button type="submit" className="w-full" disabled={assignMutation.isPending}>
                                    {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Assign to {selectedStudentIds.length} Students
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Select Students</CardTitle>
                        <CardDescription>
                            {selectedStudentIds.length} selected
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border h-[500px] overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">
                                            <Checkbox
                                                checked={filteredStudents?.length > 0 && selectedStudentIds.length === filteredStudents?.length}
                                                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                            />
                                        </TableHead>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead>Admission No</TableHead>
                                        <TableHead>Class</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingStudents ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">Loading...</TableCell>
                                        </TableRow>
                                    ) : filteredStudents?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">No students found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredStudents?.map((student: any) => (
                                            <TableRow key={student.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedStudentIds.includes(Number(student.id))}
                                                        onCheckedChange={(checked) => handleSelectStudent(Number(student.id), checked === true)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{student.user?.name}</TableCell>
                                                <TableCell>{student.admissionNo}</TableCell>
                                                <TableCell>{student.class?.name} {student.class?.section}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
