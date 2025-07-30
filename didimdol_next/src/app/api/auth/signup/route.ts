// app/api/auth/sinup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/services/auth.service'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()
    // console.log(name, email, password)
    // 필수 필드 검증 (간단한 서버 검증)
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: '모든 필드를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 회원가입 처리
    const result = await authService.signUp({ name, email, password })

    // 응답 생성
    const response = NextResponse.json({
      message: '회원가입이 완료되었습니다.',
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
            : '회원가입 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}
