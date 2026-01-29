import { useState } from "react";
import { useClasses } from "@/hooks/use-classes";
import { useStudents } from "@/hooks/use-students";
import { useMarkAttendance } from "@/hooks/use-attendance";
import { format } from "date-fns";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CalendarCheck, Save } from "lucide-react";

export default function AttendancePage() {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  
  // Local state for attendance marking
  // Map<studentId, status>
  const [attendanceState, setAttendanceState] = useState<Record<number, "present" | "absent" | "late" | "excused">>({});

  const { data: classes } = useClasses();
  const { data: students, isLoading: isLoadingStudents } = useStudents(selectedClassId ? Number(selectedClassId) : undefined);
  const markAttendanceMutation = useMarkAttendance();

  const handleStatusChange = (studentId: number, status: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: status as any
    }));
  };

  const handleSave = () => {
    if (!students) return;
    
    const payload = students.map(student => ({
      studentId: student.id,
      date,
      status: attendanceState[student.id] || "present" // Default to present
    }));

    markAttendanceMutation.mutate(payload);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Attendance</h1>
        <p className="text-muted-foreground mt-1">Mark daily attendance for classes.</p>
      </div>

      <div className="bg-card p-6 rounded-xl border shadow-sm grid md:grid-cols-3 gap-6 items-end">
        <div className="space-y-2">
          <Label>Select Class</Label>
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

        <div className="text-sm text-muted-foreground md:pb-3">
          {students ? `${students.length} students found` : "Select a class to load list"}
        </div>
      </div>

      {selectedClassId && (
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 bg-muted/30 border-b flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" />
              Mark Attendance
            </h3>
            <Button onClick={handleSave} disabled={markAttendanceMutation.isPending || !students?.length}>
              <Save className="mr-2 h-4 w-4" />
              {markAttendanceMutation.isPending ? "Saving..." : "Save Attendance"}
            </Button>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admission No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingStudents ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">Loading students...</TableCell>
                </TableRow>
              ) : students?.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-mono text-xs">{student.admissionNo}</TableCell>
                  <TableCell className="font-medium">{student.user.name}</TableCell>
                  <TableCell>
                    <RadioGroup 
                      defaultValue="present" 
                      value={attendanceState[student.id] || "present"}
                      onValueChange={(val) => handleStatusChange(student.id, val)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="present" id={`p-${student.id}`} className="text-green-600 border-green-600" />
                        <Label htmlFor={`p-${student.id}`} className="text-green-700 font-medium">Present</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="absent" id={`a-${student.id}`} className="text-red-600 border-red-600" />
                        <Label htmlFor={`a-${student.id}`} className="text-red-700 font-medium">Absent</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="late" id={`l-${student.id}`} className="text-orange-600 border-orange-600" />
                        <Label htmlFor={`l-${student.id}`} className="text-orange-700 font-medium">Late</Label>
                      </div>
                    </RadioGroup>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
