import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  GitHubServiceError,
  MAX_REPOSITORY_PAGES,
  fetchGitHubProfile,
} from '../../src/services/github'

const originalToken = process.env.GITHUB_TOKEN

function graphQlResponse({
  after = null,
  avatarUrl = 'https://avatars.githubusercontent.com/u/1?v=4',
  bio = 'Ship useful things.',
  hasNextPage = false,
  nodes = [{ stargazerCount: 7 }],
  user = true,
}: {
  after?: string | null
  avatarUrl?: string
  bio?: string | null
  hasNextPage?: boolean
  nodes?: Array<{ stargazerCount: number }>
  user?: boolean
} = {}): Response {
  return Response.json({
    data: {
      user: user
        ? {
            login: 'octocat',
            name: 'The Octocat',
            bio,
            avatarUrl,
            followers: { totalCount: 42 },
            repositories: {
              totalCount: 101,
              nodes,
              pageInfo: {
                hasNextPage,
                endCursor: after,
              },
            },
            contributionsCollection: {
              contributionCalendar: { totalContributions: 365 },
            },
          }
        : null,
    },
  })
}

function avatarResponse(
  contentType = 'image/png',
  bytes = new Uint8Array([0, 1, 2]),
  extraHeaders: HeadersInit = {},
): Response {
  return new Response(bytes, {
    headers: {
      'Content-Type': contentType,
      ...Object.fromEntries(new Headers(extraHeaders)),
    },
  })
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  if (originalToken === undefined) {
    delete process.env.GITHUB_TOKEN
  } else {
    process.env.GITHUB_TOKEN = originalToken
  }
})

