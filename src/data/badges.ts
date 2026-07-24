import type {
  ContributionCalendar,
  GitHubActivityMetrics,
  GitHubProfile,
} from '../services/github.js'

export const LEVEL_BADGE_IDS = [
  'level-new',
  'level-beginner',
  'level-junior',
  'level-senior',
  'level-staff',
  'level-principal',
  'level-master',
] as const

export const ACHIEVEMENT_BADGE_IDS = [
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
] as const

export type LevelBadgeId = (typeof LEVEL_BADGE_IDS)[number]
export type AchievementBadgeId = (typeof ACHIEVEMENT_BADGE_IDS)[number]
export type BadgeId = LevelBadgeId | AchievementBadgeId
export type BadgeKind = 'level' | 'achievement'

export interface BadgeIcon {
  /** All catalog paths use the common 16 by 16 coordinate system. */
  readonly viewBox: '0 0 16 16'
  readonly path: string
}

export interface BadgePalette {
  /** High-contrast content such as icon or label text. */
  readonly foreground: string
  /** Emphasis color for borders, highlights, or icon treatments. */
  readonly accent: string
  /** Base chip or badge surface color. */
  readonly background: string
}

export interface BadgeDefinition<
  Id extends BadgeId = BadgeId,
  Kind extends BadgeKind = BadgeKind,
> {
  readonly id: Id
  readonly label: string
  readonly description: string
  readonly kind: Kind
  readonly icon: BadgeIcon
  readonly palette: BadgePalette
}

export type LevelBadgeDefinition = BadgeDefinition<LevelBadgeId, 'level'>
export type AchievementBadgeDefinition = BadgeDefinition<
  AchievementBadgeId,
  'achievement'
>
export type BadgeAward = LevelBadgeDefinition | AchievementBadgeDefinition

export interface CalendarActivityMetrics {
  readonly activeDays: number
  readonly weekendActiveDays: number
  readonly distinctWeekdays: number
  readonly longestActiveStreak: number
}

export interface BadgeOverflow {
  readonly count: number
  readonly awards: readonly AchievementBadgeDefinition[]
  /** Concise renderer tooltip text containing every hidden award label. */
  readonly title: string
}

export interface BadgeEvaluation {
  readonly score: number
  readonly calendarMetrics: CalendarActivityMetrics
  readonly level: LevelBadgeDefinition
  /** Every earned achievement in stable priority order. */
  readonly achievements: readonly AchievementBadgeDefinition[]
  /** The level followed by every earned achievement, without truncation. */
  readonly awards: readonly BadgeAward[]
  /** At most five achievements, suitable for direct display. */
  readonly visibleAchievements: readonly AchievementBadgeDefinition[]
  /** The level followed by at most five visible achievements. */
  readonly visibleAwards: readonly BadgeAward[]
  readonly overflow: BadgeOverflow | null
}

const VIEW_BOX = '0 0 16 16' as const

function level(
  id: LevelBadgeId,
  label: string,
  description: string,
  path: string,
  foreground: string,
  accent: string,
  background: string,
): LevelBadgeDefinition {
  return {
    id,
    label,
    description,
    kind: 'level',
    icon: { viewBox: VIEW_BOX, path },
    palette: { foreground, accent, background },
  }
}

function achievement(
  id: AchievementBadgeId,
  label: string,
  description: string,
  path: string,
  foreground: string,
  accent: string,
  background: string,
): AchievementBadgeDefinition {
  return {
    id,
    label,
    description,
    kind: 'achievement',
    icon: { viewBox: VIEW_BOX, path },
    palette: { foreground, accent, background },
  }
}

const LEVEL_CATALOG: Readonly<
  Record<LevelBadgeId, LevelBadgeDefinition>
