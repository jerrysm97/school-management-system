import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChartOfAccounts, useCreateChartOfAccount } from "@/hooks/use-gl";
import {
    BookOpen, Plus, TrendingUp, BarChart3, FileText, Sparkles,
    AlertCircle, DollarSign, PiggyBank, ArrowUpRight, ArrowDownRight,
    Scale, ClipboardList, Calculator, Wallet, Building, Shield
} from "lucide-react";
import type { InsertChartOfAccount } from "@shared/schema";

export default function GLManagement() {
    const { user } = useAuth();
    const isFinance = user?.role === "accountant" || user?.role === "main_admin" || user?.role === "principal" || user?.role === "admin";

    const [activeTab, setActiveTab] = useState("chart-of-accounts");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newAccount, setNewAccount] = useState<Partial<InsertChartOfAccount>>({
        accountType: "asset",
        normalBalance: "debit",
        isActive: true,
    });

    const { data: accounts, isLoading } = useChartOfAccounts(true);
    const createAccount = useCreateChartOfAccount();

    if (!isFinance) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-center p-8 bg-red-500/10 rounded-2xl border border-red-500/20 max-w-md">
                    <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
                    <p className="text-slate-400">This page is only available to financial personnel.</p>
                </div>
            </div>
        );
    }

    const handleCreateAccount = async () => {
        if (!newAccount.accountCode || !newAccount.accountName || !newAccount.accountType) {
            return;
        }

        await createAccount.mutateAsync(newAccount as InsertChartOfAccount);
        setIsCreateDialogOpen(false);
        setNewAccount({
            accountType: "asset",
            normalBalance: "debit",
            isActive: true,
        });
    };

    const accountTypeConfig: Record<string, { color: string; gradient: string; icon: typeof DollarSign }> = {
        asset: { color: "blue", gradient: "from-blue-500 to-blue-600", icon: Wallet },
        liability: { color: "red", gradient: "from-red-500 to-red-600", icon: AlertCircle },
        equity: { color: "purple", gradient: "from-purple-500 to-purple-600", icon: Building },
        revenue: { color: "emerald", gradient: "from-emerald-500 to-emerald-600", icon: TrendingUp },
        expense: { color: "orange", gradient: "from-orange-500 to-orange-600", icon: BarChart3 },
    };

    // Calculate stats
    const totalAccounts = accounts?.length || 0;
    const assetAccounts = accounts?.filter(a => a.accountType === "asset").length || 0;
    const revenueAccounts = accounts?.filter(a => a.accountType === "revenue").length || 0;
    const expenseAccounts = accounts?.filter(a => a.accountType === "expense").length || 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-indigo-600/10 to-violet-600/20" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiM2MzY2ZjEiIGZpbGwtb3BhY2l0eT0iLjAzIi8+PC9nPjwvc3ZnPg==')] opacity-40" />

                <div className="relative px-6 py-12 lg:py-16">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                                    <Sparkles className="h-4 w-4" />
                                    <span>Double-Entry Accounting</span>
                                </div>
                                <h1 className="text-4xl lg:text-5xl font-bold">
                                    <span className="bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
                                        General Ledger
                                    </span>
                                    <span className="text-white"> Management</span>
                                </h1>
                                <p className="text-lg text-slate-400 max-w-xl">
                                    Manage your chart of accounts, journal entries, and financial reports with full audit trail.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all"
                                >
                                    <FileText className="h-5 w-5 mr-2" />
                                    Reports
                                </Button>
                                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            size="lg"
                                            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/25 transition-all"
                                        >
                                            <Plus className="h-5 w-5 mr-2" />
                                            New Account
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-slate-900 border-slate-800">
                                        <DialogHeader>
                                            <DialogTitle className="text-white">Create New GL Account</DialogTitle>
                                            <DialogDescription className="text-slate-400">
                                                Add a new account to the chart of accounts
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="accountCode" className="text-slate-300">Account Code</Label>
                                                <Input
                                                    id="accountCode"
                                                    placeholder="e.g., 1000"
                                                    className="bg-slate-800 border-slate-700 text-white"
                                                    value={newAccount.accountCode || ""}
                                                    onChange={(e) => setNewAccount({ ...newAccount, accountCode: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="accountName" className="text-slate-300">Account Name</Label>
                                                <Input
                                                    id="accountName"
                                                    placeholder="e.g., Cash - Operating"
                                                    className="bg-slate-800 border-slate-700 text-white"
                                                    value={newAccount.accountName || ""}
                                                    onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="accountType" className="text-slate-300">Account Type</Label>
                                                <Select
                                                    value={newAccount.accountType}
                                                    onValueChange={(value: any) => setNewAccount({
                                                        ...newAccount,
                                                        accountType: value,
                                                        normalBalance: ["asset", "expense"].includes(value) ? "debit" : "credit"
                                                    })}
                                                >
                                                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="asset">Asset</SelectItem>
                                                        <SelectItem value="liability">Liability</SelectItem>
                                                        <SelectItem value="equity">Equity</SelectItem>
                                                        <SelectItem value="revenue">Revenue</SelectItem>
                                                        <SelectItem value="expense">Expense</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="description" className="text-slate-300">Description (Optional)</Label>
                                                <Input
                                                    id="description"
                                                    placeholder="Account description"
                                                    className="bg-slate-800 border-slate-700 text-white"
                                                    value={newAccount.description || ""}
                                                    onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" className="border-slate-700" onClick={() => setIsCreateDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button
                                                className="bg-blue-600 hover:bg-blue-700"
                                                onClick={handleCreateAccount}
                                                disabled={createAccount.isPending}
                                            >
                                                {createAccount.isPending ? "Creating..." : "Create Account"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="px-6 -mt-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Total Accounts", value: totalAccounts, icon: BookOpen, color: "blue", gradient: "from-blue-500 to-blue-600" },
                            { label: "Asset Accounts", value: assetAccounts, icon: Wallet, color: "cyan", gradient: "from-cyan-500 to-cyan-600" },
                            { label: "Revenue Accounts", value: revenueAccounts, icon: TrendingUp, color: "emerald", gradient: "from-emerald-500 to-emerald-600" },
                            { label: "Expense Accounts", value: expenseAccounts, icon: BarChart3, color: "orange", gradient: "from-orange-500 to-orange-600" },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className="group relative bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5 overflow-hidden transition-all duration-300 hover:border-slate-600 hover:shadow-lg"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                                <div className="relative flex items-center gap-4">
                                    <div className={`p-3 rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/20`}>
                                        <stat.icon className={`h-5 w-5 text-${stat.color}-400`} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                                        <p className="text-xs text-slate-400">{stat.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-6 py-10">
                <div className="max-w-7xl mx-auto">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        {/* Tab Header */}
                        <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4">
                            <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1 rounded-xl">
                                <TabsTrigger value="chart-of-accounts" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 rounded-lg px-6">
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    Chart of Accounts
                                </TabsTrigger>
                                <TabsTrigger value="journal-entries" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 rounded-lg px-6">
                                    <ClipboardList className="h-4 w-4 mr-2" />
                                    Journal Entries
                                </TabsTrigger>
                                <TabsTrigger value="reports" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 rounded-lg px-6">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Financial Reports
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="chart-of-accounts" className="space-y-6 mt-0">
                            <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
                                <div className="p-6 border-b border-slate-700/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                                <BookOpen className="h-5 w-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-semibold text-white">Chart of Accounts</h2>
                                                <p className="text-sm text-slate-400">Hierarchical structure of all GL accounts</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-3 py-1">
                                            {totalAccounts} accounts
                                        </Badge>
                                    </div>
                                </div>

                                {isLoading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="h-10 w-10 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                                            <p className="text-slate-400">Loading accounts...</p>
                                        </div>
                                    </div>
                                ) : !accounts || accounts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <div className="p-4 rounded-full bg-slate-800/50 mb-4">
                                            <BookOpen className="h-10 w-10 text-slate-500" />
                                        </div>
                                        <p className="text-lg font-medium text-white">No Accounts Yet</p>
                                        <p className="text-sm text-slate-400 mt-1">Create your first GL account to get started</p>
                                        <Button
                                            className="mt-4 bg-blue-600 hover:bg-blue-700"
                                            onClick={() => setIsCreateDialogOpen(true)}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create First Account
                                        </Button>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-slate-700/50 hover:bg-transparent">
                                                <TableHead className="text-slate-300">Code</TableHead>
                                                <TableHead className="text-slate-300">Account Name</TableHead>
                                                <TableHead className="text-slate-300">Type</TableHead>
                                                <TableHead className="text-slate-300">Normal Balance</TableHead>
                                                <TableHead className="text-slate-300">Description</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {accounts.map((account) => {
                                                const config = accountTypeConfig[account.accountType] || accountTypeConfig.asset;
                                                return (
                                                    <TableRow key={account.id} className="border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                                                        <TableCell>
                                                            <code className="px-2 py-1 rounded bg-slate-700/50 text-blue-400 text-sm font-mono">
                                                                {account.accountCode}
                                                            </code>
                                                        </TableCell>
                                                        <TableCell className="font-medium text-white">{account.accountName}</TableCell>
                                                        <TableCell>
                                                            <Badge className={`bg-${config.color}-500/20 text-${config.color}-400 border-${config.color}-500/30 uppercase text-xs`}>
                                                                {account.accountType}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2 text-slate-300 capitalize">
                                                                {account.normalBalance === 'debit' ? (
                                                                    <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                                                                ) : (
                                                                    <ArrowDownRight className="h-4 w-4 text-red-400" />
                                                                )}
                                                                {account.normalBalance}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-slate-400 max-w-xs truncate">
                                                            {account.description || "—"}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="journal-entries" className="space-y-6 mt-0">
                            <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
                                <div className="p-6 border-b border-slate-700/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                                <ClipboardList className="h-5 w-5 text-indigo-400" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-semibold text-white">Journal Entries</h2>
                                                <p className="text-sm text-slate-400">Record transactions with double-entry validation</p>
                                            </div>
                                        </div>
                                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                                            <Plus className="h-4 w-4 mr-2" />
                                            New Entry
                                        </Button>
                                    </div>
                                </div>

                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-slate-700/50 hover:bg-transparent">
                                            <TableHead className="text-slate-300">Entry #</TableHead>
                                            <TableHead className="text-slate-300">Date</TableHead>
                                            <TableHead className="text-slate-300">Description</TableHead>
                                            <TableHead className="text-slate-300 text-right">Debit</TableHead>
                                            <TableHead className="text-slate-300 text-right">Credit</TableHead>
                                            <TableHead className="text-slate-300">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {[
                                            { id: "JE-001", desc: "Opening Balance Entry", debit: 10000, credit: 10000, status: "posted" },
                                            { id: "JE-002", desc: "Tuition Fee Collection", debit: 5000, credit: 5000, status: "posted" },
                                            { id: "JE-003", desc: "Salary Expense Accrual", debit: 25000, credit: 25000, status: "draft" },
                                        ].map((entry) => (
                                            <TableRow key={entry.id} className="border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                                                <TableCell>
                                                    <code className="px-2 py-1 rounded bg-slate-700/50 text-indigo-400 text-sm font-mono">
                                                        {entry.id}
                                                    </code>
                                                </TableCell>
                                                <TableCell className="text-slate-300">{new Date().toLocaleDateString()}</TableCell>
                                                <TableCell className="text-white font-medium">{entry.desc}</TableCell>
                                                <TableCell className="text-right text-emerald-400 font-medium">
                                                    ${entry.debit.toLocaleString()}.00
                                                </TableCell>
                                                <TableCell className="text-right text-red-400 font-medium">
                                                    ${entry.credit.toLocaleString()}.00
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={entry.status === 'posted'
                                                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                                        : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                                    }>
                                                        {entry.status === 'posted' ? 'Posted' : 'Draft'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                <div className="p-4 border-t border-slate-700/50 text-center">
                                    <p className="text-sm text-slate-500">
                                        Showing sample entries. Full journal entry management available in production.
                                    </p>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="reports" className="space-y-6 mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    {
                                        title: "Trial Balance",
                                        description: "View debits and credits for all accounts at a glance",
                                        icon: Scale,
                                        color: "blue",
                                        gradient: "from-blue-500/5 to-transparent"
                                    },
                                    {
                                        title: "Balance Sheet",
                                        description: "Assets = Liabilities + Equity snapshot",
                                        icon: PiggyBank,
                                        color: "emerald",
                                        gradient: "from-emerald-500/5 to-transparent"
                                    },
                                    {
                                        title: "Income Statement",
                                        description: "Revenue and expenses for a period",
                                        icon: TrendingUp,
                                        color: "purple",
                                        gradient: "from-purple-500/5 to-transparent"
                                    },
                                    {
                                        title: "Cash Flow Statement",
                                        description: "Track operating, investing, and financing activities",
                                        icon: DollarSign,
                                        color: "cyan",
                                        gradient: "from-cyan-500/5 to-transparent"
                                    },
                                    {
                                        title: "General Ledger",
                                        description: "Detailed transaction history by account",
                                        icon: ClipboardList,
                                        color: "orange",
                                        gradient: "from-orange-500/5 to-transparent"
                                    },
                                    {
                                        title: "Audit Trail",
                                        description: "Complete history of all financial changes",
                                        icon: Shield,
                                        color: "rose",
                                        gradient: "from-rose-500/5 to-transparent"
                                    },
                                ].map((report, i) => (
                                    <button
                                        key={i}
                                        className={`group relative bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 text-left overflow-hidden transition-all duration-300 hover:border-${report.color}-500/30 hover:shadow-lg hover:shadow-${report.color}-500/5`}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${report.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                                        <div className="relative">
                                            <div className={`p-3 rounded-xl bg-${report.color}-500/10 border border-${report.color}-500/20 w-fit mb-4 group-hover:scale-110 transition-transform`}>
                                                <report.icon className={`h-6 w-6 text-${report.color}-400`} />
                                            </div>
                                            <h3 className="font-semibold text-lg text-white group-hover:text-blue-300 transition-colors">{report.title}</h3>
                                            <p className="text-sm text-slate-400 mt-2">{report.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
