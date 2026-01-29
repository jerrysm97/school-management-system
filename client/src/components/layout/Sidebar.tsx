import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  CalendarCheck, 
  Banknote, 
  Settings, 
  LogOut,
  UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

const navItems = {
  admin: [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Students", href: "/students", icon: GraduationCap },
    { label: "Teachers", href: "/teachers", icon: Users },
    { label: "Classes", href: "/classes", icon: BookOpen },
    { label: "Fees", href: "/fees", icon: Banknote },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
  teacher: [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "My Classes", href: "/classes", icon: BookOpen },
    { label: "Attendance", href: "/attendance", icon: CalendarCheck },
  ],
  student: [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Timetable", href: "/timetable", icon: CalendarCheck },
  ],
  parent: [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
  ],
};

export function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const roleNav = navItems[user.role as keyof typeof navItems] || [];

  return (
    <div className="h-screen w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 shadow-2xl">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-primary/20 p-2 rounded-xl">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <h1 className="font-display font-bold text-xl tracking-tight">EduManage</h1>
      </div>

      <div className="flex-1 py-6 px-4 space-y-1">
        {roleNav.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer",
                  isActive 
                    ? "bg-primary text-white shadow-lg shadow-primary/25 font-medium" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-10 w-10 border border-slate-700">
            <AvatarFallback className="bg-slate-800 text-slate-200">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user.role}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full border-slate-700 text-slate-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50 justify-start"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
