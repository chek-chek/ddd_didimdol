import { NextRequest, NextResponse } from 'next/server'
import { getAnalyzeByChatId } from '@/services/analyze.service'
import { getUserFromRequest } from '@/utils/auth'

export async function GET(
  request: NextRequest,
  contextPromise: Promise<{ params: { chatId: string } }>
) {
  try {
    const { params } = await contextPromise
    const chatId = params.chatId

    // 인증된 사용자 정보 가져오기
    const user = await getUserFromRequest(request)
    const userId = user.id

    // chat_analysis 테이블에서 분석 데이터 조회
    const analysisData = await getAnalyzeByChatId(chatId)

    if (!analysisData) {
      return NextResponse.json(
        { message: '분석 데이터가 없습니다.' },
        { status: 404 }
      )
    }

    // 사용자 검증 (본인의 분석인지 확인)
    if (analysisData.user_id !== userId) {
      return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 })
    }

    return NextResponse.json(analysisData)
  } catch (error: any) {
    if (
      error instanceof Error &&
      (error.message.includes('인증이 필요합니다') ||
        error.message.includes('유효하지 않은 인증입니다'))
    ) {
      return NextResponse.json({ message: error.message }, { status: 401 })
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
