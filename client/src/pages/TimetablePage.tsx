import { useState } from "react";
import { useTimetable, useCreateTimetableSlot, useDeleteTimetableSlot } from "@/hooks/use-timetable";
import { useClasses } from "@/hooks/use-classes";
import { useSubjects } from "@/hooks/use-subjects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Trash2, Clock, Calendar, BookOpen, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_COLORS = ["", "bg-blue-50 border-blue-200", "bg-green-50 border-green-200", "bg-purple-50 border-purple-200", "bg-orange-50 border-orange-200", "bg-pink-50 border-pink-200", "bg-cyan-50 border-cyan-200", "bg-gray-50 border-gray-200"];
const DAY_TEXT_COLORS = ["", "text-blue-700", "text-green-700", "text-purple-700", "text-orange-700", "text-pink-700", "text-cyan-700", "text-gray-700"];

const createSlotSchema = z.object({
    classId: z.coerce.number().min(1, "Select a class"),
    subjectId: z.string().min(1, "Subject required"),
    dayOfWeek: z.coerce.number().min(1).max(7),
    startTime: z.string().min(1, "Start time required"),
    endTime: z.string().min(1, "End time required"),
    room: z.string().optional(),
});

const SUBJECTS = []; // Legacy placeholder, now using API

export default function TimetablePage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState<number | undefined>(undefined);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const { toast } = useToast();

    const { data: classes } = useClasses();
    const { data: subjects } = useSubjects();
    const { data: timetable, isLoading } = useTimetable(selectedClassId);
    const createSlotMutation = useCreateTimetableSlot();
    const deleteSlotMutation = useDeleteTimetableSlot();

    const form = useForm({
        resolver: zodResolver(createSlotSchema),
        defaultValues: {
            classId: 0,
            subjectId: "",
            dayOfWeek: 1,
            startTime: "08:00",
            endTime: "09:00",
            room: "",
        },
    });

    function onSubmit(data: z.infer<typeof createSlotSchema>) {
        // Map to API format
        createSlotMutation.mutate({
            classId: data.classId,
            subjectId: data.subjectId,
            dayOfWeek: data.dayOfWeek,
            startTime: data.startTime,
            endTime: data.endTime,
        } as any, {
            onSuccess: () => {
                toast({ title: "Slot added successfully" });
                setIsDialogOpen(false);
                form.reset();
            },
            onError: (err) => {
                toast({ title: "Error", description: err.message, variant: "destructive" });
            },
        });
    }

    function handleDelete(id: number) {
        deleteSlotMutation.mutate(id, {
            onSuccess: () => toast({ title: "Slot deleted" }),
            onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
        });
    }

    // Group timetable by day of week
    const groupedByDay: Record<number, any[]> = {};
    timetable?.forEach((slot: any) => {
        if (!groupedByDay[slot.dayOfWeek]) groupedByDay[slot.dayOfWeek] = [];
        groupedByDay[slot.dayOfWeek].push(slot);
    });

    // Stats
    const totalSlots = timetable?.length || 0;
    const daysWithClasses = Object.keys(groupedByDay).length;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
                        <Clock className="h-8 w-8 text-cyan-600" />
                        Timetable Management
                    </h1>
                    <p className="text-muted-foreground mt-1">View and manage weekly class schedules.</p>
                </div>
                <div className="flex gap-2">
                    <Select onValueChange={(val) => setSelectedClassId(Number(val) || undefined)}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="All Classes" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">All Classes</SelectItem>
                            {classes?.map((c: any) => (
                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-cyan-600 hover:bg-cyan-700">
                                <Plus className="mr-2 h-4 w-4" /> Add Slot
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-cyan-600" />
                                    Add Timetable Slot
                                </DialogTitle>
                                <DialogDescription>Schedule a class period for the week.</DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                            name="subjectId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Subject *</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select Subject" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {subjects?.map((s: any) => (
                                                                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
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
                                        name="dayOfWeek"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Day *</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Day" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                                                            <SelectItem key={d} value={d.toString()}>{DAYS[d]}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="startTime"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Start Time *</FormLabel>
                                                    <FormControl><Input type="time" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="endTime"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>End Time *</FormLabel>
                                                    <FormControl><Input type="time" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="room"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Room (Optional)</FormLabel>
                                                <FormControl><Input placeholder="e.g., Room 101" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700" disabled={createSlotMutation.isPending}>
                                        {createSlotMutation.isPending ? "Adding..." : "Add Slot"}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 border-cyan-200">
                    <CardHeader className="pb-2">
                        <CardDescription>Total Slots</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-cyan-700">{totalSlots}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardDescription>Active Days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-blue-700">{daysWithClasses}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                    <CardHeader className="pb-2">
                        <CardDescription>Classes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-green-700">{classes?.length || 0}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                    <CardHeader className="pb-2">
                        <CardDescription>Avg. Per Day</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-purple-700">{daysWithClasses ? Math.round(totalSlots / daysWithClasses) : 0}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Weekly Grid View */}
            {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading timetable...</div>
            ) : timetable?.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center mb-4">
                            <Calendar className="h-6 w-6 text-cyan-600" />
                        </div>
                        <h3 className="font-semibold text-lg">No Timetable Slots</h3>
                        <p className="text-muted-foreground mt-1">Add slots to create a schedule.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {[1, 2, 3, 4, 5].map((day) => {
                        const slots = groupedByDay[day] || [];
                        return (
                            <Card key={day} className={`${DAY_COLORS[day]} transition-all hover:shadow-md`}>
                                <CardHeader className="pb-3">
                                    <CardTitle className={`flex items-center gap-2 ${DAY_TEXT_COLORS[day]}`}>
                                        <Calendar className="h-4 w-4" />
                                        {DAYS[day]}
                                    </CardTitle>
                                    <CardDescription>{slots.length} period{slots.length !== 1 ? 's' : ''}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {slots.length === 0 ? (
                                        <div className="text-center py-4 text-muted-foreground text-sm">
                                            No classes
                                        </div>
                                    ) : (
                                        slots.sort((a: any, b: any) => a.startTime.localeCompare(b.startTime)).map((slot: any) => (
                                            <div key={slot.id} className="bg-white rounded-lg p-3 border shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between mb-2">
                                                    <Badge variant="outline" className="text-xs font-mono">
                                                        {slot.startTime} - {slot.endTime}
                                                    </Badge>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-red-50" onClick={() => handleDelete(slot.id)}>
                                                        <Trash2 className="h-3 w-3 text-red-500" />
                                                    </Button>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-sm font-medium truncate">
                                                        {classes?.find(c => c.id === slot.classId)?.name || "Class"}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Weekend Section */}
            {(groupedByDay[6]?.length > 0 || groupedByDay[7]?.length > 0) && (
                <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        Weekend Classes
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        {[6, 7].map((day) => {
                            const slots = groupedByDay[day] || [];
                            if (slots.length === 0) return null;
                            return (
                                <Card key={day} className={DAY_COLORS[day]}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className={`text-sm ${DAY_TEXT_COLORS[day]}`}>{DAYS[day]}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-wrap gap-2">
                                        {slots.map((slot: any) => (
                                            <Badge key={slot.id} variant="secondary">
                                                {slot.startTime} - {slot.endTime}
                                            </Badge>
                                        ))}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
