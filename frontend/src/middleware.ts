import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/management',
];

// Admin-only routes
const adminRoutes = [
    '/management/admin',
];

// Instructor routes
const instructorRoutes = [
    '/management/instructor',
];

// Public routes that authenticated users shouldn't access
const authRoutes = [
    '/login',
    '/register',
];

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // Check if route is protected
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
    const isInstructorRoute = instructorRoutes.some(route => pathname.startsWith(route));

    // Redirect to login if accessing protected route without token
    if (isProtectedRoute && !token) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    // Redirect to dashboard if accessing auth routes with token
    if (isAuthRoute && token) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    // For role-based routes, you'd need to decode the JWT here
    // This requires edge-compatible JWT library like jose
    // Example:
    // if (isAdminRoute || isInstructorRoute) {
    //     try {
    //         const { payload } = await jwtVerify(token, secret);
    //         if (isAdminRoute && payload.role !== 'ADMIN') {
    //             return NextResponse.redirect(new URL('/dashboard', request.url));
    //         }
    //     } catch {
    //         return NextResponse.redirect(new URL('/login', request.url));
    //     }
    // }

    return NextResponse.next();
}

// Configure which routes middleware runs on
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (public folder)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)',
    ],
};
