import { NextResponse } from 'next/server';
import { clearCache } from '@/lib/cache';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function POST(request: Request) {
  const headerToken = request.headers.get('x-admin-token') || '';
  const envToken = process.env.ADMIN_TOKEN || '';

  if (envToken && headerToken !== envToken) return unauthorized();

  try {
    await clearCache();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  // Allow GET for convenience but require token when ADMIN_TOKEN is set
  const url = new URL(request.url);
  const token = request.headers.get('x-admin-token') || url.searchParams.get('token') || '';
  const envToken = process.env.ADMIN_TOKEN || '';
  if (envToken && token !== envToken) return unauthorized();

  try {
    await clearCache();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
}
