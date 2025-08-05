/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/signin/route'
import { authService } from '@/services/auth.service'

jest.mock('@/services/auth.service', () => ({
  authService: {
    signIn: jest.fn(),
  },
}))

const buildRequest = ({
  email,
  password,
}: {
  email?: string
  password?: string
}) =>
  ({
    json: async () => ({ email, password }),
  } as unknown)

describe('/api/auth/signin POST', () => {
  afterEach(() => jest.clearAllMocks())

  it('필수 값이 없으면 400', async () => {
    const res = await POST(buildRequest({ email: 'a@b.com' }) as any)

    expect(res.status).toBe(400)
    expect((await res.json()).message).toBe('이메일과 비밀번호를 입력해주세요.')
  })

  it('정상 로그인 시 토큰 쿠키를 설정하고 200', async () => {
    ;(authService.signIn as jest.Mock).mockResolvedValue({
      user: { id: 'u1', email: 'a@b.com', name: 'alice', created_at: '' },
      session: {
        access_token: 'at',
        refresh_token: 'rt',
        expires_in: 3600,
      },
    })

    const res = await POST(
      buildRequest({ email: 'a@b.com', password: 'pw' }) as any
    )

    expect(authService.signIn).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'pw',
    })

    // 응답 검사
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('로그인이 완료되었습니다.')
    expect(body.user.id).toBe('u1')

    // 쿠키 헤더(단일·중복 모두 포함) 존재 여부
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain('sb-access-token=')
    expect(setCookie).toContain('sb-refresh-token=')
    expect(setCookie).toContain('user_id=')
  })
})
