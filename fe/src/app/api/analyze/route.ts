import { NextRequest, NextResponse } from 'next/server'
import { chatService } from '@/services/chat.service'
import { createAnalyze } from '@/services/analyze.service'
import { getUserFromRequest } from '@/utils/auth'

export async function POST(request: NextRequest) {
  try {
    const { chatId } = await request.json()

    // 인증된 사용자 정보 가져오기
    const user = await getUserFromRequest(request)
    const userId = user.id

    if (!chatId || !userId) {
      return NextResponse.json(
        { message: '알 수 없는 오류입니다. 다시 시도해주십시오.' },
        { status: 500 }
      )
    }

    const chatData = await chatService.getChatForAnalysis(chatId, userId)
    const chatHistory = chatData.chat_history

    if (!chatHistory) {
      return NextResponse.json(
        { message: '채팅 히스토리를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 여기 이제 agent 통해서 분석하기
    const analyzed_data = '대충 분석된 데이터.'
    await createAnalyze({
      chat_id: chatId,
      user_id: userId,
      content: analyzed_data,
    })

    await chatService.updateIsAnalyzed(chatId)

    return NextResponse.json({
      message: '분석이 완료되었습니다.',
      analyzed_data,
    })
  } catch (error) {
    // 인증 에러인 경우 401 상태 코드 반환
    if (
      error instanceof Error &&
      (error.message.includes('인증이 필요합니다') ||
        error.message.includes('유효하지 않은 인증입니다'))
    ) {
      return NextResponse.json({ message: error.message }, { status: 401 })
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : '분석 중 에러입니다. 다시 시도해주십시오.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}
