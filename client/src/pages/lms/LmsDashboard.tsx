import { useQuery } from "@tanstack/react-query";
import { Course, LmsAssignment } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Calendar as CalendarIcon, Clock, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import { format, isPast, isToday, addDays, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Helper to sort assignments by due date
function getTimelineEvents(assignments: LmsAssignment[] = []) {
    const now = new Date();
    return assignments
        .filter(a => a.dueDate && new Date(a.dueDate) > now) // Only future/current
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
        .slice(0, 5); // Limit to next 5 tasks
}

export default function LmsDashboard() {
    const { data: courses, isLoading: loadingCourses } = useQuery<Course[]>({
        queryKey: ["/api/lms/courses"],
    });

    // In a real app, you would fetch all assignments for the student across all courses
    // For now, we simulate or fetch a specific endpoint if it exists
    const { data: timelineEvents, isLoading: loadingTimeline } = useQuery<LmsAssignment[]>({
        queryKey: ["/api/lms/assignments/upcoming"], // You might need to create this endpoint
        enabled: false // Disabled until endpoint exists, mock data below
    });

    // Mock Data for Visual Demonstration of the "Timeline" Feature
    const mockTimeline = [
        { id: 1, name: "Research Proposal", dueDate: addDays(new Date(), 1).toISOString(), courseName: "Research Methods" },
        { id: 2, name: "Mid-Term Quiz", dueDate: addDays(new Date(), 3).toISOString(), courseName: "Computer Science 101" },
    ];

    return (
        <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                    <p className="text-slate-500">Welcome back. You have <span className="font-semibold text-primary">{mockTimeline.length} pending tasks</span> this week.</p>
                </div>
                <Link href="/lms/courses/create">
                    {/* Only visible if admin/teacher via RBAC check in real app */}
                    <Button className="shadow-sm">Create New Course</Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Center Column: Course Overviews */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-indigo-600" />
                            Course Overview
                        </h2>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="cursor-pointer hover:bg-slate-100">All</Badge>
                            <Badge variant="outline" className="cursor-pointer hover:bg-slate-100">In Progress</Badge>
                            <Badge variant="outline" className="cursor-pointer hover:bg-slate-100">Starred</Badge>
                        </div>
                    </div>

                    {loadingCourses ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {courses?.map((course) => (
                                <Link key={course.id} href={`/lms/course/${course.id}`}>
                                    <div className="group relative bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col">
                                        {/* Course Image Pattern */}
                                        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                            <div className="absolute bottom-4 left-4 text-white font-bold text-lg drop-shadow-md">
                                                {course.code}
                                            </div>
                                        </div>

                                        <div className="p-5 flex-1 flex flex-col">
                                            <h3 className="font-semibold text-lg text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                                                {course.fullName}
                                            </h3>
                                            <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                                                {course.summary || "No description provided for this course."}
                                            </p>

                                            {/* Progress Bar Simulation */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs text-slate-500">
                                                    <span>Progress</span>
                                                    <span>0%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 w-[0%]" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Sidebar: Timeline & Calendar */}
                <div className="space-y-6">
                    {/* Timeline Block */}
                    <Card className="border-l-4 border-l-orange-500 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Clock className="h-5 w-5 text-orange-600" />
                                Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-0 relative">
                                {mockTimeline.map((event, idx) => (
                                    <div key={event.id} className="flex gap-3 pb-6 last:pb-0 relative">
                                        {/* Connector Line */}
                                        {idx !== mockTimeline.length - 1 && (
                                            <div className="absolute left-[11px] top-6 bottom-0 w-px bg-slate-200" />
                                        )}

                                        <div className="relative z-10 mt-1">
                                            <div className="h-6 w-6 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center">
                                                <AlertCircle className="h-3 w-3 text-orange-600" />
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-800">{event.name}</h4>
                                            <p className="text-xs text-slate-500">{event.courseName}</p>
                                            <p className="text-xs font-medium text-orange-600 mt-0.5">
                                                Due {format(parseISO(event.dueDate), "EEE, MMM d, h:mm a")}
                                            </p>
                                        </div>
                                        <div className="ml-auto">
                                            <Button size="sm" variant="outline" className="h-7 text-xs px-2">Submit</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Calendar Block */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <CalendarIcon className="h-5 w-5 text-slate-600" />
                                Calendar
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Visual Placeholder for Calendar Widget */}
                            <div className="bg-slate-50 rounded-md p-4 text-center border border-dashed border-slate-200">
                                <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 mb-2">
                                    <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                                </div>
                                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                                    {Array.from({ length: 30 }).map((_, i) => (
                                        <div key={i} className={`p-1 rounded-full ${i === 15 ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 cursor-pointer'}`}>
                                            {i + 1}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Button variant="ghost" className="w-full text-xs mt-2 h-auto p-0 text-slate-500">
                                Go to full calendar...
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}