describe('fetchGitHubProfile', () => {
  it('uses GraphQL variables, paginates repositories, and embeds the avatar', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        graphQlResponse({
          after: 'next-page',
          hasNextPage: true,
          nodes: [{ stargazerCount: 2 }, { stargazerCount: 3 }],
        }),
      )
      .mockResolvedValueOnce(
        graphQlResponse({
          nodes: [{ stargazerCount: 5 }],
        }),
      )
      .mockResolvedValueOnce(avatarResponse())
    vi.stubGlobal('fetch', fetchMock)

    const profile = await fetchGitHubProfile('octocat', {
      token: 'secret-token',
    })

    expect(profile).toEqual({
      login: 'octocat',
      name: 'The Octocat',
      bio: 'Ship useful things.',
      avatarDataUrl: 'data:image/png;base64,AAEC',
      followers: 42,
      repositories: 101,
      stars: 10,
      contributions: 365,
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)

    const firstRequest = fetchMock.mock.calls[0]
    const firstBody = JSON.parse(String(firstRequest[1]?.body))
    expect(firstRequest[0]).toBe('https://api.github.com/graphql')
    expect(firstRequest[1]?.headers).toMatchObject({
      Authorization: 'Bearer secret-token',
    })
    expect(firstBody.variables).toEqual({ login: 'octocat', after: null })
    expect(firstBody.query).not.toContain('octocat')

    const secondBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body))
    expect(secondBody.variables).toEqual({
      login: 'octocat',
      after: 'next-page',
    })
    expect(fetchMock.mock.calls[2][0]).toBe(
      'https://avatars.githubusercontent.com/u/1?v=4',
    )
    expect(fetchMock.mock.calls[2][1]).not.toHaveProperty('headers')
  })

  it('rejects a missing token before making a request', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      fetchGitHubProfile('octocat', { token: undefined }),
    ).rejects.toMatchObject({
      code: 'missing_token',
      message: expect.not.stringContaining('undefined'),
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    [
      'not-found GraphQL errors',
      Response.json({
        data: { user: null },
        errors: [{ message: 'Could not resolve user', type: 'NOT_FOUND' }],
      }),
      'user_not_found',
    ],
    [
      'other GraphQL errors',
      Response.json({
        errors: [{ message: 'Sensitive upstream detail', type: 'FORBIDDEN' }],
      }),
      'graphql_error',
    ],
    [
      'GraphQL rate limiting',
      Response.json({
        errors: [
          {
            message: 'API rate limit exceeded',
            extensions: { code: 'RATE_LIMITED' },
          },
        ],
      }),
      'rate_limited',
    ],
    ['a malformed payload', Response.json({ data: { user: { login: 42 } } }), 'malformed_response'],
    ['rate limiting', new Response('slow down', { status: 429 }), 'rate_limited'],
    ['an upstream failure', new Response('secret failure', { status: 503 }), 'upstream_error'],
  ])('returns a safe typed error for %s', async (_label, response, code) => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(response))

    await expect(
      fetchGitHubProfile('octocat', { token: 'secret-token' }),
    ).rejects.toMatchObject({
      code,
      message: expect.not.stringContaining('Sensitive upstream detail'),
    })
  })

  it('rejects avatar URLs outside GitHub-controlled hosts', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        graphQlResponse({ avatarUrl: 'https://example.com/avatar.png' }),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      fetchGitHubProfile('octocat', { token: 'secret-token' }),
    ).rejects.toMatchObject({ code: 'avatar_untrusted_host' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    [
      'unsupported media',
      avatarResponse('image/svg+xml', new TextEncoder().encode('<svg/>')),
      'avatar_unsupported_type',
    ],
    [
      'an oversized response',
      avatarResponse('image/png', new Uint8Array([0]), {
        'Content-Length': String(2_000_001),
      }),
      'avatar_too_large',
    ],
  ])('rejects %s for avatars', async (_label, avatar, code) => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(graphQlResponse())
      .mockResolvedValueOnce(avatar)
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      fetchGitHubProfile('octocat', { token: 'secret-token' }),
    ).rejects.toMatchObject({ code })
  })

  it('turns a bounded request timeout into a safe typed error', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(
        (_input, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              reject(new DOMException('request aborted', 'AbortError'))
            })
          }),
      ),
    )

    const request = fetchGitHubProfile('octocat', {
      token: 'secret-token',
      timeoutMs: 10,
    })
    const expectation = expect(request).rejects.toMatchObject({
      code: 'timeout',
    })

    await vi.advanceTimersByTimeAsync(11)
    await expectation
  })

  it('uses one deadline across repository pages instead of resetting it', async () => {
    vi.useFakeTimers()
    const signals: AbortSignal[] = []
    let requestNumber = 0
    const fetchMock = vi.fn<typeof fetch>((_input, init) => {
      requestNumber += 1
      const response =
        requestNumber === 1
          ? graphQlResponse({
              after: 'next-page',
              hasNextPage: true,
            })
          : graphQlResponse()

      return new Promise((resolve, reject) => {
        if (init?.signal) {
          signals.push(init.signal)
          init.signal.addEventListener('abort', () => {
            reject(new DOMException('request aborted', 'AbortError'))
          })
        }
        setTimeout(() => resolve(response), 6)
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const request = fetchGitHubProfile('octocat', {
      token: 'secret-token',
      timeoutMs: 10,
    })
    const expectation = expect(request).rejects.toMatchObject({
      code: 'timeout',
      message: expect.not.stringContaining('request aborted'),
    })

    await vi.advanceTimersByTimeAsync(6)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(5)
    expect(signals[1]?.aborted).toBe(true)
    await expectation
  })

  it('fails safely when repository pagination exceeds its page budget', async () => {
    let requestNumber = 0
    const fetchMock = vi.fn<typeof fetch>(() => {
      requestNumber += 1
      if (requestNumber <= MAX_REPOSITORY_PAGES) {
        return Promise.resolve(
          graphQlResponse({
            after: `cursor-${requestNumber}`,
            hasNextPage: true,
          }),
        )
      }
      if (requestNumber === MAX_REPOSITORY_PAGES + 1) {
        return Promise.resolve(graphQlResponse())
      }
      return Promise.resolve(avatarResponse())
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      fetchGitHubProfile('octocat', { token: 'secret-token' }),
    ).rejects.toMatchObject({
      code: 'repository_page_limit',
      message: expect.not.stringContaining('cursor-'),
    })
    expect(fetchMock).toHaveBeenCalledTimes(MAX_REPOSITORY_PAGES)
  })

  it('does not expose raw exception or token details', () => {
    const error = new GitHubServiceError('upstream_error')

    expect(error.message).not.toContain('secret-token')
    expect(error.message).not.toContain('Sensitive upstream detail')
  })
})
