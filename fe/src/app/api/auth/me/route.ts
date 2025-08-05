import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/services/auth.service'

export async function GET(request: NextRequest) {
  try {
    // 현재 사용자 정보 조회
    const user = await authService.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      message: '사용자 정보 조회 성공',
      user,
    })
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : '사용자 정보 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}
