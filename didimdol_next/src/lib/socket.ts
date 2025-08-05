// src/server/socket.ts
import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { chatService } from '@/services/chat.service'

export function initializeSocketIO(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log('사용자 연결:', socket.id)

    // 사용자 인증 및 방 참여
    socket.on('join-chat', (data: { userId: string; chatId?: string }) => {
      const { userId, chatId } = data

      // 사용자별 룸에 참여
      socket.join(`user-${userId}`)

      if (chatId) {
        socket.join(`chat-${chatId}`)
      }

      console.log(`사용자 ${userId}가 채팅에 참여했습니다.`)
    })

    // 메시지 전송
    socket.on(
      'send-message',
      async (data: { userId: string; chatId?: string; message: string }) => {
        try {
          const { userId, chatId, message } = data

          // 실시간으로 사용자 메시지 전송
          const userMessage = {
            role: 'user' as const,
            content: message,
            timestamp: new Date().toISOString(),
            isTyping: false,
          }

          // 해당 채팅방에 사용자 메시지 즉시 전송
          if (chatId) {
            io.to(`chat-${chatId}`).emit('receive-message', userMessage)
          } else {
            socket.emit('receive-message', userMessage)
          }

          // AI 응답 생성 중 표시
          const typingMessage = {
            role: 'assistant' as const,
            content: '',
            timestamp: new Date().toISOString(),
            isTyping: true,
          }

          if (chatId) {
            io.to(`chat-${chatId}`).emit('receive-message', typingMessage)
          } else {
            socket.emit('receive-message', typingMessage)
          }

          // Python 백엔드 호출 (기존 로직 활용)
          const PYTHON_BACKEND_URL =
            process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'

          let chatHistory: any[] = []
          if (chatId) {
            chatHistory = await chatService.getChatHistory(chatId, userId)
          }

          const response = await fetch(`${PYTHON_BACKEND_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message,
              chat_history: chatHistory.map((msg) => ({
                role: msg.role,
                content: msg.content,
              })),
            }),
          })

          const result = await response.json()
          const assistantMessage = result.answer

          // DB에 저장
          let finalChatId = chatId
          if (!chatId) {
            const created = await chatService.createChat({
              userId,
              userMessage: message,
              assistantMessage,
            })
            finalChatId = created.chatId

            // 새 채팅방에 참여
            socket.join(`chat-${finalChatId}`)
          } else {
            await chatService.updateChat({
              chatId,
              userId,
              userMessage: message,
              assistantMessage,
            })
          }

          // AI 응답 전송
          const aiResponse = {
            role: 'assistant' as const,
            content: assistantMessage,
            timestamp: new Date().toISOString(),
            isTyping: false,
            chatId: finalChatId,
          }

          if (finalChatId) {
            io.to(`chat-${finalChatId}`).emit('receive-message', aiResponse)
          } else {
            socket.emit('receive-message', aiResponse)
          }
        } catch (error) {
          console.error('메시지 처리 오류:', error)
          socket.emit('error', {
            message: '메시지 처리 중 오류가 발생했습니다.',
          })
        }
      }
    )

    // 연결 해제
    socket.on('disconnect', () => {
      console.log('사용자 연결 해제:', socket.id)
    })
  })

  return io
}
