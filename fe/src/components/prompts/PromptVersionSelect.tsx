// components/prompts/PromptVersionSelect.tsx
'use client'

import { Prompt } from '@/types/index.type'
import { useEffect, useState } from 'react'

interface PromptVersionSelectProps {
  /**
   * base_prompt_id (최초 버전의 id) — 같은 묶음의 버전을 불러올 기준 값
   */
  basePromptId: string
  /**
   * 현재 선택된 프롬프트 id (select value)
   */
  selectedPromptId: string
  /**
   * 사용자가 다른 버전을 선택했을 때 호출됩니다.
   */
  onSelect: (prompt: Prompt) => void
  /**
   * 셀렉트 박스 추가 클래스 (선택)
   */
  className?: string
}

export default function PromptVersionSelect({
  basePromptId,
  selectedPromptId,
  onSelect,
  className = '',
}: PromptVersionSelectProps) {
  const [versions, setVersions] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    const fetchVersions = async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/admin/prompts?includeVersions=true&base=${basePromptId}`
        )
        const data = await res.json()
        if (!ignore) setVersions(data as Prompt[])
      } catch (err) {
        /* eslint-disable no-console */
        console.error('버전 목록 로딩 실패', err)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    if (basePromptId) fetchVersions()

    return () => {
      ignore = true
    }
  }, [basePromptId])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    const sel = versions.find((v) => v.id === id)
    if (sel) onSelect(sel)
  }

  return (
    <select
      value={selectedPromptId}
      onChange={handleChange}
      disabled={loading}
      className={`border rounded px-1 py-0.5 text-sm ${className}`.trim()}
    >
      {versions.map((v) => (
        <option key={v.id} value={v.id}>
          {`v${v.version}`}
        </option>
      ))}
    </select>
  )
}
