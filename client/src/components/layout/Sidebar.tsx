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
  UserCircle,
  ClipboardCheck,
  Clock,
  ShieldCheck,
  Calculator,
  FileText,
  Library,
  UserPlus,
  Menu,
  Check,
  Calendar,
  History,
  Building2,
  Bus
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Role-based navigation configuration based on RBAC hierarchy
const navItems = {
  // Level 0: Main Admin - Full access
  main_admin: [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "User Management", href: "/users", icon: UserCircle },
    { label: "LMS", href: "/lms", icon: Library },
    { label: "Financial Control", href: "/finance/dashboard", icon: Banknote },
    { label: "Fee Structures", href: "/finance/fee-structures", icon: FileText },
    { label: "Fee Overview", href: "/finance/fee-assignment", icon: Check },
    { label: "Payment Plans", href: "/finance/payment-plans", icon: Calendar },
    { label: "Scholarships", href: "/finance/scholarships", icon: GraduationCap },
    { label: "Student Ledger", href: "/finance/student-ledger", icon: FileText },
    { label: "Students", href: "/students", icon: GraduationCap },
    { label: "Teachers", href: "/teachers", icon: Users },
    { label: "Classes", href: "/classes", icon: BookOpen },
    { label: "Attendance", href: "/attendance", icon: ClipboardCheck },
    { label: "Timetable", href: "/timetable", icon: Clock },
    { label: "Exams", href: "/exams", icon: CalendarCheck },
    { label: "Recruitment", href: "/hr/recruitment", icon: UserPlus },
    { label: "Admissions", href: "/admissions/dashboard", icon: UserPlus },
    { label: "Hostel", href: "/campus/hostel", icon: Building2 },
    { label: "Transport", href: "/campus/transport", icon: Bus },
    { label: "Library", href: "/library", icon: BookOpen },
    { label: "Leave Mgmt", href: "/hr/leave", icon: Calendar },
    { label: "Staff", href: "/hr/staff", icon: Users },
    { label: "Fees", href: "/fees", icon: Banknote },
    { label: "Audit Trail", href: "/audit-logs", icon: History },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
  // Legacy 'admin' maps to main_admin
  admin: [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Fee Structures", href: "/finance/fee-structures", icon: Banknote },
    { label: "Fee Overview", href: "/finance/fee-assignment", icon: Check },
    { label: "Payment Plans", href: "/finance/payment-plans", icon: Calendar },
    { label: "Scholarships", href: "/finance/scholarships", icon: GraduationCap },
    { label: "Students", href: "/students", icon: GraduationCap },
    { label: "Teachers", href: "/teachers", icon: Users },
    { label: "Classes", href: "/classes", icon: BookOpen },
    { label: "Attendance", href: "/attendance", icon: ClipboardCheck },
    { label: "Timetable", href: "/timetable", icon: Clock },
    { label: "Exams", href: "/exams", icon: CalendarCheck },
    { label: "Fees", href: "/fees", icon: Banknote },
    { label: "Hostel", href: "/campus/hostel", icon: Building2 },
    { label: "Transport", href: "/campus/transport", icon: Bus },
    { label: "Library", href: "/library", icon: BookOpen },
    { label: "Leave Mgmt", href: "/hr/leave", icon: Calendar },
    { label: "Audit Trail", href: "/audit-logs", icon: History },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
  // Level 1: Principal - Institutional oversight
  principal: [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "LMS", href: "/lms", icon: Library },
    { label: "Financial Control", href: "/finance/dashboard", icon: Banknote },
    { label: "Fee Structures", href: "/finance/fee-structures", icon: Banknote },
    { label: "Fee Overview", href: "/finance/fee-assignment", icon: Banknote },
    { label: "Payment Plans", href: "/finance/payment-plans", icon: Banknote },
    { label: "Scholarships", href: "/finance/scholarships", icon: GraduationCap },
    { label: "Students", href: "/students", icon: GraduationCap },
    { label: "Teachers", href: "/teachers", icon: Users },
    { label: "Classes", href: "/classes", icon: BookOpen },
    { label: "Timetable", href: "/timetable", icon: Clock },
    { label: "Exams", href: "/exams", icon: CalendarCheck },
    { label: "Recruitment", href: "/hr/recruitment", icon: UserPlus },
    { label: "Leave Mgmt", href: "/hr/leave", icon: Calendar },
    { label: "Staff", href: "/hr/staff", icon: Users },
    { label: "Hostel", href: "/campus/hostel", icon: Building2 },
    { label: "Transport", href: "/campus/transport", icon: Bus },
    { label: "Library", href: "/library", icon: BookOpen },
    { label: "Reports", href: "/reports", icon: FileText },
  ],
  // Level 2: Accountant - Financial access
  accountant: [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Financial Control", href: "/finance/dashboard", icon: Banknote },
    { label: "Fee Structures", href: "/finance/fee-structures", icon: Banknote },
    { label: "Fee Overview", href: "/finance/fee-assignment", icon: Check },
    { label: "Payment Plans", href: "/finance/payment-plans", icon: Calendar },
    { label: "Scholarships", href: "/finance/scholarships", icon: GraduationCap },
    { label: "Students", href: "/students", icon: GraduationCap },
    { label: "Fees", href: "/fees", icon: Banknote },
    { label: "Student Ledger", href: "/finance/student-ledger", icon: FileText },
    { label: "Reports", href: "/reports", icon: FileText },
  ],
  // Level 2: Teacher - Academic access
  teacher: [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "LMS", href: "/lms", icon: Library },
    { label: "My Classes", href: "/classes", icon: BookOpen },
    { label: "Attendance", href: "/attendance", icon: ClipboardCheck },
    { label: "Exams", href: "/exams", icon: CalendarCheck },
    { label: "Timetable", href: "/timetable", icon: Clock },
  ],
  // Level 1: Student - Self-service
  student: [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "LMS", href: "/lms", icon: Library },
    { label: "My Schedule", href: "/timetable", icon: Clock },
    { label: "My Grades", href: "/exams", icon: CalendarCheck },
    { label: "My Fees", href: "/fees", icon: Banknote },
  ],
  // Level 3: Parent - Read-only
  parent: [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Child Info", href: "/students", icon: GraduationCap },
    { label: "Attendance", href: "/attendance", icon: ClipboardCheck },
    { label: "Fees", href: "/fees", icon: Banknote },
  ],
};

