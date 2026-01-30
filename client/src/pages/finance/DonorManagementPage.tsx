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
import { useDonors, useCreateDonor, useDonations, useCreateDonation, usePostDonationToGL } from "@/hooks/use-finance-modules";
import { Heart, Plus, DollarSign, Users, TrendingUp, Gift, Send, Calendar } from "lucide-react";
import type { InsertDonor, InsertDonation } from "@shared/schema";

export default function DonorManagementPage() {
    const { user } = useAuth();
    const isFinance = user?.role === "accountant" || user?.role === "main_admin" || user?.role === "principal";

    const [activeTab, setActiveTab] = useState("donors");
    const [isDonorDialogOpen, setIsDonorDialogOpen] = useState(false);
    const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false);

    const [newDonor, setNewDonor] = useState<Partial<InsertDonor>>({
        donorType: "individual",
        isActive: true,
    });

    const [newDonation, setNewDonation] = useState<Partial<InsertDonation>>({
        donationDate: new Date().toISOString().split('T')[0],
        paymentMethod: "check",
    });

    const { data: donors, isLoading: loadingDonors } = useDonors(true);
    const { data: donations, isLoading: loadingDonations } = useDonations();
    const createDonor = useCreateDonor();
    const createDonation = useCreateDonation();
    const postToGL = usePostDonationToGL();

    if (!isFinance) {
        return (
            <div className="p-8 text-center text-red-500">
                Restricted Access: Financial Personnel Only
            </div>
        );
    }

    const handleCreateDonor = async () => {
        if (!newDonor.name || !newDonor.donorType || !newDonor.donorCode) return;
        await createDonor.mutateAsync(newDonor as InsertDonor);
        setIsDonorDialogOpen(false);
        setNewDonor({ donorType: "individual", isActive: true });
    };

    const handleCreateDonation = async () => {
        if (!newDonation.donorId || !newDonation.amount || !newDonation.donationDate) return;
        await createDonation.mutateAsync(newDonation as InsertDonation);
        setIsDonationDialogOpen(false);
        setNewDonation({
            donationDate: new Date().toISOString().split('T')[0],
            paymentMethod: "check",
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100);
    };

    const totalDonations = donations?.reduce((sum, d) => sum + d.amount, 0) || 0;
    const totalDonors = donors?.length || 0;
    const activeDonorsThisYear = donors?.filter(d => {
        if (!d.lastDonationDate) return false;
        const year = new Date(d.lastDonationDate).getFullYear();
        return year === new Date().getFullYear();
    }).length || 0;

    const donorTypeColors: Record<string, string> = {
        individual: "bg-blue-100 text-blue-800",
        corporation: "bg-purple-100 text-purple-800",
        foundation: "bg-green-100 text-green-800",
        government: "bg-orange-100 text-orange-800",
        alumni: "bg-teal-100 text-teal-800",
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                        Donor Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Track donors, donations, and scholarship funding
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isDonationDialogOpen} onOpenChange={setIsDonationDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Gift className="w-4 h-4 mr-2" />
                                Record Donation
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Record New Donation</DialogTitle>
                                <DialogDescription>
                                    Record a donation from an existing donor
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Donor</Label>
                                    <Select
                                        value={newDonation.donorId?.toString()}
                                        onValueChange={(v) => setNewDonation({ ...newDonation, donorId: parseInt(v) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select donor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {donors?.map(d => (
                                                <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Amount ($)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="1000.00"
                                        onChange={(e) => setNewDonation({ ...newDonation, amount: Math.round(parseFloat(e.target.value) * 100) })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Donation Date</Label>
                                    <Input
                                        type="date"
                                        value={newDonation.donationDate}
                                        onChange={(e) => setNewDonation({ ...newDonation, donationDate: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Purpose</Label>
                                    <Input
                                        placeholder="e.g., General Fund, Scholarship, Building"
                                        value={newDonation.purpose || ""}
                                        onChange={(e) => setNewDonation({ ...newDonation, purpose: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Payment Method</Label>
                                    <Select
                                        value={newDonation.paymentMethod || "check"}
                                        onValueChange={(v: "cash" | "card" | "bank_transfer" | "check" | "online") => setNewDonation({ ...newDonation, paymentMethod: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="check">Check</SelectItem>
                                            <SelectItem value="bank_transfer">Wire Transfer</SelectItem>
                                            <SelectItem value="card">Credit Card</SelectItem>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="online">Online</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDonationDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateDonation} disabled={createDonation.isPending}>
                                    {createDonation.isPending ? "Recording..." : "Record Donation"}
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
                        <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalDonors}</div>
                        <p className="text-xs text-muted-foreground">Registered donors</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active This Year</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeDonorsThisYear}</div>
                        <p className="text-xs text-muted-foreground">Donors with activity</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalDonations)}</div>
                        <p className="text-xs text-muted-foreground">All time donations</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Donations YTD</CardTitle>
                        <Calendar className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(
                                donations?.filter(d => new Date(d.donationDate).getFullYear() === new Date().getFullYear())
                                    .reduce((sum, d) => sum + d.amount, 0) || 0
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">This year</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="donors">Donors</TabsTrigger>
                    <TabsTrigger value="donations">Donation History</TabsTrigger>
                </TabsList>

                <TabsContent value="donors" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Donor Directory</CardTitle>
                                    <CardDescription>
                                        Manage donor profiles and contact information
                                    </CardDescription>
                                </div>
                                <Dialog open={isDonorDialogOpen} onOpenChange={setIsDonorDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Donor
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add New Donor</DialogTitle>
                                            <DialogDescription>
                                                Create a new donor profile
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label>Donor Code</Label>
                                                <Input
                                                    placeholder="e.g., DON-001"
                                                    value={newDonor.donorCode || ""}
                                                    onChange={(e) => setNewDonor({ ...newDonor, donorCode: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Name</Label>
                                                <Input
                                                    placeholder="Donor name"
                                                    value={newDonor.name || ""}
                                                    onChange={(e) => setNewDonor({ ...newDonor, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Donor Type</Label>
                                                <Select
                                                    value={newDonor.donorType || "individual"}
                                                    onValueChange={(v: "individual" | "corporation" | "foundation" | "government" | "alumni") => setNewDonor({ ...newDonor, donorType: v })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="individual">Individual</SelectItem>
                                                        <SelectItem value="corporation">Corporation</SelectItem>
                                                        <SelectItem value="foundation">Foundation</SelectItem>
                                                        <SelectItem value="government">Government</SelectItem>
                                                        <SelectItem value="alumni">Alumni</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Email</Label>
                                                <Input
                                                    type="email"
                                                    placeholder="email@example.com"
                                                    value={newDonor.contactEmail || ""}
                                                    onChange={(e) => setNewDonor({ ...newDonor, contactEmail: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Phone</Label>
                                                <Input
                                                    placeholder="Phone number"
                                                    value={newDonor.contactPhone || ""}
                                                    onChange={(e) => setNewDonor({ ...newDonor, contactPhone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsDonorDialogOpen(false)}>Cancel</Button>
                                            <Button onClick={handleCreateDonor} disabled={createDonor.isPending}>
                                                {createDonor.isPending ? "Creating..." : "Add Donor"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loadingDonors ? (
                                <div className="text-center py-8">Loading donors...</div>
                            ) : !donors || donors.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No donors found. Add your first donor to get started.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Total Donations</TableHead>
                                            <TableHead>Last Donation</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {donors.map((donor) => (
                                            <TableRow key={donor.id} className="cursor-pointer hover:bg-muted/50">
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Heart className="w-4 h-4 text-pink-500" />
                                                        {donor.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={donor.donorType ? donorTypeColors[donor.donorType] || "bg-gray-100" : "bg-gray-100"}>
                                                        {donor.donorType || "individual"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{donor.contactEmail || "-"}</TableCell>
                                                <TableCell className="font-medium">{formatCurrency(donor.totalDonations || 0)}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString() : "Never"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={donor.isActive ? "default" : "secondary"}>
                                                        {donor.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="donations" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Donation History</CardTitle>
                            <CardDescription>
                                Complete record of all donations received
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingDonations ? (
                                <div className="text-center py-8">Loading donations...</div>
                            ) : !donations || donations.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No donations recorded yet.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Donor</TableHead>
                                            <TableHead>Purpose</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead>GL Posted</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {donations.map((donation) => {
                                            const donor = donors?.find(d => d.id === donation.donorId);
                                            return (
                                                <TableRow key={donation.id}>
                                                    <TableCell>{new Date(donation.donationDate).toLocaleDateString()}</TableCell>
                                                    <TableCell className="font-medium">{donor?.name || `Donor #${donation.donorId}`}</TableCell>
                                                    <TableCell className="text-muted-foreground">{donation.purpose || "General"}</TableCell>
                                                    <TableCell className="font-mono font-medium text-green-600">
                                                        {formatCurrency(donation.amount)}
                                                    </TableCell>
                                                    <TableCell className="capitalize">{donation.paymentMethod?.replace('_', ' ') || "-"}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={donation.glJournalEntryId ? "default" : "outline"}>
                                                            {donation.glJournalEntryId ? "Posted" : "Pending"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {!donation.glJournalEntryId && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => postToGL.mutate(donation.id)}
                                                                disabled={postToGL.isPending}
                                                            >
                                                                <Send className="w-4 h-4 mr-1" />
                                                                Post to GL
                                                            </Button>
                                                        )}
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
            </Tabs>
        </div>
    );
}
