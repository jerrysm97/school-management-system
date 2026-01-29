import { useState } from "react";
import { useClasses, useCreateClass } from "@/hooks/use-classes";
import { useTeachers } from "@/hooks/use-teachers";
import { useStudents } from "@/hooks/use-students";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Plus, Users, GraduationCap, Search, Eye, Layers } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createClassFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  grade: z.string().min(1, "Grade is required"),
  section: z.string().min(1, "Section is required"),
  classTeacherId: z.coerce.number().optional(),
  capacity: z.coerce.number().optional(),
  room: z.string().optional(),
});

const GRADES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const SECTIONS = ["A", "B", "C", "D", "E"];

export default function ClassesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const { data: classes, isLoading } = useClasses();
  const { data: teachers } = useTeachers();
  const { data: students } = useStudents();
  const createClassMutation = useCreateClass();

  const form = useForm({
    resolver: zodResolver(createClassFormSchema),
    defaultValues: {
      name: "",
      grade: "",
      section: "",
      classTeacherId: undefined,
      capacity: 40,
      room: "",
    }
  });

  const filteredClasses = classes?.filter(cls =>
    cls.name.toLowerCase().includes(search.toLowerCase()) ||
    cls.grade?.toLowerCase().includes(search.toLowerCase())
  );

  function onSubmit(data: any) {
    const payload = {
      ...data,
      classTeacherId: data.classTeacherId ? Number(data.classTeacherId) : undefined
    };
    createClassMutation.mutate(payload, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
      }
    });
  }

  const getStudentCount = (classId: number) =>
    students?.filter((s: any) => s.classId === classId).length || 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Class Details Modal */}
      <Dialog open={!!selectedClass} onOpenChange={() => setSelectedClass(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Class Details</DialogTitle>
          </DialogHeader>
          {selectedClass && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-100 via-green-50 to-transparent p-6 rounded-xl border">
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 bg-green-600 rounded-xl flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedClass.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">Grade {selectedClass.grade}</Badge>
                      <Badge variant="outline">Section {selectedClass.section}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Students</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-700">{getStudentCount(selectedClass.id)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Class Teacher</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold">{selectedClass.classTeacher?.user?.name || "Not assigned"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Room</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold">{selectedClass.room || "TBD"}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Students in Class */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Enrolled Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {students?.filter((s: any) => s.classId === selectedClass.id).slice(0, 10).map((student: any) => (
                      <Badge key={student.id} variant="secondary" className="py-1">
                        {student.user.name}
                      </Badge>
                    ))}
                    {getStudentCount(selectedClass.id) === 0 && (
                      <p className="text-sm text-muted-foreground">No students enrolled</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-green-600" />
            Class Management
          </h1>
          <p className="text-muted-foreground mt-1">Overview of all active classes and sections.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-green-200 bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" /> Create Class
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                Create New Class
              </DialogTitle>
              <DialogDescription>Add a new class section to the system.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Class Name *</FormLabel>
                        <FormControl><Input placeholder="e.g., Class 10-A" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GRADES.map(g => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="section"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SECTIONS.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="classTeacherId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Teacher</FormLabel>
                        <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={field.value ? String(field.value) : undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Assign teacher" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teachers?.map((t) => (
                              <SelectItem key={t.id} value={t.id.toString()}>{t.user.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="room"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room</FormLabel>
                        <FormControl><Input placeholder="e.g., Room 101" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createClassMutation.isPending} className="bg-green-600 hover:bg-green-700">
                    {createClassMutation.isPending ? "Creating..." : "Create Class"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardHeader className="pb-2">
            <CardDescription>Total Classes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-700">{classes?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardHeader className="pb-2">
            <CardDescription>Total Students</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700">{students?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardHeader className="pb-2">
            <CardDescription>Grades</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-700">{[...new Set(classes?.map(c => c.grade))].length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
          <CardHeader className="pb-2">
            <CardDescription>Avg. Class Size</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-700">
              {classes?.length ? Math.round((students?.length || 0) / classes.length) : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and View Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
        <div className="flex gap-2">
          <Button variant={viewMode === "cards" ? "default" : "outline"} size="sm" onClick={() => setViewMode("cards")}>
            <Layers className="h-4 w-4 mr-1" /> Cards
          </Button>
          <Button variant={viewMode === "table" ? "default" : "outline"} size="sm" onClick={() => setViewMode("table")}>
            <Users className="h-4 w-4 mr-1" /> Table
          </Button>
        </div>
      </div>

      {/* Classes Display */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading classes...</div>
      ) : viewMode === "cards" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses?.map((cls) => (
            <Card key={cls.id} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => setSelectedClass(cls)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-colors">
                    <BookOpen className="h-5 w-5 text-green-600 group-hover:text-white" />
                  </div>
                  <Badge variant="outline">Grade {cls.grade}</Badge>
                </div>
                <CardTitle className="mt-3">{cls.name}</CardTitle>
                <CardDescription>Section {cls.section}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span>{getStudentCount(cls.id)} students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate max-w-[100px]">{cls.classTeacher?.user?.name || "No teacher"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredClasses?.length === 0 && (
            <div className="col-span-3 text-center py-12 text-muted-foreground">No classes found.</div>
          )}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Students</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses?.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell className="font-medium">{cls.name}</TableCell>
                  <TableCell>{cls.grade}</TableCell>
                  <TableCell>{cls.section}</TableCell>
                  <TableCell>{cls.classTeacher?.user?.name || "-"}</TableCell>
                  <TableCell>{getStudentCount(cls.id)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedClass(cls)}>
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
