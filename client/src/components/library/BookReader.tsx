// client/src/components/library/BookReader.tsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, X, Loader2, AlertCircle, Maximize2, ExternalLink, Clock } from "lucide-react";
import type { DigitalContentResponse } from "@/types/library";

async function fetchWithAuth(url: string) {
    const token = localStorage.getItem("token");
    const res = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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

interface BookReaderProps {
    bookId: number;
    bookTitle: string;
    onClose: () => void;
}

export function BookReader({ bookId, bookTitle, onClose }: BookReaderProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [contentInfo, setContentInfo] = useState<DigitalContentResponse | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const loadContent = async () => {
            try {
                const response = await fetchWithAuth(`/api/library/items/${bookId}/read`);
                setContentInfo(response);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load content");
            } finally {
                setLoading(false);
            }
        };
        loadContent();
    }, [bookId]);

    const toggleFullscreen = () => {
        const iframe = document.getElementById('book-reader-iframe');
        if (iframe) {
            if (!document.fullscreenElement) {
                iframe.requestFullscreen?.();
                setIsFullscreen(true);
            } else {
                document.exitFullscreen?.();
                setIsFullscreen(false);
            }
        }
    };

    const openInNewTab = () => {
        if (contentInfo?.readUrl) {
            window.open(contentInfo.readUrl, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <Dialog open onOpenChange={() => onClose()}>
            <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden flex flex-col">
                {/* Header */}
                <DialogHeader className="px-6 py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <BookOpen className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-semibold line-clamp-1">{bookTitle}</span>
                                {contentInfo && (
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Session expires at {new Date(contentInfo.expiresAt).toLocaleTimeString()}
                                    </span>
                                )}
                            </div>
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            {contentInfo && (
                                <>
                                    <Badge variant="outline" className="bg-gray-800 border-gray-600 text-gray-300 uppercase">
                                        {contentInfo.format}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={openInNewTab}
                                        className="text-gray-400 hover:text-white hover:bg-gray-700"
                                        title="Open in new tab"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={toggleFullscreen}
                                        className="text-gray-400 hover:text-white hover:bg-gray-700"
                                        title="Fullscreen"
                                    >
                                        <Maximize2 className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="text-gray-400 hover:text-white hover:bg-gray-700"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Content Area */}
                <div className="flex-1 bg-gray-900 relative">
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                            <Loader2 className="h-12 w-12 animate-spin text-emerald-400 mb-4" />
                            <p className="text-lg font-medium">Loading book...</p>
                            <p className="text-sm text-gray-400 mt-1">Preparing your reading session</p>
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                            <div className="p-4 bg-red-500/20 rounded-full mb-4">
                                <AlertCircle className="h-12 w-12 text-red-400" />
                            </div>
                            <p className="text-lg font-medium">Unable to Load Book</p>
                            <p className="text-sm text-gray-400 mt-1 max-w-md text-center">{error}</p>
                            <Button
                                onClick={onClose}
                                className="mt-6 bg-gray-700 hover:bg-gray-600"
                            >
                                Close Reader
                            </Button>
                        </div>
                    )}

                    {contentInfo && !loading && !error && (
                        <iframe
                            id="book-reader-iframe"
                            src={contentInfo.readUrl}
                            className="w-full h-full border-0"
                            title={bookTitle}
                            allowFullScreen
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
