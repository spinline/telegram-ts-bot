import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const session = request.cookies.get('session')?.value

    const isAuthRoute = request.nextUrl.pathname.startsWith('/account') ||
        request.nextUrl.pathname.startsWith('/support') ||
        request.nextUrl.pathname.startsWith('/buy') ||
        request.nextUrl.pathname.startsWith('/ticket')

    if (isAuthRoute && !session) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // Session doğrulama kaldırıldı, sadece cookie var mı kontrolü yapılır

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
