import { useState, useMemo } from "react";
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
import {
    Library, BookOpen, Plus, Search, BookMarked, Clock, AlertCircle,
    LayoutGrid, List as ListIcon, Filter, Star, TrendingUp, Sparkles,
    ChevronLeft, ChevronRight, BookCopy, Users, Bookmark
} from "lucide-react";

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
    coverUrl?: string;
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
    if (!res.ok) {
        let errorMessage = "Request failed";
        try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
            errorMessage = await res.text() || `HTTP ${res.status}`;
        }
        throw new Error(errorMessage);
    }
    return res.json();
}

export default function LibraryManagementPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [addItemOpen, setAddItemOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedBook, setSelectedBook] = useState<LibraryItem | null>(null);
    const ITEMS_PER_PAGE = 20;

    // External Search State
    const [externalSearchQuery, setExternalSearchQuery] = useState("");
    const [externalSearchResults, setExternalSearchResults] = useState<any[]>([]);
    const [isSearchingExternal, setIsSearchingExternal] = useState(false);

    const handleExternalSearch = async () => {
        if (!externalSearchQuery.trim()) return;
        setIsSearchingExternal(true);
        try {
            const results = await fetchWithAuth(`/api/library/external-search?q=${encodeURIComponent(externalSearchQuery)}`);
            setExternalSearchResults(results);
        } catch (error) {
            toast({ title: "Error", description: "Failed to search Open Library", variant: "destructive" });
        } finally {
            setIsSearchingExternal(false);
        }
    };

    // State for form fields
    const [formData, setFormData] = useState({
        title: "",
        author: "",
        isbn: "",
        category: "",
        publisher: "",
        publishYear: "",
        callNumber: "",
        totalCopies: "1",
        location: ""
    });

    const selectExternalBook = (book: any) => {
        setFormData({
            title: book.title || "",
            author: book.author || "",
            isbn: book.isbn || "",
            category: "non-fiction",
            publisher: "",
            publishYear: book.publishedDate?.toString() || "",
            callNumber: "",
            totalCopies: "1",
            location: "Main Library"
        });
        setExternalSearchResults([]);
        toast({ title: "Book Selected", description: "Form populated with book details" });
    };

    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Fetch library items
    const { data: items = [], isLoading } = useQuery<any[]>({
        queryKey: ["/api/library/items"],
        queryFn: () => fetchWithAuth("/api/library/items"),
    });

    // Map the items to include the frontend-expected fields
    const mappedItems = useMemo(() => {
        return items.map(item => ({
            ...item,
            publishYear: item.publicationYear,
            location: item.locationStack,
            category: item.marcData?.category || item.category || item.subject || "General",
        }));
    }, [items]);

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

    // Extract unique categories
    const categories = useMemo(() => {
        const cats = new Set(mappedItems.map(i => i.category).filter(Boolean));
        return ["all", ...Array.from(cats)] as string[];
    }, [mappedItems]);

    // Filter items by search and category
    const filteredItems = useMemo(() => {
        return mappedItems.filter(item => {
            const matchesSearch =
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.isbn?.includes(searchQuery);
            const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [mappedItems, searchQuery, selectedCategory]);

    // Paginated items
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredItems.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredItems, currentPage]);

    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

    // Featured books (books with covers, limited to 6)
    const featuredBooks = useMemo(() => {
        return mappedItems.filter(i => i.coverUrl).slice(0, 8);
    }, [mappedItems]);

    // Stats
    const totalBooks = mappedItems.length;
    const totalCopies = mappedItems.reduce((sum, i) => sum + i.totalCopies, 0);
    const availableCopies = mappedItems.reduce((sum, i) => sum + i.availableCopies, 0);
    const activeLoans = loans.filter(l => !l.returnDate).length;
    const overdueLoans = loans.filter(l => !l.returnDate && new Date(l.dueDate) < new Date()).length;

    const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formDataObj = new FormData(e.currentTarget);
        createItemMutation.mutate({
            title: formDataObj.get("title") as string,
            author: formDataObj.get("author") as string,
            isbn: formDataObj.get("isbn") as string,
            category: formDataObj.get("category") as string,
            publisher: formDataObj.get("publisher") as string,
            publishYear: parseInt(formDataObj.get("publishYear") as string) || null,
            callNumber: formDataObj.get("callNumber") as string,
            totalCopies: parseInt(formDataObj.get("totalCopies") as string) || 1,
            availableCopies: parseInt(formDataObj.get("totalCopies") as string) || 1,
            location: formDataObj.get("location") as string,
        });
    };

    const handleCheckout = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formDataObj = new FormData(e.currentTarget);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        createLoanMutation.mutate({
            itemId: parseInt(formDataObj.get("itemId") as string),
            userId: parseInt(formDataObj.get("userId") as string),
            checkoutDate: new Date().toISOString(),
            dueDate: dueDate.toISOString(),
            status: "active",
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
                        <BookOpen className="absolute inset-0 m-auto h-6 w-6 text-emerald-600" />
                    </div>
                    <p className="text-gray-600 animate-pulse">Loading Library...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section - Clean White Header */}
            <div className="relative bg-white border-b border-gray-200 shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 via-white to-teal-50" />

                <div className="relative px-6 py-10 lg:py-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
                                    <Sparkles className="h-4 w-4" />
                                    <span>Digital Library System</span>
                                </div>
                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                                    Library Management
                                </h1>
                                <p className="text-base text-gray-600 max-w-xl">
                                    Explore our collection of {totalBooks.toLocaleString()} titles. Search, browse, and manage book circulation with ease.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400"
                                        >
                                            <BookMarked className="h-5 w-5 mr-2" />
                                            Checkout Book
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-white border-gray-200 shadow-xl">
                                        <DialogHeader>
                                            <DialogTitle className="text-gray-900">Checkout Book</DialogTitle>
                                            <DialogDescription className="text-gray-600">Issue a book to a user</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleCheckout} className="space-y-4">
                                            <div>
                                                <Label className="text-gray-700">Select Book</Label>
                                                <select
                                                    name="itemId"
                                                    required
                                                    className="w-full mt-1.5 p-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                >
                                                    <option value="">Select a book</option>
                                                    {mappedItems.filter(i => i.availableCopies > 0).map((item) => (
                                                        <option key={item.id} value={item.id}>
                                                            {item.title} ({item.availableCopies} available)
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <Label className="text-gray-700">User ID</Label>
                                                <Input
                                                    name="userId"
                                                    type="number"
                                                    required
                                                    className="mt-1.5 bg-white border-gray-300 text-gray-900 focus:ring-emerald-500 focus:border-emerald-500"
                                                    placeholder="Enter user ID"
                                                />
                                            </div>
                                            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={createLoanMutation.isPending}>
                                                {createLoanMutation.isPending ? "Processing..." : "Checkout Book"}
                                            </Button>
                                        </form>
                                    </DialogContent>
                                </Dialog>

                                <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            size="lg"
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
                                        >
                                            <Plus className="h-5 w-5 mr-2" />
                                            Add New Book
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-white border-gray-200 shadow-xl max-w-lg max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle className="text-gray-900">Add New Book</DialogTitle>
                                            <DialogDescription className="text-gray-600">Add a book to the library catalog</DialogDescription>
                                        </DialogHeader>

                                        {/* External Search Section */}
                                        <div className="space-y-3 mb-6 p-4 border border-gray-200 rounded-xl bg-gray-50">
                                            <Label className="text-emerald-700 font-medium">Auto-fill from Open Library</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Search by title, ISBN, or author..."
                                                    value={externalSearchQuery}
                                                    onChange={(e) => setExternalSearchQuery(e.target.value)}
                                                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleExternalSearch(); } }}
                                                />
                                                <Button type="button" onClick={handleExternalSearch} disabled={isSearchingExternal} variant="secondary" className="bg-gray-200 hover:bg-gray-300 text-gray-700">
                                                    {isSearchingExternal ? <div className="animate-spin h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full" /> : <Search className="h-4 w-4" />}
                                                </Button>
                                            </div>

                                            {externalSearchResults.length > 0 && (
                                                <div className="max-h-40 overflow-y-auto space-y-2 mt-2 border-t border-gray-200 pt-2">
                                                    {externalSearchResults.map((book, idx) => (
                                                        <div
                                                            key={book.key || idx}
                                                            className="flex items-start justify-between p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-emerald-200"
                                                            onClick={() => selectExternalBook(book)}
                                                        >
                                                            <div className="text-sm">
                                                                <p className="font-medium text-gray-900 line-clamp-1">{book.title}</p>
                                                                <p className="text-xs text-gray-500">{book.author} ({book.publishedDate})</p>
                                                            </div>
                                                            <Button type="button" size="sm" variant="ghost" className="h-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">Select</Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <form onSubmit={handleAddItem} className="space-y-4">
                                            <div>
                                                <Label className="text-gray-700">Title *</Label>
                                                <Input name="title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required className="mt-1.5 bg-white border-gray-300 text-gray-900" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-gray-700">Author</Label>
                                                    <Input name="author" value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} className="mt-1.5 bg-white border-gray-300 text-gray-900" />
                                                </div>
                                                <div>
                                                    <Label className="text-gray-700">ISBN</Label>
                                                    <Input name="isbn" value={formData.isbn} onChange={e => setFormData({ ...formData, isbn: e.target.value })} className="mt-1.5 bg-white border-gray-300 text-gray-900" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-gray-700">Category</Label>
                                                    <Select name="category" value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                                                        <SelectTrigger className="mt-1.5 bg-white border-gray-300 text-gray-900">
                                                            <SelectValue placeholder="Select category" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white border-gray-200">
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
                                                    <Label className="text-gray-700">Publisher</Label>
                                                    <Input name="publisher" value={formData.publisher} onChange={e => setFormData({ ...formData, publisher: e.target.value })} className="mt-1.5 bg-white border-gray-300 text-gray-900" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <Label className="text-gray-700">Publish Year</Label>
                                                    <Input name="publishYear" type="number" value={formData.publishYear} onChange={e => setFormData({ ...formData, publishYear: e.target.value })} className="mt-1.5 bg-white border-gray-300 text-gray-900" />
                                                </div>
                                                <div>
                                                    <Label className="text-gray-700">Call Number</Label>
                                                    <Input name="callNumber" value={formData.callNumber} onChange={e => setFormData({ ...formData, callNumber: e.target.value })} className="mt-1.5 bg-white border-gray-300 text-gray-900" />
                                                </div>
                                                <div>
                                                    <Label className="text-gray-700">Copies</Label>
                                                    <Input name="totalCopies" type="number" value={formData.totalCopies} onChange={e => setFormData({ ...formData, totalCopies: e.target.value })} className="mt-1.5 bg-white border-gray-300 text-gray-900" />
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-gray-700">Location</Label>
                                                <Input name="location" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g., Shelf A-12" className="mt-1.5 bg-white border-gray-300 text-gray-900" />
                                            </div>
                                            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={createItemMutation.isPending}>
                                                {createItemMutation.isPending ? "Adding..." : "Add Book"}
                                            </Button>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="px-6 py-6 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            { label: "Total Titles", value: totalBooks, icon: Library, color: "emerald" },
                            { label: "Total Copies", value: totalCopies, icon: BookCopy, color: "teal" },
                            { label: "Available", value: availableCopies, icon: Bookmark, color: "green" },
                            { label: "Active Loans", value: activeLoans, icon: Users, color: "blue" },
                            { label: "Overdue", value: overdueLoans, icon: AlertCircle, color: "red" },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className="group bg-white rounded-xl border border-gray-200 p-5 transition-all duration-200 hover:border-gray-300 hover:shadow-md"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${stat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                                        stat.color === 'teal' ? 'bg-teal-100 text-teal-600' :
                                            stat.color === 'green' ? 'bg-green-100 text-green-600' :
                                                stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-red-100 text-red-600'
                                        }`}>
                                        <stat.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                                        <p className="text-sm text-gray-500">{stat.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Featured Books Carousel */}
            {featuredBooks.length > 0 && (
                <div className="px-6 py-8 bg-gradient-to-b from-white to-gray-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-100">
                                    <Star className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Featured Collection</h2>
                                    <p className="text-sm text-gray-500">Handpicked titles from our library</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                            {featuredBooks.map((book) => (
                                <div
                                    key={book.id}
                                    className="group cursor-pointer"
                                >
                                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                                        <img
                                            src={book.coverUrl}
                                            alt={book.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                                <p className="text-white text-sm font-medium line-clamp-2">{book.title}</p>
                                                <p className="text-gray-200 text-xs line-clamp-1">{book.author}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="px-6 pb-12">
                <div className="max-w-7xl mx-auto">
                    <Tabs defaultValue="catalog" className="space-y-6">
                        {/* Tab Header with Search */}
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                            <TabsList className="bg-gray-100 p-1 rounded-lg">
                                <TabsTrigger value="catalog" className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm rounded-md px-6 text-gray-600">
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    Book Catalog
                                </TabsTrigger>
                                <TabsTrigger value="loans" className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm rounded-md px-6 text-gray-600">
                                    <Clock className="h-4 w-4 mr-2" />
                                    Active Loans
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                                {/* Search */}
                                <div className="relative flex-1 lg:w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search by title, author, or ISBN..."
                                        value={searchQuery}
                                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                        className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>

                                {/* Category Filter */}
                                <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setCurrentPage(1); }}>
                                    <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-700">
                                        <Filter className="h-4 w-4 mr-2 text-gray-400" />
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-gray-200">
                                        {categories.map(cat => (
                                            <SelectItem key={cat} value={cat} className="capitalize text-gray-700">
                                                {cat === "all" ? "All Categories" : cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* View Toggle */}
                                <div className="flex bg-gray-100 rounded-lg p-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-9 w-9 p-0 rounded-md ${viewMode === 'grid' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        onClick={() => setViewMode('grid')}
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-9 w-9 p-0 rounded-md ${viewMode === 'list' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        onClick={() => setViewMode('list')}
                                    >
                                        <ListIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Results Count */}
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Showing <span className="font-semibold text-gray-900">{paginatedItems.length}</span> of <span className="font-semibold text-gray-900">{filteredItems.length}</span> books
                                {searchQuery && <span> matching "<span className="text-emerald-600 font-medium">{searchQuery}</span>"</span>}
                            </p>
                        </div>

                        <TabsContent value="catalog" className="space-y-6 mt-0">
                            {viewMode === 'list' ? (
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50 border-gray-200 hover:bg-gray-50">
                                                <TableHead className="text-gray-700 font-semibold">Title</TableHead>
                                                <TableHead className="text-gray-700 font-semibold">Author</TableHead>
                                                <TableHead className="text-gray-700 font-semibold">Category</TableHead>
                                                <TableHead className="text-gray-700 font-semibold">ISBN</TableHead>
                                                <TableHead className="text-gray-700 font-semibold">Location</TableHead>
                                                <TableHead className="text-gray-700 font-semibold">Availability</TableHead>
                                                <TableHead className="text-gray-700 font-semibold">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedItems.map((item) => (
                                                <TableRow
                                                    key={item.id}
                                                    className="border-gray-100 hover:bg-gray-50 cursor-pointer"
                                                    onClick={() => setSelectedBook(item)}
                                                >
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-3">
                                                            {item.coverUrl ? (
                                                                <img src={item.coverUrl} alt={item.title} className="h-12 w-9 object-cover rounded-md shadow" />
                                                            ) : (
                                                                <div className="h-12 w-9 bg-gray-100 rounded-md flex items-center justify-center">
                                                                    <BookOpen className="h-4 w-4 text-gray-400" />
                                                                </div>
                                                            )}
                                                            <span className="line-clamp-1 text-gray-900">{item.title}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-gray-600">{item.author || "—"}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize border-gray-300 text-gray-600 bg-gray-50">{item.category || "—"}</Badge>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm text-gray-500">{item.isbn || "—"}</TableCell>
                                                    <TableCell className="text-gray-600">{item.location || "—"}</TableCell>
                                                    <TableCell>
                                                        <span className={item.availableCopies > 0 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                                                            {item.availableCopies}/{item.totalCopies}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={item.availableCopies > 0 ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-red-100 text-red-700 border-red-200"}>
                                                            {item.availableCopies > 0 ? "Available" : "Out"}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {paginatedItems.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center text-gray-500 py-12">
                                                        {searchQuery ? "No books matching your search" : "No books in catalog"}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                                    {paginatedItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="group bg-white hover:bg-white transition-all duration-300 rounded-xl overflow-hidden border border-gray-200 hover:border-emerald-300 shadow-sm hover:shadow-lg"
                                        >
                                            <div className="aspect-[2/3] relative overflow-hidden">
                                                {item.coverUrl ? (
                                                    <img
                                                        src={item.coverUrl}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-gray-100 to-gray-200">
                                                        <div className="p-4 rounded-full bg-white shadow-sm mb-3">
                                                            <BookOpen className="h-8 w-8 text-gray-400" />
                                                        </div>
                                                        <span className="text-xs text-gray-500">No Cover</span>
                                                    </div>
                                                )}

                                                {/* Overlay on hover */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                                        <Button
                                                            size="sm"
                                                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
                                                            onClick={() => setSelectedBook(item)}
                                                        >
                                                            View Details
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Availability Badge */}
                                                <div className="absolute top-3 right-3">
                                                    <Badge className={`${item.availableCopies > 0 ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'} text-white border-0 shadow-md`}>
                                                        {item.availableCopies > 0 ? 'Available' : 'Out'}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="p-4 space-y-2">
                                                <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-emerald-700 transition-colors" title={item.title}>
                                                    {item.title}
                                                </h3>
                                                <p className="text-sm text-gray-500 line-clamp-1">{item.author || "Unknown Author"}</p>

                                                <div className="flex items-center justify-between pt-3 text-xs border-t border-gray-100">
                                                    <span className="capitalize bg-gray-100 px-2 py-1 rounded-md text-gray-600">{item.category || "General"}</span>
                                                    <span className={`font-medium ${item.availableCopies > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {item.availableCopies}/{item.totalCopies}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {paginatedItems.length === 0 && (
                                        <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-500 bg-white rounded-xl border-2 border-dashed border-gray-200">
                                            <div className="p-6 rounded-full bg-gray-100 mb-4">
                                                <Search className="h-12 w-12 text-gray-300" />
                                            </div>
                                            <p className="text-lg font-medium text-gray-700">No books found</p>
                                            <p className="text-sm mt-1 text-gray-500">Try adjusting your search or filter</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 pt-6">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="border-gray-300 hover:bg-gray-50 text-gray-700"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={currentPage === pageNum ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={currentPage === pageNum ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-gray-300 hover:bg-gray-50 text-gray-700"}
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="border-gray-300 hover:bg-gray-50 text-gray-700"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="loans" className="space-y-4 mt-0">
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50 border-gray-200 hover:bg-gray-50">
                                            <TableHead className="text-gray-700 font-semibold">Book</TableHead>
                                            <TableHead className="text-gray-700 font-semibold">User</TableHead>
                                            <TableHead className="text-gray-700 font-semibold">Checkout Date</TableHead>
                                            <TableHead className="text-gray-700 font-semibold">Due Date</TableHead>
                                            <TableHead className="text-gray-700 font-semibold">Status</TableHead>
                                            <TableHead className="text-gray-700 font-semibold">Fine</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loans.filter(l => !l.returnDate).map((loan) => {
                                            const isOverdue = new Date(loan.dueDate) < new Date();
                                            const bookTitle = mappedItems.find(i => i.id === loan.itemId)?.title || `Book #${loan.itemId}`;
                                            return (
                                                <TableRow key={loan.id} className="border-gray-100 hover:bg-gray-50">
                                                    <TableCell className="font-medium text-gray-900">{bookTitle}</TableCell>
                                                    <TableCell className="text-gray-600">User #{loan.userId}</TableCell>
                                                    <TableCell className="text-gray-600">{new Date(loan.checkoutDate).toLocaleDateString()}</TableCell>
                                                    <TableCell className={isOverdue ? "text-red-600 font-medium" : "text-gray-600"}>
                                                        {new Date(loan.dueDate).toLocaleDateString()}
                                                        {isOverdue && <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Overdue</span>}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={isOverdue ? "bg-red-100 text-red-700 border-red-200" : "bg-emerald-100 text-emerald-700 border-emerald-200"}>
                                                            {isOverdue ? "Overdue" : "Active"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {loan.fineAmount > 0 ? (
                                                            <span className="text-red-600 font-medium">${(loan.fineAmount / 100).toFixed(2)}</span>
                                                        ) : (
                                                            <span className="text-gray-400">—</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {loans.filter(l => !l.returnDate).length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                                                    <div className="flex flex-col items-center">
                                                        <Clock className="h-12 w-12 text-gray-300 mb-3" />
                                                        <p className="text-gray-600">No active loans</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Book Detail Dialog */}
            <Dialog open={!!selectedBook} onOpenChange={(open) => !open && setSelectedBook(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    {selectedBook && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-gray-900 pr-8">
                                    {selectedBook.title}
                                </DialogTitle>
                                <DialogDescription className="text-gray-600">
                                    by {selectedBook.author || "Unknown Author"}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid md:grid-cols-3 gap-6 mt-4">
                                {/* Book Cover */}
                                <div className="md:col-span-1">
                                    <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-lg border border-gray-200">
                                        {selectedBook.coverUrl ? (
                                            <img
                                                src={selectedBook.coverUrl}
                                                alt={selectedBook.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                                <BookOpen className="h-16 w-16 text-gray-400 mb-2" />
                                                <span className="text-sm text-gray-500">No Cover Available</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Availability Status */}
                                    <div className="mt-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">Availability</span>
                                            <Badge className={selectedBook.availableCopies > 0
                                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                : "bg-red-100 text-red-700 border-red-200"
                                            }>
                                                {selectedBook.availableCopies > 0 ? "Available" : "All Checked Out"}
                                            </Badge>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {selectedBook.availableCopies} <span className="text-sm font-normal text-gray-500">of {selectedBook.totalCopies} copies</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Book Details */}
                                <div className="md:col-span-2 space-y-6">
                                    {/* Quick Info Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                                            <span className="text-xs text-gray-500 uppercase tracking-wide">Category</span>
                                            <p className="font-medium text-gray-900 capitalize mt-1">{selectedBook.category || "General"}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                                            <span className="text-xs text-gray-500 uppercase tracking-wide">ISBN</span>
                                            <p className="font-mono text-sm text-gray-900 mt-1">{selectedBook.isbn || "N/A"}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                                            <span className="text-xs text-gray-500 uppercase tracking-wide">Publisher</span>
                                            <p className="font-medium text-gray-900 mt-1">{selectedBook.publisher || "Unknown"}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                                            <span className="text-xs text-gray-500 uppercase tracking-wide">Year Published</span>
                                            <p className="font-medium text-gray-900 mt-1">{selectedBook.publishYear || "Unknown"}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                                            <span className="text-xs text-gray-500 uppercase tracking-wide">Call Number</span>
                                            <p className="font-mono text-sm text-gray-900 mt-1">{selectedBook.callNumber || "N/A"}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                                            <span className="text-xs text-gray-500 uppercase tracking-wide">Location</span>
                                            <p className="font-medium text-gray-900 mt-1">{selectedBook.location || "Main Library"}</p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Description</h4>
                                        <p className="text-gray-600 leading-relaxed">
                                            {(selectedBook as any).description ||
                                                "No description available for this book. Visit your library to learn more about this title."}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                                        {selectedBook.availableCopies > 0 ? (
                                            <Button
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                onClick={() => {
                                                    setSelectedBook(null);
                                                    setCheckoutOpen(true);
                                                    toast({
                                                        title: "Request to Borrow",
                                                        description: `To borrow "${selectedBook.title}", please use the Checkout feature.`
                                                    });
                                                }}
                                            >
                                                <BookMarked className="h-4 w-4 mr-2" />
                                                Borrow This Book
                                            </Button>
                                        ) : (
                                            <Button className="flex-1" variant="outline" disabled>
                                                <Clock className="h-4 w-4 mr-2" />
                                                Currently Unavailable
                                            </Button>
                                        )}
                                        <Button variant="outline" onClick={() => setSelectedBook(null)}>
                                            Close
                                        </Button>
                                    </div>

                                    {/* Note about digital reading */}
                                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-blue-800">Physical Library System</p>
                                                <p className="text-sm text-blue-700 mt-1">
                                                    This is a catalog for physical books. To read this book, please borrow it from
                                                    the library and pick it up at the specified location.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
