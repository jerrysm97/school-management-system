import { useClasses, useCreateClass } from "@/hooks/use-classes";
import { useTeachers } from "@/hooks/use-teachers";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, Users } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClassSchema } from "@shared/schema";

export default function ClassesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: classes, isLoading } = useClasses();
  const { data: teachers } = useTeachers();
  const createClassMutation = useCreateClass();

  const form = useForm({
    resolver: zodResolver(insertClassSchema),
    defaultValues: {
      name: "",
      grade: "",
      section: "",
      classTeacherId: undefined
    }
  });

  function onSubmit(data: any) {
    // Ensure classTeacherId is number or undefined
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

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Classes</h1>
          <p className="text-muted-foreground mt-1">Overview of all active classes and sections.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> Create Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>Add a new class section to the system.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Name</FormLabel>
                      <FormControl><Input placeholder="e.g. 10A" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade</FormLabel>
                        <FormControl><Input placeholder="10" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="section"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section</FormLabel>
                        <FormControl><Input placeholder="A" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="classTeacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Teacher</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Teacher" />
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
                <Button type="submit" className="w-full" disabled={createClassMutation.isPending}>
                  {createClassMutation.isPending ? "Creating..." : "Create Class"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div>Loading classes...</div>
        ) : classes?.map((cls) => (
          <Card key={cls.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary group">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-2xl font-display">{cls.name}</CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                  <BookOpen className="h-4 w-4" />
                </div>
              </div>
              <CardDescription>
                Grade {cls.grade} • Section {cls.section}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                <Users className="h-4 w-4" />
                <span>Teacher: {cls.classTeacher?.user.name || "Unassigned"}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
