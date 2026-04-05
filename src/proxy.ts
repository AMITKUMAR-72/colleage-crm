import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    // Determine if the request is destined for the backend API
    if (request.nextUrl.pathname.startsWith('/api/') || request.nextUrl.pathname.startsWith('/auth/')) {

        // Clone headers to mutate them
        const requestHeaders = new Headers(request.headers);

        // Remove origin and referer so the backend Spring Boot server doesn't treat
        // this as a Cross-Origin request and hit 403 Forbidden on its CORS filter.
        requestHeaders.delete('origin');
        requestHeaders.delete('referer');

        // Critical: Set the Host header to the target backend domain so NGINX routes it!
        const backendUrl = process.env.BACKEND_URL || 'https://apis.rafunirp.com';
        try {
            const host = new URL(backendUrl).host;
            requestHeaders.set('host', host);
        } catch {
            requestHeaders.set('host', 'apis.rafunirp.com');
        }

        // Proceed to the proxy setup in next.config.ts with the sanitized headers
        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    }

    return NextResponse.next();
}

export const config = {
    // Optimize proxy so it only runs on API and Auth routes
    matcher: ['/api/:path*', '/auth/:path*'],
};