> = {
  'level-new': level(
    'level-new',
    'New',
    'A new GitHub journey.',
    'M8 1 10 5l4 .6-3 3 .7 4.4L8 11l-3.7 2 .7-4.4-3-3L6 5z',
    '#f8fafc',
    '#94a3b8',
    '#334155',
  ),
  'level-beginner': level(
    'level-beginner',
    'Beginner',
    'Building an early GitHub track record.',
    'M8 1.2 13.5 4v4c0 3.5-2.2 5.7-5.5 6.8C4.7 13.7 2.5 11.5 2.5 8V4z',
    '#f0fdf4',
    '#4ade80',
    '#166534',
  ),
  'level-junior': level(
    'level-junior',
    'Junior',
    'Growing through regular development work.',
    'M3 2h10v3H3zm1 4h8v8H4zm2 2v4h4V8z',
    '#eff6ff',
    '#60a5fa',
    '#1e40af',
  ),
  'level-senior': level(
    'level-senior',
    'Senior',
    'An established and productive contributor.',
    'M8 1 10 5l4 .6-3 3 .7 4.4L8 11l-3.7 2 .7-4.4-3-3L6 5z',
    '#faf5ff',
    '#c084fc',
    '#6b21a8',
  ),
  'level-staff': level(
    'level-staff',
    'Staff',
    'Broad, sustained engineering impact.',
    'M8 1.5 10 5l4 .7-3 2.8.7 4L8 10.7l-3.7 1.8.7-4-3-2.8L6 5z',
    '#fff7ed',
    '#fb923c',
    '#9a3412',
  ),
  'level-principal': level(
    'level-principal',
    'Principal',
    'Exceptional depth and ecosystem influence.',
    'M2 4.5 5.2 7 8 2l2.8 5L14 4.5 12.8 13H3.2z',
    '#fffbeb',
    '#facc15',
    '#854d0e',
  ),
  'level-master': level(
    'level-master',
    'Master',
    'Top-tier, long-standing GitHub impact.',
    'M8 1 10.1 5.1 14.5 5.8l-3.2 3.1.8 4.4L8 11.3l-4.1 2.2.8-4.4-3.2-3.1 4.4-.7z',
    '#fdf4ff',
    '#e879f9',
    '#701a75',
  ),
}

const ACHIEVEMENT_CATALOG: Readonly<
  Record<AchievementBadgeId, AchievementBadgeDefinition>
