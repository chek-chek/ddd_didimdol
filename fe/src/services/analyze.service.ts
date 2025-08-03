import { supabase } from '@/lib/supabase/client'

interface AnalyzeData {
  chat_id: string
  user_id: string
  content: string
  // 필요한 추가 필드들을 여기에 명시하세요
}

export async function createAnalyze(data: AnalyzeData) {
  const { data: inserted, error } = await supabase
    .from('chat_analysis') // 테이블 이름
    .insert(data)
    .single()
  console.log(error)
  if (error) throw error
  return inserted
}

export async function getChatHistoryFromId(chatId: string) {
  const { data, error } = await supabase
    .from('chat')
    .select('*')
    .eq('id', chatId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getAnalyzeByChatId(chatId: string) {
  const { data, error } = await supabase
    .from('chat_analysis')
    .select('*')
    .eq('chat_id', chatId)
    .maybeSingle()

  if (error) throw error
  return data
}
