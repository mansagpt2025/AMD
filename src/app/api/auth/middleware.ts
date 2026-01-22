// app/api/auth/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // التحقق من الـ Content-Type لطلبات POST
  if (request.method === 'POST') {
    const contentType = request.headers.get('content-type')
    
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'يجب أن يكون Content-Type: application/json' },
        { status: 400 }
      )
    }
  }

  // السماح بجميع الطلبات
  return NextResponse.next()
}

export const config = {
  matcher: '/api/auth/:path*'
}