> = {
  'github-star': achievement(
    'github-star',
    'GitHub Star',
    'Recognized by the official GitHub Stars program.',
    'M8 1.2 10 5.3l4.5.7-3.2 3.1.8 4.5L8 12.7l-4.1 2.1.8-4.5L1.5 6 6 5.3z',
    '#fff7ed',
    '#fb923c',
    '#7c2d12',
  ),
  sponsor: achievement(
    'sponsor',
    'Sponsor',
    'Offers sponsorship through GitHub Sponsors.',
    'M8 14S2 10.2 2 5.8C2 2.8 5.8 1.5 8 4c2.2-2.5 6-1.2 6 1.8C14 10.2 8 14 8 14z',
    '#fdf2f8',
    '#f472b6',
    '#831843',
  ),
  'community-builder': achievement(
    'community-builder',
    'Community Builder',
    'Authored 100 issues and belongs to a public organization.',
    'M5.5 7A2.5 2.5 0 1 0 5.5 2a2.5 2.5 0 0 0 0 5zm5-1A2 2 0 1 0 10.5 2a2 2 0 0 0 0 4zM1 14v-2.2C1 9.7 3 8 5.5 8S10 9.7 10 11.8V14zm9.5 0v-2.2c0-1.2-.4-2.3-1.2-3.1.4-.1.8-.2 1.2-.2 2.2 0 4 1.5 4 3.3V14z',
    '#ecfeff',
    '#22d3ee',
    '#155e75',
  ),
  mentor: achievement(
    'mentor',
    'Mentor',
    'Completed at least 150 pull request reviews this year.',
    'M8 1 14 4v4c0 3.3-2.4 5.8-6 7-3.6-1.2-6-3.7-6-7V4zm0 2.2L4 5v3c0 2.1 1.4 3.8 4 4.8 2.6-1 4-2.7 4-4.8V5z',
    '#f0fdfa',
    '#2dd4bf',
    '#115e59',
  ),
  marathon: achievement(
    'marathon',
    'Marathon',
    'Maintained an active contribution streak of 30 days.',
    'M9 1.2C9.4 4 7 5 7.8 7.2c.6 1.5 2.2 1.2 2.7-.2.8 3.2-.6 6-3.5 7.5C4.1 13.7 2 11.5 2 8.7c0-2.2 1.1-4.4 3.3-6.4-.2 2.3.6 3.4 1.4 3.8C6.5 3.8 7.5 2 9 1.2z',
    '#fff7ed',
    '#f97316',
    '#9a3412',
  ),
  maintainer: achievement(
    'maintainer',
    'Maintainer',
    'Owns 10 repositories with at least 100 received stars.',
    'M2 3h5l1.5 2H14v8H2zm2 4v4h8V7z',
    '#f0fdf4',
    '#4ade80',
    '#166534',
  ),
  polyglot: achievement(
    'polyglot',
    'Polyglot',
    'Uses at least four repository languages.',
    'M2 2h5v2H4v3h3v2H4v3h3v2H2zm7 0h5v12H9v-2h3V9H9V7h3V4H9z',
    '#f5f3ff',
    '#a78bfa',
    '#5b21b6',
  ),
  'open-source': achievement(
    'open-source',
    'Open Source',
    'Authored 100 pull requests or contributed to 25 repositories.',
    'M6.3 1.5h3.4l.6 2.1 1.8 1 .2 2.2-1.5 1.6.3 2.2-1.9 1.1-.7 2.1H6.3l-.7-2.1-1.9-1.1.3-2.2-1.5-1.6.2-2.2 1.8-1zm1.7 4A2.5 2.5 0 1 0 8 10.5 2.5 2.5 0 0 0 8 5.5z',
    '#eff6ff',
    '#38bdf8',
    '#075985',
  ),
  star: achievement(
    'star',
    'Star',
    'Earned 500 repository stars or 1,000 followers.',
    'M8 1.1 10.1 5l4.4.7-3.2 3.1.8 4.4L8 11.2l-4.1 2 .8-4.4-3.2-3.1 4.4-.7z',
    '#fffbeb',
    '#facc15',
    '#854d0e',
  ),
  'hard-worker': achievement(
    'hard-worker',
    'Hard Worker',
    'Reached 1,000 annual contributions or 240 active days.',
    'M9 1 3 8h4l-1 7 7-9H9z',
    '#fff7ed',
    '#fb923c',
    '#9a3412',
  ),
  volunteer: achievement(
    'volunteer',
    'Volunteer',
    'Made 75 annual pull request or issue contributions across five repositories.',
    'M8 14S2 10.2 2 6c0-2.8 3.6-4 6-1.2C10.4 2 14 3.2 14 6c0 4.2-6 8-6 8z',
    '#fdf2f8',
    '#fb7185',
    '#9f1239',
  ),
  voter: achievement(
    'voter',
    'Voter',
    'Completed at least 50 pull request reviews this year.',
    'M2 3h12v10H2zm2 2v6h8V5zm1.2 3 1.4-1.4L8 8l2.8-2.8 1.4 1.4L8 10.8z',
    '#f0fdfa',
    '#14b8a6',
    '#115e59',
  ),
  collaborator: achievement(
    'collaborator',
    'Collaborator',
    'Contributed to at least 15 repositories.',
    'M5 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm6-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM1 14v-2c0-2 1.8-3.5 4-3.5S9 10 9 12v2zm9 0v-2c0-1.1-.4-2.1-1.1-2.8.6-.4 1.3-.7 2.1-.7 2.2 0 4 1.5 4 3.5v2z',
    '#eff6ff',
    '#60a5fa',
    '#1e40af',
  ),
  'developer-24-7': achievement(
    'developer-24-7',
    '24/7 Developer',
    'Broad weekly consistency inferred from daily activity: 180 active days, six weekdays, and 20 weekend days.',
    'M8 1a7 7 0 1 0 7 7 7 7 0 0 0-7-7zm1 3v3.6l2.5 1.5-1 1.7L7 8.7V4z',
    '#eef2ff',
    '#818cf8',
    '#3730a3',
  ),
}

