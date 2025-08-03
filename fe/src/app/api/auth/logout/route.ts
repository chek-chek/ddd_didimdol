// api/auth/logout/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/services/auth.service'

export async function POST(request: NextRequest) {
  try {
    // Supabase Auth로 로그아웃
    await authService.signOut()

    // 응답 생성
    const response = NextResponse.json({
      message: '로그아웃이 완료되었습니다.',
    })

    // 모든 관련 쿠키 삭제
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 0, // 즉시 만료
      path: '/',
    }

    response.cookies.set('sb-access-token', '', cookieOptions)
    response.cookies.set('sb-refresh-token', '', cookieOptions)
    response.cookies.set('user_id', '', cookieOptions)

    return response
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : '로그아웃 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}
