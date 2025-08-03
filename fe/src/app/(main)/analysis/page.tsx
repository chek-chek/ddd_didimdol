'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from 'next/navigation'

type Chat = {
  chatId: string
  title: string
  createdAt: string
  updatedAt: string
  isAnalyzed: boolean
  firstChat: string
}

export default function AnalysisPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await fetch('/api/chat', { method: 'GET' })
        const data = await res.json()
        if (res.ok) {
          setChats(data.chats)
        } else {
          console.error(data.message)
        }
      } catch (error) {
        console.error('채팅 목록 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchChats()
  }, [])

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">내 채팅 분석</h1>
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : chats.length === 0 ? (
        <p className="text-muted-foreground">채팅 내역이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chats.map((chat) => (
            <Card
              className="cursor-pointer"
              key={chat.chatId}
              onClick={() => router.push(`/analysis/${chat.chatId}`)}
            >
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="text-base">{chat.title}</CardTitle>

                <Badge variant={chat.isAnalyzed ? 'default' : 'outline'}>
                  {chat.isAnalyzed ? '분석 완료' : '분석 x'}
                </Badge>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                생성일: {new Date(chat.createdAt).toLocaleString('ko-KR')}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