export const BADGE_CATALOG: Readonly<Record<BadgeId, BadgeDefinition>> = {
  ...LEVEL_CATALOG,
  ...ACHIEVEMENT_CATALOG,
}

const LEVEL_SCORE_MINIMUMS: Readonly<
  Record<LevelBadgeId, number>
> = {
  'level-new': 0,
  'level-beginner': 250,
  'level-junior': 500,
  'level-senior': 1_500,
  'level-staff': 3_000,
  'level-principal': 5_000,
  'level-master': 7_500,
}

const DAY_MS = 86_400_000
const MAX_VISIBLE_ACHIEVEMENTS = 5

function normalizedCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

function cappedScore(value: number, cap: number, weight: number): number {
  return Math.min(normalizedCount(value), cap) * weight
}

function assertReferenceDate(referenceDate: Date): number {
  const timestamp = referenceDate.getTime()
  if (!Number.isFinite(timestamp)) {
    throw new RangeError('Invalid reference date.')
  }
  return timestamp
}

function utcDayNumber(timestamp: number): number {
  const date = new Date(timestamp)
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
      DAY_MS,
  )
}

function parseCalendarDay(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }
  const timestamp = Date.parse(`${value}T00:00:00Z`)
  if (
    !Number.isFinite(timestamp) ||
    new Date(timestamp).toISOString().slice(0, 10) !== value
  ) {
    return null
  }
  return Math.floor(timestamp / DAY_MS)
}

function accountAgeDays(
  activity: GitHubActivityMetrics,
  referenceTimestamp: number,
): number {
  const createdAt = Date.parse(activity.createdAt)
  if (!Number.isFinite(createdAt) || createdAt >= referenceTimestamp) {
    return 0
  }
  return Math.floor((referenceTimestamp - createdAt) / DAY_MS)
}

/**
 * Normalize contribution days in UTC before deriving activity metrics.
 * Duplicate dates count once (using their highest contribution count), invalid
 * dates are ignored, and dates after the injected reference day are excluded.
 */
export function summarizeContributionCalendar(
  calendar: ContributionCalendar,
  referenceDate: Date = new Date(),
): CalendarActivityMetrics {
  const referenceDay = utcDayNumber(assertReferenceDate(referenceDate))
  const countsByDay = new Map<number, number>()

  for (const week of calendar.weeks) {
    for (const day of week.contributionDays) {
      const dayNumber = parseCalendarDay(day.date)
      if (dayNumber === null || dayNumber > referenceDay) {
        continue
      }
      const count = normalizedCount(day.contributionCount)
      countsByDay.set(dayNumber, Math.max(countsByDay.get(dayNumber) ?? 0, count))
    }
  }

  const activeDayNumbers = [...countsByDay]
    .filter(([, count]) => count > 0)
    .map(([dayNumber]) => dayNumber)
    .sort((left, right) => left - right)
  const weekdays = new Set<number>()
  let weekendActiveDays = 0
  let longestActiveStreak = 0
  let currentStreak = 0
  let previousDay: number | undefined

  for (const dayNumber of activeDayNumbers) {
    const weekday = new Date(dayNumber * DAY_MS).getUTCDay()
    weekdays.add(weekday)
    if (weekday === 0 || weekday === 6) {
      weekendActiveDays += 1
    }

    currentStreak =
      previousDay !== undefined && dayNumber === previousDay + 1
        ? currentStreak + 1
        : 1
    longestActiveStreak = Math.max(longestActiveStreak, currentStreak)
    previousDay = dayNumber
  }

  return {
    activeDays: activeDayNumbers.length,
    weekendActiveDays,
    distinctWeekdays: weekdays.size,
    longestActiveStreak,
  }
}

