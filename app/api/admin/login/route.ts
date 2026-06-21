import { NextRequest, NextResponse } from 'next/server';

// POST /api/admin/login — validates password and sets a cookie
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { password } = body as { password: string };

  const adminPassword = process.env.ADMIN_PASSWORD ?? 'rootx_admin_2024';

  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('admin_token', adminPassword, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  });

  return response;
}
