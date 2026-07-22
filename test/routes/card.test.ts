import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import app from '../../src/index'

const originalToken = process.env.GITHUB_TOKEN

function mockProfile(): void {
  vi.stubGlobal(
    'fetch',
    vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({
          data: {
            user: {
              login: 'octocat',
              name: 'The Octocat',
              bio: 'GitHub mascot',
              avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
              followers: { totalCount: 12 },
              repositories: {
                totalCount: 34,
                nodes: [{ stargazerCount: 56 }],
                pageInfo: { hasNextPage: false, endCursor: null },
              },
              contributionsCollection: {
                contributionCalendar: { totalContributions: 78 },
              },
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(new Uint8Array([137, 80, 78, 71]), {
          headers: { 'Content-Type': 'image/png' },
        }),
      ),
  )
}

beforeEach(() => {
  process.env.GITHUB_TOKEN = 'test-token'
})

afterEach(() => {
  vi.unstubAllGlobals()
  if (originalToken === undefined) {
    delete process.env.GITHUB_TOKEN
  } else {
    process.env.GITHUB_TOKEN = originalToken
  }
})

describe('GET /api/card', () => {
  it('renders ordered composable sections with scoped effects', async () => {
    mockProfile()

    const response = await app.request(
      '/api/card?sections=profile,stats,skills&username=octocat&skills=typescript,react&theme=dark&effects=card:shimmer,avatar:orbit,skills:grid',
    )
    const svg = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('s-maxage=3600')
    expect(svg).toContain('data-sections="profile,stats,skills"')
    expect(svg).toContain('data-card-effect="shimmer"')
    expect(svg).toContain('data-avatar-effect="orbit"')
    expect(svg).toContain('data-section="skills"')
    expect(svg).toContain('data-section-effect="grid"')
    expect(svg).toContain('data-skill="typescript"')
  })

  it('renders skills without fetching GitHub when no profile data is needed', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)

    const response = await app.request(
      '/api/card?sections=skills&skills=typescript',
    )
    const svg = await response.text()

    expect(response.status).toBe(200)
    expect(svg).toContain('data-sections="skills"')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not download an avatar for a stats-only card', async () => {
    mockProfile()

    const response = await app.request(
      '/api/card?sections=stats&username=octocat',
    )
    const svg = await response.text()

    expect(svg).toContain('data-sections="stats"')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('redirects equivalent card queries to one cache key before fetching', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)

    const response = await app.request(
      '/api/card?theme=DARK&skills=React,typescript&username=OCTOCAT&sections=profile,skills&effects=skills:GRID,card:SHIMMER&utm_source=readme',
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      '/api/card?sections=profile,skills&username=octocat&skills=react,typescript&theme=dark&effects=card:shimmer,skills:grid',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns a safe no-store error when GitHub access is not configured', async () => {
    delete process.env.GITHUB_TOKEN
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)

    const response = await app.request(
      '/api/card?sections=profile&username=octocat',
    )
    const svg = await response.text()

    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('x-github-deco-error')).toBe('missing_token')
    expect(svg).toContain('Card unavailable')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps upstream GitHub failures to safe no-store errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response('private upstream detail', { status: 503 }),
      ),
    )

    const response = await app.request(
      '/api/card?sections=stats&username=octocat',
    )
    const svg = await response.text()

    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('x-github-deco-error')).toBe('upstream_error')
    expect(svg).toContain('GitHub is temporarily unavailable.')
    expect(svg).not.toContain('private upstream detail')
  })

  it.each([
    ['/api/card?sections=profile', 'username_required'],
    ['/api/card?sections=skills', 'skills_required'],
    ['/api/card?sections=unknown', 'section_unknown'],
    [
      '/api/card?sections=skills&skills=typescript&effects=avatar:shimmer',
      'effect_invalid',
    ],
    [
      '/api/card?sections=stats&username=octocat&effects=avatar:pulse',
      'effect_invalid',
    ],
    [
      '/api/card?sections=profile&username=octocat&effects=skills:grid',
      'effect_invalid',
    ],
    [
      `/api/card?sections=${'skills,'.repeat(30)}&skills=typescript`,
      'sections_too_long',
    ],
    [
      `/api/card?sections=skills&skills=typescript&effects=${'card:shimmer,'.repeat(40)}`,
      'effects_too_long',
    ],
  ])('returns a safe SVG error for invalid composition %s', async (url, code) => {
    const response = await app.request(url)

    expect(response.status).toBe(200)
    expect(response.headers.get('x-github-deco-error')).toBe(code)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
})
