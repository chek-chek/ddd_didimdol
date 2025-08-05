// app/api/admin/prompts/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/* ---------------------------------------------------------------------- */
/* GET  ─ 모든 프롬프트 목록 --------------------------------------------- */
/* ---------------------------------------------------------------------- */
export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('prompts')
    .select('id, title, content, version, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

/* ---------------------------------------------------------------------- */
/* DELETE  ─ 프롬프트 삭제 ----------------------------------------------- */
/* ---------------------------------------------------------------------- */
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { promptId } = await req.json()

  const { error } = await supabase.from('prompts').delete().eq('id', promptId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

/* ---------------------------------------------------------------------- */
/* PATCH  ─ 프롬프트 수정(버전 +1) ---------------------------------------- */
/* ---------------------------------------------------------------------- */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { promptId, title, content } = await req.json()

  /* 현재 버전 확인 */
  const { data: current, error: selErr } = await supabase
    .from('prompts')
    .select('version')
    .eq('id', promptId)
    .single()

  if (selErr)
    return NextResponse.json({ error: selErr.message }, { status: 500 })

  const newVersion = (current?.version ?? 0) + 1

  /* 버전 +1 후 업데이트 */
  const { data, error } = await supabase
    .from('prompts')
    .update({
      title,
      content,
      version: newVersion,
    })
    .eq('id', promptId)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

/* ---------------------------------------------------------------------- */
/* POST  ─ 새 프롬프트(버전=1) 또는 동일 제목 새 프롬프트(버전 이어받기) ---- */
/* ---------------------------------------------------------------------- */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { title, content } = await req.json()

  /* 같은 제목의 최신 버전 조회 → 새로 만들 때 이어받을 버전 계산 */
  const { data: latest } = await supabase
    .from('prompts')
    .select('version')
    .eq('title', title)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  const newVersion = latest ? latest.version + 1 : 1

  const { data, error } = await supabase
    .from('prompts')
    .insert({ title, content, version: newVersion })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
