import { describe, expect, it } from 'vitest'

import { evaluateBadges, type BadgeEvaluation } from '../../src/data/badges'
import { EFFECT_NAMES } from '../../src/effects'
import type { GitHubProfile } from '../../src/services/github'
import { THEME_NAMES } from '../../src/themes'
import { BRANDING_FOOTER_HEIGHT } from '../../src/themes/branding'
import {
  PROFILE_CARD_HEIGHT,
  PROFILE_CARD_WIDTH,
  renderProfileCard,
} from '../../src/widgets/profile'

const profile = {
  login: 'octocat',
  name: 'The Octocat',
  bio: 'GitHub mascot and demo profile',
  avatarDataUrl: 'data:image/png;base64,iVBORw==',
  followers: 1200,
  repositories: 8,
  stars: 42,
  contributions: 987,
} as const

const contributionDays = Array.from({ length: 240 }, (_, index) => ({
  date: new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10),
  contributionCount: 1,
  contributionLevel: 'FIRST_QUARTILE' as const,
  color: '#9be9a8',
}))

const badgeEvaluation = evaluateBadges(
  {
    ...profile,
    followers: 1_000,
    repositories: 10,
    stars: 500,
    contributions: 1_000,
    contributionCalendar: {
      totalContributions: 1_000,
      weeks: [{ contributionDays }],
    },
    pinnedRepositories: [],
    activity: {
      createdAt: '2010-01-01T00:00:00Z',
      organizations: 1,
      authoredPullRequests: 150,
      authoredIssues: 100,
      repositoriesContributedTo: 25,
      starredRepositories: 10,
      commitContributions: 900,
      issueContributions: 25,
      pullRequestContributions: 50,
      pullRequestReviewContributions: 150,
      isGitHubStar: true,
      hasSponsorsListing: true,
      repositoryLanguages: ['TypeScript', 'Rust', 'Go', 'Python'],
    },
  } satisfies GitHubProfile,
  new Date('2026-01-01T12:00:00Z'),
)

function svgIds(svg: string): string[] {
  return [...svg.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])
}

