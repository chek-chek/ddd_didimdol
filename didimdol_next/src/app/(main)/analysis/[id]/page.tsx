'use client'

import { useEffect, useState, use } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useChatHistory } from '@/hooks/useChatHistory'

interface AnalysisDetailPageProps {
  params: Promise<{ id: string }>
}

export default function AnalysisDetailPage({
  params,
}: AnalysisDetailPageProps) {
  const { id: chatId } = use(params)
  const { chatHistory, handleMutateChatHistory, isGetChatHistoryPending } =
    useChatHistory()
  useEffect(() => {
    handleMutateChatHistory(chatId)
  }, [])
  const [analysis, setAnalysis] = useState<string | null>(null)

  const userId =
    typeof window !== 'undefined' ? localStorage.getItem('user_id') ?? '' : ''

  useEffect(() => {
    const fetchData = async () => {
      try {
        const analysisRes = await fetch(`/api/analyze/${chatId}`)
        const analysisData = await analysisRes.json()
        if (analysisData?.content) {
          setAnalysis(analysisData.content)
        }
      } catch (error: any) {
        toast.error('오류 발생' + error.message)
      }
    }

    if (userId) fetchData()
  }, [chatId, userId])

  const handleAnalyze = async () => {
    try {
      const conversation = chatHistory
        .map(
          (msg) =>
            `${msg.role === 'user' ? '👤 사용자' : '🤖 AI'}: ${msg.content}`
        )
        .join('\n')

      const prompt = `다음은 사용자와 AI의 대화입니다. 이 대화를 최대한 자세하고 깊이 있게 분석해줘. 핵심 포인트, 감정 흐름, 맥락, 행동 추천 등 가능한 한 많은 내용을 포함해서 설명해줘.\n\n${conversation}`

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, chatId, userId }),
      })

      const data = await res.json()

      if (res.ok) {
        setAnalysis(data.analyzed_data)
        toast.success('분석 완료')
      } else {
        throw new Error(data.error || '분석 실패')
      }
    } catch (error: any) {
      toast.error('오류 발생' + error.message)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">채팅 분석</h1>

      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          {chatHistory.length > 0 ? (
            chatHistory.map((msg, i) => (
              <div key={i}>
                <div className="text-sm text-muted-foreground mb-1">
                  {msg.role === 'user' ? '👤 사용자' : '🤖 AI'}
                </div>
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                <Separator className="my-3" />
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">채팅 내역이 없습니다.</p>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleAnalyze} disabled={!!analysis} className="mb-6">
        {isGetChatHistoryPending
          ? '분석 중...'
          : analysis
          ? '분석 완료됨'
          : '이 대화 분석하기'}
      </Button>

      {analysis && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-xl font-semibold">🔍 분석 결과</h2>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {analysis}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
