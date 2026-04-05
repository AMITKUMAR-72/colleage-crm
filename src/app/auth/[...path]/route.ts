import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.BACKEND_URL || 'https://api.rafunirp.com';

async function handler(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    const backendUrl = `${BACKEND_BASE.replace(/\/$/, '')}/auth/${path.join('/')}${request.nextUrl.search}`;

    const forwardHeaders: Record<string, string> = {
        'Accept': 'application/json',
    };

    const contentType = request.headers.get('content-type');
    if (contentType) {
        forwardHeaders['Content-Type'] = contentType;
    }

    const authorization = request.headers.get('authorization');
    if (authorization) {
        forwardHeaders['Authorization'] = authorization;
    }

    const method = request.method.toUpperCase();
    let body: ArrayBuffer | undefined;

    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
            body = await request.arrayBuffer();
        } catch {
            body = undefined;
        }
    }

    try {
        const backendResponse = await fetch(backendUrl, {
            method,
            headers: forwardHeaders,
            body: body || undefined,
            redirect: 'follow',
        });

        const responseText = await backendResponse.text();

        return new NextResponse(responseText, {
            status: backendResponse.status,
            headers: {
                'Content-Type': backendResponse.headers.get('Content-Type') || 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (err) {
        console.error(`[Proxy] Failed to reach backend: ${backendUrl}`, err);
        return NextResponse.json(
            { success: false, message: 'Could not reach the backend server.' },
            { status: 502 }
        );
    }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = async () =>
    new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept',
        },
    });
