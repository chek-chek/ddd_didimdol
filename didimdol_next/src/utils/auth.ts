// src/utils/auth.ts
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function getUserFromRequest(request: NextRequest) {
  const accessToken = request.cookies.get('sb-access-token')?.value

  if (!accessToken) {
    throw new Error('인증이 필요합니다.')
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken)

  if (error || !user) {
    throw new Error('유효하지 않은 인증입니다.')
  }

  return user
}
