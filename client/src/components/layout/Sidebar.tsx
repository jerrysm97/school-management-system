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
    { label: "Staff", href: "/hr/staff", icon: Users },
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
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-indigo-500" />
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Nexus
          </span>
        </h2>
        <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-medium">
          Institution Platform
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {items.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group cursor-pointer",
                  isActive
                    ? "bg-indigo-600/10 text-indigo-400 shadow-sm border border-indigo-500/20"
                    : "hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-white"
                  )}
                />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-10 w-10 border border-slate-700 shadow-sm">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} />
            <AvatarFallback className="bg-slate-800 text-slate-400">
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user.name || user.username}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={cn("h-2 w-2 rounded-full animate-pulse", roleInfo.color)} />
              <span className="text-xs text-slate-400 capitalize truncate">
                {roleInfo.label}
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30 border-slate-800"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen w-64 flex-col border-r border-slate-800 shadow-2xl bg-slate-900 shrink-0 z-20">
        <SidebarContent />
      </div>

      {/* Mobile Trigger & Sheet */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-slate-900 border-slate-800 text-white hover:bg-slate-800 shadow-lg">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-slate-900 border-slate-800 w-64 border-r-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
