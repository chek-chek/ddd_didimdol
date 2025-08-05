import { getChatHistory } from '@/apis/chatApi'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

type ChatData =
  | {
      id: string
      created_at: string
      user_id: string
      chat_history: ChatMessage[]
      chat_title: string
      updated_at: string
      isAnalyzed: true
      analyzed_content: string
    }
  | {
      id: string
      created_at: string
      user_id: string
      chat_history: ChatMessage[]
      chat_title: string
      updated_at: string
      isAnalyzed: false
      analyzed_content?: undefined
    }

export function useChatHistory() {
  const [chatData, setChatData] = useState<ChatData | null>(null)

  const {
    mutate: handleMutateChatHistory,
    isPending: isGetChatHistoryPending,
  } = useMutation({
    // getChatHistory는 (chatId: string) => Promise<ChatData> 형태라고 가정
    mutationFn: getChatHistory,
    onSuccess: (data: any) => {
      setChatData(data)
    },
  })

  return {
    chatData,
    setChatData, // 분석 후 즉시 반영을 위해 외부에서도 갱신 가능
    handleMutateChatHistory, // 사용: handleMutateChatHistory(chatId)
    isGetChatHistoryPending,
  }
}
