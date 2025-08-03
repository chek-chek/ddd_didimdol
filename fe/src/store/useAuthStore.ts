// store/useAuthStore.ts
import { create } from 'zustand'

interface AuthState {
  isLoggedIn: boolean
  login: () => void
  logout: () => Promise<void>
  setIsLoggedIn: (value: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  login: () => set({ isLoggedIn: true }),

  logout: async () => {
    // 서버 세션 & 쿠키 제거
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {
      /* 네트워크 오류 시에도 클라이언트 상태는 일단 초기화 */
    })
    set({ isLoggedIn: false })
  },
  setIsLoggedIn: (value) => set({ isLoggedIn: value }),
}))
