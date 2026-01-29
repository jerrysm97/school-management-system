import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, PieChart, ShieldCheck } from "lucide-react";

export default function FinanceDashboard() {
    const { user } = useAuth();
    const isAccountant = user?.role === "accountant" || user?.role === "main_admin" || user?.role === "principal";

    if (!isAccountant) {
        return <div className="p-8 text-center text-red-500">Restricted Access: Financial Personnel Only</div>;
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        Financial Control Center
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Real-time tracking of institutional health, integrity, and compliance.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <ShieldCheck className="w-4 h-4 mr-2 text-green-600" />
                        Compliance Status: OK
                    </Button>
                    <Button>Generate Report</Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-700">Total Income (YTD)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">$1,245,000</div>
                        <p className="text-xs text-green-600">+12% from last year</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-700">Total Expenses (YTD)</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">$980,000</div>
                        <p className="text-xs text-red-600">+5% vs budget</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700">Net Surplus</CardTitle>
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">+ Profit</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700">$265,000</div>
                        <p className="text-xs text-blue-600">Healthy Margin</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-700">Budget Utilization</CardTitle>
                        <PieChart className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-700">82%</div>
                        <p className="text-xs text-purple-600">On Track</p>
                    </CardContent>
                </Card>
            </div>

            {/* Module Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link href="/finance/income">
                    <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-green-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-500" />
                                Income
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            Manage fees, donations, grants, and sponsorships.
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/finance/expenses">
                    <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-red-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingDown className="w-5 h-5 text-red-500" />
                                Expenses
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            Track salaries, operational costs, and vendor payments.
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/finance/assets">
                    <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-blue-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-blue-500" />
                                Assets
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            Fixed asset registry, depreciation scheduling, and inventory.
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/finance/budget">
                    <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-purple-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-purple-500" />
                                Budgeting
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            Plan annual budgets and analyze variance vs actuals.
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Placeholder for Recent Transactions / Charts */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Financial Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="p-8 text-center text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                        Financial Activity Table Placeholder - Will connect to fin_audit_logs
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
