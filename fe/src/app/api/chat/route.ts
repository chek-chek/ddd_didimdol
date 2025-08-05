// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { chatService } from '@/services/chat.service'
import { getUserFromRequest } from '@/utils/auth'

// Python 백엔드 URL (환경변수로 관리 권장)
const PYTHON_BACKEND_URL =
  process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'

interface ChatHistory {
  role: 'user' | 'assistant'
  content: string
}

async function callPythonRAG(message: string, chatHistory: ChatHistory[] = []) {
  try {
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        chat_history: chatHistory,
      }),
    })

    if (!response.ok) {
      throw new Error(`Python API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.answer
  } catch (error) {
    console.error('Error calling Python RAG:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { chatId, message } = await request.json()

    // 사용자 ID 가져오기
    const user = await getUserFromRequest(request)
    const userId = user.id

    if (!message) {
      return NextResponse.json(
        { message: '메시지가 필요합니다.' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    let answer = ''
    let finalChatId = chatId
    let chatHistory: ChatHistory[] = []

    const existingChat = await chatService.getChatHistory(chatId, userId)

    if (existingChat.length == 0) {
      // 처음하는 발화이면 - 히스토리 없이 호출
      // console.log('처음')
      answer = await callPythonRAG(message)
      // answer = '답1'
      console.log(chatId, userId, message, answer)
      // 새로운 채팅 생성
      const result = await chatService.createChat({
        chatId,
        userId,
        userMessage: message,
        assistantMessage: answer,
      })
      finalChatId = result.chatId
    } else {
      // 채팅이 있었으면

      // 채팅 히스토리 포맷팅
      chatHistory = existingChat.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }))

      // Python RAG 호출
      answer = await callPythonRAG(message, chatHistory)
      // answer = '답'
      // 기존 채팅 업데이트
      await chatService.updateChat({
        chatId,
        userId,
        userMessage: message,
        assistantMessage: answer,
      })
    }

    return NextResponse.json({
      message: '발화 성공',
      utterance: answer,
      chatId: finalChatId,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : '발화 중 오류가 발생했습니다. 다시 시도해주십시오.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // 기존 코드 유지
  try {
    const userId = request.cookies.get('user_id')?.value

    if (!userId) {
      return NextResponse.json(
        { message: '인증 정보가 없습니다.' },
        { status: 401 }
      )
    }

    // 채팅 내역 조회 (user_id 기준)
    const chats = await chatService.getChatsByUserId(userId)

    // chat_title이 없을 경우 기본 제목 지정
    const formattedChats = chats.map((chat: any) => ({
      chatId: chat.id,
      createdAt: chat.created_at,
      updatedAt: chat.updated_at,
      firstChat: chat.chat_history[0].content,
      title:
        chat.chat_title ??
        `${new Date(chat.created_at).toLocaleString('ko-KR')}`,
      isAnalyzed: chat.isAnalyzed,
    }))

    return NextResponse.json({
      message: '채팅 내역 조회 성공',
      chats: formattedChats,
    })
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : '채팅 내역 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}
