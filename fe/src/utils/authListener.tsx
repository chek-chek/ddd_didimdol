'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'

export default function AuthListener() {
  const setIsLoggedIn = useAuthStore((state) => state.setIsLoggedIn)
  const router = useRouter()
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session && session.user) {
          setIsLoggedIn(true)
        } else {
          router.push('/')
          setIsLoggedIn(false)
        }
      }
    )

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [setIsLoggedIn])

  return null
}
