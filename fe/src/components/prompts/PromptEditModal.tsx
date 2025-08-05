'use client'

import { Prompt } from '@/types/index.type'
import { useState } from 'react'

export default function PromptEditModal({
  prompt,
  onClose,
  onSave,
}: {
  prompt: Prompt
  onClose: () => void
  onSave: (updated: Prompt) => void
}) {
  const [title, setTitle] = useState(prompt.title)
  const [content, setContent] = useState(prompt.content)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)

    const res = await fetch('/api/admin/prompts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptId: prompt.id, title, content }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      alert(data.error || '수정 실패')
      return
    }

    onSave(data)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-md w-[400px] space-y-4">
        <h2 className="text-lg font-bold">프롬프트 수정</h2>
        <input
          className="w-full border rounded-md px-3 py-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
        />
        <textarea
          className="w-full border rounded-md px-3 py-2 text-sm h-32"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용"
        />

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="text-gray-500 hover:underline">
            취소
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 text-sm"
            disabled={loading}
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
