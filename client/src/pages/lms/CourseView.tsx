import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
// Types are inferred or manually defined if missing from schema export
interface Course {
    id: number;
    fullName: string;
    code: string;
    summary: string | null;
}
interface CourseSection {
    id: number;
    title: string;
    description: string | null;
}
interface CourseModule {
    id: number;
    title: string;
    type: string;
    content: string | null;
}

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Loader2, FileText, Video, HelpCircle, ChevronLeft, Download,
    Upload, CheckCircle, Send
} from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

function ModuleItem({ module }: { module: CourseModule }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionContent, setSubmissionContent] = useState("");
    const [showSubmitDialog, setShowSubmitDialog] = useState(false);

    const iconMap: Record<string, any> = {
        pdf: FileText,
        video: Video,
        quiz: HelpCircle,
        assignment: FileText
    };
    const Icon = iconMap[module.type] || FileText;

    const handleSubmit = async () => {
        if (!submissionContent.trim()) {
            toast({ title: "Error", description: "Please enter your submission", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/lms/submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    moduleId: module.id,
                    studentId: user?.id, // Note: Should ideally be student detail ID not user ID
                    content: submissionContent,
                    submittedAt: new Date().toISOString()
                }),
            });

            if (!res.ok) throw new Error("Submission failed");

            toast({ title: "Success", description: "Assignment submitted successfully!" });
            setShowSubmitDialog(false);
            setSubmissionContent("");
        } catch (error) {
            toast({ title: "Error", description: "Failed to submit assignment", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-md border border-transparent hover:border-slate-200 transition-colors group">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded text-slate-500 group-hover:text-primary group-hover:bg-indigo-50 transition-colors">
                    <Icon className="h-4 w-4" />
                </div>
                <div>
                    <p className="text-sm font-medium">{module.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{module.type}</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {module.type === 'assignment' && user?.role === 'student' && (
                    <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                <Upload className="h-4 w-4 mr-1" /> Submit
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Submit Assignment: {module.title}</DialogTitle>
                                <DialogDescription>
                                    Enter your response or a link to your work (Git, Google Drive, etc.)
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Textarea
                                    placeholder="Write your submission content here..."
                                    className="min-h-[150px]"
                                    value={submissionContent}
                                    onChange={(e) => setSubmissionContent(e.target.value)}
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
                                <Button onClick={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                                    Submit Assignment
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                    {module.type === 'video' ? 'Watch' : 'View'}
                </Button>
            </div>
        </div>
    );
}

function SectionItem({ section }: { section: CourseSection }) {
    const { data: modules, isLoading } = useQuery<CourseModule[]>({
        queryKey: [`/api/lms/sections/${section.id}/modules`],
    });

    return (
        <AccordionItem value={`section-${section.id}`} className="border rounded-lg mb-2 px-2 bg-white">
            <AccordionTrigger className="hover:no-underline px-2">
                <div className="flex flex-col items-start text-left">
                    <span className="font-semibold text-lg">{section.title}</span>
                    {section.description && (
                        <span className="text-sm font-normal text-muted-foreground">{section.description}</span>
                    )}
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 px-2 space-y-1">
                {isLoading ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">Loading contents...</div>
                ) : modules && modules.length > 0 ? (
                    modules.map(module => <ModuleItem key={module.id} module={module} />)
                ) : (
                    <div className="py-4 text-center text-sm text-muted-foreground italic">No content yet</div>
                )}
            </AccordionContent>
        </AccordionItem>
    );
}

export default function CourseView() {
    const params = useParams();
    const courseId = Number(params.id);

    const { data: course, isLoading: loadingCourse } = useQuery<Course>({
        queryKey: [`/api/lms/courses/${courseId}`],
    });

    const { data: sections, isLoading: loadingSections } = useQuery<CourseSection[]>({
        queryKey: [`/api/lms/courses/${courseId}/sections`],
        enabled: !!courseId,
    });

    if (loadingCourse) {
        return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!course) {
        return <div className="p-8">Course not found</div>;
    }

    return (
        <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8">
            {/* Header */}
            <div className="space-y-4">
                <Link href="/lms">
                    <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
                    </Button>
                </Link>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-slate-900">{course.fullName}</h1>
                        <p className="text-lg text-slate-600 mt-1">{course.code} • 2024-2025</p>
                    </div>
                    <Button>Continue Learning</Button>
                </div>
                {course.summary && (
                    <div className="bg-white p-4 rounded-lg border text-slate-600 shadow-sm">
                        {course.summary}
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Main Content: Sections */}
                <div className="md:col-span-2 space-y-4">
                    <h2 className="text-xl font-semibold">Course Content</h2>
                    {loadingSections ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : sections && sections.length > 0 ? (
                        <Accordion type="multiple" className="w-full space-y-2">
                            {sections.map(section => (
                                <SectionItem key={section.id} section={section} />
                            ))}
                        </Accordion>
                    ) : (
                        <div className="text-center py-12 border rounded-lg bg-slate-50 border-dashed">
                            <p className="text-muted-foreground">This course has no sections yet.</p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Instructor</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <div className="font-semibold">Instructor Name</div>
                            <div className="text-muted-foreground">Department Head</div>
                            <Button variant="ghost" className="p-0 h-auto font-normal mt-2 hover:underline">Contact Instructor</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Course Tools</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            <Button variant="outline" className="justify-start w-full">
                                <Download className="mr-2 h-4 w-4" /> Syllabus
                            </Button>
                            <Button variant="outline" className="justify-start w-full">
                                <FileText className="mr-2 h-4 w-4" /> Grades
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