// Role display configuration
const roleConfig: Record<string, { label: string; color: string }> = {
  main_admin: { label: "Main Admin", color: "bg-red-500" },
  admin: { label: "Admin", color: "bg-red-500" },
  principal: { label: "Principal", color: "bg-purple-500" },
  accountant: { label: "Accountant", color: "bg-green-500" },
  teacher: { label: "Teacher", color: "bg-blue-500" },
  student: { label: "Student", color: "bg-cyan-500" },
  parent: { label: "Parent", color: "bg-gray-500" },
};

export function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const role = user.role as keyof typeof navItems;
  // Fallback to student if role not found, or handle error
  const items = navItems[role] || navItems.student;
  const roleInfo = roleConfig[role] || { label: role, color: "bg-gray-500" };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-[hsl(225,35%,8%)] to-[hsl(225,35%,12%)] text-sidebar-foreground border-r border-[#ffffff0a] relative overflow-hidden">
      {/* Decorative Glow Effects */}
      <div className="absolute top-0 left-0 w-full h-32 bg-primary/20 blur-3xl rounded-full translate-y-[-50%] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-full h-32 bg-accent/20 blur-3xl rounded-full translate-y-[50%] pointer-events-none" />

      {/* Header */}
      <div className="p-6 border-b border-[#ffffff0a] relative z-10">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-xl shadow-lg shadow-primary/25">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Nexus
          </span>
        </h2>
        <p className="text-xs text-muted-foreground mt-2 pl-1 font-medium tracking-wider uppercase opacity-70">
          Institution Platform
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 relative z-10 scrollbar-none">
        {items.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer relative overflow-hidden",
                  isActive
                    ? "text-white font-medium"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent border-l-2 border-primary" />
                )}

                <item.icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-300 relative z-10",
                    isActive ? "text-primary scale-110" : "text-muted-foreground group-hover:text-white"
                  )}
                />
                <span className="relative z-10">{item.label}</span>

                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-[#ffffff0a] bg-black/20 backdrop-blur-md relative z-10">
        <div className="glass-panel rounded-xl p-3 mb-3 border border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-white/10 shadow-inner ring-2 ring-white/5">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-none">
                {user.name || user.username}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 border-0 bg-opacity-20", roleInfo.color.replace('bg-', 'bg-').replace('500', '500/20 text-white'))}>
                  {roleInfo.label}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 h-9 px-2"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="mr-2 h-4 w-4 opacity-70" />
          <span className="text-sm">Sign Out</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen w-[280px] flex-col shadow-2xl shrink-0 z-50 transition-all duration-300">
        <SidebarContent />
      </div>

      {/* Mobile Trigger & Sheet */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="glass-button bg-black/40 border-white/10 text-white hover:bg-black/60 shadow-lg backdrop-blur-md">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-r-0 w-[280px] bg-transparent shadow-2xl">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
