import { NextRequest, NextResponse } from 'next/server'
import { chatService } from '@/services/chat.service'
import { getUserFromRequest } from '@/utils/auth'

export async function GET(
  request: NextRequest,
  contextPromise: Promise<{ params: { id: string } }>
) {
  const { params } = await contextPromise
  const chatId = params.id
  const user = await getUserFromRequest(request)
  const userId = user.id

  try {
    const chat = await chatService.getChatForAnalysis(chatId, userId)

    return NextResponse.json(chat)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
