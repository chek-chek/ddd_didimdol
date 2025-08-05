import { chatService } from '@/services/chat.service'
import { getUserFromRequest } from '@/utils/auth'
import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 인증된 사용자 정보 가져오기
    const user = await getUserFromRequest(request)
    console.log(user)
    const userId = user.id

    // URL에서 chatId 쿼리 파라미터 확인
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('chatId')

    if (chatId) {
      // chatId가 있으면 채팅 히스토리 반환
      const chatData = await chatService.getChatForAnalysis(chatId, userId)

      if (!chatData || !chatData.chat_history) {
        return NextResponse.json(
          { message: '채팅 히스토리를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        chatId,
        chat_history: chatData.chat_history,
      })
    } else {
      // chatId가 없으면 새로운 채팅 ID 생성
      const uuid = randomUUID()
      return NextResponse.json({ chatId: uuid })
    }
  } catch (error) {
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
            : '요청 처리 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