/**
 * Score weights are intentionally transparent and bounded:
 * - account age: up to 1,000 points over ten years
 * - annual contributions: 1 point each, capped at 2,000
 * - owned repositories: 20 points each, capped at 100
 * - lifetime authored pull requests: 5 points each, capped at 500
 * - annual reviews: 5 points each, capped at 500
 * - contributed repositories: 20 points each, capped at 100
 * - received stars: 50 * sqrt(stars), capped at 2,500
 */
export function calculateExperienceScore(
  profile: GitHubProfile,
  referenceDate: Date = new Date(),
): number {
  const referenceTimestamp = assertReferenceDate(referenceDate)
  const ageDays = accountAgeDays(profile.activity, referenceTimestamp)
  const ageScore = Math.floor((Math.min(ageDays, 10 * 365) * 1_000) / (10 * 365))
  const starScore = Math.min(
    2_500,
    Math.floor(Math.sqrt(normalizedCount(profile.stars)) * 50),
  )

  return (
    ageScore +
    cappedScore(profile.contributions, 2_000, 1) +
    cappedScore(profile.repositories, 100, 20) +
    cappedScore(profile.activity.authoredPullRequests, 500, 5) +
    cappedScore(profile.activity.pullRequestReviewContributions, 500, 5) +
    cappedScore(profile.activity.repositoriesContributedTo, 100, 20) +
    starScore
  )
}

export function resolveLevelId(score: number, ageDays: number): LevelBadgeId {
  const normalizedScore = normalizedCount(score)
  let scoreIndex = 0
  for (let index = 1; index < LEVEL_BADGE_IDS.length; index += 1) {
    const id = LEVEL_BADGE_IDS[index]!
    if (normalizedScore < LEVEL_SCORE_MINIMUMS[id]) {
      break
    }
    scoreIndex = index
  }

  // Account-age level caps are temporarily disabled; levels follow score only.
  // const normalizedAge = normalizedCount(ageDays)
  // let maximumIndex: number
  // if (normalizedAge < 90) {
  //   maximumIndex = 0
  // } else if (normalizedAge < 365) {
  //   maximumIndex = 2
  // } else if (normalizedAge < 3 * 365) {
  //   maximumIndex = 3
  // } else if (normalizedAge < 5 * 365) {
  //   maximumIndex = 4
  // } else if (normalizedAge < 7 * 365) {
  //   maximumIndex = 5
  // } else {
  //   maximumIndex = 6
  // }
  //
  // return LEVEL_BADGE_IDS[Math.min(scoreIndex, maximumIndex)]!
  void ageDays
  return LEVEL_BADGE_IDS[scoreIndex]!
}

// Account-age level caps are temporarily disabled.
// function completedAccountYears(
//   activity: GitHubActivityMetrics,
//   referenceTimestamp: number,
// ): number {
//   const createdTimestamp = Date.parse(activity.createdAt)
//   if (!Number.isFinite(createdTimestamp) || createdTimestamp >= referenceTimestamp) {
//     return 0
//   }
//
//   const created = new Date(createdTimestamp)
//   const reference = new Date(referenceTimestamp)
//   let years = reference.getUTCFullYear() - created.getUTCFullYear()
//   const anniversary = new Date(createdTimestamp)
//   anniversary.setUTCFullYear(created.getUTCFullYear() + years)
//   if (anniversary.getTime() > referenceTimestamp) {
//     years -= 1
//   }
//   return Math.max(0, years)
// }

// Account-age level caps are temporarily disabled.
// function resolveAccountLevelId(
//   score: number,
//   activity: GitHubActivityMetrics,
//   referenceTimestamp: number,
// ): LevelBadgeId {
//   const ageDays = accountAgeDays(activity, referenceTimestamp)
//   if (ageDays < 90) {
//     return resolveLevelId(score, ageDays)
//   }
//
//   const completedYears = completedAccountYears(activity, referenceTimestamp)
//   let ageCapDays: number
//   if (completedYears < 1) ageCapDays = 90
//   else if (completedYears < 3) ageCapDays = 365
//   else if (completedYears < 5) ageCapDays = 3 * 365
//   else if (completedYears < 7) ageCapDays = 5 * 365
//   else ageCapDays = 7 * 365
//   return resolveLevelId(score, ageCapDays)
// }

