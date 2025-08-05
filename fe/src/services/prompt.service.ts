// services/prompt.service.ts
import { createClient } from '@/lib/supabase/server'

export interface Prompt {
  id: string
  user_id: string
  title: string
  content: string
  created_at: string
}

export interface CreatePromptParams {
  userId: string
  title: string
  content: string
}

export interface UpdatePromptParams {
  promptId: string
  userId: string
  title?: string
  content?: string
}

export class PromptService {
  private supabase: any

  constructor() {
    this.supabase = null
  }

  private async getSupabaseClient() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * 프롬프트 생성
   */
  async createPrompt({
    userId,
    title,
    content,
  }: CreatePromptParams): Promise<Prompt> {
    const supabase = await this.getSupabaseClient()

    const { data, error } = await supabase
      .from('prompts')
      .insert({ user_id: userId, title, content })
      .select('*')
      .single()

    if (error) {
      throw new Error(`프롬프트 생성 중 오류가 발생했습니다: ${error.message}`)
    }

    return data as Prompt
  }

  /**
   * 특정 사용자 프롬프트 목록 가져오기
   */
  async getPromptsByUser(userId: string): Promise<Prompt[]> {
    const supabase = await this.getSupabaseClient()

    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`프롬프트 조회 중 오류가 발생했습니다: ${error.message}`)
    }

    return data as Prompt[]
  }

  /**
   * 특정 프롬프트 조회
   */
  async getPromptById(
    promptId: string,
    userId: string
  ): Promise<Prompt | null> {
    const supabase = await this.getSupabaseClient()

    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', promptId)
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return data as Prompt
  }

  /**
   * 프롬프트 수정
   */
  async updatePrompt({
    promptId,
    userId,
    title,
    content,
  }: UpdatePromptParams): Promise<Prompt> {
    const supabase = await this.getSupabaseClient()

    const { data, error } = await supabase
      .from('prompts')
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq('id', promptId)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) {
      throw new Error(`프롬프트 수정 중 오류가 발생했습니다: ${error.message}`)
    }

    return data as Prompt
  }

  /**
   * 프롬프트 삭제
   */
  async deletePrompt(promptId: string, userId: string): Promise<void> {
    const supabase = await this.getSupabaseClient()

    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', promptId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`프롬프트 삭제 중 오류가 발생했습니다: ${error.message}`)
    }
  }
}

// 싱글톤 인스턴스
export const promptService = new PromptService()
