import { useAuth } from "@/hooks/use-auth";
import { useAdminStats } from "@/hooks/use-stats";
import { StatsCard } from "@/components/common/StatsCard";
import { Users, GraduationCap, BookOpen, Clock } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-display font-bold mb-2">Welcome back, {user?.name}!</h1>
      <p className="text-muted-foreground">Here is an overview of your activity.</p>
      
      <div className="mt-8 p-12 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">Coming Soon</h3>
        <p className="text-muted-foreground max-w-md mt-2">
          Specific dashboards for {user?.role}s are under construction. Please use the sidebar to navigate to other modules.
        </p>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return <div className="p-8">Loading dashboard stats...</div>;
  }

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of the school's performance.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon={GraduationCap}
          trend="+12% from last term"
          color="blue"
        />
        <StatsCard
          title="Total Teachers"
          value={stats?.totalTeachers || 0}
          icon={Users}
          color="purple"
        />
        <StatsCard
          title="Active Classes"
          value={stats?.totalClasses || 0}
          icon={BookOpen}
          color="green"
        />
        <StatsCard
          title="Attendance Rate"
          value="94%"
          icon={Clock}
          description="Average daily attendance"
          color="orange"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Placeholder for charts */}
        <div className="h-[300px] bg-card rounded-xl border p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Attendance Trends</h3>
          <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg">
            Chart Placeholder
          </div>
        </div>
        <div className="h-[300px] bg-card rounded-xl border p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Fee Collection</h3>
          <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg">
            Chart Placeholder
          </div>
        </div>
      </div>
    </div>
  );
}