function hasDistinctLanguages(activity: GitHubActivityMetrics): boolean {
  const languages = new Set(
    activity.repositoryLanguages
      .map((language) => language.trim().toLocaleLowerCase('en-US'))
      .filter(Boolean),
  )
  return languages.size >= 4
}

function earnedAchievementIds(
  profile: GitHubProfile,
  metrics: CalendarActivityMetrics,
): ReadonlySet<AchievementBadgeId> {
  const activity = profile.activity
  const annualPullRequestAndIssueContributions =
    normalizedCount(activity.pullRequestContributions) +
    normalizedCount(activity.issueContributions)
  const earned = new Set<AchievementBadgeId>()

  if (activity.isGitHubStar) earned.add('github-star')
  if (activity.hasSponsorsListing) earned.add('sponsor')
  if (activity.authoredIssues >= 100 && activity.organizations >= 1) {
    earned.add('community-builder')
  }
  if (activity.pullRequestReviewContributions >= 150) earned.add('mentor')
  if (metrics.longestActiveStreak >= 30) earned.add('marathon')
  if (profile.repositories >= 10 && profile.stars >= 100) {
    earned.add('maintainer')
  }
  if (hasDistinctLanguages(activity)) earned.add('polyglot')
  if (
    activity.authoredPullRequests >= 100 ||
    activity.repositoriesContributedTo >= 25
  ) {
    earned.add('open-source')
  }
  if (profile.stars >= 500 || profile.followers >= 1_000) earned.add('star')
  if (profile.contributions >= 1_000 || metrics.activeDays >= 240) {
    earned.add('hard-worker')
  }
  if (
    annualPullRequestAndIssueContributions >= 75 &&
    activity.repositoriesContributedTo >= 5
  ) {
    earned.add('volunteer')
  }
  if (activity.pullRequestReviewContributions >= 50) earned.add('voter')
  if (activity.repositoriesContributedTo >= 15) earned.add('collaborator')
  // GitHub exposes daily counts, not hourly telemetry. This badge therefore
  // represents breadth and consistency inferred from the daily calendar.
  if (
    metrics.activeDays >= 180 &&
    metrics.distinctWeekdays >= 6 &&
    metrics.weekendActiveDays >= 20
  ) {
    earned.add('developer-24-7')
  }

  return earned
}

export function evaluateBadges(
  profile: GitHubProfile,
  referenceDate: Date = new Date(),
): BadgeEvaluation {
  const referenceTimestamp = assertReferenceDate(referenceDate)
  const calendarMetrics = summarizeContributionCalendar(
    profile.contributionCalendar,
    referenceDate,
  )
  const score = calculateExperienceScore(profile, referenceDate)
  // Account-age level caps are temporarily disabled; levels follow score only.
  // const levelId = resolveAccountLevelId(
  //   score,
  //   profile.activity,
  //   referenceTimestamp,
  // )
  const levelId = resolveLevelId(score, accountAgeDays(profile.activity, referenceTimestamp))
  const levelAward = LEVEL_CATALOG[levelId]
  const earnedIds = earnedAchievementIds(profile, calendarMetrics)
  const achievements = ACHIEVEMENT_BADGE_IDS.filter((id) =>
    earnedIds.has(id),
  ).map((id) => ACHIEVEMENT_CATALOG[id])
  const visibleAchievements = achievements.slice(
    0,
    MAX_VISIBLE_ACHIEVEMENTS,
  )
  const overflowAwards = achievements.slice(MAX_VISIBLE_ACHIEVEMENTS)
  const overflow =
    overflowAwards.length === 0
      ? null
      : {
          count: overflowAwards.length,
          awards: overflowAwards,
          title: overflowAwards.map((award) => award.label).join(', '),
        }

  return {
    score,
    calendarMetrics,
    level: levelAward,
    achievements,
    awards: [levelAward, ...achievements],
    visibleAchievements,
    visibleAwards: [levelAward, ...visibleAchievements],
    overflow,
  }
}
