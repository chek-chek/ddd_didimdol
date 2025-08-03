import { createClient } from '@/lib/supabase/server'

export interface SignUpParams {
  name: string
  email: string
  password: string
}

export interface SignInParams {
  email: string
  password: string
}

export interface User {
  id: string
  name: string
  email: string
  created_at: string
}

export class AuthService {
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
   * 회원가입
   */
  async signUp({
    name,
    email,
    password,
  }: SignUpParams): Promise<{ user: User; session: any }> {
    const supabase = await this.getSupabaseClient()

    // Supabase Auth로 회원가입
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name, // 메타데이터로 이름 저장
        },
      },
    })

    if (authError) {
      throw new Error(`회원가입 중 오류가 발생했습니다: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('회원가입에 실패했습니다.')
    }

    // 추가 사용자 정보를 별도 테이블에 저장 (선택사항)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        name,
        email,
      })

    if (profileError) {
      // 프로필 저장 실패 시 로그만 남기고 계속 진행
      console.error('프로필 저장 실패:', profileError)
    }

    return {
      user: {
        id: authData.user.id,
        name,
        email,
        created_at: authData.user.created_at || new Date().toISOString(),
      },
      session: authData.session,
    }
  }

  /**
   * 로그인
   */
  async signIn({
    email,
    password,
  }: SignInParams): Promise<{ user: User; session: any }> {
    const supabase = await this.getSupabaseClient()

    // Supabase Auth로 로그인
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (authError) {
      throw new Error(`로그인 중 오류가 발생했습니다: ${authError.message}`)
    }

    if (!authData.user || !authData.session) {
      throw new Error('로그인에 실패했습니다.')
    }

    // 사용자 프로필 정보 가져오기
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('name')
      .eq('id', authData.user.id)
      .single()

    return {
      user: {
        id: authData.user.id,
        name: profileData?.name || authData.user.user_metadata?.name || '',
        email: authData.user.email || '',
        created_at: authData.user.created_at || new Date().toISOString(),
      },
      session: authData.session,
    }
  }

  /**
   * 로그아웃
   */
  async signOut(): Promise<void> {
    const supabase = await this.getSupabaseClient()

    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(`로그아웃 중 오류가 발생했습니다: ${error.message}`)
    }
  }

  /**
   * 현재 사용자 정보 조회
   */
  async getCurrentUser(): Promise<User | null> {
    const supabase = await this.getSupabaseClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    // 사용자 프로필 정보 가져오기
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('name')
      .eq('id', user.id)
      .single()

    return {
      id: user.id,
      name: profileData?.name || user.user_metadata?.name || '',
      email: user.email || '',
      created_at: user.created_at || new Date().toISOString(),
    }
  }

  /**
   * 세션 검증
   */
  async getSession(): Promise<any> {
    const supabase = await this.getSupabaseClient()

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      throw new Error(`세션 조회 중 오류가 발생했습니다: ${error.message}`)
    }

    return session
  }

  /**
   * 사용자 ID로 사용자 정보 조회
   */
  async getUserById(userId: string): Promise<User | null> {
    const supabase = await this.getSupabaseClient()

    // 프로필 테이블에서 사용자 정보 조회
    const { data: profileData, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !profileData) {
      return null
    }

    return {
      id: profileData.id,
      name: profileData.name,
      email: profileData.email,
      created_at: profileData.created_at,
    }
  }
}

// 싱글톤 인스턴스 생성
export const authService = new AuthService()
