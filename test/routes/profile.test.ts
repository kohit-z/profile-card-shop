import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import app from '../../src/index'

const originalToken = process.env.GITHUB_TOKEN
const originalGiphyKey = process.env.GIPHY_API_KEY

const activityFields = {
  createdAt: '2010-01-01T00:00:00Z',
  isGitHubStar: true,
  hasSponsorsListing: true,
  organizations: { totalCount: 1 },
  pullRequests: { totalCount: 100 },
  issues: { totalCount: 100 },
  repositoriesContributedTo: { totalCount: 25 },
  starredRepositories: { totalCount: 10 },
} as const

function profileResponse({
  bio = 'Code & <cats> 🙂',
  name = 'Octo <& "猫"',
}: {
  bio?: string | null
  name?: string | null
} = {}): Response {
  return Response.json({
    data: {
      user: {
        login: 'octocat',
        name,
        bio,
        avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
        ...activityFields,
        followers: { totalCount: 12 },
        pinnedItems: { nodes: [] },
        repositories: {
          totalCount: 34,
          nodes: [
            {
              stargazerCount: 56,
              primaryLanguage: { name: 'TypeScript' },
            },
          ],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
        contributionsCollection: {
          totalCommitContributions: 3,
          totalIssueContributions: 25,
          totalPullRequestContributions: 50,
          totalPullRequestReviewContributions: 150,
          contributionCalendar: { totalContributions: 78, weeks: [] },
        },
      },
    },
  })
}

function mockSuccessfulFetch(profile = profileResponse()): void {
  vi.stubGlobal(
    'fetch',
    vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(profile)
      .mockResolvedValueOnce(
        new Response(new Uint8Array([137, 80, 78, 71]), {
          headers: { 'Content-Type': 'image/png' },
        }),
      ),
  )
}

function appendGiphyFetches(): void {
  vi.mocked(fetch)
    .mockResolvedValueOnce(
      Response.json({
        data: [
          {
            id: 'abc123',
            title: 'Coding cat',
            images: {
              fixed_height: {
                url: 'https://media1.giphy.com/media/abc123/200.gif',
                width: '320',
                height: '200',
              },
            },
          },
        ],
      }),
    )
    .mockResolvedValueOnce(
      new Response(new Uint8Array([0, 1, 2]), {
        headers: { 'Content-Type': 'image/gif' },
      }),
    )
}

beforeEach(() => {
  process.env.GITHUB_TOKEN = 'test-token'
  process.env.GIPHY_API_KEY = 'test-giphy-key'
})

afterEach(() => {
  vi.unstubAllGlobals()
  if (originalToken === undefined) {
    delete process.env.GITHUB_TOKEN
  } else {
    process.env.GITHUB_TOKEN = originalToken
  }
  if (originalGiphyKey === undefined) {
    delete process.env.GIPHY_API_KEY
  } else {
    process.env.GIPHY_API_KEY = originalGiphyKey
  }
})

describe('GET /api/profile', () => {
  it('is advertised as available by the service index', async () => {
    const response = await app.request('/meta')
    const body = await response.json()

    expect(body.routes.profile).toMatchObject({
      method: 'GET',
      path: '/api/profile?username=<name>&theme=<theme>&effect=<effect>&bannerGiphy=<search-or-id>',
      status: 'available',
    })
  })

  it('serves canonical input as a cacheable accessible themed SVG', async () => {
    mockSuccessfulFetch()

    const response = await app.request(
      '/api/profile?username=octocat&theme=nebula',
    )
    const svg = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe(
      'image/svg+xml; charset=UTF-8',
    )
    expect(response.headers.get('cache-control')).toBe(
      'public, s-maxage=3600, stale-while-revalidate=86400',
    )
    expect(response.headers.has('location')).toBe(false)
    expect(response.headers.has('x-github-deco-error')).toBe(false)
    expect(svg).toContain('width="842" height="492"')
    expect(svg).toContain('data-theme-renderer="nebula"')
    expect(svg).toContain('data-nebula-banner="true"')
    expect(svg).toContain('data-auto-badges="true"')
    expect(svg.match(/data-badge-kind="level"/g)).toHaveLength(1)
    expect(svg).toContain('data-badge-id="github-star"')
    expect(svg).toContain('data-badge-kind="achievement"')
    expect(svg).toContain('data-badge-overflow=')
    expect(svg).not.toContain('data-nebula-status')
    expect(svg).not.toContain('Online — Building things')
    expect(svg).not.toContain('>GITHUB</text>')
    expect(svg).toContain('role="img"')
    expect(svg).toContain('data-effect="pulse"')
    expect(svg).toContain('data-stat="followers"')
    expect(svg).toContain('Octo &lt;&amp; &quot;猫&quot;')
    expect(svg).toContain('Code &amp; &lt;cats&gt; 🙂')
    expect(svg).not.toContain('Octo <&')
    expect(svg).toContain('data:image/png;base64,iVBORw==')
    expect(svg).toContain('Followers')
    expect(svg).toContain('Repositories')
    expect(svg).toContain('Stars')
    expect(svg).toContain('Contributions')
    expect(svg).toContain('>12<')
    expect(svg).toContain('>34<')
    expect(svg).toContain('>56<')
    expect(svg).toContain('>78<')
  })

  it('renders a selected Giphy GIF in the nebula banner', async () => {
    mockSuccessfulFetch()
    appendGiphyFetches()

    const response = await app.request(
      '/api/profile?username=octocat&theme=nebula&bannerGiphy=coding',
    )
    const svg = await response.text()

    expect(response.status).toBe(200)
    expect(svg).toContain('data-nebula-banner-gif="abc123"')
    expect(svg).toContain('href="data:image/gif;base64,AAEC"')
  })

  it('renders a selected effect candidate in the SVG', async () => {
    mockSuccessfulFetch()

    const response = await app.request(
      '/api/profile?username=octocat&effect=orbit',
    )
    const svg = await response.text()

    expect(response.status).toBe(200)
    expect(svg).toContain('data-effect="orbit"')
    expect(svg).toContain('animateTransform')
  })

  it.each([
    [
      'uppercase username',
      '/api/profile?username=OctoCat',
      '/api/profile?username=octocat',
    ],
    [
      'parameter order and theme casing',
      '/api/profile?theme=NEBULA&username=OctoCat',
      '/api/profile?username=octocat&theme=nebula',
    ],
    [
      'effect casing and order',
      '/api/profile?effect=ORBIT&username=OctoCat&theme=nebula',
      '/api/profile?username=octocat&theme=nebula&effect=orbit',
    ],
    [
      'unknown parameters',
      '/api/profile?username=octocat&utm_source=readme',
      '/api/profile?username=octocat',
    ],
    [
      'duplicate and explicit default parameters',
      '/api/profile?username=octocat&username=other&theme=default&theme=nebula&effect=pulse',
      '/api/profile?username=octocat',
    ],
    [
      'non-canonical encoding',
      '/api/profile?username=%6fctocat',
      '/api/profile?username=octocat',
    ],
  ])(
    'redirects %s to one canonical cache key without fetching',
    async (_label, requestTarget, redirectTarget) => {
      const fetchMock = vi.fn<typeof fetch>()
      vi.stubGlobal('fetch', fetchMock)

      const response = await app.request(requestTarget)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe(redirectTarget)
      expect(fetchMock).not.toHaveBeenCalled()
    },
  )

  it('renders a readable fallback when the bio is missing', async () => {
    mockSuccessfulFetch(profileResponse({ bio: null, name: null }))

    const response = await app.request('/api/profile?username=octocat')
    const svg = await response.text()

    expect(response.status).toBe(200)
    expect(svg).toContain('octocat')
    expect(svg).toContain('GitHub profile')
  })

  it('truncates a long bio without inserting the full value', async () => {
    const longBio = `Unicode 🙂 ${'x'.repeat(200)}`
    mockSuccessfulFetch(profileResponse({ bio: longBio }))

    const svg = await (
      await app.request('/api/profile?username=octocat')
    ).text()

    expect(svg).toContain('Unicode 🙂')
    expect(svg).toContain('…')
    expect(svg).not.toContain(longBio)
  })

  it('returns an HTTP 200 no-store SVG error for invalid usernames', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)

    const response = await app.request('/api/profile?username=%3Cscript%3E')
    const svg = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe(
      'image/svg+xml; charset=UTF-8',
    )
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('x-github-deco-error')).toBe(
      'username_invalid',
    )
    expect(svg).toContain('Invalid profile request')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns a safe configuration error when the token is missing', async () => {
    delete process.env.GITHUB_TOKEN
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)

    const response = await app.request('/api/profile?username=octocat')
    const svg = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('x-github-deco-error')).toBe('missing_token')
    expect(svg).not.toContain('test-token')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps upstream failures to a readable no-store SVG without raw details', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          new Response('private upstream failure', { status: 503 }),
        ),
    )

    const response = await app.request('/api/profile?username=octocat')
    const svg = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('x-github-deco-error')).toBe('upstream_error')
    expect(svg).toContain('GitHub is temporarily unavailable.')
    expect(svg).not.toContain('private upstream failure')
  })
})
