// src/app/api/auth/signin/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/services/auth.service'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // 필수 필드 검증
    if (!email || !password) {
      return NextResponse.json(
        { message: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 로그인 처리
    const result = await authService.signIn({ email, password })

    // 응답 생성
    const response = NextResponse.json({
      message: '로그인이 완료되었습니다.',
      user: result.user,
    })

    // Supabase 세션 토큰을 쿠키에 설정
    if (result.session) {
      response.cookies.set('sb-access-token', result.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: result.session.expires_in || 3600,
        path: '/',
      })

      response.cookies.set('sb-refresh-token', result.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7일
        path: '/',
      })

      // 사용자 ID도 별도 쿠키에 저장 (기존 코드와의 호환성)
      response.cookies.set('user_id', result.user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7일
        path: '/',
      })
    }

    return response
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : '로그인 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}
