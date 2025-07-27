'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface FavoriteButtonProps {
  itemType: 'food' | 'recipe';
  itemId: string;
  itemData: {
    name: string;
    description?: string;
    imageUrl?: string;
    category?: string;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  onToggle?: (isFavorite: boolean) => void;
}

export function FavoriteButton({
  itemType,
  itemId,
  itemData,
  className = '',
  size = 'md',
  showText = false,
  onToggle
}: FavoriteButtonProps) {
  const { data: session, status } = useSession();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Size configurations
  const sizeConfig = {
    sm: {
      button: 'w-6 h-6',
      icon: 'w-4 h-4',
      text: 'text-xs'
    },
    md: {
      button: 'w-8 h-8',
      icon: 'w-5 h-5',
      text: 'text-sm'
    },
    lg: {
      button: 'w-10 h-10',
      icon: 'w-6 h-6',
      text: 'text-base'
    }
  };

  const config = sizeConfig[size];

  // Check if item is in favorites
  const checkFavoriteStatus = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }

    try {
      const response = await fetch(`/api/favorites/${itemType}/${itemId}`);
      
      if (response.ok) {
        const data = await response.json();
        setIsFavorite(data.isFavorite);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  }, [status, session?.user?.id, itemType, itemId]);

  // Toggle favorite status
  const toggleFavorite = async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setError('ログインが必要です');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isFavorite) {
        // Remove from favorites
        const response = await fetch(`/api/favorites/${itemType}/${itemId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('プレミアムプランが必要です');
          }
          throw new Error('お気に入りから削除できませんでした');
        }

        setIsFavorite(false);
        onToggle?.(false);
      } else {
        // Add to favorites
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemType,
            itemId,
            itemData
          })
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('プレミアムプランが必要です');
          }
          if (response.status === 409) {
            throw new Error('既にお気に入りに追加されています');
          }
          throw new Error('お気に入りに追加できませんでした');
        }

        setIsFavorite(true);
        onToggle?.(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // Check favorite status on mount and when session changes
  useEffect(() => {
    checkFavoriteStatus();
  }, [checkFavoriteStatus, session, status, itemType, itemId]);

  // Don't show for unauthenticated users
  if (status !== 'authenticated') {
    return (
      <Link
        href="/auth/signin"
        className={`inline-flex items-center justify-center ${config.button} rounded-full border border-gray-300 bg-white text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors ${className}`}
        title="ログインしてお気に入りに追加"
      >
        <svg className={config.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        {showText && <span className={`ml-1 ${config.text}`}>ログイン</span>}
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={toggleFavorite}
        disabled={isLoading}
        data-testid="favorite-button"
        className={`
          inline-flex items-center justify-center ${config.button} rounded-full border transition-all duration-200
          ${isFavorite 
            ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100 favorited' 
            : 'bg-white border-gray-300 text-gray-400 hover:text-red-500 hover:border-red-300'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
          ${className}
        `}
        title={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
      >
        {isLoading ? (
          <svg className={`${config.icon} animate-spin`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg 
            className={config.icon} 
            fill={isFavorite ? 'currentColor' : 'none'} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )}
        {showText && (
          <span className={`ml-1 ${config.text}`}>
            {isFavorite ? 'お気に入り済み' : 'お気に入り'}
          </span>
        )}
      </button>

      {error && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-red-100 border border-red-300 rounded text-xs text-red-700 whitespace-nowrap z-10">
          {error}
          {error.includes('プレミアム') && (
            <Link href="/pricing" className="ml-1 underline hover:no-underline">
              アップグレード
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default FavoriteButton;