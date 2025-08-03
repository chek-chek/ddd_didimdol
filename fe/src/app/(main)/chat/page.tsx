'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const [input, setInput] = useState('')
  const [chatId, setChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition()

  // 음성 입력이 실시간으로 input에 반영되도록 함
  useEffect(() => {
    if (!loading) {
      setInput(transcript)
    }
  }, [transcript, loading])

  const sendMessage = async () => {
    if (!input.trim()) return
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
      if (data.chatId) {
        setChatId(data.chatId)
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ 오류가 발생했습니다.' },
      ])
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
        continuous: false, // 💡 단일 문장만 인식 후 자동 종료
      })
    }
  }

  return (
    <div className="flex flex-col h-full p-4">
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-4 h-full">
          {messages.length === 0 && !loading ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-2xl text-gray-400 select-none">
                채팅을 시작하세요 ✨
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
          placeholder="메시지를 입력하세요..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim()}>
          전송
        </Button>
        <Button variant="outline" onClick={toggleListening} disabled={loading}>
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
