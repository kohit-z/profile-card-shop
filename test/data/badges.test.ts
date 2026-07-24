import { describe, expect, it } from 'vitest'

import {
  ACHIEVEMENT_BADGE_IDS,
  BADGE_CATALOG,
  LEVEL_BADGE_IDS,
  calculateExperienceScore,
  evaluateBadges,
  resolveLevelId,
  summarizeContributionCalendar,
  type AchievementBadgeId,
} from '../../src/data/badges'
import type {
  ContributionCalendar,
  ContributionDay,
  GitHubProfile,
} from '../../src/services/github'

const REFERENCE_DATE = new Date('2026-01-01T12:00:00Z')

function contributionDay(
  date: string,
  contributionCount = 1,
): ContributionDay {
  return {
    date,
    contributionCount,
    contributionLevel:
      contributionCount > 0 ? 'FIRST_QUARTILE' : 'NONE',
    color: contributionCount > 0 ? '#9be9a8' : '#ebedf0',
  }
}

function calendar(days: readonly ContributionDay[] = []): ContributionCalendar {
  return {
    totalContributions: days.reduce(
      (total, day) => total + day.contributionCount,
      0,
    ),
    weeks: [{ contributionDays: days }],
  }
}

function consecutiveDays(
  start: string,
  count: number,
): readonly ContributionDay[] {
  const startTime = Date.parse(`${start}T00:00:00Z`)
  return Array.from({ length: count }, (_, index) =>
    contributionDay(
      new Date(startTime + index * 86_400_000).toISOString().slice(0, 10),
    ),
  )
}

function profile(
  overrides: Omit<Partial<GitHubProfile>, 'activity'> & {
    activity?: Partial<GitHubProfile['activity']>
  } = {},
): GitHubProfile {
  return {
    login: 'octocat',
    name: 'The Octocat',
    bio: null,
    avatarDataUrl: '',
    followers: 0,
    repositories: 0,
    stars: 0,
    contributions: 0,
    contributionCalendar: calendar(),
    pinnedRepositories: [],
    ...overrides,
    activity: {
      createdAt: '2010-01-01T00:00:00Z',
      organizations: 0,
      authoredPullRequests: 0,
      authoredIssues: 0,
      repositoriesContributedTo: 0,
      starredRepositories: 0,
      commitContributions: 0,
      issueContributions: 0,
      pullRequestContributions: 0,
      pullRequestReviewContributions: 0,
      isGitHubStar: false,
      hasSponsorsListing: false,
      repositoryLanguages: [],
      ...overrides.activity,
    },
  }
}

function achievementIds(candidate: GitHubProfile): readonly string[] {
  return evaluateBadges(candidate, REFERENCE_DATE).achievements.map(
    (award) => award.id,
  )
}

function expectAchievement(
  id: AchievementBadgeId,
  below: GitHubProfile,
  earned: GitHubProfile,
): void {
  expect(achievementIds(below), `${id} below threshold`).not.toContain(id)
  expect(achievementIds(earned), `${id} at threshold`).toContain(id)
}

