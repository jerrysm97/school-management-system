import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Course, LmsAssignment } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from "@/components/ui/accordion";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

// Icons (Color-coded logic applied below)
import {
    FileText, Video, HelpCircle, MessageSquare, Upload,
    MoreVertical, Plus, Trash2, Edit, GripVertical, Download
} from "lucide-react";

// --- Types ---
interface CourseSection { id: number; title: string; description: string | null; }
interface CourseModule { id: number; title: string; type: string; content: string | null; }

// --- Components ---

// 1. Module Item (The actual content row)
function ModuleItem({ module, isEditMode }: { module: CourseModule, isEditMode: boolean }) {
    const { toast } = useToast();

    // Moodle-style Color Coding
    // Blue = Resources (File, Page, URL, Video)
    // Pink = Assessment (Quiz, Assignment)
    // Red = Communication (Forum)
    const getIconStyle = (type: string) => {
        switch (type) {
            case 'quiz':
            case 'assignment': return "text-pink-600 bg-pink-50";
            case 'forum': return "text-red-600 bg-red-50";
            default: return "text-blue-600 bg-blue-50"; // Resources
        }
    };

    const Icon = {
        pdf: FileText,
        video: Video,
        quiz: HelpCircle,
        assignment: Upload,
        forum: MessageSquare
    }[module.type] || FileText;

    return (
        <div className="group flex items-center justify-between p-3 mb-2 bg-white border border-slate-100 rounded-lg hover:border-slate-300 transition-all shadow-sm">
            <div className="flex items-center gap-3">
                {isEditMode && <GripVertical className="h-5 w-5 text-slate-300 cursor-move" />}

                <div className={`p-2.5 rounded-lg ${getIconStyle(module.type)}`}>
                    <Icon className="h-5 w-5" />
                </div>

                <div>
                    <h4 className="text-sm font-medium text-slate-900 group-hover:text-primary transition-colors">
                        {module.title}
                    </h4>
                    <p className="text-xs text-slate-500 capitalize">{module.type}</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {isEditMode ? (
                    <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600">
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    // Student View Actions
                    module.type === 'assignment' ? (
                        <Button size="sm" variant="outline" className="h-8 text-xs border-pink-200 text-pink-700 hover:bg-pink-50">
                            Submit
                        </Button>
                    ) : (
                        <Button size="sm" variant="ghost" className="h-8 text-xs">View</Button>
                    )
                )}
            </div>
        </div>
    );
}

// 2. Section Item (The Weekly/Topic container)
function SectionItem({ section, isEditMode }: { section: CourseSection, isEditMode: boolean }) {
    const { data: modules } = useQuery<CourseModule[]>({
        queryKey: [`/api/lms/sections/${section.id}/modules`],
    });

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-800">{section.title}</h3>
                    {isEditMode && <Edit className="h-3 w-3 text-slate-400 cursor-pointer" />}
                </div>
                {isEditMode && (
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-dashed">
                        <Plus className="h-3 w-3" /> Add Activity
                    </Button>
                )}
            </div>

            {section.description && (
                <div className="text-sm text-slate-600 mb-4 px-1">{section.description}</div>
            )}

            <div className="space-y-2">
                {modules?.map(module => (
                    <ModuleItem key={module.id} module={module} isEditMode={isEditMode} />
                ))}
                {(!modules || modules.length === 0) && (
                    <div className="p-4 border-2 border-dashed border-slate-100 rounded-lg text-center text-sm text-slate-400">
                        No content in this section.
                    </div>
                )}
            </div>
        </div>
    );
}

// 3. Main Course View
export default function CourseView() {
    const params = useParams();
    const courseId = Number(params.id);
    const { user } = useAuth();

    // Permission Check: Can this user edit? (Admin or Teacher)
    const canEdit = user?.role === 'admin' || user?.role === 'main_admin' || user?.role === 'teacher';
    const [isEditMode, setIsEditMode] = useState(false);

    const { data: course } = useQuery<Course>({ queryKey: [`/api/lms/courses/${courseId}`] });
    const { data: sections } = useQuery<CourseSection[]>({
        queryKey: [`/api/lms/courses/${courseId}/sections`]
    });

    if (!course) return <div className="p-8">Loading...</div>;

    return (
        <div className="flex h-[calc(100vh-4rem)]">

            {/* Left: Course Index / Sidebar */}
            <aside className="w-64 border-r bg-slate-50 hidden lg:block overflow-y-auto">
                <div className="p-4">
                    <h3 className="font-semibold mb-4 text-sm text-slate-500 uppercase tracking-wider">Course Index</h3>
                    <div className="space-y-1">
                        {sections?.map((section) => (
                            <div key={section.id} className="text-sm p-2 rounded-md hover:bg-slate-200 cursor-pointer truncate text-slate-700">
                                {section.title}
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-6 md:p-10">

                    {/* Course Header */}
                    <div className="flex flex-col gap-6 mb-8 border-b pb-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <Badge variant="outline" className="mb-2 bg-blue-50 text-blue-700 border-blue-200">
                                    {course.code}
                                </Badge>
                                <h1 className="text-4xl font-bold text-slate-900">{course.fullName}</h1>
                            </div>

                            {/* Lecturer Edit Mode Switch */}
                            {canEdit && (
                                <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg border">
                                    <Label htmlFor="edit-mode" className="text-sm font-medium cursor-pointer">
                                        Edit Mode
                                    </Label>
                                    <Switch
                                        id="edit-mode"
                                        checked={isEditMode}
                                        onCheckedChange={setIsEditMode}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Course Tools Bar */}
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            <Button variant="outline" size="sm" className="gap-2">
                                <MessageSquare className="h-4 w-4 text-red-500" /> Announcements
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2">
                                <FileText className="h-4 w-4 text-blue-500" /> Gradebook
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Download className="h-4 w-4 text-green-500" /> Syllabus
                            </Button>
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div className="space-y-8">
                        {sections?.map(section => (
                            <SectionItem
                                key={section.id}
                                section={section}
                                isEditMode={isEditMode}
                            />
                        ))}

                        {/* Add Section Button (Only in Edit Mode) */}
                        {isEditMode && (
                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 cursor-pointer transition-colors">
                                <Plus className="h-8 w-8 mb-2" />
                                <span className="font-medium">Add New Topic / Week</span>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}