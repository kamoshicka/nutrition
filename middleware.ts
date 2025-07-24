import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Initialize database on first request
    if (req.nextUrl.pathname.startsWith('/api/')) {
      // Database initialization will be handled in individual API routes
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect premium routes
        if (req.nextUrl.pathname.startsWith('/premium')) {
          return token?.user?.subscription?.status === 'premium';
        }
        
        // Protect user dashboard
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
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
    '/api/user/:path*',
    '/api/favorites/:path*',
    '/api/shopping-list/:path*',
    '/api/nutrition/:path*',
    '/api/subscription/:path*',
  ],
};