describe('badge catalog', () => {
  it('defines unique renderer-ready level and achievement records', () => {
    const ids = [...LEVEL_BADGE_IDS, ...ACHIEVEMENT_BADGE_IDS]

    expect(new Set(ids).size).toBe(ids.length)
    expect(Object.keys(BADGE_CATALOG)).toEqual(ids)
    for (const id of ids) {
      const definition = BADGE_CATALOG[id]
      expect(definition.id).toBe(id)
      expect(definition.label.length).toBeGreaterThan(0)
      expect(definition.description.length).toBeGreaterThan(0)
      expect(['level', 'achievement']).toContain(definition.kind)
      expect(definition.icon.viewBox).toBe('0 0 16 16')
      expect(definition.icon.path).toMatch(/^M/)
      expect(definition.palette).toEqual({
        foreground: expect.stringMatching(/^#[0-9a-f]{6}$/i),
        accent: expect.stringMatching(/^#[0-9a-f]{6}$/i),
        background: expect.stringMatching(/^#[0-9a-f]{6}$/i),
      })
    }
  })

  it('documents 24/7 Developer as an inference from daily activity', () => {
    expect(BADGE_CATALOG['developer-24-7'].description).toMatch(
      /inferred from daily activity/i,
    )
  })
})

describe('experience levels', () => {
  it.each([
    [0, 'level-new'],
    [249, 'level-new'],
    [250, 'level-beginner'],
    [499, 'level-beginner'],
    [500, 'level-junior'],
    [1499, 'level-junior'],
    [1500, 'level-senior'],
    [2999, 'level-senior'],
    [3000, 'level-staff'],
    [4999, 'level-staff'],
    [5000, 'level-principal'],
    [7499, 'level-principal'],
    [7500, 'level-master'],
  ] as const)('maps score %i to %s', (score, expected) => {
    expect(resolveLevelId(score, 10 * 365)).toBe(expected)
  })

  // Account-age level caps are temporarily disabled.
  // it.each([
  //   [89, 'level-new'],
  //   [90, 'level-junior'],
  //   [364, 'level-junior'],
  //   [365, 'level-senior'],
  //   [3 * 365 - 1, 'level-senior'],
  //   [3 * 365, 'level-staff'],
  //   [5 * 365 - 1, 'level-staff'],
  //   [5 * 365, 'level-principal'],
  //   [7 * 365 - 1, 'level-principal'],
  //   [7 * 365, 'level-master'],
  // ] as const)('caps a Master score at age %i days to %s', (age, expected) => {
  //   expect(resolveLevelId(100_000, age)).toBe(expected)
  // })

  // Account-age level caps are temporarily disabled.
  // it('applies year-based caps on UTC account anniversaries', () => {
  //   const candidate = profile({
  //     repositories: 100,
  //     stars: 10_000,
  //     contributions: 2_000,
  //     activity: {
  //       createdAt: '2024-01-01T00:00:00Z',
  //       authoredPullRequests: 500,
  //       pullRequestReviewContributions: 500,
  //       repositoriesContributedTo: 100,
  //     },
  //   })
  //
  //   expect(evaluateBadges(candidate, new Date('2024-12-31T23:59:59Z')).level.id)
  //     .toBe('level-junior')
  //   expect(evaluateBadges(candidate, new Date('2025-01-01T00:00:00Z')).level.id)
  //     .toBe('level-senior')
  // })

  it('ignores account age when resolving level from score', () => {
    expect(resolveLevelId(100_000, 0)).toBe('level-master')
    expect(resolveLevelId(100_000, 89)).toBe('level-master')
  })

  it('calculates a capped transparent score with square-root-scaled stars', () => {
    const candidate = profile({
      repositories: 500,
      stars: 10_000,
      contributions: 9_000,
      activity: {
        createdAt: '1990-01-01T00:00:00Z',
        authoredPullRequests: 900,
        pullRequestReviewContributions: 900,
        repositoriesContributedTo: 900,
      },
    })

    expect(calculateExperienceScore(candidate, REFERENCE_DATE)).toBe(14_500)
    expect(
      calculateExperienceScore(
        profile({ stars: 100, activity: { createdAt: '2026-01-01T00:00:00Z' } }),
        REFERENCE_DATE,
      ),
    ).toBe(500)
  })

  it('returns exactly one level award', () => {
    const result = evaluateBadges(
      profile({
        repositories: 100,
        stars: 10_000,
        contributions: 2_000,
        activity: {
          authoredPullRequests: 500,
          pullRequestReviewContributions: 500,
          repositoriesContributedTo: 100,
        },
      }),
      REFERENCE_DATE,
    )

    expect(result.awards.filter((award) => award.kind === 'level')).toEqual([
      result.level,
    ])
    expect(result.level.id).toBe('level-master')
  })
})

describe('achievement thresholds', () => {
  it('grants Star at either received-stars or follower boundary', () => {
    expectAchievement(
      'star',
      profile({ stars: 499 }),
      profile({ stars: 500 }),
    )
    expectAchievement(
      'star',
      profile({ followers: 999 }),
      profile({ followers: 1_000 }),
    )
  })

  it('grants Hard Worker at either annual-contribution or active-day boundary', () => {
    expectAchievement(
      'hard-worker',
      profile({ contributions: 999 }),
      profile({ contributions: 1_000 }),
    )
    expectAchievement(
      'hard-worker',
      profile({ contributionCalendar: calendar(consecutiveDays('2025-01-01', 239)) }),
      profile({ contributionCalendar: calendar(consecutiveDays('2025-01-01', 240)) }),
    )
  })

  it('grants Volunteer only at both contribution and repository boundaries', () => {
    expectAchievement(
      'volunteer',
      profile({
        activity: {
          pullRequestContributions: 50,
          issueContributions: 24,
          repositoriesContributedTo: 5,
        },
      }),
      profile({
        activity: {
          pullRequestContributions: 50,
          issueContributions: 25,
          repositoriesContributedTo: 5,
        },
      }),
    )
    expectAchievement(
      'volunteer',
      profile({
        activity: {
          pullRequestContributions: 75,
          repositoriesContributedTo: 4,
        },
      }),
      profile({
        activity: {
          pullRequestContributions: 75,
          repositoriesContributedTo: 5,
        },
      }),
    )
  })

  it('grants Voter and Mentor at their review boundaries', () => {
    expectAchievement(
      'voter',
      profile({ activity: { pullRequestReviewContributions: 49 } }),
      profile({ activity: { pullRequestReviewContributions: 50 } }),
    )
    expectAchievement(
      'mentor',
      profile({ activity: { pullRequestReviewContributions: 149 } }),
      profile({ activity: { pullRequestReviewContributions: 150 } }),
    )
  })

  it('grants Collaborator at the contributed-repository boundary', () => {
    expectAchievement(
      'collaborator',
      profile({ activity: { repositoriesContributedTo: 14 } }),
      profile({ activity: { repositoriesContributedTo: 15 } }),
    )
  })

  it('grants 24/7 Developer only when all daily-activity inferences qualify', () => {
    const qualifying = consecutiveDays('2025-06-01', 180)
    const extended = consecutiveDays('2025-01-01', 260)
    const fiveWeekdays = extended
      .filter((day) =>
        [0, 1, 2, 3, 6].includes(
          new Date(`${day.date}T00:00:00Z`).getUTCDay(),
        ),
      )
      .slice(0, 180)
    let includedWeekendDays = 0
    const nineteenWeekendDays = extended
      .filter((day) => {
        const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay()
        if (weekday !== 0 && weekday !== 6) return true
        includedWeekendDays += 1
        return includedWeekendDays <= 19
      })
      .slice(0, 180)

    expect(
      achievementIds(
        profile({
          contributionCalendar: calendar(qualifying.slice(0, 179)),
        }),
      ),
    ).not.toContain('developer-24-7')
    expect(
      achievementIds(
        profile({ contributionCalendar: calendar(fiveWeekdays) }),
      ),
    ).not.toContain('developer-24-7')
    expect(
      summarizeContributionCalendar(
        calendar(nineteenWeekendDays),
        REFERENCE_DATE,
      ).weekendActiveDays,
    ).toBe(19)
    expect(
      achievementIds(
        profile({ contributionCalendar: calendar(nineteenWeekendDays) }),
      ),
    ).not.toContain('developer-24-7')
    expect(
      achievementIds(profile({ contributionCalendar: calendar(qualifying) })),
    ).toContain('developer-24-7')
  })

  it('grants Open Source at either lifetime threshold', () => {
    expectAchievement(
      'open-source',
      profile({ activity: { authoredPullRequests: 99 } }),
      profile({ activity: { authoredPullRequests: 100 } }),
    )
    expectAchievement(
      'open-source',
      profile({ activity: { repositoriesContributedTo: 24 } }),
      profile({ activity: { repositoriesContributedTo: 25 } }),
    )
  })

  it('grants Maintainer only at both repository and star boundaries', () => {
    expectAchievement(
      'maintainer',
      profile({ repositories: 9, stars: 100 }),
      profile({ repositories: 10, stars: 100 }),
    )
    expectAchievement(
      'maintainer',
      profile({ repositories: 10, stars: 99 }),
      profile({ repositories: 10, stars: 100 }),
    )
  })

  it('grants Marathon at the longest-streak boundary', () => {
    expectAchievement(
      'marathon',
      profile({ contributionCalendar: calendar(consecutiveDays('2025-01-01', 29)) }),
      profile({ contributionCalendar: calendar(consecutiveDays('2025-01-01', 30)) }),
    )
  })

  it('grants Polyglot for four distinct repository languages', () => {
    expectAchievement(
      'polyglot',
      profile({ activity: { repositoryLanguages: ['Go', 'Rust', 'TypeScript'] } }),
      profile({
        activity: {
          repositoryLanguages: ['Go', 'Rust', 'TypeScript', 'Python'],
        },
      }),
    )
  })

  it('grants Community Builder only at both issue and organization boundaries', () => {
    expectAchievement(
      'community-builder',
      profile({ activity: { authoredIssues: 99, organizations: 1 } }),
      profile({ activity: { authoredIssues: 100, organizations: 1 } }),
    )
    expectAchievement(
      'community-builder',
      profile({ activity: { authoredIssues: 100, organizations: 0 } }),
      profile({ activity: { authoredIssues: 100, organizations: 1 } }),
    )
  })

  it('grants authoritative GitHub Star and Sponsor flags', () => {
    expectAchievement(
      'github-star',
      profile(),
      profile({ activity: { isGitHubStar: true } }),
    )
    expectAchievement(
      'sponsor',
      profile(),
      profile({ activity: { hasSponsorsListing: true } }),
    )
  })
})

describe('calendar normalization and award selection', () => {
  it('sorts, deduplicates, ignores future dates, and computes UTC activity metrics', () => {
    const metrics = summarizeContributionCalendar(
      calendar([
        contributionDay('2025-01-05'),
        contributionDay('2025-01-04', 0),
        contributionDay('2025-01-07', 10),
        contributionDay('2025-01-03'),
        contributionDay('2025-01-04', 2),
        contributionDay('2025-01-06', 0),
      ]),
      new Date('2025-01-06T23:59:59Z'),
    )

    expect(metrics).toEqual({
      activeDays: 3,
      weekendActiveDays: 2,
      distinctWeekdays: 3,
      longestActiveStreak: 3,
    })
  })

  it('uses the injected date deterministically and rejects invalid dates', () => {
    const candidate = profile({
      activity: { createdAt: '2025-10-01T00:00:00Z' },
      contributionCalendar: calendar([
        contributionDay('2026-01-01'),
        contributionDay('2026-01-02'),
      ]),
    })

    expect(evaluateBadges(candidate, REFERENCE_DATE)).toEqual(
      evaluateBadges(candidate, new Date(REFERENCE_DATE.getTime())),
    )
    expect(
      evaluateBadges(candidate, new Date('2025-12-31T23:59:59Z'))
        .calendarMetrics.activeDays,
    ).toBe(0)
    expect(() => evaluateBadges(candidate, new Date(Number.NaN))).toThrow(
      /reference date/i,
    )
    expect(() =>
      summarizeContributionCalendar(candidate.contributionCalendar, new Date(Number.NaN)),
    ).toThrow(/reference date/i)
  })

  it('returns authoritative-first stable order, five visible achievements, and lossless overflow', () => {
    const result = evaluateBadges(
      profile({
        followers: 1_000,
        repositories: 10,
        stars: 500,
        contributions: 1_000,
        contributionCalendar: calendar(consecutiveDays('2025-01-01', 240)),
        activity: {
          organizations: 1,
          authoredPullRequests: 150,
          authoredIssues: 100,
          repositoriesContributedTo: 25,
          issueContributions: 25,
          pullRequestContributions: 50,
          pullRequestReviewContributions: 150,
          isGitHubStar: true,
          hasSponsorsListing: true,
          repositoryLanguages: ['TypeScript', 'Rust', 'Go', 'Python'],
        },
      }),
      REFERENCE_DATE,
    )

    expect(result.achievements.map((award) => award.id)).toEqual([
      'github-star',
      'sponsor',
      'community-builder',
      'mentor',
      'marathon',
      'maintainer',
      'polyglot',
      'open-source',
      'star',
      'hard-worker',
      'volunteer',
      'voter',
      'collaborator',
      'developer-24-7',
    ])
    expect(result.visibleAchievements).toEqual(result.achievements.slice(0, 5))
    expect(result.visibleAwards).toEqual([
      result.level,
      ...result.achievements.slice(0, 5),
    ])
    expect(result.overflow).toEqual({
      count: 9,
      awards: result.achievements.slice(5),
      title:
        'Maintainer, Polyglot, Open Source, Star, Hard Worker, Volunteer, Voter, Collaborator, 24/7 Developer',
    })
    expect(new Set(result.awards.map((award) => award.id)).size).toBe(
      result.awards.length,
    )
  })

  it('returns an empty achievement list and no overflow for empty activity', () => {
    const result = evaluateBadges(profile(), REFERENCE_DATE)

    expect(result.achievements).toEqual([])
    expect(result.visibleAchievements).toEqual([])
    expect(result.overflow).toBeNull()
  })
})
