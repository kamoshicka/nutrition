'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import SearchBar from './SearchBar';
import { useSearchHistory } from '@/lib/search-history';
import UserMenu from '../auth/UserMenu';

/**
 * GlobalHeader component with integrated search functionality
 * 
 * This component provides a consistent header across the application
 * with a global search bar that allows searching from any page.
 */
export default function GlobalHeader() {
        const router = useRouter();
        const pathname = usePathname();
        const { searchHistory, addToHistory } = useSearchHistory();
        const [searchTerm, setSearchTerm] = useState('');
        const [showSuggestions, setShowSuggestions] = useState(false);
        const [suggestions, setSuggestions] = useState<string[]>([]);
        const [showSearchHistory, setShowSearchHistory] = useState(false);

        // Handle search submission
        const handleSearch = (value: string) => {
                if (!value.trim()) return;

                // Save search to history
                addToHistory(value);

                // Navigate to search results page
                router.push(`/search?q=${encodeURIComponent(value)}`);

                // Reset state
                setSearchTerm('');
                setShowSuggestions(false);
        };

        // Fetch search suggestions when search term changes
        useEffect(() => {
                if (!searchTerm.trim() || searchTerm.length < 2) {
                        setSuggestions([]);
                        return;
                }

                // Debounce the API call
                const timer = setTimeout(() => {
                        fetch(`/api/search/suggestions?q=${encodeURIComponent(searchTerm)}`)
                                .then(res => res.ok ? res.json() : { suggestions: [] })
                                .then(data => {
                                        // Combine API suggestions with search history matches
                                        const historyMatches = searchHistory.filter(item =>
                                                item.toLowerCase().includes(searchTerm.toLowerCase())
                                        );

                                        // Deduplicate suggestions
                                        const allSuggestions = Array.from(new Set([...historyMatches, ...(data.suggestions || [])]));
                                        setSuggestions(allSuggestions.slice(0, 5));
                                })
                                .catch(err => {
                                        console.error('Error fetching suggestions:', err);
                                        // Fall back to history matches only
                                        const historyMatches = searchHistory.filter(item =>
                                                item.toLowerCase().includes(searchTerm.toLowerCase())
                                        );
                                        setSuggestions(historyMatches.slice(0, 5));
                                });
                }, 300);

                return () => clearTimeout(timer);
        }, [searchTerm, searchHistory]);

        // Handle input focus
        const handleInputFocus = () => {
                if (searchTerm.trim().length >= 2) {
                        setShowSuggestions(true);
                } else if (searchHistory.length > 0) {
                        setShowSearchHistory(true);
                }
        };

        // Handle suggestion click
        const handleSuggestionClick = (suggestion: string) => {
                setSearchTerm(suggestion);
                handleSearch(suggestion);
        };

        // Handle click outside to close suggestions
        useEffect(() => {
                const handleClickOutside = (event: MouseEvent) => {
                        const target = event.target as HTMLElement;
                        if (!target.closest('.search-container')) {
                                setShowSuggestions(false);
                                setShowSearchHistory(false);
                        }
                };

                document.addEventListener('mousedown', handleClickOutside);
                return () => {
                        document.removeEventListener('mousedown', handleClickOutside);
                };
        }, []);

        return (
                <header className="bg-white shadow-sm border-b">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                <div className="flex justify-between items-center h-16">
                                        <div className="flex items-center">
                                                <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                                                        クックケア
                                                </Link>

                                                <nav className="hidden md:ml-8 md:flex md:space-x-4">
                                                        <Link
                                                                href="/"
                                                                className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/'
                                                                        ? 'text-blue-600 bg-blue-50'
                                                                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                                                                        }`}
                                                        >
                                                                ホーム
                                                        </Link>
                                                </nav>
                                        </div>

                                        <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
                                                <div className="max-w-lg w-full lg:max-w-xs relative search-container">
                                                        <SearchBar
                                                                placeholder="カテゴリや食材を検索..."
                                                                value={searchTerm}
                                                                onChange={setSearchTerm}
                                                                onSearch={handleSearch}
                                                                onFocus={handleInputFocus}
                                                                className="w-full"
                                                        />

                                                        {/* Search suggestions dropdown */}
                                                        {showSuggestions && searchTerm.trim().length >= 2 && (
                                                                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200">
                                                                        <ul className="py-1 max-h-60 overflow-auto">
                                                                                {suggestions.length > 0 ? (
                                                                                        suggestions.map((suggestion, index) => (
                                                                                                <li key={index}>
                                                                                                        <button
                                                                                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                                                                                                onClick={() => handleSuggestionClick(suggestion)}
                                                                                                        >
                                                                                                                <svg
                                                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                                                        className="h-4 w-4 mr-2 text-gray-400"
                                                                                                                        fill="none"
                                                                                                                        viewBox="0 0 24 24"
                                                                                                                        stroke="currentColor"
                                                                                                                >
                                                                                                                        <path
                                                                                                                                strokeLinecap="round"
                                                                                                                                strokeLinejoin="round"
                                                                                                                                strokeWidth={2}
                                                                                                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                                                                                                        />
                                                                                                                </svg>
                                                                                                                {suggestion}
                                                                                                        </button>
                                                                                                </li>
                                                                                        ))
                                                                                ) : (
                                                                                        <li className="px-4 py-2 text-sm text-gray-500">
                                                                                                検索候補がありません
                                                                                        </li>
                                                                                )}
                                                                        </ul>
                                                                </div>
                                                        )}

                                                        {/* Search history dropdown */}
                                                        {showSearchHistory && !showSuggestions && searchHistory.length > 0 && (
                                                                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200">
                                                                        <div className="flex justify-between items-center px-4 py-2 bg-gray-50">
                                                                                <span className="text-xs text-gray-500">最近の検索</span>
                                                                                <button
                                                                                        className="text-xs text-blue-600 hover:text-blue-800"
                                                                                        onClick={() => setShowSearchHistory(false)}
                                                                                >
                                                                                        閉じる
                                                                                </button>
                                                                        </div>
                                                                        <ul className="py-1 max-h-60 overflow-auto">
                                                                                {searchHistory.map((item, index) => (
                                                                                        <li key={index}>
                                                                                                <button
                                                                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                                                                                        onClick={() => handleSuggestionClick(item)}
                                                                                                >
                                                                                                        <svg
                                                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                                                className="h-4 w-4 mr-2 text-gray-400"
                                                                                                                fill="none"
                                                                                                                viewBox="0 0 24 24"
                                                                                                                stroke="currentColor"
                                                                                                        >
                                                                                                                <path
                                                                                                                        strokeLinecap="round"
                                                                                                                        strokeLinejoin="round"
                                                                                                                        strokeWidth={2}
                                                                                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                                                                />
                                                                                                        </svg>
                                                                                                        {item}
                                                                                                </button>
                                                                                        </li>
                                                                                ))}
                                                                        </ul>
                                                                </div>
                                                        )}
                                                </div>
                                        </div>

                                        <div className="ml-4">
                                                <UserMenu />
                                        </div>
                                </div>
                        </div>
                </header>
        );
}