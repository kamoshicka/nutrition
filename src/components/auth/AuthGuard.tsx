'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  requirePremium?: boolean;
  fallbackUrl?: string;
  loadingComponent?: ReactNode;
}

/**
 * AuthGuard component for protecting routes based on authentication and subscription status
 * 
 * @param children - The content to render if access is granted
 * @param requireAuth - Whether authentication is required
 * @param requirePremium - Whether premium subscription is required
 * @param fallbackUrl - URL to redirect to if access is denied
 * @param loadingComponent - Component to show while loading
 */
export default function AuthGuard({
  children,
  requireAuth = false,
  requirePremium = false,
  fallbackUrl,
  loadingComponent
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    // Check authentication requirement
    if (requireAuth && !session) {
      const redirectUrl = fallbackUrl || `/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
      router.push(redirectUrl);
      return;
    }

    // Check premium requirement
    if (requirePremium && session) {
      const isPremium = session.user.subscription?.status === 'premium';
      if (!isPremium) {
        const redirectUrl = fallbackUrl || '/pricing';
        router.push(redirectUrl);
        return;
      }
    }
  }, [session, status, requireAuth, requirePremium, fallbackUrl, router]);

  // Show loading state
  if (status === 'loading') {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Check access permissions
  if (requireAuth && !session) {
    return null; // Will redirect in useEffect
  }

  if (requirePremium && session) {
    const isPremium = session.user.subscription?.status === 'premium';
    if (!isPremium) {
      return null; // Will redirect in useEffect
    }
  }

  return <>{children}</>;
}