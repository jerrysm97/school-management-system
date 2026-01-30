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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
    useEndowmentFunds,
    useCreateEndowmentFund,
    useInvestments,
    useCreateInvestment,
} from "@/hooks/use-finance-modules";
import { Landmark, Plus, TrendingUp, DollarSign, PieChart, BarChart3, Wallet } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { InsertEndowmentFund, InsertInvestment } from "@shared/schema";

export default function EndowmentManagementPage() {
    const { user } = useAuth();
    const isFinance = user?.role === "accountant" || user?.role === "main_admin" || user?.role === "principal";

    const [activeTab, setActiveTab] = useState("funds");
    const [isFundDialogOpen, setIsFundDialogOpen] = useState(false);
    const [isInvestmentDialogOpen, setIsInvestmentDialogOpen] = useState(false);

    const [newFund, setNewFund] = useState<Partial<InsertEndowmentFund>>({
        isActive: true,
        spendingRate: 500, // 5% stored as basis points
    });

    const [newInvestment, setNewInvestment] = useState<Partial<InsertInvestment>>({
        purchaseDate: new Date().toISOString().split('T')[0],
        investmentType: "stock",
    });

    const { data: funds, isLoading: loadingFunds } = useEndowmentFunds(true);
    const { data: investments, isLoading: loadingInvestments } = useInvestments();
    const createFund = useCreateEndowmentFund();
    const createInvestment = useCreateInvestment();

    if (!isFinance) {
        return (
            <div className="p-8 text-center text-red-500">
                Restricted Access: Financial Personnel Only
            </div>
        );
    }

    const handleCreateFund = async () => {
        if (!newFund.fundName || !newFund.principal || !newFund.fundCode) return;
        await createFund.mutateAsync({
            ...newFund,
            currentValue: newFund.principal, // Set currentValue equal to principal initially
        } as InsertEndowmentFund);
        setIsFundDialogOpen(false);
        setNewFund({ isActive: true, spendingRate: 500 });
    };

    const handleCreateInvestment = async () => {
        if (!newInvestment.endowmentFundId || !newInvestment.description || !newInvestment.quantity || !newInvestment.costBasis) return;
        await createInvestment.mutateAsync({
            ...newInvestment,
            currentPrice: newInvestment.costBasis,
            currentValue: (newInvestment.quantity || 0) * (newInvestment.costBasis || 0),
        } as InsertInvestment);
        setIsInvestmentDialogOpen(false);
        setNewInvestment({ purchaseDate: new Date().toISOString().split('T')[0], investmentType: "stock" });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100);
    };

    const totalPrincipal = funds?.reduce((sum, f) => sum + f.principal, 0) || 0;
    const totalValue = funds?.reduce((sum, f) => sum + f.currentValue, 0) || 0;
    const totalGainLoss = totalValue - totalPrincipal;
    const gainLossPercent = totalPrincipal > 0 ? (totalGainLoss / totalPrincipal) * 100 : 0;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        Endowment & Investment Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage endowment funds and investment portfolios
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isInvestmentDialogOpen} onOpenChange={setIsInvestmentDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Add Investment
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Add Investment</DialogTitle>
                                <DialogDescription>
                                    Add a new investment to an endowment fund
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Endowment Fund</Label>
                                    <Select
                                        value={newInvestment.endowmentFundId?.toString()}
                                        onValueChange={(v) => setNewInvestment({ ...newInvestment, endowmentFundId: parseInt(v) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select fund" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {funds?.map(f => (
                                                <SelectItem key={f.id} value={f.id.toString()}>{f.fundName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Symbol/Ticker</Label>
                                    <Input
                                        placeholder="e.g., AAPL, VTI"
                                        value={newInvestment.symbol || ""}
                                        onChange={(e) => setNewInvestment({ ...newInvestment, symbol: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Description</Label>
                                    <Input
                                        placeholder="e.g., Apple Inc. Stock"
                                        value={newInvestment.description || ""}
                                        onChange={(e) => setNewInvestment({ ...newInvestment, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Investment Type</Label>
                                    <Select
                                        value={newInvestment.investmentType || "stock"}
                                        onValueChange={(v: "stock" | "bond" | "mutual_fund" | "real_estate" | "other") => setNewInvestment({ ...newInvestment, investmentType: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="stock">Stock</SelectItem>
                                            <SelectItem value="bond">Bond</SelectItem>
                                            <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                                            <SelectItem value="real_estate">Real Estate</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Quantity/Shares</Label>
                                        <Input
                                            type="number"
                                            placeholder="100"
                                            onChange={(e) => setNewInvestment({ ...newInvestment, quantity: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Cost Basis ($)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="150.00"
                                            onChange={(e) => setNewInvestment({
                                                ...newInvestment,
                                                costBasis: Math.round(parseFloat(e.target.value) * 100),
                                            })}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Purchase Date</Label>
                                    <Input
                                        type="date"
                                        value={newInvestment.purchaseDate}
                                        onChange={(e) => setNewInvestment({ ...newInvestment, purchaseDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsInvestmentDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateInvestment} disabled={createInvestment.isPending}>
                                    {createInvestment.isPending ? "Adding..." : "Add Investment"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Funds</CardTitle>
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{funds?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Active endowments</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Principal</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalPrincipal)}</div>
                        <p className="text-xs text-muted-foreground">Original endowment value</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Value</CardTitle>
                        <Wallet className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                        <p className="text-xs text-muted-foreground">Market value</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Return</CardTitle>
                        <TrendingUp className={`h-4 w-4 ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}% overall
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="funds">Endowment Funds</TabsTrigger>
                    <TabsTrigger value="investments">Investment Portfolio</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="funds" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Endowment Funds</CardTitle>
                                    <CardDescription>
                                        Manage individual endowment funds and spending policies
                                    </CardDescription>
                                </div>
                                <Dialog open={isFundDialogOpen} onOpenChange={setIsFundDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Fund
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create Endowment Fund</DialogTitle>
                                            <DialogDescription>
                                                Establish a new endowment fund
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label>Fund Code</Label>
                                                <Input
                                                    placeholder="e.g., END-001"
                                                    value={newFund.fundCode || ""}
                                                    onChange={(e) => setNewFund({ ...newFund, fundCode: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Fund Name</Label>
                                                <Input
                                                    placeholder="e.g., Smith Family Scholarship Fund"
                                                    value={newFund.fundName || ""}
                                                    onChange={(e) => setNewFund({ ...newFund, fundName: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Donor Name</Label>
                                                <Input
                                                    placeholder="e.g., John Smith"
                                                    value={newFund.donorName || ""}
                                                    onChange={(e) => setNewFund({ ...newFund, donorName: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Principal Amount ($)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="100000.00"
                                                    onChange={(e) => setNewFund({
                                                        ...newFund,
                                                        principal: Math.round(parseFloat(e.target.value) * 100),
                                                    })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Restrictions</Label>
                                                <Input
                                                    placeholder="e.g., Engineering scholarships only"
                                                    value={newFund.restrictions || ""}
                                                    onChange={(e) => setNewFund({ ...newFund, restrictions: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Spending Rate (%)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="10"
                                                    placeholder="5"
                                                    value={(newFund.spendingRate || 500) / 100}
                                                    onChange={(e) => setNewFund({ ...newFund, spendingRate: Math.round(parseFloat(e.target.value) * 100) })}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Annual percentage of fund value available for spending
                                                </p>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsFundDialogOpen(false)}>Cancel</Button>
                                            <Button onClick={handleCreateFund} disabled={createFund.isPending}>
                                                {createFund.isPending ? "Creating..." : "Create Fund"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loadingFunds ? (
                                <div className="text-center py-8">Loading funds...</div>
                            ) : !funds || funds.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No endowment funds created yet.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {funds.map((fund) => {
                                        const gainLoss = fund.currentValue - fund.principal;
                                        const gainLossPct = fund.principal > 0 ? (gainLoss / fund.principal) * 100 : 0;
                                        const spendableAmount = fund.spendableAmount || Math.round(fund.currentValue * (fund.spendingRate || 500) / 10000);

                                        return (
                                            <Card key={fund.id} className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
                                                <CardHeader className="pb-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Landmark className="w-5 h-5 text-emerald-600" />
                                                            <CardTitle className="text-lg">{fund.fundName}</CardTitle>
                                                        </div>
                                                        <Badge variant={fund.isActive ? "default" : "secondary"}>
                                                            {fund.isActive ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </div>
                                                    <CardDescription>{fund.restrictions || "General endowment"}</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Principal</p>
                                                            <p className="text-lg font-semibold">{formatCurrency(fund.principal)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Current Value</p>
                                                            <p className="text-lg font-semibold">{formatCurrency(fund.currentValue)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Gain/Loss</p>
                                                            <p className={`text-lg font-semibold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)} ({gainLossPct.toFixed(1)}%)
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Spendable ({(fund.spendingRate || 500) / 100}%)</p>
                                                            <p className="text-lg font-semibold text-blue-600">{formatCurrency(spendableAmount)}</p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="investments" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Investment Portfolio</CardTitle>
                            <CardDescription>
                                All investments across endowment funds
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingInvestments ? (
                                <div className="text-center py-8">Loading investments...</div>
                            ) : !investments || investments.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No investments recorded. Add investments to track portfolio performance.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Security</TableHead>
                                            <TableHead>Fund</TableHead>
                                            <TableHead className="text-right">Quantity</TableHead>
                                            <TableHead className="text-right">Cost Basis</TableHead>
                                            <TableHead className="text-right">Current Price</TableHead>
                                            <TableHead className="text-right">Market Value</TableHead>
                                            <TableHead className="text-right">Gain/Loss</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {investments.map((inv) => {
                                            const fund = funds?.find(f => f.id === inv.endowmentFundId);
                                            const costBasis = inv.quantity * inv.costBasis;
                                            const marketValue = inv.currentValue;
                                            const gainLoss = marketValue - costBasis;
                                            const gainLossPct = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

                                            return (
                                                <TableRow key={inv.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <TrendingUp className="w-4 h-4 text-blue-500" />
                                                            <div>
                                                                <div>{inv.symbol || inv.description}</div>
                                                                {inv.symbol && <div className="text-xs text-muted-foreground">{inv.description}</div>}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">{fund?.fundName || `Fund #${inv.endowmentFundId}`}</TableCell>
                                                    <TableCell className="text-right">{inv.quantity.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right font-mono">{formatCurrency(inv.costBasis)}</TableCell>
                                                    <TableCell className="text-right font-mono">{formatCurrency(inv.currentPrice)}</TableCell>
                                                    <TableCell className="text-right font-semibold">{formatCurrency(marketValue)}</TableCell>
                                                    <TableCell className={`text-right font-semibold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)}
                                                        <span className="text-xs ml-1">({gainLossPct.toFixed(1)}%)</span>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PieChart className="w-5 h-5" />
                                    Asset Allocation
                                </CardTitle>
                                <CardDescription>
                                    Distribution of investments by fund
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {funds?.map(fund => {
                                        const fundInvestments = investments?.filter(i => i.endowmentFundId === fund.id) || [];
                                        const fundValue = fundInvestments.reduce((sum, i) => sum + i.currentValue, 0);
                                        const percentage = totalValue > 0 ? (fundValue / totalValue) * 100 : 0;

                                        return (
                                            <div key={fund.id} className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span>{fund.fundName}</span>
                                                    <span className="font-medium">{percentage.toFixed(1)}%</span>
                                                </div>
                                                <Progress value={percentage} className="h-2" />
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5" />
                                    Fund Summary
                                </CardTitle>
                                <CardDescription>
                                    Overview of all endowment funds
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Principal</p>
                                            <p className="text-xl font-bold">{formatCurrency(totalPrincipal)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Current Value</p>
                                            <p className="text-xl font-bold">{formatCurrency(totalValue)}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Gain/Loss</p>
                                            <p className={`text-xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Average Spending Rate</p>
                                            <p className="text-xl font-bold">
                                                {funds && funds.length > 0
                                                    ? ((funds.reduce((sum, f) => sum + (f.spendingRate || 500), 0) / funds.length) / 100).toFixed(1)
                                                    : '5.0'
                                                }%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
