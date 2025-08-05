import { NextRequest, NextResponse } from 'next/server'
import { Server as SocketIOServer } from 'socket.io'
import { createServer } from 'http'
import { initializeSocketIO } from '@/lib/socket'

let io: SocketIOServer | null = null

export async function GET(request: NextRequest) {
  if (!io) {
    // HTTP 서버 생성
    const httpServer = createServer()

    // Socket.IO 초기화
    io = initializeSocketIO(httpServer)

    console.log('Socket.IO 서버가 초기화되었습니다.')
  }

  return NextResponse.json({ message: 'Socket.IO 서버가 실행 중입니다.' })
}

// Socket.IO 인스턴스를 외부에서 접근할 수 있도록 export
export function getSocketIOInstance() {
  return io
}
