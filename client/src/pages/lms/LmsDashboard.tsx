import { useQuery } from "@tanstack/react-query";
import { Course } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Calendar, BookOpen, Clock, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export default function LmsDashboard() {
    const { data: courses, isLoading } = useQuery<Course[]>({
        queryKey: ["/api/lms/courses"],
    });

    if (isLoading) {
        return <div className="p-8">Loading LMS...</div>;
    }

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">LMS Dashboard</h1>
                    <p className="text-muted-foreground">Welcome to your learning space.</p>
                </div>
                <Link href="/lms/courses/create">
                    <Button>Create Course (Admin)</Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Content - Courses */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">My Courses</h2>
                        <Button variant="ghost" size="sm">View All</Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {courses?.map((course) => (
                            <Card key={course.id} className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex justify-between items-start">
                                        <Link href={`/lms/course/${course.id}`} className="hover:underline">
                                            {course.fullName}
                                        </Link>
                                        <span className="text-xs font-normal bg-muted px-2 py-1 rounded text-muted-foreground">
                                            {course.code}
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                        {course.summary || "No description available."}
                                    </p>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <BookOpen className="h-4 w-4" />
                                            <span>Sections</span>
                                        </div>
                                        <Link href={`/lms/course/${course.id}`}>
                                            <Button variant="outline" size="sm" className="h-8">
                                                Enter <ChevronRight className="h-3 w-3 ml-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {courses?.length === 0 && (
                            <div className="col-span-2 text-center py-12 border rounded-lg bg-muted/10 border-dashed">
                                <p className="text-muted-foreground">No courses found. Ask an admin to create one.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar - Timeline */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" /> Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="border-l-2 border-muted pl-4 py-1 relative">
                                    <div className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-primary" />
                                    <p className="text-sm font-medium">Assignment 1 Due</p>
                                    <p className="text-xs text-muted-foreground">Math 101 • Tomorrow</p>
                                </div>
                                <div className="border-l-2 border-muted pl-4 py-1 relative">
                                    <div className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-muted-foreground" />
                                    <p className="text-sm font-medium">Weekly Quiz</p>
                                    <p className="text-xs text-muted-foreground">Science 101 • Friday</p>
                                </div>
                                {/* Empty State Mock */}
                                <p className="text-xs text-muted-foreground pt-2">No more upcoming events.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" /> Calendar
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-4 text-muted-foreground text-sm">
                                Calendar Widget Placeholder
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
