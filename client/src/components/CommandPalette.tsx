import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Command } from 'cmdk';
import { Search, User, GraduationCap, Users, DollarSign, Clock, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useGlobalSearch, useRecentSearches } from '@/hooks/use-global-search';
import { cn } from '@/lib/utils';

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [location, setLocation] = useLocation();

    const { data: results = [], isLoading } = useGlobalSearch(query);
    const { recent, addRecent, clearRecent } = useRecentSearches();

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

    const getIcon = (type: string) => {
        switch (type) {
            case 'student': return <GraduationCap className="h-4 w-4" />;
            case 'teacher': return <User className="h-4 w-4" />;
            case 'class': return <Users className="h-4 w-4" />;
            case 'payment': return <DollarSign className="h-4 w-4" />;
            default: return <Search className="h-4 w-4" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="overflow-hidden p-0 shadow-lg max-w-2xl">
                <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Command.Input
                            placeholder="Search students, teachers, classes, payments..."
                            value={query}
                            onValueChange={setQuery}
                            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="mr-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                            <span className="text-xs">ESC</span>
                        </kbd>
                    </div>

                    <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden">
                        <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                            {isLoading ? 'Searching...' : 'No results found.'}
                        </Command.Empty>

                        {!query && recent.length > 0 && (
                            <Command.Group heading="Recent Searches">
                                {recent.map((item) => (
                                    <Command.Item
                                        key={`${item.type}-${item.id}`}
                                        value={item.title}
                                        onSelect={() => handleSelect(item)}
                                        className="flex items-center gap-2 cursor-pointer px-2 py-3 hover:bg-accent rounded-sm"
                                    >
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex flex-col flex-1">
                                            <span className="font-medium">{item.title}</span>
                                            {item.subtitle && (
                                                <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground capitalize">{item.type}</span>
                                    </Command.Item>
                                ))}
                                <Command.Item
                                    onSelect={clearRecent}
                                    className="flex items-center gap-2 cursor-pointer px-2 py-2 text-xs text-muted-foreground hover:bg-accent rounded-sm justify-center"
                                >
                                    Clear recent searches
                                </Command.Item>
                            </Command.Group>
                        )}

                        {results.length > 0 && (
                            <Command.Group heading="Results">
                                {results.map((result) => (
                                    <Command.Item
                                        key={`${result.type}-${result.id}`}
                                        value={result.title}
                                        onSelect={() => handleSelect(result)}
                                        className="flex items-center gap-2 cursor-pointer px-2 py-3 hover:bg-accent rounded-sm"
                                    >
                                        {getIcon(result.type)}
                                        <div className="flex flex-col flex-1">
                                            <span className="font-medium">{result.title}</span>
                                            {result.subtitle && (
                                                <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground capitalize">{result.type}</span>
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        {query && !isLoading && (
                            <Command.Group heading="Quick Actions">
                                <Command.Item
                                    onSelect={() => {
                                        setOpen(false);
                                        setLocation('/students');
                                    }}
                                    className="flex items-center gap-2 cursor-pointer px-2 py-3 hover:bg-accent rounded-sm"
                                >
                                    <GraduationCap className="h-4 w-4" />
                                    <span>View All Students</span>
                                </Command.Item>
                                <Command.Item
                                    onSelect={() => {
                                        setOpen(false);
                                        setLocation('/finance/payments');
                                    }}
                                    className="flex items-center gap-2 cursor-pointer px-2 py-3 hover:bg-accent rounded-sm"
                                >
                                    <DollarSign className="h-4 w-4" />
                                    <span>View Payments</span>
                                </Command.Item>
                            </Command.Group>
                        )}
                    </Command.List>

                    <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                                ↑↓
                            </kbd>
                            <span>Navigate</span>
                            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                                ↵
                            </kbd>
                            <span>Select</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                                ⌘K
                            </kbd>
                            <span>To open</span>
                        </div>
                    </div>
                </Command>
            </DialogContent>
        </Dialog>
    );
}
