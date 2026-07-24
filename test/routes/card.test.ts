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
              ...activityFields,
              followers: { totalCount: 12 },
              pinnedItems: {
                nodes: [
                  {
                    name: 'Hello-World',
                    description: 'My first repository on GitHub!',
                    url: 'https://github.com/octocat/Hello-World',
                    stargazerCount: 2500,
                    primaryLanguage: { name: 'C', color: '#555555' },
                  },
                  {
                    name: 'Spoon-Knife',
                    description: null,
                    url: 'https://github.com/octocat/Spoon-Knife',
                    stargazerCount: 100,
                    primaryLanguage: null,
                  },
                ],
              },
              repositories: {
                totalCount: 34,
                nodes: [
                  {
                    stargazerCount: 56,
                    primaryLanguage: { name: 'C' },
                  },
                ],
                pageInfo: { hasNextPage: false, endCursor: null },
              },
              contributionsCollection: {
                totalCommitContributions: 3,
                totalIssueContributions: 25,
                totalPullRequestContributions: 50,
                totalPullRequestReviewContributions: 150,
                contributionCalendar: {
                  totalContributions: 78,
                  weeks: [
                    {
                      contributionDays: [
                        {
                          date: '2025-01-05',
                          contributionCount: 3,
                          contributionLevel: 'SECOND_QUARTILE',
                          color: '#40c463',
                        },
                        {
                          date: '2025-01-06',
                          contributionCount: 0,
                          contributionLevel: 'NONE',
                          color: '#ebedf0',
                        },
                        {
                          date: '2025-01-07',
                          contributionCount: 1,
                          contributionLevel: 'FIRST_QUARTILE',
                          color: '#9be9a8',
                        },
                        {
                          date: '2025-01-08',
                          contributionCount: 0,
                          contributionLevel: 'NONE',
                          color: '#ebedf0',
                        },
                        {
                          date: '2025-01-09',
                          contributionCount: 5,
                          contributionLevel: 'THIRD_QUARTILE',
                          color: '#30a14e',
                        },
                        {
                          date: '2025-01-10',
                          contributionCount: 0,
                          contributionLevel: 'NONE',
                          color: '#ebedf0',
                        },
                        {
                          date: '2025-01-11',
                          contributionCount: 8,
                          contributionLevel: 'FOURTH_QUARTILE',
                          color: '#216e39',
                        },
                      ],
                    },
                  ],
                },
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

function mockGiphy(): void {
  vi.stubGlobal('fetch', vi.fn<typeof fetch>())
  appendGiphyFetches()
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

describe('GET /api/card', () => {
  it('renders ordered composable sections with scoped effects', async () => {
    mockProfile()

    const response = await app.request(
      '/api/card?sections=profile,stats,skills&username=octocat&skills=typescript,react&theme=nebula&effects=card:shimmer,avatar:orbit,skills:grid',
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
    expect(svg).toContain('data-theme-renderer="nebula"')
    expect(svg).toContain('data-nebula-banner="true"')
    expect(svg).toContain('data-auto-badges="true"')
    expect(svg.match(/data-badge-kind="level"/g)).toHaveLength(1)
    expect(svg).toContain('data-badge-id="github-star"')
    expect(svg).toContain('data-badge-overflow=')
    expect(svg).not.toContain('Online — Building things')
    expect(svg).not.toContain('>GITHUB</text>')
    expect(svg).toContain('width="842" height="630"')
  })

  it('uses a self-contained profile and full-bleed stats when they are not adjacent', async () => {
    mockProfile()

    const response = await app.request(
      '/api/card?sections=profile,skills,stats&username=octocat&skills=typescript',
    )
    const svg = await response.text()

    expect(response.status).toBe(200)
    expect(svg).toContain('data-layout="full"')
    expect(svg).toContain('width="842" height="486"')
    expect(svg).not.toContain('data-layout="paired"')
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

  it('renders contact and donate sections with an independent background effect', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)

    const response = await app.request(
      '/api/card?sections=contact,donate&contact=email:hello%40example.com,github:octocat,telegram:octocat,whatsapp:15551234567&donate=kofi:octocat,github-sponsors:octocat&theme=nebula&effects=background:matrix,contact:grid',
    )
    const svg = await response.text()

    expect(response.status).toBe(200)
    expect(svg).toContain('data-sections="contact,donate"')
    expect(svg).toContain('data-background-effect="matrix"')
    expect(svg).toContain('data-effect-layer="background"')
    expect(svg).toContain('data-section="contact"')
    expect(svg).toContain('data-section-effect="grid"')
    expect(svg).toContain('data-contact="email"')
    expect(svg).toContain('data-contact="telegram"')
    expect(svg).toContain('data-contact="whatsapp"')
    expect(svg).toContain('data-donate="kofi"')
    expect(svg).toContain('data-nebula-links="contact"')
    expect(svg).toContain('data-nebula-links="donate"')
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
      '/api/card?theme=NEBULA&skills=React,typescript&username=OCTOCAT&sections=profile,skills&effects=skills:GRID,card:SHIMMER&utm_source=readme',
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      '/api/card?sections=profile,skills&username=octocat&skills=react,typescript&theme=nebula&effects=card:shimmer,skills:grid',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('canonicalizes stale iconBorder input away without validation errors', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)

    const response = await app.request(
      '/api/card?sections=skills&skills=typescript&iconBorder=glow',
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      '/api/card?sections=skills&skills=typescript',
    )
    expect(response.headers.get('x-github-deco-error')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not redirect when commas and colons are already percent-encoded', async () => {
    mockProfile()

    const response = await app.request(
      '/api/card?sections=profile%2Cstats%2Cskills&username=octocat&skills=typescript%2Creact&effects=avatar%3Apulse',
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
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

  it('renders pinned projects from the GitHub profile', async () => {
    mockProfile()

    const response = await app.request(
      '/api/card?sections=projects&username=octocat&theme=nebula&effects=projects:grid',
    )
    const svg = await response.text()

    expect(response.status).toBe(200)
    expect(svg).toContain('data-sections="projects"')
    expect(svg).toContain('data-section="projects"')
    expect(svg).toContain('data-section-effect="grid"')
    expect(svg).toContain('data-project="Hello-World"')
    expect(svg).toContain('data-project="Spoon-Knife"')
    expect(svg).toContain('href="https://github.com/octocat/Hello-World"')
    expect(svg).toContain('Pinned Projects')
    expect(svg).toContain('data-nebula-projects="true"')
  })

  it('renders the contribution graph from the GitHub profile', async () => {
    mockProfile()

    const response = await app.request(
      '/api/card?sections=contributions&username=octocat&theme=nebula&effects=contributions:grid',
    )
    const svg = await response.text()

    expect(response.status).toBe(200)
    expect(svg).toContain('data-sections="contributions"')
    expect(svg).toContain('data-section="contributions"')
    expect(svg).toContain('data-section-effect="grid"')
    expect(svg).toContain('data-contributions="true"')
    expect(svg).toContain('data-contribution-day="2025-01-11"')
    expect(svg).toContain('Contributions')
    expect(svg).toContain('data-nebula-contributions="true"')
    expect(svg).not.toContain('in the last year')
  })

  it('keeps the card available when the projects section has no pins', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValueOnce(
        Response.json({
          data: {
            user: {
              login: 'octocat',
              name: 'The Octocat',
              bio: 'GitHub mascot',
              avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
              ...activityFields,
              followers: { totalCount: 12 },
              pinnedItems: { nodes: [] },
              repositories: {
                totalCount: 0,
                nodes: [],
                pageInfo: { hasNextPage: false, endCursor: null },
              },
              contributionsCollection: {
                totalCommitContributions: 0,
                totalIssueContributions: 0,
                totalPullRequestContributions: 0,
                totalPullRequestReviewContributions: 0,
                contributionCalendar: { totalContributions: 0, weeks: [] },
              },
            },
          },
        }),
      ),
    )

    const response = await app.request(
      '/api/card?sections=stats,projects&username=octocat',
    )
    const svg = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('x-github-deco-error')).toBeNull()
    expect(svg).toContain('data-sections="stats,projects"')
    expect(svg).toContain('data-projects-empty="true"')
    expect(svg).toContain('Pinned Projects')
  })

  it('renders a custom Giphy GIF section', async () => {
    mockGiphy()

    const response = await app.request(
      '/api/card?sections=giphy&giphy=coding&theme=nebula&effects=giphy:grid',
    )
    const svg = await response.text()

    expect(response.status).toBe(200)
    expect(svg).toContain('data-sections="giphy"')
    expect(svg).toContain('data-section="giphy"')
    expect(svg).toContain('data-giphy="abc123"')
    expect(svg).not.toContain('Custom GIF')
    expect(svg).not.toContain('Powered by GIPHY')
    expect(svg).toContain('data-nebula-giphy="true"')
    expect(svg).toContain('data-section-effect="grid"')
  })

  it('renders a selected Giphy GIF in the nebula profile banner', async () => {
    mockProfile()
    appendGiphyFetches()

    const response = await app.request(
      '/api/card?sections=profile,stats&username=octocat&bannerGiphy=coding&theme=nebula',
    )
    const svg = await response.text()

    expect(response.status).toBe(200)
    expect(svg).toContain('data-nebula-banner-gif="abc123"')
    expect(svg).toContain('href="data:image/gif;base64,AAEC"')
  })

  it('returns a safe SVG error when Giphy is not configured', async () => {
    delete process.env.GIPHY_API_KEY

    const response = await app.request('/api/card?sections=giphy&giphy=coding')

    expect(response.status).toBe(200)
    expect(response.headers.get('x-github-deco-error')).toBe('missing_api_key')
  })

  it.each([
    ['/api/card?sections=profile', 'username_required'],
    ['/api/card?sections=projects', 'username_required'],
    ['/api/card?sections=contributions', 'username_required'],
    ['/api/card?sections=skills', 'skills_required'],
    ['/api/card?sections=contact', 'contact_required'],
    ['/api/card?sections=donate', 'donate_required'],
    ['/api/card?sections=giphy', 'giphy_required'],
    ['/api/card?sections=contact&contact=unknown:value', 'contact_unknown'],
    ['/api/card?sections=donate&donate=unknown:value', 'donate_unknown'],
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
