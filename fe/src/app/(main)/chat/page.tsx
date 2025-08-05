'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition'
import { toast } from 'sonner'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const [input, setInput] = useState('')
  const [chatId, setChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition()

  // 초기 진입 시 chatId 설정
  useEffect(() => {
    const initializeChatId = async () => {
      // URL에서 chatId 확인
      const urlChatId = searchParams.get('chatId')

      if (urlChatId) {
        // URL에 chatId가 있으면 그대로 사용
        setChatId(urlChatId)
      } else {
        // 없으면 새로운 UUID 받아오기
        try {
          const res = await fetch('/api/chat/initialize')
          const data = await res.json()

          if (data.chatId) {
            setChatId(data.chatId)
            // URL 업데이트 (페이지 리로드 없이)
            const newUrl = `/chat?chatId=${data.chatId}`
            window.history.replaceState({}, '', newUrl)
          }
        } catch (error) {
          console.error('Failed to get new chatId:', error)
          toast.error('채팅 초기화에 실패했습니다.')
        }
      }
    }

    initializeChatId()
  }, [searchParams])

  // 음성 입력이 실시간으로 input에 반영되도록 함
  useEffect(() => {
    if (!loading) {
      setInput(transcript)
    }
  }, [transcript, loading])

  const sendMessage = async () => {
    if (!input.trim() || !chatId) return
    const userMessage = input.trim()

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setInput('')
    resetTranscript()
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          chatId,
          message: userMessage,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.message || '오류 발생')

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.utterance },
      ])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ 오류가 발생했습니다.' },
      ])
      toast.error('메시지 전송에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!listening && transcript.trim() && !loading) {
      sendMessage()
    }
  }, [listening])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening()
    } else {
      SpeechRecognition.startListening({
        language: 'ko-KR',
        continuous: false,
      })
    }
  }

  const handleNewChat = () => {
    // 새 채팅 시작 - chatId 없이 새로고침
    router.push('/chat')
    window.location.reload()
  }

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">채팅</h1>
        <Button variant="outline" onClick={handleNewChat} size="sm">
          새 채팅
        </Button>
      </div>

      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-4 h-full">
          {messages.length === 0 && !loading ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-2xl text-gray-400 select-none">
                {chatId ? '채팅을 시작하세요 ✨' : '채팅을 초기화하는 중...'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-4">
              <div className="flex flex-col gap-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg p-3 max-w-[75%] ${
                      msg.role === 'user'
                        ? 'self-end bg-blue-10'
                        : 'self-start bg-gray-10'
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
                {loading && (
                  <div className="self-start text-gray-500 text-sm">
                    Typing...
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center gap-2">
        <Input
          placeholder={
            chatId ? '메시지를 입력하세요...' : '채팅을 초기화하는 중...'
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading || !chatId}
        />
        <Button
          onClick={sendMessage}
          disabled={loading || !input.trim() || !chatId}
        >
          전송
        </Button>
        <Button
          variant="outline"
          onClick={toggleListening}
          disabled={loading || !chatId}
        >
          {listening ? '🛑 음성 멈추기' : '🎤 음성 입력'}
        </Button>
      </div>

      {!browserSupportsSpeechRecognition && (
        <p className="text-red-500 mt-2">
          ⚠️ 현재 브라우저는 음성 인식을 지원하지 않습니다.
        </p>
      )}
    </div>
  )
}
