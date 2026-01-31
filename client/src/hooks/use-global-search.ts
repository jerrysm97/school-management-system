import { useQuery } from '@tanstack/react-query';

interface SearchResult {
    type: 'student' | 'teacher' | 'class' | 'payment' | 'user';
    id: number;
    title: string;
    subtitle?: string;
    url: string;
}

export function useGlobalSearch(query: string) {
    return useQuery<SearchResult[]>({
        queryKey: ['/api/search', query],
        queryFn: async () => {
            if (!query || query.length < 2) return [];

            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Search failed');

            return response.json();
        },
        enabled: query.length >= 2,
        staleTime: 30000, // Cache for 30 seconds
    });
}

// Recent searches stored in localStorage
export function useRecentSearches() {
    const getRecent = (): SearchResult[] => {
        try {
            const stored = localStorage.getItem('recentSearches');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    };

    const addRecent = (result: SearchResult) => {
        const recent = getRecent();
        const filtered = recent.filter(r => !(r.type === result.type && r.id === result.id));
        const updated = [result, ...filtered].slice(0, 5); // Keep last 5
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    const clearRecent = () => {
        localStorage.removeItem('recentSearches');
    };

    return { recent: getRecent(), addRecent, clearRecent };
}
