import { NextRequest, NextResponse } from 'next/server'
import { chatService } from '@/services/chat.service'

export async function GET(
  request: NextRequest,
  contextPromise: Promise<{ params: { id: string } }>
) {
  const { params } = await contextPromise
  const chatId = params.id
  const userId = request.cookies.get('user_id')?.value

  console.log(chatId, userId)

  if (!userId) {
    return NextResponse.json({ error: 'userId 누락됨' }, { status: 400 })
  }

  try {
    const chat = await chatService.getChatForAnalysis(chatId, userId)

    return NextResponse.json(chat)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
