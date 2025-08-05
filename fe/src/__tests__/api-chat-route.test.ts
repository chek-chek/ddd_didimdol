/**
 * @jest-environment node
 */

import { POST } from '@/app/api/chat/route' // 경로를 프로젝트 구조에 맞게 수정
import { chatService } from '@/services/chat.service'

// 1️⃣ ChatService 메서드를 전부 Mock 처리
jest.mock('@/services/chat.service', () => ({
  chatService: {
    createChat: jest.fn(),
    updateChat: jest.fn(),
  },
}))

/**
 * 테스트용 NextRequest stub.
 *  - request.json()  ➜ { chatId, message } 반환
 *  - request.cookies.get('user_id') ➜ { value: userId } 또는 undefined
 */
const buildRequest = ({
  chatId,
  message,
  userId,
}: {
  chatId?: string
  message?: string
  userId?: string
}) =>
  ({
    json: async () => ({ chatId, message }),
    cookies: {
      get: (name: string) =>
        name === 'user_id' && userId ? { value: userId } : undefined,
    },
  } as unknown)

describe('/api/chat POST', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('메시지가 없으면 400을 반환한다', async () => {
    const res = await POST(buildRequest({ userId: 'u1' }) as any)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toBe('메시지가 필요합니다.')
  })

  it('인증되지 않은 요청이면 401을 반환한다', async () => {
    const res = await POST(buildRequest({ message: 'hello' }) as any)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.message).toBe('인증이 필요합니다.')
  })

  it('chatId가 없을 때 새 채팅을 생성한다', async () => {
    ;(chatService.createChat as jest.Mock).mockResolvedValue({
      chatId: 'chat-123',
      chatHistory: [],
    })

    const res = await POST(
      buildRequest({ message: '안녕!', userId: 'user-1' }) as any
    )

    // createChat가 올바른 인수로 호출되었는지 검증
    expect(chatService.createChat).toHaveBeenCalledWith({
      userId: 'user-1',
      userMessage: '안녕!',
      assistantMessage: 'first text',
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.utterance).toBe('first text')
    expect(body.chatId).toBe('chat-123')
  })

  it('기존 chatId가 있으면 채팅을 업데이트한다', async () => {
    ;(chatService.updateChat as jest.Mock).mockResolvedValue({})

    const res = await POST(
      buildRequest({
        chatId: 'chat-123',
        message: '다시 왔어',
        userId: 'user-1',
      }) as any
    )

    // updateChat가 올바른 인수로 호출되었는지 검증
    expect(chatService.updateChat).toHaveBeenCalledWith({
      chatId: 'chat-123',
      userId: 'user-1',
      userMessage: '다시 왔어',
      assistantMessage: 'second text',
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.utterance).toBe('second text')
    expect(body.chatId).toBe('chat-123')
  })
})
