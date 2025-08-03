/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/signup/route'
import { authService } from '@/services/auth.service'

jest.mock('@/services/auth.service', () => ({
  authService: { signUp: jest.fn() },
}))

const buildRequest = ({
  name,
  email,
  password,
}: {
  name?: string
  email?: string
  password?: string
}) =>
  ({
    json: async () => ({ name, email, password }),
  } as unknown)

describe('/api/auth/signup POST', () => {
  afterEach(() => jest.clearAllMocks())

  it('모든 필드가 없으면 400', async () => {
    const res = await POST(buildRequest({ email: 'a@b.com' }) as any)

    expect(res.status).toBe(400)
    expect((await res.json()).message).toBe('모든 필드를 입력해주세요.')
  })

  it('정상 회원가입 시 200 & 쿠키 설정', async () => {
    ;(authService.signUp as jest.Mock).mockResolvedValue({
      user: { id: 'u2', email: 'a@b.com', name: 'alice', created_at: '' },
      session: {
        access_token: 'at',
        refresh_token: 'rt',
        expires_in: 3600,
      },
    })

    const res = await POST(
      buildRequest({
        name: 'alice',
        email: 'a@b.com',
        password: 'pw',
      }) as any
    )

    expect(authService.signUp).toHaveBeenCalledWith({
      name: 'alice',
      email: 'a@b.com',
      password: 'pw',
    })

    expect(res.status).toBe(200)
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain('sb-access-token=')
    expect(setCookie).toContain('sb-refresh-token=')
    expect(setCookie).toContain('user_id=')
  })
})
