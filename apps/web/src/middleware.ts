import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths — allow always
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/products') ||
    pathname.startsWith('/categories') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/cart'
  ) {
    return NextResponse.next();
  }

  // Admin routes — need auth + admin role
  if (pathname.startsWith('/admin')) {
    const sessionToken =
      request.cookies.get('better-auth.session_token')?.value ||
      request.cookies.get('__Secure-better-auth.session_token')?.value;

    if (!sessionToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      loginUrl.searchParams.set('admin', '1');
      return NextResponse.redirect(loginUrl);
    }

    // Verify role via API
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
      });

      if (res.ok) {
        const data = await res.json();
        const role = data?.data?.role;
        if (role !== 'admin' && role !== 'superadmin') {
          // User is logged in but not admin — redirect to home
          const homeUrl = new URL('/', request.url);
          homeUrl.searchParams.set('error', 'unauthorized');
          return NextResponse.redirect(homeUrl);
        }
      } else {
        // Session invalid
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      // API unreachable — allow through (client-side will handle)
      return NextResponse.next();
    }

    return NextResponse.next();
  }

  // Wishlist, profile — allow (client-side auth check)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
