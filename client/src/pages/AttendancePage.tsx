import { useState, useMemo } from "react";
import { useClasses } from "@/hooks/use-classes";
import { useStudents } from "@/hooks/use-students";
import { useMarkAttendance } from "@/hooks/use-attendance";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  CalendarCheck, Save, CheckCircle, XCircle, Clock, AlertCircle,
  Users, TrendingUp, Calendar
} from "lucide-react";

export default function AttendancePage() {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [attendanceState, setAttendanceState] = useState<Record<string, "present" | "absent" | "late" | "excused">>({});

  const { data: classes } = useClasses();
  const { data: students, isLoading: isLoadingStudents } = useStudents(selectedClassId ? selectedClassId : undefined);
  const markAttendanceMutation = useMarkAttendance();

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: status as any
    }));
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSave = () => {
    if (!students) return;

    const payload = students.map(student => ({
      studentId: student.id,
      date,
      status: attendanceState[student.id] || "present"
    }));

    markAttendanceMutation.mutate(payload, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Attendance marked successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to mark attendance",
          variant: "destructive",
        });
      }
    });
  };

  // Quick stats
  const stats = useMemo(() => {
    if (!students) return { present: 0, absent: 0, late: 0, total: 0 };
    const total = students.length;
    const present = students.filter(s => (attendanceState[s.id] || "present") === "present").length;
    const absent = students.filter(s => attendanceState[s.id] === "absent").length;
    const late = students.filter(s => attendanceState[s.id] === "late").length;
    return { present, absent, late, total };
  }, [students, attendanceState]);

  const attendanceRate = stats.total ? Math.round((stats.present / stats.total) * 100) : 0;

  // Mark all quick actions
  const markAll = (status: "present" | "absent" | "late") => {
    if (!students) return;
    const newState: Record<string, typeof status> = {};
    students.forEach(s => { newState[s.id] = status; });
    setAttendanceState(newState);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
            <CalendarCheck className="h-8 w-8 text-orange-600" />
            Attendance Management
          </h1>
          <p className="text-muted-foreground mt-1">Mark and track daily attendance for classes.</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Present
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-700">{stats.present}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Absent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-700">{stats.absent}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Late
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-700">{stats.late}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Attendance Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700">{attendanceRate}%</p>
            <Progress value={attendanceRate} className="h-1 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Selection Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Select Class & Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {students ? `${students.length} students` : "Select class"}
            </div>

            {selectedClassId && students && students.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => markAll("present")} className="text-green-600 border-green-200 hover:bg-green-50">
                  All Present
                </Button>
                <Button variant="outline" size="sm" onClick={() => markAll("absent")} className="text-red-600 border-red-200 hover:bg-red-50">
                  All Absent
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      {selectedClassId && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-orange-600" />
                  Mark Attendance
                </CardTitle>
                <CardDescription>
                  {classes?.find(c => c.id.toString() === selectedClassId)?.name} • {format(new Date(date), "MMMM d, yyyy")}
                </CardDescription>
              </div>
              <Button
                onClick={handleSave}
                disabled={markAttendanceMutation.isPending || !students?.length}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {markAttendanceMutation.isPending ? "Saving..." : "Save Attendance"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Roll No.</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingStudents ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">Loading students...</TableCell>
                  </TableRow>
                ) : students?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No students in this class.</TableCell>
                  </TableRow>
                ) : students?.map((student, idx) => (
                  <TableRow key={student.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {student.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{student.user.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{student.admissionNo}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RadioGroup
                        value={attendanceState[student.id] || "present"}
                        onValueChange={(val) => handleStatusChange(student.id, val)}
                        className="flex justify-center gap-4"
                      >
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="present" id={`p-${student.id}`} className="text-green-600 border-green-600 data-[state=checked]:bg-green-600" />
                          <Label htmlFor={`p-${student.id}`} className="text-xs font-medium cursor-pointer">
                            <Badge variant="outline" className={`${(attendanceState[student.id] || "present") === "present" ? "bg-green-100 text-green-700 border-green-300" : ""}`}>
                              Present
                            </Badge>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="absent" id={`a-${student.id}`} className="text-red-600 border-red-600 data-[state=checked]:bg-red-600" />
                          <Label htmlFor={`a-${student.id}`} className="text-xs font-medium cursor-pointer">
                            <Badge variant="outline" className={`${attendanceState[student.id] === "absent" ? "bg-red-100 text-red-700 border-red-300" : ""}`}>
                              Absent
                            </Badge>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="late" id={`l-${student.id}`} className="text-orange-600 border-orange-600 data-[state=checked]:bg-orange-600" />
                          <Label htmlFor={`l-${student.id}`} className="text-xs font-medium cursor-pointer">
                            <Badge variant="outline" className={`${attendanceState[student.id] === "late" ? "bg-orange-100 text-orange-700 border-orange-300" : ""}`}>
                              Late
                            </Badge>
                          </Label>
                        </div>
                      </RadioGroup>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!selectedClassId && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
              <CalendarCheck className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-lg">Select a Class</h3>
            <p className="text-muted-foreground mt-1">Choose a class from the dropdown above to mark attendance.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