function expectValidSvgIds(svg: string): void {
  const ids = svgIds(svg)
  const references = [...svg.matchAll(/url\(#([^)]+)\)/g)].map(
    (match) => match[1],
  )

  expect(new Set(ids).size).toBe(ids.length)
  expect(references.length).toBeGreaterThan(0)
  for (const reference of references) {
    expect(ids).toContain(reference)
  }
}

describe('renderProfileCard effects', () => {
  it('renders identical compact automatic awards in every registered theme', () => {
    const rendered = THEME_NAMES.map((theme) =>
      renderProfileCard(profile, theme, 'none', { badgeEvaluation }),
    )
    const awardedIds = rendered.map((svg) =>
      [...svg.matchAll(/data-badge-id="([^"]+)"/g)].map((match) => match[1]),
    )

    expect(awardedIds[0]).toEqual(awardedIds[1])
    expect(awardedIds[0]).toEqual([
      badgeEvaluation.level.id,
      'github-star',
      'sponsor',
      'community-builder',
      'mentor',
    ])
    for (const svg of rendered) {
      expect(svg).toContain('data-auto-badges="true"')
      expect(svg.match(/data-badge-kind="level"/g)).toHaveLength(1)
      expect(svg).toContain('data-badge-kind="achievement"')
      expect(svg).toContain('data-badge-overflow="10"')
      expect(svg).toContain(`d="${badgeEvaluation.level.icon.path}"`)
      expect(svg).toContain(`stroke="${badgeEvaluation.level.palette.accent}"`)
      expect(svg).toContain(
        '<title>Marathon, Maintainer, Polyglot, Open Source, Star, Hard Worker, Volunteer, Voter, Collaborator, 24/7 Developer</title>',
      )
      expect(svg).toContain('<title>Recognized by the official GitHub Stars program.</title>')
    }
  })

  it('escapes automatic badge labels, descriptions, and attributes', () => {
    const level = {
      ...badgeEvaluation.level,
      label: '<Root & "Admin">',
      description: 'Earned <safely> & "clearly".',
    }
    const evaluation: BadgeEvaluation = {
      ...badgeEvaluation,
      level,
      achievements: [],
      awards: [level],
      visibleAchievements: [],
      visibleAwards: [level],
      overflow: null,
    }
    const svg = renderProfileCard(
      profile,
      'default',
      'none',
      { badgeEvaluation: evaluation },
    )

    expect(svg).toContain('&lt;Root &amp; &quot;Admin&quot;&gt;')
    expect(svg).toContain(
      '<title>Earned &lt;safely&gt; &amp; &quot;clearly&quot;.</title>',
    )
    expect(svg).not.toContain('<Root & "Admin">')
  })

  it('preserves the compact overlapping profile+stats geometry', () => {
    const svg = renderProfileCard(
      profile,
      'default',
      'none',
      { badgeEvaluation },
    )

    expect(PROFILE_CARD_WIDTH).toBe(842)
    expect(PROFILE_CARD_HEIGHT).toBe(222)
    expect(svg).toContain(
      `width="842" height="${PROFILE_CARD_HEIGHT + BRANDING_FOOTER_HEIGHT}"`,
    )
    expect(svg).toContain('<circle cx="124" cy="122" r="67"')
    expect(svg).toContain('<rect x="236" y="134" width="135.5" height="76"')
    expect(svg).toContain('y="66"')
    expect(svg).toContain('y="88"')
    expect(svg).toContain('y="118"')
    expect(svg).toContain(
      'data-auto-badges="true" data-badge-layout="paired" transform="translate(236 16)"',
    )
    expect(svg).toContain('@octocat')
    expect(svg).not.toContain('M8 0C3.58 0 0 3.58 0 8c0 3.54')
  })

  it('lets the nebula theme replace the legacy profile geometry', () => {
    const svg = renderProfileCard(
      profile,
      'nebula',
      'none',
      { badgeEvaluation },
    )

    expect(svg).toContain('width="842" height="492"')
    expect(svg).toContain('data-theme-renderer="nebula"')
    expect(svg).toContain('data-nebula-banner="true"')
    expect(svg).toContain('data-nebula-identity="true"')
    expect(svg).toContain('data-nebula-stat="followers"')
    expect(svg).toContain(
      'data-auto-badges="true" data-badge-layout="banner" transform="translate(226 22)"',
    )
    expect(svg).toContain('<circle cx="92" cy="200" r="59"')
    expect(svg).toContain('x="168" y="234"')
    expect(svg).not.toContain('data-nebula-status')
    expect(svg).not.toContain('Online — Building things')
    expect(svg).not.toContain('>GITHUB</text>')
    expect(svg).not.toContain('nebula-badge')
    expect(svg).not.toContain('data-layout="paired"')
  })

  it.each([...EFFECT_NAMES])('renders the %s effect candidate', (effect) => {
    const svg = renderProfileCard(profile, 'nebula', effect)

    expect(svg).toContain(`data-effect="${effect}"`)
    expect(svg).not.toContain('data-legacy-effect-id')
    expect(svg).toContain('data-stat="followers"')
    expect(svg).toContain('data-stat="contributions"')
    expectValidSvgIds(svg)
    if (effect === 'none') {
      expect(svg).not.toMatch(/<animate[ >]|<animateTransform|<animateMotion/)
    } else {
      expect(svg).toMatch(/<animate[ >]|<animateTransform|<animateMotion/)
    }
  })

  it.each([...THEME_NAMES])(
    'namespaces generated effect ids for the %s theme',
    (theme) => {
      const svg = renderProfileCard(profile, theme, 'shimmer')
      const namespace = `card-${theme}-shimmer-none`
      const generatedCardIds = svgIds(svg).filter((id) =>
        id.startsWith('card-'),
      )

      expect(svg).toContain(`data-theme="${theme}"`)
      expect(generatedCardIds).toContain(`${namespace}-shimmer`)
      expect(
        generatedCardIds.every((id) => id.startsWith(`${namespace}-`)),
      ).toBe(true)
    },
  )
})
