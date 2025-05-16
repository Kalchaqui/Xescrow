import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Redirigir si intentan acceder directamente a los dashboards
  if (path.startsWith('/cliente') || path.startsWith('/proveedor')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}