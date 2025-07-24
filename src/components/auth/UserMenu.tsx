'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (status === 'loading') {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center space-x-4">
        <Link
          href="/auth/signin"
          className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
        >
          ログイン
        </Link>
        <Link
          href="/auth/signup"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium"
        >
          新規登録
        </Link>
      </div>
    );
  }

  const isPremium = session.user.subscription.status === 'premium';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
      >
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {session.user.name?.charAt(0) || session.user.email.charAt(0)}
        </div>
        <span>{session.user.name || 'ユーザー'}</span>
        {isPremium && (
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
            Premium
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 text-sm text-gray-700 border-b">
            <div className="font-medium">{session.user.name || 'ユーザー'}</div>
            <div className="text-gray-500">{session.user.email}</div>
          </div>
          
          <Link
            href="/dashboard"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            ダッシュボード
          </Link>
          
          {!isPremium && (
            <Link
              href="/pricing"
              className="block px-4 py-2 text-sm text-indigo-600 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              プレミアムにアップグレード
            </Link>
          )}
          
          {isPremium && (
            <>
              <Link
                href="/premium/favorites"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                お気に入り
              </Link>
              <Link
                href="/premium/nutrition-calculator"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                栄養計算機
              </Link>
              <Link
                href="/premium/shopping-list"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                買い物リスト
              </Link>
            </>
          )}
          
          <button
            onClick={() => {
              setIsOpen(false);
              signOut();
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            ログアウト
          </button>
        </div>
      )}
    </div>
  );
}