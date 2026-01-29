import { useState, useMemo } from "react";
import { useExams, useCreateExam, useMarks, useCreateMark } from "@/hooks/use-exams";
import { useClasses } from "@/hooks/use-classes";
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
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Plus, ClipboardList, PenLine, CalendarCheck, TrendingUp,
    Award, Target, ArrowLeft, Save, BookOpen
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const SUBJECTS = [
    "Mathematics", "Science", "English", "History", "Geography",
    "Physics", "Chemistry", "Biology", "Computer Science"
];

const createExamSchema = z.object({
    name: z.string().min(1, "Exam name is required"),
    classId: z.coerce.number().min(1, "Select a class"),
    subjectId: z.coerce.number().min(1, "Select a subject"),
    subjectName: z.string().optional(),
    date: z.string().min(1, "Date is required"),
    totalMarks: z.coerce.number().min(1).default(100),
    passingMarks: z.coerce.number().optional(),
});

export default function ExamsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedExam, setSelectedExam] = useState<any>(null);
    const [examFilter, setExamFilter] = useState<string>("all");
    const { toast } = useToast();

    const { data: exams, isLoading } = useExams();
    const { data: classes } = useClasses();
    const { data: students } = useStudents();
    const createExamMutation = useCreateExam();

    const form = useForm({
        resolver: zodResolver(createExamSchema),
        defaultValues: {
            name: "",
            classId: 0,
            subjectId: 1,
            subjectName: "",
            date: "",
            totalMarks: 100,
            passingMarks: 40,
        },
    });

    const filteredExams = useMemo(() => {
        if (!exams) return [];
        if (examFilter === "all") return exams;
        return exams.filter((e: any) => e.classId?.toString() === examFilter);
    }, [exams, examFilter]);

    function onSubmit(data: z.infer<typeof createExamSchema>) {
        createExamMutation.mutate(data, {
            onSuccess: () => {
                toast({ title: "Exam created successfully" });
                setIsDialogOpen(false);
                form.reset();
            },
            onError: (err) => {
                toast({ title: "Error", description: err.message, variant: "destructive" });
            },
        });
    }

    // Stats
    const totalExams = exams?.length || 0;
    const upcomingExams = exams?.filter((e: any) => new Date(e.date) > new Date()).length || 0;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
                        <CalendarCheck className="h-8 w-8 text-indigo-600" />
                        Exams & Grades
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage examinations and student performance.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                            <Plus className="mr-2 h-4 w-4" /> Create Exam
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CalendarCheck className="h-5 w-5 text-indigo-600" />
                                Create New Exam
                            </DialogTitle>
                            <DialogDescription>Schedule an examination for a class.</DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Exam Name *</FormLabel>
                                            <FormControl><Input placeholder="e.g., Midterm Examination 2026" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="classId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Class *</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Class" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {classes?.map((c: any) => (
                                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="subjectName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Subject</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Subject" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {SUBJECTS.map((s) => (
                                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Date *</FormLabel>
                                                <FormControl><Input type="date" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="totalMarks"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Total Marks *</FormLabel>
                                                <FormControl><Input type="number" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="passingMarks"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Passing Marks</FormLabel>
                                                <FormControl><Input type="number" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={createExamMutation.isPending}>
                                    {createExamMutation.isPending ? "Creating..." : "Create Exam"}
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1">
                            <ClipboardList className="h-3 w-3" /> Total Exams
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-indigo-700">{totalExams}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Upcoming
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-green-700">{upcomingExams}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1">
                            <Award className="h-3 w-3" /> Classes
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-purple-700">{classes?.length || 0}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1">
                            <Target className="h-3 w-3" /> Avg. Pass Rate
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-orange-700">85%</p>
                    </CardContent>
                </Card>
            </div>

            {selectedExam ? (
                <MarksEntryView exam={selectedExam} students={students} classes={classes} onBack={() => setSelectedExam(null)} />
            ) : (
                <>
                    {/* Filter */}
                    <div className="flex items-center gap-4">
                        <Select value={examFilter} onValueChange={setExamFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="All Classes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {classes?.map((c: any) => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span className="text-sm text-muted-foreground">{filteredExams.length} exams</span>
                    </div>

                    {/* Exams Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {isLoading ? (
                            <div className="col-span-full text-center py-12 text-muted-foreground">Loading exams...</div>
                        ) : filteredExams.length === 0 ? (
                            <Card className="col-span-full border-dashed">
                                <CardContent className="py-12 text-center">
                                    <div className="mx-auto w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                                        <CalendarCheck className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <h3 className="font-semibold text-lg">No Exams Found</h3>
                                    <p className="text-muted-foreground mt-1">Create your first exam to get started.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredExams.map((exam: any) => {
                                const examDate = new Date(exam.date);
                                const isUpcoming = examDate > new Date();
                                const className = classes?.find((c: any) => c.id === exam.classId)?.name;

                                return (
                                    <Card key={exam.id} className="hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={() => setSelectedExam(exam)}>
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg font-display">{exam.name}</CardTitle>
                                                    <CardDescription className="mt-1">
                                                        {className || "Class"}
                                                    </CardDescription>
                                                </div>
                                                <Badge variant={isUpcoming ? "default" : "secondary"} className={isUpcoming ? "bg-green-100 text-green-700" : ""}>
                                                    {isUpcoming ? "Upcoming" : "Completed"}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">Date</p>
                                                    <p className="font-medium">{format(examDate, "MMM d, yyyy")}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Total Marks</p>
                                                    <p className="font-medium">{exam.totalMarks}</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" className="w-full group-hover:bg-indigo-50 group-hover:text-indigo-700 group-hover:border-indigo-200">
                                                <PenLine className="mr-2 h-4 w-4" /> Enter Marks
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function MarksEntryView({ exam, students, classes, onBack }: { exam: any; students: any[] | undefined; classes: any[] | undefined; onBack: () => void }) {
    const { data: marks } = useMarks(exam.id);
    const createMarkMutation = useCreateMark();
    const { toast } = useToast();
    const [scores, setScores] = useState<Record<number, number>>({});

    const classStudents = students?.filter((s: any) => s.classId === exam.classId) || [];
    const className = classes?.find((c: any) => c.id === exam.classId)?.name;
    const existingMarksMap = new Map(marks?.map((m: any) => [m.studentId, m.score]) || []);

    // Calculate stats
    const totalStudents = classStudents.length;
    const gradedStudents = marks?.length || 0;
    const avgScore = marks?.length ? Math.round(marks.reduce((sum: number, m: any) => sum + m.score, 0) / marks.length) : 0;
    const passRate = marks?.length ? Math.round((marks.filter((m: any) => m.score >= (exam.totalMarks * 0.4)).length / marks.length) * 100) : 0;

    function handleSaveMarks() {
        const entries = Object.entries(scores);
        if (entries.length === 0) {
            toast({ title: "No marks to save", variant: "destructive" });
            return;
        }

        entries.forEach(([studentId, score]) => {
            createMarkMutation.mutate({ examId: exam.id, studentId: Number(studentId), score });
        });

        toast({ title: "Marks saved successfully" });
        setScores({});
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Button variant="ghost" onClick={onBack} className="mb-2">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exams
                    </Button>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <ClipboardList className="h-6 w-6 text-indigo-600" />
                        {exam.name}
                    </h2>
                    <p className="text-muted-foreground">{className} • Total: {exam.totalMarks} marks</p>
                </div>
                <Button onClick={handleSaveMarks} disabled={createMarkMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                    <Save className="mr-2 h-4 w-4" />
                    {createMarkMutation.isPending ? "Saving..." : "Save Marks"}
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <p className="text-2xl font-bold">{totalStudents}</p>
                        <p className="text-xs text-muted-foreground">Total Students</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <p className="text-2xl font-bold text-green-700">{gradedStudents}</p>
                        <p className="text-xs text-muted-foreground">Graded</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <p className="text-2xl font-bold text-blue-700">{avgScore}</p>
                        <p className="text-xs text-muted-foreground">Avg. Score</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <p className="text-2xl font-bold text-purple-700">{passRate}%</p>
                        <p className="text-xs text-muted-foreground">Pass Rate</p>
                    </CardContent>
                </Card>
            </div>

            {/* Marks Table */}
            <Card>
                <CardHeader className="border-b">
                    <CardTitle className="flex items-center gap-2">
                        <PenLine className="h-5 w-5 text-indigo-600" />
                        Enter Student Marks
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">#</TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead>Roll No.</TableHead>
                                <TableHead className="text-center">Previous Score</TableHead>
                                <TableHead className="text-center">New Score</TableHead>
                                <TableHead className="text-center">Grade</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {classStudents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No students in this class.</TableCell>
                                </TableRow>
                            ) : (
                                classStudents.map((student: any, idx: number) => {
                                    const existingScore = existingMarksMap.get(student.id);
                                    const currentScore = scores[student.id] ?? existingScore;
                                    const percentage = currentScore !== undefined ? (currentScore / exam.totalMarks) * 100 : null;

                                    let grade = "-";
                                    let gradeColor = "text-muted-foreground";
                                    if (percentage !== null) {
                                        if (percentage >= 90) { grade = "A+"; gradeColor = "text-green-700 bg-green-100"; }
                                        else if (percentage >= 80) { grade = "A"; gradeColor = "text-green-600 bg-green-50"; }
                                        else if (percentage >= 70) { grade = "B"; gradeColor = "text-blue-600 bg-blue-50"; }
                                        else if (percentage >= 60) { grade = "C"; gradeColor = "text-yellow-600 bg-yellow-50"; }
                                        else if (percentage >= 40) { grade = "D"; gradeColor = "text-orange-600 bg-orange-50"; }
                                        else { grade = "F"; gradeColor = "text-red-600 bg-red-50"; }
                                    }

                                    return (
                                        <TableRow key={student.id} className="hover:bg-muted/50">
                                            <TableCell className="font-mono text-sm text-muted-foreground">{idx + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
                                                            {student.user?.name?.charAt(0) || "?"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{student.user?.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{student.admissionNo}</TableCell>
                                            <TableCell className="text-center">
                                                {existingScore !== undefined ? (
                                                    <Badge variant="outline">{existingScore}/{exam.totalMarks}</Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Input
                                                    type="number"
                                                    className="w-20 mx-auto text-center"
                                                    placeholder="0"
                                                    min={0}
                                                    max={exam.totalMarks}
                                                    value={scores[student.id] ?? ""}
                                                    onChange={(e) => setScores({ ...scores, [student.id]: Number(e.target.value) })}
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={gradeColor}>{grade}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
