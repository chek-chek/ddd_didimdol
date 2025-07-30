import { NextRequest, NextResponse } from 'next/server'
import { getChatHistoryFromId } from '@/services/analyze.service'

export async function GET(
  request: NextRequest,
  contextPromise: Promise<{ params: { id: string } }>
) {
  const { params } = await contextPromise
  const chatId = params.id

  try {
    const data = await getChatHistoryFromId(chatId)
    console.log(data)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
