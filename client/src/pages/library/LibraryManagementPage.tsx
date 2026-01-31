import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Library, BookOpen, Users, Plus, Search, BookMarked, Clock, AlertCircle } from "lucide-react";

interface LibraryItem {
    id: number;
    title: string;
    author: string | null;
    isbn: string | null;
    category: string | null;
    publisher: string | null;
    publishYear: number | null;
    callNumber: string | null;
    totalCopies: number;
    availableCopies: number;
    location: string | null;
    status: string;
}

interface LibraryLoan {
    id: number;
    itemId: number;
    userId: number;
    checkoutDate: string;
    dueDate: string;
    returnDate: string | null;
    fineAmount: number;
    status: string;
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem("token");
    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export default function LibraryManagementPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [addItemOpen, setAddItemOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);

    // Fetch library items
    const { data: items = [], isLoading } = useQuery<LibraryItem[]>({
        queryKey: ["/api/library/items"],
        queryFn: () => fetchWithAuth("/api/library/items"),
    });

    // Fetch loans
    const { data: loans = [] } = useQuery<LibraryLoan[]>({
        queryKey: ["/api/library/loans"],
        queryFn: () => fetchWithAuth("/api/library/loans"),
    });

    // Create item mutation
    const createItemMutation = useMutation({
        mutationFn: (data: Partial<LibraryItem>) => fetchWithAuth("/api/library/items", {
            method: "POST",
            body: JSON.stringify(data),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/library/items"] });
            setAddItemOpen(false);
            toast({ title: "Success", description: "Book added to catalog" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    // Create loan mutation
    const createLoanMutation = useMutation({
        mutationFn: (data: Partial<LibraryLoan>) => fetchWithAuth("/api/library/loans", {
            method: "POST",
            body: JSON.stringify(data),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/library/loans"] });
            queryClient.invalidateQueries({ queryKey: ["/api/library/items"] });
            setCheckoutOpen(false);
            toast({ title: "Success", description: "Book checked out successfully" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    // Filter items by search
    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.isbn?.includes(searchQuery)
    );

    // Stats
    const totalBooks = items.length;
    const totalCopies = items.reduce((sum, i) => sum + i.totalCopies, 0);
    const availableCopies = items.reduce((sum, i) => sum + i.availableCopies, 0);
    const activeLoans = loans.filter(l => !l.returnDate).length;
    const overdueLoans = loans.filter(l => !l.returnDate && new Date(l.dueDate) < new Date()).length;

    const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        createItemMutation.mutate({
            title: formData.get("title") as string,
            author: formData.get("author") as string,
            isbn: formData.get("isbn") as string,
            category: formData.get("category") as string,
            publisher: formData.get("publisher") as string,
            publishYear: parseInt(formData.get("publishYear") as string) || null,
            callNumber: formData.get("callNumber") as string,
            totalCopies: parseInt(formData.get("totalCopies") as string) || 1,
            availableCopies: parseInt(formData.get("totalCopies") as string) || 1,
            location: formData.get("location") as string,
        });
    };

    const handleCheckout = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14); // 2 weeks loan period

        createLoanMutation.mutate({
            itemId: parseInt(formData.get("itemId") as string),
            userId: parseInt(formData.get("userId") as string),
            checkoutDate: new Date().toISOString(),
            dueDate: dueDate.toISOString(),
            status: "active",
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                        Library Management
                    </h1>
                    <p className="text-slate-400 mt-1">Manage book catalog, loans, and circulation</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                                <BookMarked className="h-4 w-4 mr-2" /> Checkout Book
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-800">
                            <DialogHeader>
                                <DialogTitle>Checkout Book</DialogTitle>
                                <DialogDescription>Issue a book to a user</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCheckout} className="space-y-4">
                                <div>
                                    <Label>Select Book</Label>
                                    <select
                                        name="itemId"
                                        required
                                        className="w-full p-2 bg-slate-800 border border-slate-700 rounded-md text-white"
                                    >
                                        <option value="">Select a book</option>
                                        {items.filter(i => i.availableCopies > 0).map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.title} ({item.availableCopies} available)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label>User ID</Label>
                                    <Input name="userId" type="number" required className="bg-slate-800 border-slate-700" />
                                </div>
                                <Button type="submit" className="w-full" disabled={createLoanMutation.isPending}>
                                    {createLoanMutation.isPending ? "Processing..." : "Checkout Book"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                                <Plus className="h-4 w-4 mr-2" /> Add Book
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Add New Book</DialogTitle>
                                <DialogDescription>Add a book to the library catalog</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddItem} className="space-y-4">
                                <div>
                                    <Label>Title *</Label>
                                    <Input name="title" required className="bg-slate-800 border-slate-700" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Author</Label>
                                        <Input name="author" className="bg-slate-800 border-slate-700" />
                                    </div>
                                    <div>
                                        <Label>ISBN</Label>
                                        <Input name="isbn" className="bg-slate-800 border-slate-700" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Category</Label>
                                        <Select name="category">
                                            <SelectTrigger className="bg-slate-800 border-slate-700">
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="fiction">Fiction</SelectItem>
                                                <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                                                <SelectItem value="textbook">Textbook</SelectItem>
                                                <SelectItem value="reference">Reference</SelectItem>
                                                <SelectItem value="journal">Journal</SelectItem>
                                                <SelectItem value="magazine">Magazine</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Publisher</Label>
                                        <Input name="publisher" className="bg-slate-800 border-slate-700" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Label>Publish Year</Label>
                                        <Input name="publishYear" type="number" className="bg-slate-800 border-slate-700" />
                                    </div>
                                    <div>
                                        <Label>Call Number</Label>
                                        <Input name="callNumber" className="bg-slate-800 border-slate-700" />
                                    </div>
                                    <div>
                                        <Label>Copies</Label>
                                        <Input name="totalCopies" type="number" defaultValue="1" className="bg-slate-800 border-slate-700" />
                                    </div>
                                </div>
                                <div>
                                    <Label>Location</Label>
                                    <Input name="location" placeholder="e.g., Shelf A-12" className="bg-slate-800 border-slate-700" />
                                </div>
                                <Button type="submit" className="w-full" disabled={createItemMutation.isPending}>
                                    {createItemMutation.isPending ? "Adding..." : "Add Book"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-emerald-500/20">
                                <Library className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{totalBooks}</p>
                                <p className="text-sm text-slate-400">Total Titles</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-teal-500/10 to-teal-500/5 border-teal-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-teal-500/20">
                                <BookOpen className="h-6 w-6 text-teal-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{totalCopies}</p>
                                <p className="text-sm text-slate-400">Total Copies</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/20">
                                <BookMarked className="h-6 w-6 text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{availableCopies}</p>
                                <p className="text-sm text-slate-400">Available</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-cyan-500/20">
                                <Clock className="h-6 w-6 text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{activeLoans}</p>
                                <p className="text-sm text-slate-400">Active Loans</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-red-500/20">
                                <AlertCircle className="h-6 w-6 text-red-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{overdueLoans}</p>
                                <p className="text-sm text-slate-400">Overdue</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="catalog" className="space-y-4">
                <div className="flex items-center justify-between">
                    <TabsList className="bg-slate-800 border-slate-700">
                        <TabsTrigger value="catalog">Book Catalog</TabsTrigger>
                        <TabsTrigger value="loans">Active Loans</TabsTrigger>
                    </TabsList>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search books..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-slate-800 border-slate-700"
                        />
                    </div>
                </div>

                <TabsContent value="catalog" className="space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-800">
                                <TableHead>Title</TableHead>
                                <TableHead>Author</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>ISBN</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Availability</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredItems.map((item) => (
                                <TableRow key={item.id} className="border-slate-800">
                                    <TableCell className="font-medium">{item.title}</TableCell>
                                    <TableCell>{item.author || "—"}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">{item.category || "—"}</Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">{item.isbn || "—"}</TableCell>
                                    <TableCell>{item.location || "—"}</TableCell>
                                    <TableCell>
                                        <span className={item.availableCopies > 0 ? "text-green-400" : "text-red-400"}>
                                            {item.availableCopies}/{item.totalCopies}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={item.availableCopies > 0 ? "default" : "secondary"}>
                                            {item.availableCopies > 0 ? "Available" : "All Checked Out"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredItems.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                                        {searchQuery ? "No books matching your search" : "No books in catalog. Add your first book!"}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TabsContent>

                <TabsContent value="loans" className="space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-800">
                                <TableHead>Book ID</TableHead>
                                <TableHead>User ID</TableHead>
                                <TableHead>Checkout Date</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Fine</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loans.filter(l => !l.returnDate).map((loan) => {
                                const isOverdue = new Date(loan.dueDate) < new Date();
                                return (
                                    <TableRow key={loan.id} className="border-slate-800">
                                        <TableCell className="font-medium">#{loan.itemId}</TableCell>
                                        <TableCell>User #{loan.userId}</TableCell>
                                        <TableCell>{new Date(loan.checkoutDate).toLocaleDateString()}</TableCell>
                                        <TableCell className={isOverdue ? "text-red-400 font-medium" : ""}>
                                            {new Date(loan.dueDate).toLocaleDateString()}
                                            {isOverdue && <span className="ml-2 text-xs">(Overdue)</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={isOverdue ? "destructive" : "default"}>
                                                {isOverdue ? "Overdue" : "Active"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {loan.fineAmount > 0 ? (
                                                <span className="text-red-400">${(loan.fineAmount / 100).toFixed(2)}</span>
                                            ) : (
                                                "—"
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {loans.filter(l => !l.returnDate).length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                                        No active loans
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TabsContent>
            </Tabs>
        </div>
    );
}
