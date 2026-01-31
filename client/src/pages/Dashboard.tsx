import { useAuth } from "@/hooks/use-auth";
import { useAdminStats } from "@/hooks/use-stats";
import { useStudents } from "@/hooks/use-students";
import { useFeeStats } from "@/hooks/use-fees";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, GraduationCap, BookOpen, Clock, TrendingUp,
  TrendingDown, DollarSign, Calendar, CheckCircle, AlertTriangle,
  Activity, BarChart3, PieChart, Sparkles, UserCheck, Briefcase, Loader2
} from "lucide-react";
import { JobApplication } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { NotificationBell } from "@/components/NotificationBell";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === 'admin' || user?.role === 'main_admin') {
    return <AdminDashboard />;
  }

  if (user?.role === 'teacher') {
    return <TeacherDashboard />;
  }

  if (user?.role === 'principal') {
    return <PrincipalDashboard />;
  }

  if (user?.role === 'student') {
    return <StudentDashboard />;
  }

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Welcome back, {user?.name}!
          </h1>
          <p className="text-muted-foreground mt-1">Here is an overview of your activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">
            <UserCheck className="h-3 w-3 mr-1" />
            {user?.role?.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Account Status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-blue-700">Active</p>
            <p className="text-xs text-blue-600 mt-1">Your account is in good standing</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-green-700 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Member Since
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-700">
              {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
            <p className="text-xs text-green-600 mt-1">Welcome to the platform</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-purple-700 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Quick Actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-purple-700">Explore</p>
            <p className="text-xs text-purple-600 mt-1">Navigate using the sidebar</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Getting Started
          </CardTitle>
          <CardDescription>Here are some things you can do</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <GraduationCap className="h-8 w-8 text-blue-600 mb-2" />
              <h4 className="font-semibold">Students</h4>
              <p className="text-sm text-muted-foreground">View student information</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <BookOpen className="h-8 w-8 text-green-600 mb-2" />
              <h4 className="font-semibold">Classes</h4>
              <p className="text-sm text-muted-foreground">Manage class schedules</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <DollarSign className="h-8 w-8 text-yellow-600 mb-2" />
              <h4 className="font-semibold">Finance</h4>
              <p className="text-sm text-muted-foreground">Track fees and payments</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <BarChart3 className="h-8 w-8 text-purple-600 mb-2" />
              <h4 className="font-semibold">Reports</h4>
              <p className="text-sm text-muted-foreground">View analytics</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();
  const { data: students } = useStudents();
  const { data: feeStats } = useFeeStats();

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-32" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  const recentStudents = students?.slice(0, 5) || [];
  const collectionRate = feeStats ? Math.round((feeStats.totalCollected / (feeStats.totalCollected + feeStats.totalPending + feeStats.totalOverdue || 1)) * 100) : 0;

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your institution overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
            <Activity className="h-3 w-3 mr-1" /> System Online
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/students">
          <Card className="glass-card border-l-4 border-l-blue-500 hover:shadow-xl hover:translate-y-[-2px] transition-all duration-200 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="font-medium text-slate-500">Total Students</CardDescription>
              <div className="p-2 bg-blue-100 rounded-lg">
                <GraduationCap className="h-4 w-4 text-blue-700" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{stats?.totalStudents || 0}</p>
              <p className="text-xs text-emerald-600 mt-1 flex items-center font-medium bg-emerald-50 w-fit px-1.5 py-0.5 rounded-full">
                <TrendingUp className="h-3 w-3 mr-1" /> +12% growth
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/teachers">
          <Card className="glass-card border-l-4 border-l-purple-500 hover:shadow-xl hover:translate-y-[-2px] transition-all duration-200 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="font-medium text-slate-500">Total Teachers</CardDescription>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-4 w-4 text-purple-700" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{stats?.totalTeachers || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Active faculty members</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/classes">
          <Card className="glass-card border-l-4 border-l-green-500 hover:shadow-xl hover:translate-y-[-2px] transition-all duration-200 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="font-medium text-slate-500">Active Classes</CardDescription>
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="h-4 w-4 text-green-700" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{stats?.totalClasses || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Running this term</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/attendance">
          <Card className="glass-card border-l-4 border-l-orange-500 hover:shadow-xl hover:translate-y-[-2px] transition-all duration-200 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="font-medium text-slate-500">Attendance Rate</CardDescription>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-4 w-4 text-orange-700" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{stats?.attendanceRate ?? 0}%</p>
              <p className={`text-xs mt-1 flex items-center font-medium w-fit px-1.5 py-0.5 rounded-full ${(stats?.attendanceWeeklyChange ?? 0) >= 0
                ? 'text-emerald-600 bg-emerald-50'
                : 'text-red-600 bg-red-50'
                }`}>
                {(stats?.attendanceWeeklyChange ?? 0) >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {(stats?.attendanceWeeklyChange ?? 0) >= 0 ? '+' : ''}{stats?.attendanceWeeklyChange ?? 0}% this week
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts and Activity Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Fee Collection Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Financial Overview
            </CardTitle>
            <CardDescription>Fee collection status this term</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/fees" className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100 hover:shadow-md hover:bg-green-100 transition-all cursor-pointer">
                <p className="text-2xl font-bold text-green-700">{formatCurrency(feeStats?.totalCollected || 0)}</p>
                <p className="text-xs text-green-600 mt-1">Collected</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100 hover:shadow-md hover:bg-yellow-100 transition-all cursor-pointer">
                <p className="text-2xl font-bold text-yellow-700">{formatCurrency(feeStats?.totalPending || 0)}</p>
                <p className="text-xs text-yellow-600 mt-1">Pending</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100 hover:shadow-md hover:bg-red-100 transition-all cursor-pointer">
                <p className="text-2xl font-bold text-red-700">{formatCurrency(feeStats?.totalOverdue || 0)}</p>
                <p className="text-xs text-red-600 mt-1">Overdue</p>
              </div>
            </Link>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Collection Rate</span>
                <span className="font-medium">{collectionRate}%</span>
              </div>
              <Progress value={collectionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Recent Students */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Recent Students
              </CardTitle>
              <CardDescription>Latest admissions</CardDescription>
            </div>
            <Link to="/students" className="text-xs text-primary hover:underline">View all →</Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No students yet</p>
            ) : (
              recentStudents.map((student: any) => (
                <Link key={student.id} to={`/students`} className="flex items-center gap-3 hover:bg-muted/50 p-2 -mx-2 rounded-lg transition-colors cursor-pointer">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {student.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{student.user.name}</p>
                    <p className="text-xs text-muted-foreground">{student.admissionNo}</p>
                  </div>
                  <Badge variant={student.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                    {student.status}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Link to="/students?status=approved">
          <Card className="p-4 flex items-center gap-4 hover:shadow-lg hover:translate-y-[-2px] transition-all cursor-pointer">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{students?.filter((s: any) => s.status === 'approved').length || 0}</p>
              <p className="text-xs text-muted-foreground">Approved Students</p>
            </div>
          </Card>
        </Link>
        <Link to="/students?status=pending">
          <Card className="p-4 flex items-center gap-4 hover:shadow-lg hover:translate-y-[-2px] transition-all cursor-pointer">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{students?.filter((s: any) => s.status === 'pending').length || 0}</p>
              <p className="text-xs text-muted-foreground">Pending Approval</p>
            </div>
          </Card>
        </Link>
        <Link to="/timetable">
          <Card className="p-4 flex items-center gap-4 hover:shadow-lg hover:translate-y-[-2px] transition-all cursor-pointer">
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-xs text-muted-foreground">Upcoming Events</p>
            </div>
          </Card>
        </Link>
        <Link to="/audit-logs">
          <Card className="p-4 flex items-center gap-4 hover:shadow-lg hover:translate-y-[-2px] transition-all cursor-pointer">
            <div className="p-3 bg-purple-100 rounded-full">
              <AlertTriangle className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-xs text-muted-foreground">Alerts</p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function PrincipalDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: students } = useStudents();
  const { data: feeStats } = useFeeStats();

  // Fetch Recruitment Info
  const { data: applications } = useQuery<JobApplication[]>({
    queryKey: ["/api/hr/applications"],
  });

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  const pendingAdmissions = students?.filter((s: any) => s.status === 'pending').length || 0;
  const hiringPipeline = applications?.filter((a: any) => a.status === 'review' || a.status === 'interviewed').length || 0;

  if (statsLoading) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-32" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="pl-2">
              <Skeleton className="h-[350px] w-full" />
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center">
                    <Skeleton className="h-9 w-9 rounded-full mr-4" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            Institutional Overview
          </h1>
          <p className="text-muted-foreground mt-1">Strategic view of all campus operations</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-indigo-600">Principal's View</Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-slate-500 font-medium">Monthly Revenue</CardDescription>
            <div className="p-2 bg-green-100 rounded-lg"><DollarSign className="h-4 w-4 text-green-700" /></div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency((feeStats?.totalCollected || 0) / 12)}</p>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" /> Estimated monthly
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-slate-500 font-medium">Pending Admissions</CardDescription>
            <div className="p-2 bg-yellow-100 rounded-lg"><GraduationCap className="h-4 w-4 text-yellow-700" /></div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingAdmissions}</p>
            <p className="text-xs text-yellow-600 mt-1">Awaiting decision</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-slate-500 font-medium">Hiring Pipeline</CardDescription>
            <div className="p-2 bg-purple-100 rounded-lg"><Briefcase className="h-4 w-4 text-purple-700" /></div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{hiringPipeline}</p>
            <p className="text-xs text-purple-600 mt-1">Qualified candidates</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-slate-500 font-medium">Student Success</CardDescription>
            <div className="p-2 bg-blue-100 rounded-lg"><Activity className="h-4 w-4 text-blue-700" /></div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">92%</p>
            <p className="text-xs text-blue-600 mt-1">Average Passing Rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Departmental Health
              </CardTitle>
              <Badge variant="outline">Year to Date</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Academics", score: 95, color: "bg-blue-500" },
                { name: "Finance", score: 82, color: "bg-green-500" },
                { name: "Recruitment", score: 64, color: "bg-purple-500" },
                { name: "Facilities", score: 88, color: "bg-orange-500" }
              ].map(dept => (
                <div key={dept.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{dept.name}</span>
                    <span className="text-muted-foreground">{dept.score}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`${dept.color} h-full transition-all duration-1000`} style={{ width: `${dept.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Recent HR Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applications?.slice(0, 4).map(app => (
                <div key={app.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{app.firstName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{app.firstName} {app.lastName}</p>
                      <p className="text-xs text-muted-foreground">Applied for Faculty</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] uppercase">{app.status}</Badge>
                </div>
              ))}
              {(applications?.length || 0) === 0 && (
                <p className="text-center py-8 text-sm text-muted-foreground italic">No recent HR activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TeacherDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Welcome, {user?.name}!</h1>
        <p className="text-muted-foreground mt-1">Here's your teaching overview for today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-700">My Classes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-700">4</p>
            <p className="text-xs text-blue-600 mt-1">Active this term</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-green-700">Total Students</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-700">86</p>
            <p className="text-xs text-green-600 mt-1">Across all classes</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-orange-700">Today's Classes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-orange-700">3</p>
            <p className="text-xs text-orange-600 mt-1">Scheduled for today</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Welcome, {user?.name}!</h1>
        <p className="text-muted-foreground mt-1">Here's your academic overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-700">Current GPA</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-700">3.8</p>
            <p className="text-xs text-blue-600 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" /> +0.2 from last term
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-green-700">Attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-700">96%</p>
            <p className="text-xs text-green-600 mt-1">This semester</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-purple-700">Credits</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-purple-700">45</p>
            <p className="text-xs text-purple-600 mt-1">Completed</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
