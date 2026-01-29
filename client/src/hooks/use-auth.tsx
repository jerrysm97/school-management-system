import { createContext, ReactNode, useContext, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type User } from "@shared/schema";
import { api, loginSchema } from "@shared/routes";
import { z } from "zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: any;
  logoutMutation: any;
  changePasswordMutation: any; // <--- Added
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: user, error, isLoading } = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(api.auth.me.path, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return await res.json();
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: z.infer<typeof loginSchema>) => {
      const res = await fetch(api.auth.login.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!res.ok) {
        throw new Error("Invalid credentials");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      queryClient.setQueryData([api.auth.me.path], data.user);
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${data.user.name}`,
      });

      // Redirect based on forced password change
      if (data.user.mustChangePassword) {
        setLocation("/change-password");
      } else {
        setLocation("/");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to change password");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Password updated! Please login again." });
      // Logout logic to force re-login
      localStorage.removeItem("token");
      queryClient.setQueryData([api.auth.me.path], null);
      setLocation("/auth");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      localStorage.removeItem("token");
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null);
      setLocation("/auth");
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error: error as Error | null,
        loginMutation,
        logoutMutation,
        changePasswordMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}