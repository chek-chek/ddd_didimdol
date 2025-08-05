'use client'

import { useEffect, useState, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const {
    chatData,
    handleMutateChatHistory,
    isGetChatHistoryPending,
    setChatData,
  } = useChatHistory()

  useEffect(() => {
    if (chatId) handleMutateChatHistory(chatId)
  }, [chatId, handleMutateChatHistory])

  const userId =
    typeof window !== 'undefined' ? localStorage.getItem('user_id') ?? '' : ''

  const handleAnalyze = async () => {
    try {
      if (!chatData?.chat_history?.length) {
        toast.error('분석할 채팅이 없습니다.')
        return
      }

      setIsAnalyzing(true)

      const conversation = chatData.chat_history
        .map(
          (msg: any) =>
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

      if (!res.ok) throw new Error(data?.error || '분석 실패')

      setAnalysis(data.analyzed_data)
      setChatData((prev: any) => ({
        ...(prev || {}),
        isAnalyzed: true,
        analyzed_content: data.analyzed_data,
      }))

      toast.success('분석 완료')
    } catch (error: any) {
      toast.error('오류 발생: ' + (error?.message ?? '알 수 없는 오류'))
    } finally {
      setIsAnalyzing(false)
    }
  }

  const messages = chatData?.chat_history ?? []
  const analyzedText = chatData?.analyzed_content ?? analysis ?? null

  return (
    <div className="p-6 max-w-3xl mx-auto relative">
      <motion.h1
        className="text-2xl font-bold mb-6"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        채팅 분석
      </motion.h1>

      <Card className="mb-6 overflow-hidden">
        <CardContent className="pt-6 space-y-4">
          {/* 채팅 로딩 상태 */}
          <AnimatePresence mode="wait">
            {isGetChatHistoryPending ? (
              <motion.div
                key="skeleton-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <MessageSkeletonList count={5} />
              </motion.div>
            ) : messages.length > 0 ? (
              <motion.div
                key="message-list"
                initial="hidden"
                animate="show"
                variants={listVariants}
              >
                {messages.map((msg: any, i: number) => (
                  <motion.div key={i} variants={itemVariants}>
                    <div className="text-sm text-muted-foreground mb-1">
                      {msg.role === 'user' ? '👤 사용자' : '🤖 AI'}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">
                      {msg.content}
                    </div>
                    <Separator className="my-3" />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.p
                key="empty"
                className="text-sm text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                채팅 내역이 없습니다.
              </motion.p>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <Button onClick={handleAnalyze} disabled={isAnalyzing} className="mb-6">
        <AnimatePresence mode="wait" initial={false}>
          {isAnalyzing ? (
            <motion.span
              key="loading"
              className="inline-flex items-center gap-2"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              <Spinner />
              분석 중...
            </motion.span>
          ) : analyzedText ? (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              분석 완료
            </motion.span>
          ) : (
            <motion.span
              key="do"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              이 대화 분석하기
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      {/* 분석 결과 섹션 */}
      <AnimatePresence mode="wait">
        {(!!analyzedText || chatData?.isAnalyzed || isAnalyzing) && (
          <motion.div
            key="analysis-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h2 className="text-xl font-semibold">🔍 분석 결과</h2>

                {isAnalyzing && !analyzedText ? (
                  <AnalysisSkeleton />
                ) : (
                  <motion.p
                    className="text-sm whitespace-pre-wrap leading-relaxed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                  >
                    {analyzedText ?? '분석 결과가 아직 준비되지 않았습니다.'}
                  </motion.p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* -------------------- Framer Motion Variants -------------------- */
const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

/* -------------------- UI Pieces: Skeleton / Spinner -------------------- */
function Spinner() {
  return (
    <motion.svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      className="shrink-0"
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        opacity=".25"
      />
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="60"
        strokeDashoffset="40"
        animate={{ strokeDashoffset: [40, 10, 40] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
      />
    </motion.svg>
  )
}

function MessageSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <MessageSkeleton key={i} />
      ))}
    </div>
  )
}

function MessageSkeleton() {
  return (
    <div>
      <div className="mb-1 h-3 w-16 rounded bg-muted/60 relative overflow-hidden">
        <Shimmer />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-3/4 rounded bg-muted/50 relative overflow-hidden">
          <Shimmer />
        </div>
        <div className="h-4 w-2/3 rounded bg-muted/40 relative overflow-hidden">
          <Shimmer />
        </div>
      </div>
      <Separator className="my-3" />
    </div>
  )
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-32 rounded bg-muted/60 relative overflow-hidden">
        <Shimmer />
      </div>
      <div className="h-4 w-full rounded bg-muted/50 relative overflow-hidden">
        <Shimmer />
      </div>
      <div className="h-4 w-11/12 rounded bg-muted/40 relative overflow-hidden">
        <Shimmer />
      </div>
      <div className="h-4 w-10/12 rounded bg-muted/40 relative overflow-hidden">
        <Shimmer />
      </div>
      <div className="h-4 w-9/12 rounded bg-muted/30 relative overflow-hidden">
        <Shimmer />
      </div>
    </div>
  )
}

function Shimmer() {
  return (
    <motion.div
      className="absolute inset-0 -translate-x-full"
      animate={{ x: ['-100%', '100%'] }}
      transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
    >
      <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
    </motion.div>
  )
}
