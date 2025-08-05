'use client'
import { useState } from 'react'
import LoginModal from '@/components/auth/authModal'

export default function SomePage() {
  const [showLogin, setShowLogin] = useState(false)

  return (
    <>
      <button onClick={() => setShowLogin(true)}>🔐 로그인</button>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  )
}
