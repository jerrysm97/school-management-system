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
import { BookOpen, Plus, TrendingUp, BarChart3, FileText } from "lucide-react";
import type { InsertChartOfAccount } from "@shared/schema";

export default function GLManagement() {
    const { user } = useAuth();
    const isFinance = user?.role === "accountant" || user?.role === "main_admin" || user?.role === "principal";

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
            <div className="p-8 text-center text-red-500">
                Restricted Access: Financial Personnel Only
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

    const accountTypeColors: Record<string, string> = {
        asset: "bg-blue-100 text-blue-800",
        liability: "bg-red-100 text-red-800",
        equity: "bg-purple-100 text-purple-800",
        revenue: "bg-green-100 text-green-800",
        expense: "bg-orange-100 text-orange-800",
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        General Ledger Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Double-entry accounting with full audit trail
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        Reports
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{accounts?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Active GL accounts</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Asset Accounts</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {accounts?.filter(a => a.accountType === "asset").length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Assets tracked</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue Accounts</CardTitle>
                        <BarChart3 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {accounts?.filter(a => a.accountType === "revenue").length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Revenue streams</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expense Accounts</CardTitle>
                        <BarChart3 className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {accounts?.filter(a => a.accountType === "expense").length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Expense categories</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="chart-of-accounts">Chart of Accounts</TabsTrigger>
                    <TabsTrigger value="journal-entries">Journal Entries</TabsTrigger>
                    <TabsTrigger value="reports">Financial Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="chart-of-accounts" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Chart of Accounts</CardTitle>
                                    <CardDescription>
                                        Hierarchical structure of all GL accounts
                                    </CardDescription>
                                </div>
                                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="w-4 h-4 mr-2" />
                                            New Account
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create New GL Account</DialogTitle>
                                            <DialogDescription>
                                                Add a new account to the chart of accounts
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="accountCode">Account Code</Label>
                                                <Input
                                                    id="accountCode"
                                                    placeholder="e.g., 1000"
                                                    value={newAccount.accountCode || ""}
                                                    onChange={(e) => setNewAccount({ ...newAccount, accountCode: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="accountName">Account Name</Label>
                                                <Input
                                                    id="accountName"
                                                    placeholder="e.g., Cash - Operating"
                                                    value={newAccount.accountName || ""}
                                                    onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="accountType">Account Type</Label>
                                                <Select
                                                    value={newAccount.accountType}
                                                    onValueChange={(value: any) => setNewAccount({
                                                        ...newAccount,
                                                        accountType: value,
                                                        normalBalance: ["asset", "expense"].includes(value) ? "debit" : "credit"
                                                    })}
                                                >
                                                    <SelectTrigger>
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
                                                <Label htmlFor="description">Description (Optional)</Label>
                                                <Input
                                                    id="description"
                                                    placeholder="Account description"
                                                    value={newAccount.description || ""}
                                                    onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button onClick={handleCreateAccount} disabled={createAccount.isPending}>
                                                {createAccount.isPending ? "Creating..." : "Create Account"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="text-center py-8">Loading accounts...</div>
                            ) : !accounts || accounts.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No accounts found. Create your first GL account to get started.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Code</TableHead>
                                            <TableHead>Account Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Normal Balance</TableHead>
                                            <TableHead>Description</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {accounts.map((account) => (
                                            <TableRow key={account.id}>
                                                <TableCell className="font-mono font-medium">{account.accountCode}</TableCell>
                                                <TableCell className="font-medium">{account.accountName}</TableCell>
                                                <TableCell>
                                                    <Badge className={accountTypeColors[account.accountType]}>
                                                        {account.accountType.toUpperCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="capitalize">{account.normalBalance}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {account.description || "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="journal-entries">
                    <Card>
                        <CardHeader>
                            <CardTitle>Journal Entries</CardTitle>
                            <CardDescription>
                                Record and manage journal entries with double-entry validation
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 text-muted-foreground">
                                Journal entry interface coming soon
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reports">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-lg">Trial Balance</CardTitle>
                                <CardDescription>
                                    View debits and credits for all accounts
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-lg">Balance Sheet</CardTitle>
                                <CardDescription>
                                    Assets = Liabilities + Equity
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-lg">Income Statement</CardTitle>
                                <CardDescription>
                                    Revenue and expenses for a period
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
