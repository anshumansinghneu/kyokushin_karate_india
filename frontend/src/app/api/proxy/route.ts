/**
 * API Proxy Route Handler
 *
 * This proxies requests to the backend, hiding the actual backend URL
 * Usage: Instead of calling https://backend.com/api/users
 *        Call /api/proxy?endpoint=users
 *
 * Benefits:
 * - Hides backend URL from client
 * - Can add server-side validation
 * - Can modify requests/responses
 * - Better security
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://kyokushin-api.onrender.com';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
        return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
    }

    try {
        // Get auth token from cookie or header
        const token = request.cookies.get('token')?.value ||
                     request.headers.get('authorization')?.replace('Bearer ', '');

        const response = await fetch(`${BACKEND_URL}/api/${endpoint}`, {
            method: 'GET',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
        return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const token = request.cookies.get('token')?.value ||
                     request.headers.get('authorization')?.replace('Bearer ', '');

        const response = await fetch(`${BACKEND_URL}/api/${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
    }
}

// Add PATCH, DELETE, PUT as needed
