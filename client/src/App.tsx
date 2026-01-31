import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/Sidebar";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import StudentsPage from "@/pages/StudentsPage";
import TeachersPage from "@/pages/TeachersPage";
import ClassesPage from "@/pages/ClassesPage";
import AttendancePage from "@/pages/AttendancePage";
import ChangePasswordPage from "@/pages/ChangePasswordPage";
import FeesPage from "@/pages/FeesPage";
import ExamsPage from "@/pages/ExamsPage";
import TimetablePage from "@/pages/TimetablePage";
import SettingsPage from "@/pages/SettingsPage";
import UsersPage from "@/pages/UsersPage";
import FinanceDashboard from "@/pages/finance/FinanceDashboard";
import IncomePage from "@/pages/finance/IncomePage";
import ExpensesPage from "@/pages/finance/ExpensesPage";
import PaymentsPage from "@/pages/finance/PaymentsPage";
import AssetsPage from "@/pages/finance/AssetsPage";
import BudgetPage from "@/pages/finance/BudgetPage";
import StudentLedgerPage from "@/pages/finance/StudentLedgerPage";
import GLManagement from "@/pages/finance/GLManagement";
import DonorManagementPage from "@/pages/finance/DonorManagementPage";
import EndowmentManagementPage from "@/pages/finance/EndowmentManagementPage";
import PayrollTimesheetsPage from "@/pages/finance/PayrollTimesheetsPage";
import FeeStructuresPage from "@/pages/finance/FeeStructuresPage";
import FeeAssignmentPage from "@/pages/finance/FeeAssignmentPage";
import PaymentPlansPage from "@/pages/finance/PaymentPlansPage";
import ScholarshipManagementPage from "@/pages/finance/ScholarshipManagementPage";
import RecruitmentDashboard from "@/pages/hr/RecruitmentDashboard";
import StaffDirectory from "@/pages/hr/StaffDirectory";
import AdmissionForm from "@/pages/public/AdmissionForm";
import AdmissionDashboard from "@/pages/admissions/AdmissionDashboard";
import LmsDashboard from "@/pages/lms/LmsDashboard";
import CourseView from "@/pages/lms/CourseView";
import ReportsPage from "@/pages/ReportsPage";
import AuditLogsPage from "@/pages/AuditLogsPage";
import HostelManagementPage from "@/pages/campus/HostelManagementPage";
import TransportManagementPage from "@/pages/campus/TransportManagementPage";
import LibraryManagementPage from "@/pages/library/LibraryManagementPage";
import LeaveManagementPage from "@/pages/hr/LeaveManagementPage";
import { Loader2, AlertCircle } from "lucide-react";
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/CommandPalette";


