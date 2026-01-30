import { useState, useEffect } from "react";
import { useTeachers, useCreateTeacher } from "@/hooks/use-teachers";
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
import { Plus, Search, Users, Mail, Phone, Building, Eye, RefreshCw, Briefcase } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTeacherSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

// Generate Employee ID (e.g., TCH2A4B8)
function generateTeacherId(): string {
  const prefix = "TCH";
  const chars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let id = prefix;
  for (let i = 0; i < 5; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

const DEPARTMENTS = [
  "Mathematics",
  "Science",
  "English",
  "History",
  "Computer Science",
  "Physical Education",
  "Arts",
  "Music",
  "Languages",
  "Business Studies",
];

const createTeacherFormSchema = insertTeacherSchema.omit({ userId: true }).extend({
  user: insertUserSchema.omit({ role: true }).extend({
    password: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
  }),
  employeeId: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.string().optional(),
  address: z.string().optional(),
});

export default function TeachersPage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ username: string, password: string } | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  const { data: teachers, isLoading } = useTeachers();
  const createTeacherMutation = useCreateTeacher();

  const form = useForm({
    resolver: zodResolver(createTeacherFormSchema),
    defaultValues: {
      department: "",
      phone: "",
      employeeId: "",
      qualification: "",
      experience: "",
      address: "",
      user: {
        name: "",
        username: "",
        email: "",
      }
    }
  });

  useEffect(() => {
    if (isDialogOpen && !form.getValues("employeeId")) {
      form.setValue("employeeId", generateTeacherId());
    }
  }, [isDialogOpen]);

  const filteredTeachers = teachers?.filter(teacher => {
    const matchesSearch =
      teacher.user.name.toLowerCase().includes(search.toLowerCase()) ||
      teacher.department?.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === "all" || teacher.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(teachers?.map(t => t.department).filter(Boolean) || []));

  function onSubmit(data: any) {
    const submissionData = { ...data };
    submissionData.user.password = "placeholder";

    createTeacherMutation.mutate(submissionData, {
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
    form.setValue("employeeId", generateTeacherId());
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Credentials Modal */}
      <AlertDialog open={!!createdCreds} onOpenChange={() => setCreatedCreds(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Teacher Account Created
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>Please copy these credentials. The teacher will be asked to change the password on first login.</p>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
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

      {/* Teacher Profile Modal */}
      <Dialog open={!!selectedTeacher} onOpenChange={() => setSelectedTeacher(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Teacher Profile</DialogTitle>
          </DialogHeader>
          {selectedTeacher && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-100 via-purple-50 to-transparent p-6 rounded-xl border">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                    <AvatarFallback className="text-2xl font-bold bg-purple-600 text-white">
                      {selectedTeacher.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{selectedTeacher.user.name}</h2>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge className="bg-purple-100 text-purple-700">{selectedTeacher.department || "General"}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold text-sm">{selectedTeacher.user.email || "Not set"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Phone
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold">{selectedTeacher.phone || "Not set"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-1">
                      <Building className="h-3 w-3" /> Department
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold">{selectedTeacher.department || "General"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" /> Status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-purple-600" />
            Faculty Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage teachers and faculty members.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-purple-200 bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" /> Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                New Faculty Registration
              </DialogTitle>
              <DialogDescription>Employee ID is auto-generated.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="professional">Professional</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4 pt-4">
                    {/* Auto-generated ID */}
                    <div className="bg-gradient-to-r from-purple-100 to-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Employee ID</p>
                          <p className="font-mono font-bold text-xl tracking-wider">{form.watch("employeeId") || "---"}</p>
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
                            <FormControl><Input placeholder="John Smith" {...field} /></FormControl>
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
                            <FormControl><Input placeholder="jsmith" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="user.email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl><Input type="email" placeholder="teacher@school.com" {...field} value={field.value || ''} /></FormControl>
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
                            <FormControl><Input placeholder="+1 234 567 8900" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="professional" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {DEPARTMENTS.map(dept => (
                                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="qualification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Qualification</FormLabel>
                            <FormControl><Input placeholder="M.Ed, Ph.D, etc." {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="experience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Experience (Years)</FormLabel>
                            <FormControl><Input placeholder="5" {...field} /></FormControl>
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
                </Tabs>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createTeacherMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
                    {createTeacherMutation.isPending ? "Creating..." : "Register Teacher"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardHeader className="pb-2">
            <CardDescription>Total Faculty</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-700">{teachers?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardHeader className="pb-2">
            <CardDescription>Departments</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700">{departments.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-700">{teachers?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
          <CardHeader className="pb-2">
            <CardDescription>Avg. Classes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-700">4</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Faculty Directory</CardTitle>
              <CardDescription>All registered teachers</CardDescription>
            </div>
            <div className="flex gap-3">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teachers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept!}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">Loading teachers...</TableCell>
                </TableRow>
              ) : filteredTeachers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No teachers found.</TableCell>
                </TableRow>
              ) : (
                filteredTeachers?.map((teacher) => (
                  <TableRow key={teacher.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
                            {teacher.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{teacher.user.name}</p>
                          <p className="text-xs text-muted-foreground">{teacher.user.email || "No email"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {teacher.department || "General"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {teacher.phone || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700">Active</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedTeacher(teacher)}>
                        <Eye className="mr-1 h-4 w-4" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}