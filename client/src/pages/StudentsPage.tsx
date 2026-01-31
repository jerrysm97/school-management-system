import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useClasses } from "@/hooks/use-classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Filter, User, GraduationCap, Phone, Mail, MapPin, Calendar, Hash, Eye, RefreshCw, CheckCircle, XCircle, DollarSign, BookOpen, ClipboardCheck, Award, Clock, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStudentSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { useStudents, useCreateStudent, useApproveStudent, useBulkActionStudent } from "@/hooks/use-students";

// Generate 8-character alphanumeric ID (e.g., STU2A4B8)
function generateStudentId(): string {
  const prefix = "STU";
  const chars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Removed I, O to avoid confusion
  let id = prefix;
  for (let i = 0; i < 5; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

const createStudentFormSchema = insertStudentSchema.omit({ userId: true }).extend({
  user: insertUserSchema.omit({ role: true }).extend({
    password: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
  }),
  nationalId: z.string().optional(),
  citizenship: z.string().optional(),
  ethnicity: z.string().optional(),
  religion: z.string().optional(),
  bloodGroup: z.string().optional(),
  // Previous Education
  previousSchoolName: z.string().optional(),
  previousClass: z.string().optional(),
  previousGrade: z.string().optional(),
  previousMarksObtained: z.string().optional(),
  transferCertificateNo: z.string().optional(),
  // Payment Setup (for form only, not stored in students table)
  paymentSetup: z.object({
    enabled: z.boolean().default(false),
    feeItems: z.array(z.object({
      feeType: z.string(),
      amount: z.number(),
      selected: z.boolean()
    })).optional(),
    frequency: z.enum(["lump", "monthly", "quarterly", "semester"]).optional(),
    scholarshipId: z.number().optional(),
    scholarshipAmount: z.number().optional()
  }).optional()
});

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ username: string, password: string } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [profileTab, setProfileTab] = useState("overview");
  const searchParams = useSearch();
  const [, setLocation] = useLocation();

  const { data: students, isLoading } = useStudents(classFilter !== "all" ? Number(classFilter) : undefined);
  const { data: classes } = useClasses();

  const createStudentMutation = useCreateStudent();
  const approveMutation = useApproveStudent();
  const bulkActionMutation = useBulkActionStudent();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Handle URL query parameter to open student profile
  useEffect(() => {
    if (students && searchParams) {
      const params = new URLSearchParams(searchParams);
      const viewId = params.get('view');
      if (viewId) {
        const student = students.find(s => s.id === Number(viewId));
        if (student) {
          setSelectedStudent(student);
          setProfileTab("overview");
          // Clear the URL parameter
          setLocation('/students', { replace: true });
        }
      }
    }
  }, [students, searchParams]);

  const filteredStudents = students?.filter(student =>
    student.user.name.toLowerCase().includes(search.toLowerCase()) ||
    student.admissionNo.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = filteredStudents?.map(s => s.id) || [];
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

  const handleBulkAction = (action: 'approve' | 'delete') => {
    bulkActionMutation.mutate({ action, ids: selectedIds }, {
      onSuccess: () => setSelectedIds([])
    });
  };

  const form = useForm({
    resolver: zodResolver(createStudentFormSchema),
    defaultValues: {
      admissionNo: "",
      classId: undefined,
      dob: "",
      gender: "male",
      phone: "",
      address: "",
      nationalId: "",
      citizenship: "",
      ethnicity: "",
      religion: "",
      bloodGroup: "",
      // Previous Education
      previousSchoolName: "",
      previousClass: "",
      previousGrade: "",
      previousMarksObtained: "",
      transferCertificateNo: "",
      // Payment Setup
      paymentSetup: {
        enabled: false,
        feeItems: [
          { feeType: "tuition", amount: 0, selected: false },
          { feeType: "transport", amount: 0, selected: false },
          { feeType: "library", amount: 0, selected: false },
          { feeType: "lab", amount: 0, selected: false },
          { feeType: "hostel", amount: 0, selected: false },
          { feeType: "exam", amount: 0, selected: false },
        ],
        frequency: "lump",
        scholarshipId: undefined,
        scholarshipAmount: 0
      },
      user: {
        name: "",
        username: "",
        email: "",
      }
    }
  });

  // Auto-generate admission number when dialog opens
  useEffect(() => {
    if (isDialogOpen && !form.getValues("admissionNo")) {
      form.setValue("admissionNo", generateStudentId());
    }
  }, [isDialogOpen]);



  function onSubmit(data: any) {
    const submissionData = { ...data };
    submissionData.user.password = "placeholder";

    createStudentMutation.mutate(submissionData, {
      onSuccess: (response: any) => {
        setIsDialogOpen(false);
        form.reset();
        if (response.user && response.generatedPassword) {
          setCreatedCreds({
            username: response.user.username,
            password: response.generatedPassword
          });
        }
      }
    });
  }

  function regenerateId() {
    form.setValue("admissionNo", generateStudentId());
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Credentials Modal */}
      <AlertDialog open={!!createdCreds} onOpenChange={() => setCreatedCreds(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Student Account Created
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>Please copy these credentials. The student will be asked to change the password on first login.</p>
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Username</p>
                    <p className="font-mono font-bold text-lg">{createdCreds?.username}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Password</p>
                    <p className="font-mono font-bold text-lg">{createdCreds?.password}</p>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setCreatedCreds(null)}>Done</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Student Profile Modal */}
      <Dialog open={!!selectedStudent} onOpenChange={() => { setSelectedStudent(null); setProfileTab("overview"); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Student Profile
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-xl border">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                    <AvatarFallback className="text-2xl font-bold bg-primary text-white">
                      {selectedStudent.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{selectedStudent.user.name}</h2>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Hash className="h-4 w-4" />
                        {selectedStudent.admissionNo}
                      </span>
                      {selectedStudent.class && (
                        <Badge variant="secondary">{selectedStudent.class.name}</Badge>
                      )}
                      <Badge variant={selectedStudent.status === 'approved' ? 'default' : 'outline'}>
                        {selectedStudent.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabbed Content */}
              <Tabs value={profileTab} onValueChange={setProfileTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview" className="flex items-center gap-1">
                    <User className="h-4 w-4" /> Overview
                  </TabsTrigger>
                  <TabsTrigger value="education" className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" /> Education
                  </TabsTrigger>
                  <TabsTrigger value="finance" className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" /> Finance
                  </TabsTrigger>
                  <TabsTrigger value="attendance" className="flex items-center gap-1">
                    <ClipboardCheck className="h-4 w-4" /> Attendance
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Date of Birth
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="font-semibold">{selectedStudent.dob || "Not set"}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1">
                          <User className="h-3 w-3" /> Gender
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="font-semibold capitalize">{selectedStudent.gender || "Not set"}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> Phone
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="font-semibold">{selectedStudent.phone || "Not set"}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> Email
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="font-semibold text-sm">{selectedStudent.user.email || "Not set"}</p>
                      </CardContent>
                    </Card>
                    <Card className="col-span-2">
                      <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Address
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="font-semibold">{selectedStudent.address || "Not set"}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Additional Info */}
                  {(selectedStudent.nationalId || selectedStudent.citizenship || selectedStudent.bloodGroup || selectedStudent.religion) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Additional Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {selectedStudent.nationalId && (
                            <div>
                              <p className="text-muted-foreground">National ID</p>
                              <p className="font-medium">{selectedStudent.nationalId}</p>
                            </div>
                          )}
                          {selectedStudent.citizenship && (
                            <div>
                              <p className="text-muted-foreground">Citizenship</p>
                              <p className="font-medium">{selectedStudent.citizenship}</p>
                            </div>
                          )}
                          {selectedStudent.bloodGroup && (
                            <div>
                              <p className="text-muted-foreground">Blood Group</p>
                              <p className="font-medium">{selectedStudent.bloodGroup}</p>
                            </div>
                          )}
                          {selectedStudent.religion && (
                            <div>
                              <p className="text-muted-foreground">Religion</p>
                              <p className="font-medium">{selectedStudent.religion}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Education Tab */}
                <TabsContent value="education" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BookOpen className="h-4 w-4" /> Previous Academic Record
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedStudent.previousSchoolName ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          <div>
                            <p className="text-muted-foreground text-sm">Previous School</p>
                            <p className="font-semibold">{selectedStudent.previousSchoolName}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-sm">Previous Class/Grade</p>
                            <p className="font-semibold">{selectedStudent.previousClass || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-sm">GPA/Grade Obtained</p>
                            <p className="font-semibold">{selectedStudent.previousGrade || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-sm">Marks Obtained</p>
                            <p className="font-semibold">{selectedStudent.previousMarksObtained || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-sm">Transfer Certificate No.</p>
                            <p className="font-semibold">{selectedStudent.transferCertificateNo || "N/A"}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>No previous education records available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Current Academic Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Award className="h-4 w-4" /> Current Academic Standing
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div>
                          <p className="text-muted-foreground text-sm">Current Class</p>
                          <p className="font-semibold">{selectedStudent.class?.name || "Not assigned"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm">Admission Date</p>
                          <p className="font-semibold">{selectedStudent.createdAt ? new Date(selectedStudent.createdAt).toLocaleDateString() : "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm">Academic Status</p>
                          <Badge variant="default">Active</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Finance Tab */}
                <TabsContent value="finance" className="space-y-4 mt-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                      <CardHeader className="pb-2">
                        <CardDescription>Total Paid</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-green-700">$0</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
                      <CardHeader className="pb-2">
                        <CardDescription>Pending</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-orange-700">$0</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200">
                      <CardHeader className="pb-2">
                        <CardDescription>Overdue</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-red-700">$0</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <DollarSign className="h-4 w-4" /> Fee Records
                      </CardTitle>
                      <Button variant="outline" size="sm" onClick={() => window.location.href = `/fees?student=${selectedStudent.id}`}>
                        View All Fees
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No fee records found</p>
                        <p className="text-sm mt-1">Fee records will appear here once assigned</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Payment Plan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-6 text-muted-foreground">
                        <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p>No active payment plan</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Attendance Tab */}
                <TabsContent value="attendance" className="space-y-4 mt-4">
                  <div className="grid grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                      <CardHeader className="pb-2">
                        <CardDescription>Present</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-green-700">0</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200">
                      <CardHeader className="pb-2">
                        <CardDescription>Absent</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-red-700">0</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-200">
                      <CardHeader className="pb-2">
                        <CardDescription>Late</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-yellow-700">0</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                      <CardHeader className="pb-2">
                        <CardDescription>Attendance Rate</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-blue-700">--</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4" /> Recent Attendance
                      </CardTitle>
                      <Button variant="outline" size="sm" onClick={() => window.location.href = `/attendance`}>
                        View Full Record
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No attendance records found</p>
                        <p className="text-sm mt-1">Attendance records will appear here</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground mt-1">Manage student records and admissions.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                New Student Registration
              </DialogTitle>
              <DialogDescription>
                Complete the form below. Student ID is auto-generated.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="contact">Contact</TabsTrigger>
                    <TabsTrigger value="additional">Additional</TabsTrigger>
                    <TabsTrigger value="education">Education</TabsTrigger>
                    <TabsTrigger value="payment">Payment</TabsTrigger>
                  </TabsList>

                  {/* Basic Info Tab */}
                  <TabsContent value="basic" className="space-y-4 pt-4">
                    {/* Auto-generated ID with regenerate button */}
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Student ID (Auto-Generated)</p>
                          <p className="font-mono font-bold text-xl tracking-wider">{form.watch("admissionNo") || "---"}</p>
                        </div>
                        <Button type="button" variant="outline" size="icon" onClick={regenerateId}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="user.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="user.username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username *</FormLabel>
                            <FormControl><Input placeholder="johndoe" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="classId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Class</FormLabel>
                            <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={field.value ? String(field.value) : undefined}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {classes?.map((c) => (
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
                        name="dob"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth *</FormLabel>
                            <FormControl><Input type="date" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  {/* Contact Tab */}
                  <TabsContent value="contact" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="user.email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl><Input type="email" placeholder="student@school.com" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl><Input placeholder="+1 234 567 8900" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl><Textarea placeholder="Full address..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  {/* Additional Tab */}
                  <TabsContent value="additional" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="nationalId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>National ID</FormLabel>
                            <FormControl><Input placeholder="ID Number" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="citizenship"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Citizenship</FormLabel>
                            <FormControl><Input placeholder="Country" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bloodGroup"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Blood Group</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                                  <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="religion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Religion</FormLabel>
                            <FormControl><Input placeholder="Religion" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  {/* Previous Education Tab */}
                  <TabsContent value="education" className="space-y-4 pt-4">
                    <div className="bg-muted/30 p-4 rounded-lg border">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Previous Academic Record
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="previousSchoolName"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Previous School Name</FormLabel>
                              <FormControl><Input placeholder="Enter previous school name" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="previousClass"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Previous Class/Grade</FormLabel>
                              <FormControl><Input placeholder="e.g., Grade 9" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="previousGrade"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Grade/GPA Obtained</FormLabel>
                              <FormControl><Input placeholder="e.g., A, 3.5 GPA" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="previousMarksObtained"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Marks Obtained</FormLabel>
                              <FormControl><Input placeholder="e.g., 450/500" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="transferCertificateNo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Transfer Certificate No.</FormLabel>
                              <FormControl><Input placeholder="TC Number" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Payment Setup Tab */}
                  <TabsContent value="payment" className="space-y-4 pt-4">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          Fee Configuration
                        </h4>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={form.watch("paymentSetup.enabled")}
                            onCheckedChange={(checked) => form.setValue("paymentSetup.enabled", !!checked)}
                          />
                          <span>Enable Payment Plan</span>
                        </label>
                      </div>

                      {form.watch("paymentSetup.enabled") && (
                        <div className="space-y-4">
                          {/* Fee Items */}
                          <div className="grid grid-cols-2 gap-3">
                            {form.watch("paymentSetup.feeItems")?.map((item: any, index: number) => (
                              <div key={item.feeType} className="flex items-center gap-2 p-2 bg-white rounded border">
                                <Checkbox
                                  checked={item.selected}
                                  onCheckedChange={(checked) => {
                                    const feeItems = form.getValues("paymentSetup.feeItems") || [];
                                    feeItems[index].selected = !!checked;
                                    form.setValue("paymentSetup.feeItems", [...feeItems]);
                                  }}
                                />
                                <span className="flex-1 capitalize text-sm">{item.feeType}</span>
                                <Input
                                  type="number"
                                  className="w-24 h-8 text-sm"
                                  placeholder="Amount"
                                  value={item.amount || ""}
                                  onChange={(e) => {
                                    const feeItems = form.getValues("paymentSetup.feeItems") || [];
                                    feeItems[index].amount = Number(e.target.value);
                                    form.setValue("paymentSetup.feeItems", [...feeItems]);
                                  }}
                                  disabled={!item.selected}
                                />
                              </div>
                            ))}
                          </div>

                          {/* Total Display */}
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="font-semibold">Total Amount:</span>
                            <span className="text-xl font-bold text-green-700">
                              ${(form.watch("paymentSetup.feeItems")?.filter((i: any) => i.selected).reduce((sum: number, i: any) => sum + (i.amount || 0), 0) || 0).toLocaleString()}
                            </span>
                          </div>

                          {/* Payment Frequency */}
                          <div>
                            <FormLabel className="text-sm">Payment Frequency</FormLabel>
                            <Select
                              value={form.watch("paymentSetup.frequency")}
                              onValueChange={(val) => form.setValue("paymentSetup.frequency", val as any)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="lump">Lump Sum (One Time)</SelectItem>
                                <SelectItem value="monthly">Monthly Installments</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                <SelectItem value="semester">Semester-based</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Scholarship (optional) */}
                          <div className="bg-purple-50 p-3 rounded border border-purple-200">
                            <FormLabel className="text-sm flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-purple-600" />
                              Apply Scholarship (Optional)
                            </FormLabel>
                            <div className="grid grid-cols-2 gap-3 mt-2">
                              <Input
                                type="number"
                                placeholder="Scholarship Amount"
                                value={form.watch("paymentSetup.scholarshipAmount") || ""}
                                onChange={(e) => form.setValue("paymentSetup.scholarshipAmount", Number(e.target.value))}
                              />
                              <div className="text-right text-sm text-muted-foreground pt-2">
                                Net: ${Math.max(0, (form.watch("paymentSetup.feeItems")?.filter((i: any) => i.selected).reduce((sum: number, i: any) => sum + (i.amount || 0), 0) || 0) - (form.watch("paymentSetup.scholarshipAmount") || 0)).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createStudentMutation.isPending}>
                    {createStudentMutation.isPending ? "Creating..." : "Register Student"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardHeader className="pb-2">
            <CardDescription>Total Students</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700">{students?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-700">{students?.filter((s: any) => s.status === 'approved').length || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-200">
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-700">{students?.filter((s: any) => s.status === 'pending').length || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardHeader className="pb-2">
            <CardDescription>Classes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-700">{classes?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border shadow-sm">
        <div className="p-4 flex gap-4 border-b">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/50 border-none"
            />
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes?.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={filteredStudents?.length! > 0 && selectedIds.length === filteredStudents?.length}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
              </TableHead>
              <TableHead>Student</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Loading students...</TableCell>
              </TableRow>
            ) : filteredStudents?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No students found.</TableCell>
              </TableRow>
            ) : (
              filteredStudents?.map((student) => (
                <TableRow key={student.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(student.id)}
                      onCheckedChange={(checked) => handleSelectOne(student.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {student.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{student.user.name}</p>
                        <p className="text-xs text-muted-foreground">{student.user.email || student.phone || "No contact"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">{student.admissionNo}</code>
                  </TableCell>
                  <TableCell>
                    {student.class ? (
                      <Badge variant="outline">{student.class.name}</Badge>
                    ) : <span className="text-muted-foreground italic text-sm">Unassigned</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.status === 'approved' ? 'default' : student.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {student.status === 'pending' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => approveMutation.mutate({ id: student.id, status: 'approved' })}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => approveMutation.mutate({ id: student.id, status: 'rejected' })}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(student)}>
                      <Eye className="mr-1 h-4 w-4" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-6 py-3 rounded-full shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-5 z-50">
          <span className="font-medium whitespace-nowrap">{selectedIds.length} selected</span>
          <div className="h-4 w-px bg-background/20" />
          <Button variant="secondary" size="sm" onClick={() => handleBulkAction('approve')}>Approve</Button>
          <Button variant="destructive" size="sm" onClick={() => handleBulkAction('delete')}>
            {bulkActionMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
          <Button variant="ghost" size="sm" className="text-background hover:text-background/80" onClick={() => setSelectedIds([])}>Cancel</Button>
        </div>
      )}
    </div>
  );
}