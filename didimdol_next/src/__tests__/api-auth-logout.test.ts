/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/logout/route'
import { authService } from '@/services/auth.service'

jest.mock('@/services/auth.service', () => ({
  authService: { signOut: jest.fn() },
}))

// signout은 본문이 필요 없음
const buildRequest = () => ({ json: async () => ({}) } as unknown)

describe('/api/auth/signout POST', () => {
  afterEach(() => jest.clearAllMocks())

  it('정상 로그아웃 시 200 & 쿠키 제거', async () => {
    const res = await POST(buildRequest() as any)

    expect(authService.signOut).toHaveBeenCalledTimes(1)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('로그아웃이 완료되었습니다.')

    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toMatch(/sb-access-token=.*Max-Age=0/)
    expect(setCookie).toMatch(/sb-refresh-token=.*Max-Age=0/)
    expect(setCookie).toMatch(/user_id=.*Max-Age=0/)
  })
})