class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || "An unexpected error occurred. Please try refreshing."}
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function ProtectedRoute({ component: Component, allowedRoles }: { component: React.ComponentType, allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Check Role Access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not allowed, redirect to dashboard or 403 like page? 
    // For now, redirect to dashboard
    if (location !== "/") {
      return <Redirect to="/" />;
    }
  }

  // FORCE CHANGE PASSWORD LOGIC
  if (user.mustChangePassword && location !== "/change-password") {
    return <Redirect to="/change-password" />;
  }

  if (!user.mustChangePassword && location === "/change-password") {
    // Optional: preventing access to change-password if not required? 
    // Usually allowed. Keeping as is.
  }

  // If on change password page, don't show Sidebar
  if (location === "/change-password") {
    return <Component />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Component />
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />

      {/* Protected Routes */}
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/change-password">
        <ProtectedRoute component={ChangePasswordPage} />
      </Route>
      <Route path="/students">
        <ProtectedRoute component={StudentsPage} allowedRoles={['main_admin', 'admin', 'principal', 'teacher', 'accountant']} />
      </Route>
      <Route path="/teachers">
        <ProtectedRoute component={TeachersPage} allowedRoles={['main_admin', 'admin', 'principal', 'hr']} />
      </Route>
      <Route path="/classes">
        <ProtectedRoute component={ClassesPage} allowedRoles={['main_admin', 'admin', 'principal', 'teacher']} />
      </Route>
      <Route path="/attendance">
        <ProtectedRoute component={AttendancePage} allowedRoles={['main_admin', 'admin', 'principal', 'teacher', 'student', 'parent']} />
      </Route>
      <Route path="/fees">
        <ProtectedRoute component={FeesPage} allowedRoles={['main_admin', 'admin', 'principal', 'accountant', 'student', 'parent']} />
      </Route>
      <Route path="/exams">
        <ProtectedRoute component={ExamsPage} allowedRoles={['main_admin', 'admin', 'principal', 'teacher', 'student', 'parent']} />
      </Route>
      <Route path="/timetable">
        <ProtectedRoute component={TimetablePage} allowedRoles={['main_admin', 'admin', 'principal', 'teacher', 'student', 'parent']} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={SettingsPage} allowedRoles={['main_admin', 'admin', 'principal']} />
      </Route>
      <Route path="/users">
        <ProtectedRoute component={UsersPage} allowedRoles={['main_admin', 'admin']} />
      </Route>

      {/* Finance Module Routes */}
      <Route path="/finance/dashboard">
        <ProtectedRoute component={FinanceDashboard} allowedRoles={['main_admin', 'admin', 'principal', 'accountant']} />
      </Route>
      <Route path="/finance/income">
        <ProtectedRoute component={IncomePage} allowedRoles={['main_admin', 'admin', 'principal', 'accountant']} />
      </Route>
      <Route path="/finance/expenses">
        <ProtectedRoute component={ExpensesPage} allowedRoles={['main_admin', 'admin', 'principal', 'accountant']} />
      </Route>
      <Route path="/finance/payments">
        <ProtectedRoute component={PaymentsPage} allowedRoles={['main_admin', 'admin', 'principal', 'accountant']} />
      </Route>
      <Route path="/finance/assets">
        <ProtectedRoute component={AssetsPage} allowedRoles={['main_admin', 'admin', 'principal', 'accountant']} />
      </Route>
      <Route path="/finance/budget">
        <ProtectedRoute component={BudgetPage} allowedRoles={['main_admin', 'admin', 'principal', 'accountant']} />
      </Route>
      <Route path="/finance/student-ledger">
        <ProtectedRoute component={StudentLedgerPage} allowedRoles={['main_admin', 'admin', 'principal', 'accountant']} />
      </Route>
      <Route path="/finance/gl">
        <ProtectedRoute component={GLManagement} allowedRoles={['main_admin', 'admin', 'principal', 'accountant']} />
      </Route>
      <Route path="/finance/donors">
        <ProtectedRoute component={DonorManagementPage} allowedRoles={['main_admin', 'admin', 'principal', 'accountant']} />
      </Route>
      <Route path="/finance/endowments">
        <ProtectedRoute component={EndowmentManagementPage} allowedRoles={['main_admin', 'admin', 'principal', 'accountant']} />
      </Route>
      <Route path="/finance/payroll">
        <ProtectedRoute component={PayrollTimesheetsPage} allowedRoles={['main_admin', 'admin', 'principal', 'accountant', 'hr']} />
      </Route>
      <Route path="/finance/fee-structures">
        <ProtectedRoute component={FeeStructuresPage} allowedRoles={['main_admin', 'admin', 'principal', 'accountant']} />
      </Route>
      <Route path="/finance/fee-assignment">
        <ProtectedRoute component={FeeAssignmentPage} allowedRoles={['main_admin', 'admin', 'principal', 'accountant']} />
      </Route>
      <Route path="/finance/payment-plans">
        <ProtectedRoute component={PaymentPlansPage} allowedRoles={['main_admin', 'admin', 'principal', 'accountant']} />
      </Route>
      <Route path="/finance/scholarships">
        <ProtectedRoute component={ScholarshipManagementPage} allowedRoles={['main_admin', 'admin', 'principal', 'accountant']} />
      </Route>

      {/* Reports */}
      <Route path="/reports">
        <ProtectedRoute component={ReportsPage} allowedRoles={['main_admin', 'admin', 'principal', 'accountant', 'teacher']} />
      </Route>

      {/* HR Module Routes */}
      <Route path="/hr/recruitment">
        <ProtectedRoute component={RecruitmentDashboard} allowedRoles={['main_admin', 'admin', 'principal', 'hr']} />
      </Route>
      <Route path="/hr/staff">
        <ProtectedRoute component={StaffDirectory} allowedRoles={['main_admin', 'admin', 'principal', 'hr']} />
      </Route>

      {/* Admission Routes */}
      <Route path="/admissions/apply" component={AdmissionForm} />
      <Route path="/admissions/dashboard">
        <ProtectedRoute component={AdmissionDashboard} allowedRoles={['main_admin', 'admin', 'principal']} />
      </Route>

      {/* LMS Routes */}
      <Route path="/lms">
        <ProtectedRoute component={LmsDashboard} allowedRoles={['main_admin', 'admin', 'principal', 'teacher', 'student']} />
      </Route>
      <Route path="/lms/course/:id">
        <ProtectedRoute component={CourseView} allowedRoles={['main_admin', 'admin', 'principal', 'teacher', 'student']} />
      </Route>

      {/* Campus Operations Routes */}
      <Route path="/campus/hostel">
        <ProtectedRoute component={HostelManagementPage} allowedRoles={['main_admin', 'admin', 'principal']} />
      </Route>
      <Route path="/campus/transport">
        <ProtectedRoute component={TransportManagementPage} allowedRoles={['main_admin', 'admin', 'principal']} />
      </Route>

      {/* Library Routes */}
      <Route path="/library">
        <ProtectedRoute component={LibraryManagementPage} allowedRoles={['main_admin', 'admin', 'principal', 'teacher', 'student']} />
      </Route>

      {/* HR Leave Management */}
      <Route path="/hr/leave">
        <ProtectedRoute component={LeaveManagementPage} allowedRoles={['main_admin', 'admin', 'principal', 'hr', 'teacher']} />
      </Route>

      {/* Admin Tools Routes */}
      <Route path="/audit-logs">
        <ProtectedRoute component={AuditLogsPage} allowedRoles={['main_admin', 'admin']} />
      </Route>

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CommandPalette />
          <ErrorBoundary>
            <Toaster />
            <Router />
          </ErrorBoundary>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;