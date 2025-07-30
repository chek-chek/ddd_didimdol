// src/utils/auth.middleware.ts
import { NextRequest } from 'next/server'
import { authService } from '@/services/auth.service'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    name: string
    email: string
    created_at: string
  }
}

/**
 * 인증 상태 확인 미들웨어
 */
export async function verifyAuth(request: NextRequest): Promise<{
  isAuthenticated: boolean
  user?: {
    id: string
    name: string
    email: string
    created_at: string
  }
  error?: string
}> {
  try {
    // 현재 사용자 정보 조회 (Supabase Auth 사용)
    const user = await authService.getCurrentUser()

    if (!user) {
      return {
        isAuthenticated: false,
        error: '인증이 필요합니다.',
      }
    }

    return {
      isAuthenticated: true,
      user,
    }
  } catch (error) {
    return {
      isAuthenticated: false,
      error:
        error instanceof Error
          ? error.message
          : '인증 확인 중 오류가 발생했습니다.',
    }
  }
}

/**
 * 인증이 필요한 API 라우트에서 사용할 수 있는 헬퍼 함수
 */
export async function requireAuth(request: NextRequest) {
  const authResult = await verifyAuth(request)

  if (!authResult.isAuthenticated) {
    throw new Error(authResult.error || '인증이 필요합니다.')
  }

  return authResult.user!
}

/**
 * Supabase 세션 토큰을 쿠키에서 가져와서 설정하는 헬퍼 함수
 */
export function getSupabaseTokensFromCookies(request: NextRequest) {
  const accessToken = request.cookies.get('sb-access-token')?.value
  const refreshToken = request.cookies.get('sb-refresh-token')?.value

  return {
    accessToken,
    refreshToken,
  }
}

/**
 * 서버 사이드에서 Supabase 클라이언트에 토큰 설정
 */
export async function setSupabaseSession(request: NextRequest) {
  const { accessToken, refreshToken } = getSupabaseTokensFromCookies(request)

  if (!accessToken || !refreshToken) {
    return null
  }

  try {
    const supabase = await import('@/lib/supabase/server').then((m) =>
      m.createClient()
    )

    // 세션 설정
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    return supabase
  } catch (error) {
    console.error('Supabase 세션 설정 실패:', error)
    return null
  }
}
