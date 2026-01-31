
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Command } from 'cmdk';
import {
    Search,
    User,
    GraduationCap,
    Users,
    DollarSign,
    Clock,
    X,
    Layout,
    FileText,
    Settings,
    ShieldCheck
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useGlobalSearch, useRecentSearches } from '@/hooks/use-global-search';
import { Badge } from '@/components/ui/badge';

// Client-side pages to index
const APP_PAGES = [
    { title: 'Dashboard', url: '/', icon: Layout, type: 'page', keywords: ['home', 'main'] },
    { title: 'Students', url: '/students', icon: GraduationCap, type: 'page', keywords: ['pupils', 'learners'] },
    { title: 'Teachers', url: '/teachers', icon: User, type: 'page', keywords: ['staff', 'faculty'] },
    { title: 'Classes', url: '/classes', icon: Users, type: 'page', keywords: ['courses', 'sections'] },
    { title: 'Attendance', url: '/attendance', icon: Clock, type: 'page', keywords: ['roll call', 'presence'] },
    { title: 'Finance Dashboard', url: '/finance/dashboard', icon: DollarSign, type: 'page', keywords: ['money', 'accounts'] },
    { title: 'Fee Structure', url: '/finance/fee-structures', icon: FileText, type: 'page', keywords: ['pricing', 'tuition'] },
    { title: 'Settings', url: '/settings', icon: Settings, type: 'page', keywords: ['config', 'preferences'] },
    { title: 'Audit Logs', url: '/audit-logs', icon: ShieldCheck, type: 'page', keywords: ['history', 'security'] },
];

export function OmniSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [location, setLocation] = useLocation();

    const { data: serverResults = [], isLoading } = useGlobalSearch(query);
    const { recent, addRecent, clearRecent } = useRecentSearches();

    // Filter pages locally
    const pageResults = useMemo(() => {
        if (!query) return [];
        const lowerQuery = query.toLowerCase();
        return APP_PAGES.filter(page =>
            page.title.toLowerCase().includes(lowerQuery) ||
            page.keywords.some(k => k.includes(lowerQuery))
        );
    }, [query]);

    // Listen for Cmd+K / Ctrl+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const handleSelect = useCallback((result: any) => {
        addRecent(result);
        setOpen(false);
        setQuery('');
        setLocation(result.url);
    }, [setLocation, addRecent]);

    const getIcon = (type: string, defaultIcon?: any) => {
        if (defaultIcon) return defaultIcon;
        switch (type) {
            case 'student': return <GraduationCap className="h-4 w-4" />;
            case 'teacher': return <User className="h-4 w-4" />;
            case 'class': return <Users className="h-4 w-4" />;
            case 'payment': return <DollarSign className="h-4 w-4" />;
            case 'page': return <Layout className="h-4 w-4" />;
            default: return <Search className="h-4 w-4" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="overflow-hidden p-0 shadow-2xl max-w-2xl border-0 bg-transparent">
                <Command className="bg-background/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-14 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-4 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
                    <div className="flex items-center border-b border-white/5 px-4 bg-white/5">
                        <Search className="mr-2 h-5 w-5 shrink-0 opacity-50" />
                        <Command.Input
                            placeholder="Omni-search... (Students, Pages, Invoices)"
                            value={query}
                            onValueChange={setQuery}
                            className="flex h-12 w-full rounded-md bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 font-display"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="mr-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                        <kbd className="pointer-events-none hidden h-6 select-none items-center gap-1 rounded bg-white/10 px-2 font-mono text-[10px] font-medium opacity-100 sm:flex text-muted-foreground">
                            ESC
                        </kbd>
                    </div>

                    <Command.List className="max-h-[500px] overflow-y-auto overflow-x-hidden p-2">
                        <Command.Empty className="py-12 text-center text-sm text-muted-foreground">
                            {isLoading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    <span>Searching the database...</span>
                                </div>
                            ) : (
                                'No results found.'
                            )}
                        </Command.Empty>

                        {/* Recent Searches */}
                        {!query && recent.length > 0 && (
                            <Command.Group heading="Recent">
                                {recent.map((item) => (
                                    <Command.Item
                                        key={`${item.type}-${item.id}`}
                                        value={item.title}
                                        onSelect={() => handleSelect(item)}
                                        className="flex items-center gap-3 cursor-pointer px-3 py-3 hover:bg-white/5 aria-selected:bg-white/10 rounded-lg transition-colors group"
                                    >
                                        <div className="p-2 bg-white/5 rounded-md text-muted-foreground group-hover:text-primary transition-colors">
                                            <Clock className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <span className="font-medium text-foreground">{item.title}</span>
                                            {item.subtitle && (
                                                <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                                            )}
                                        </div>
                                        <Badge variant="outline" className="text-[10px] uppercase opacity-50">{item.type}</Badge>
                                    </Command.Item>
                                ))}
                                <Command.Item
                                    onSelect={clearRecent}
                                    className="flex items-center gap-2 cursor-pointer px-2 py-2 text-xs text-muted-foreground hover:bg-white/5 aria-selected:bg-white/10 rounded-lg justify-center mt-2"
                                >
                                    Clear history
                                </Command.Item>
                            </Command.Group>
                        )}

                        {/* Page Results */}
                        {pageResults.length > 0 && (
                            <Command.Group heading="Navigation">
                                {pageResults.map((page) => (
                                    <Command.Item
                                        key={`page-${page.url}`}
                                        value={page.title}
                                        onSelect={() => handleSelect(page)}
                                        className="flex items-center gap-3 cursor-pointer px-3 py-3 hover:bg-white/5 aria-selected:bg-white/10 rounded-lg transition-colors group"
                                    >
                                        <div className="p-2 bg-blue-500/10 rounded-md text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                            {getIcon('page', <page.icon className="h-4 w-4" />)}
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <span className="font-medium text-foreground">{page.title}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">Jump to</span>
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        {/* Server Results */}
                        {serverResults.length > 0 && (
                            <Command.Group heading="Database">
                                {serverResults.map((result) => (
                                    <Command.Item
                                        key={`${result.type}-${result.id}`}
                                        value={result.title}
                                        onSelect={() => handleSelect(result)}
                                        className="flex items-center gap-3 cursor-pointer px-3 py-3 hover:bg-white/5 aria-selected:bg-white/10 rounded-lg transition-colors group"
                                    >
                                        <div className="p-2 bg-white/5 rounded-md text-muted-foreground group-hover:text-primary transition-colors">
                                            {getIcon(result.type)}
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <span className="font-medium text-foreground">{result.title}</span>
                                            {result.subtitle && (
                                                <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                                            )}
                                        </div>
                                        <Badge variant="secondary" className="text-[10px] capitalize">{result.type}</Badge>
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}
                    </Command.List>

                    <div className="border-t border-white/5 px-4 py-2 text-[10px] text-muted-foreground flex items-center justify-between bg-black/20">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 rounded">↑↓</kbd> to navigate</span>
                            <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 rounded">↵</kbd> to select</span>
                        </div>
                    </div>
                </Command>
            </DialogContent>
        </Dialog>
    );
}
