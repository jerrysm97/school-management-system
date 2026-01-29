import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { loginSchema, type LoginRequest } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { Redirect } from "wouter";

export default function AuthPage() {
  const { loginMutation, user } = useAuth();
  
  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  if (user) {
    return <Redirect to="/" />;
  }

  function onSubmit(values: LoginRequest) {
    loginMutation.mutate(values);
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-4 rounded-2xl">
                <GraduationCap className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Enter your credentials to access your dashboard
            </p>
          </div>

          <Card className="border-border/50 shadow-xl shadow-black/5">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Sign in</CardTitle>
              <CardDescription>
                Use your school assigned username
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="admin" {...field} className="h-11 bg-muted/50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="h-11 bg-muted/50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full h-11 text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <p className="px-8 text-center text-sm text-muted-foreground">
            Don't have an account? Contact your school administrator.
          </p>
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex relative bg-slate-900 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-purple-600/40 mix-blend-overlay" />
        <div className="relative z-10 p-12 text-white max-w-lg">
          <blockquote className="space-y-6">
            <p className="text-4xl font-display font-medium leading-tight">
              "Education is the most powerful weapon which you can use to change the world."
            </p>
            <footer className="text-lg text-white/80 font-medium">— Nelson Mandela</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
