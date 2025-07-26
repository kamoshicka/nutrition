import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { premiumCheckMiddleware } from './src/middleware/premium-check';

export default withAuth(
  async function middleware(req) {
    // Initialize database on first request
    if (req.nextUrl.pathname.startsWith('/api/')) {
      // Database initialization will be handled in individual API routes
    }

    // Apply premium check middleware
    const premiumCheckResult = await premiumCheckMiddleware(req);
    if (premiumCheckResult.status !== 200) {
      return premiumCheckResult;
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Premium routes require premium subscription
        const premiumRoutes = [
          '/favorites',
          '/nutrition',
          '/pdf',
          '/shopping-list',
          '/api/favorites',
          '/api/nutrition', 
          '/api/pdf',
          '/api/shopping-list'
        ];
        
        if (premiumRoutes.some(route => pathname.startsWith(route))) {
          return token?.user?.subscription?.status === 'premium';
        }
        
        // User dashboard requires authentication
        if (pathname.startsWith('/dashboard')) {
          return !!token;
        }
        
        // Subscription routes require authentication
        if (pathname.startsWith('/api/subscription')) {
          return !!token;
        }

        // Allow all other routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/premium/:path*',
    '/favorites/:path*',
    '/nutrition/:path*',
    '/pdf/:path*',
    '/shopping-list/:path*',
    '/api/user/:path*',
    '/api/favorites/:path*',
    '/api/shopping-list/:path*',
    '/api/nutrition/:path*',
    '/api/pdf/:path*',
    '/api/subscription/:path*',
  ],
};