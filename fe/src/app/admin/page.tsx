'use client'

import PromptEditModal from '@/components/prompts/PromptEditModal'
import { Prompt, User } from '@/types/index.type'
import { useEffect, useState } from 'react'

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)

  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [adding, setAdding] = useState(false)

  const addPrompt = async () => {
    if (!newTitle.trim() || !newContent.trim()) return
    setAdding(true)

    const res = await fetch('/api/admin/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, content: newContent }),
    })
    const data = await res.json()
    setAdding(false)

    if (!res.ok) {
      alert(data.error || '추가 실패')
      return
    }

    setPrompts((prev) => [data, ...prev])
    setNewTitle('')
    setNewContent('')
  }
  const handleUpdatePrompt = (updated: Prompt) => {
    setPrompts((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
    )
  }
  useEffect(() => {
    const fetchData = async () => {
      const userRes = await fetch('/api/admin/users')
      const usersData = await userRes.json()

      const promptRes = await fetch('/api/admin/prompts')
      const promptsData = await promptRes.json()

      setUsers(usersData)
      setPrompts(promptsData)
      setLoading(false)
    }

    fetchData()
  }, [])

  const deletePrompt = async (id: string) => {
    if (!confirm('정말로 삭제하시겠습니까?')) return

    const res = await fetch('/api/admin/prompts', {
      method: 'DELETE',
      body: JSON.stringify({ promptId: id }),
    })

    if (res.ok) {
      setPrompts((prev) => prev.filter((p) => p.id !== id))
    }
  }

  if (loading) return <div className="p-6">로딩 중...</div>

  console.log(prompts, users)
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">🛠️ 관리자 페이지</h1>

      <section>
        <h2 className="text-xl font-semibold mb-2">👤 사용자 목록</h2>
        <table className="w-full border text-sm">
          <thead className="bg-gray-10 text-left">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">이름</th>
              <th className="p-2 border">이메일</th>
              <th className="p-2 border">가입일</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="p-2 border">{user.id}</td>
                <td className="p-2 border">{user.name}</td>
                <td className="p-2 border">{user.email}</td>
                <td className="p-2 border">
                  {new Date(user.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">📝 프롬프트 목록</h2>
        <table className="w-full border text-sm">
          <thead className="bg-gray-10 text-left">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">제목</th>
              <th className="p-2 border">내용</th>
              <th className="p-2 border">버젼</th>
              <th className="p-2 border">관리</th>
            </tr>
          </thead>
          <tbody>
            {prompts.map((prompt) => (
              <tr key={prompt.id}>
                <td className="p-2 border">{prompt.id}</td>
                <td className="p-2 border">{prompt.title}</td>
                <td className="p-2 border">{prompt.content}</td>
                <td className="p-2 border">v{prompt.version}</td>
                <td className="p-2 border">
                  <button onClick={() => setEditingPrompt(prompt)}>
                    수정{' '}
                  </button>
                  <button
                    className="pl-2"
                    onClick={() => deletePrompt(prompt.id)}
                  >
                    {' '}
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">프롬프트 추가</h2>
        <div className="space-y-2">
          <input
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="제목"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <textarea
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="내용"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            onClick={addPrompt}
            disabled={adding}
          >
            {adding ? '추가 중...' : '프롬프트 추가'}
          </button>
        </div>
      </section>
      {editingPrompt && (
        <PromptEditModal
          prompt={editingPrompt}
          onClose={() => setEditingPrompt(null)}
          onSave={handleUpdatePrompt}
        />
      )}
    </div>
  )
}
