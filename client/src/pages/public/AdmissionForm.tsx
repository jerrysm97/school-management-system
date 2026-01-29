import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, GraduationCap, ChevronRight, ChevronLeft } from "lucide-react";

// Multi-step form schema
const admissionSchema = z.object({
    firstName: z.string().min(2, "First name required"),
    lastName: z.string().min(2, "Last name required"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(10, "Phone number required"),
    dob: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date" }),
    address: z.string().min(5, "Address required"),
    // Step 2
    guardianName: z.string().optional(),
    guardianPhone: z.string().optional(),
    // Step 3
    previousSchool: z.string().optional(),
});

type AdmissionFormValues = z.infer<typeof admissionSchema>;

export default function AdmissionForm() {
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [credentials, setCredentials] = useState<{ username: string, password: string } | null>(null);

    const form = useForm<AdmissionFormValues>({
        resolver: zodResolver(admissionSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            address: "",
        },
    });

    const mutation = useMutation({
        mutationFn: async (data: AdmissionFormValues) => {
            const res = await fetch("/api/admissions/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error((await res.json()).message);
            return res.json();
        },
        onSuccess: (data) => {
            setSubmitted(true);
            setCredentials(data.tempCredentials);
            toast({ title: "Application Submitted", description: "Good luck!" });
        },
        onError: (error: Error) => {
            toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
        },
    });

    const onSubmit = (data: AdmissionFormValues) => {
        mutation.mutate(data);
    };

    if (submitted && credentials) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-lg shadow-xl border-green-200">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl text-green-800">Application Received!</CardTitle>
                        <CardDescription>
                            Your application has been submitted successfully (ID: Created).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-slate-100 p-4 rounded-md text-center">
                            <p className="font-semibold text-slate-700 mb-2">Temporary Applicant Portal Login</p>
                            <div className="text-sm font-mono bg-white p-2 rounded border">
                                <div>Username: {credentials.username}</div>
                                <div>Password: {credentials.password}</div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Save these credentials securely. You can use them to check your application status.
                            </p>
                        </div>
                        <Button className="w-full" onClick={() => window.location.href = '/auth'}>
                            Go to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex flex-col items-center justify-center p-4">
            <div className="mb-8 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <GraduationCap className="h-10 w-10 text-primary" />
                    <h1 className="text-4xl font-display font-bold text-primary">Nexus Academy</h1>
                </div>
                <p className="text-muted-foreground">Student Admission Application 2026</p>
            </div>

            <Card className="w-full max-w-2xl shadow-xl">
                <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`w-8 h-2 rounded-full ${step >= i ? 'bg-primary' : 'bg-slate-200'}`} />
                            ))}
                        </div>
                        <span className="text-sm text-muted-foreground">Step {step} of 3</span>
                    </div>
                    <CardTitle>
                        {step === 1 && "Personal Details"}
                        {step === 2 && "Guardian Information"}
                        {step === 3 && "Previous Education"}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            {step === 1 && (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField control={form.control} name="firstName" render={({ field }) => (
                                        <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="lastName" render={({ field }) => (
                                        <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="email" render={({ field }) => (
                                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="phone" render={({ field }) => (
                                        <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="dob" render={({ field }) => (
                                        <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="address" render={({ field }) => (
                                        <FormItem className="col-span-2"><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                            )}

                            {step === 2 && (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField control={form.control} name="guardianName" render={({ field }) => (
                                        <FormItem><FormLabel>Guardian Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="guardianPhone" render={({ field }) => (
                                        <FormItem><FormLabel>Guardian Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-4">
                                    <FormField control={form.control} name="previousSchool" render={({ field }) => (
                                        <FormItem><FormLabel>Previous School Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />

                                    <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-sm text-yellow-800">
                                        Note: Document upload will be available after initial registration in your applicant portal.
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between pt-4">
                                {step > 1 ? (
                                    <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)}>
                                        <ChevronLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>
                                ) : <div />}

                                {step < 3 ? (
                                    <Button type="button" onClick={() => setStep(s => s + 1)}>
                                        Next <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button type="submit" disabled={mutation.isPending}>
                                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Submit Application
                                    </Button>
                                )}
                            </div>

                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
