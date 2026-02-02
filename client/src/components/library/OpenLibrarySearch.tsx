// client/src/components/library/OpenLibrarySearch.tsx
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
    Search, Globe, Plus, Loader2, BookOpen, Monitor,
    CheckCircle, AlertCircle, Languages, Filter
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { OpenLibraryBook } from "@/types/library";

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

interface OpenLibrarySearchProps {
    onImported?: () => void;
}

export function OpenLibrarySearch({ onImported }: OpenLibrarySearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<OpenLibraryBook[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [importing, setImporting] = useState<string | null>(null);
    const [importedKeys, setImportedKeys] = useState<Set<string>>(new Set());
    const [digitalOnly, setDigitalOnly] = useState(true);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const searchOpenLibrary = async () => {
        if (!query.trim() || query.length < 2) {
            toast({
                title: "Search Query Too Short",
                description: "Enter at least 2 characters to search",
                variant: "destructive"
            });
            return;
        }

        setIsSearching(true);
        setResults([]);

        try {
            const response = await fetchWithAuth(
                `/api/library/open-library/search?q=${encodeURIComponent(query)}`
            );
            setResults(response);

            if (response.length === 0) {
                toast({
                    title: "No Results",
                    description: "No books found matching your search. Try different keywords.",
                });
            }
        } catch (error) {
            toast({
                title: "Search Failed",
                description: error instanceof Error ? error.message : "Unable to search Open Library",
                variant: "destructive"
            });
        } finally {
            setIsSearching(false);
        }
    };

    const importBook = async (book: OpenLibraryBook) => {
        setImporting(book.openLibraryKey);

        try {
            await fetchWithAuth("/api/library/open-library/import", {
                method: "POST",
                body: JSON.stringify(book)
            });

            queryClient.invalidateQueries({ queryKey: ["/api/library/items"] });
            queryClient.invalidateQueries({ queryKey: ["/api/library/digital"] });

            toast({
                title: "Book Imported Successfully",
                description: `"${book.title}" has been added to your school library catalog.`
            });

            // Mark as imported
            setImportedKeys(prev => new Set(prev).add(book.openLibraryKey));

            // Call callback if provided
            onImported?.();
        } catch (error) {
            toast({
                title: "Import Failed",
                description: error instanceof Error ? error.message : "Unable to import book",
                variant: "destructive"
            });
        } finally {
            setImporting(null);
        }
    };

    return (
        <Card className="border-emerald-200 bg-white shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-emerald-700">
                    <Globe className="h-5 w-5" />
                    Import from Open Library
                </CardTitle>
                <CardDescription>
                    Search millions of books from the Open Library catalog and add them to your school library
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Search Input and Filter */}
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by title, author, or ISBN..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && searchOpenLibrary()}
                                className="pl-10 bg-white border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <Button
                            onClick={searchOpenLibrary}
                            disabled={isSearching}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[100px]"
                        >
                            {isSearching ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Search className="h-4 w-4 mr-2" />
                                    Search
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 rounded-md">
                                <Monitor className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blue-900">Digital Reading Access</p>
                                <p className="text-xs text-blue-700">Only show books available to read online</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="digital-only" className="text-xs font-semibold uppercase tracking-wider text-blue-700">Only Readable</Label>
                            <Switch
                                id="digital-only"
                                checked={digitalOnly}
                                onCheckedChange={setDigitalOnly}
                            />
                        </div>
                    </div>
                </div>

                {/* Results */}
                {results.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                            Found <span className="font-semibold text-gray-900">{results.length}</span> books
                        </p>
                        <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                            {results
                                .filter(book => !digitalOnly || book.canRead)
                                .map((book) => {
                                    const isImported = importedKeys.has(book.openLibraryKey);
                                    const isCurrentlyImporting = importing === book.openLibraryKey;

                                    return (
                                        <div
                                            key={book.openLibraryKey}
                                            className={`flex gap-4 p-4 border rounded-lg transition-all duration-200 ${isImported
                                                ? 'border-green-200 bg-green-50'
                                                : 'border-gray-200 hover:border-emerald-300 hover:shadow-sm'
                                                }`}
                                        >
                                            {/* Cover Image */}
                                            <div className="w-16 h-24 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden shadow-sm">
                                                {book.coverUrl ? (
                                                    <img
                                                        src={book.coverUrl}
                                                        alt={book.title}
                                                        className="w-full h-full object-cover"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <BookOpen className="h-6 w-6 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Book Info */}
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 line-clamp-1">{book.title}</h4>
                                                    <p className="text-sm text-gray-600">{book.author}</p>
                                                </div>

                                                <div className="flex flex-wrap gap-1.5">
                                                    {book.publishedYear && (
                                                        <Badge variant="outline" className="text-xs border-gray-300">
                                                            {book.publishedYear}
                                                        </Badge>
                                                    )}
                                                    {book.isbn && (
                                                        <Badge variant="outline" className="text-xs border-gray-300 font-mono">
                                                            {book.isbn}
                                                        </Badge>
                                                    )}
                                                    {book.canRead && (
                                                        <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                                            <Monitor className="h-3 w-3 mr-1" />
                                                            Read Online
                                                        </Badge>
                                                    )}
                                                    {book.isPublicDomain && (
                                                        <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                                                            Public Domain
                                                        </Badge>
                                                    )}
                                                    {book.languages.length > 0 && book.languages[0] !== "eng" && (
                                                        <Badge variant="outline" className="text-xs border-gray-300">
                                                            <Languages className="h-3 w-3 mr-1" />
                                                            {book.languages[0].toUpperCase()}
                                                        </Badge>
                                                    )}
                                                </div>

                                                {book.subjects.length > 0 && (
                                                    <p className="text-xs text-gray-500 line-clamp-1">
                                                        {book.subjects.slice(0, 3).join(" • ")}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Import Button */}
                                            <div className="flex-shrink-0 self-center">
                                                {isImported ? (
                                                    <div className="flex items-center gap-1 text-green-600">
                                                        <CheckCircle className="h-5 w-5" />
                                                        <span className="text-sm font-medium">Added</span>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => importBook(book)}
                                                        disabled={isCurrentlyImporting}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    >
                                                        {isCurrentlyImporting ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Plus className="h-4 w-4 mr-1" />
                                                                Add
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!isSearching && results.length === 0 && query.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <Globe className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">Search the Open Library</p>
                        <p className="text-sm mt-1">
                            Access millions of book records with metadata, covers, and digital reading links
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
