import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/services/auth.service'

export async function GET(request: NextRequest) {
  try {
    const session = await authService.getSession()

    if (!session) {
      return NextResponse.json({ message: '세션이 없습니다.' }, { status: 401 })
    }

    return NextResponse.json({
      message: '세션 조회 성공',
      session,
    })
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : '세션 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}
