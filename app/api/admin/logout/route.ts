import { NextResponse } from 'next/server';

// POST /api/admin/logout — clears the admin session cookie
export async function POST() {
  const response = NextResponse.redirect(
    new URL('/admin/login', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
  );
  response.cookies.delete('admin_token');
  return response;
}
