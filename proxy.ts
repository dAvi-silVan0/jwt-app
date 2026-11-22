import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
  const session = req.cookies.get('auth_session')?.value;

  if (!session) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/categories/:path*',
    '/authors/:path*',
    '/books/:path*',
    '/readers/:path*',
    '/loans/:path*',
    '/users/:path*',
  ],
};