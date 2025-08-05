import { getChatHistory } from '@/apis/chatApi'
import { ChatMessage } from '@/services/chat.service'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

export function useChatHistory() {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])

  const {
    mutate: handleMutateChatHistory,
    isPending: isGetChatHistoryPending,
  } = useMutation({
    mutationFn: getChatHistory,
    onSuccess: (data: any) => {
      console.log(data)
      setChatHistory(data.chat_history)
    },
  })
  return { chatHistory, handleMutateChatHistory, isGetChatHistoryPending }
}
