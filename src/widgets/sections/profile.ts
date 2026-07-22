import { escapeXml, truncateText } from '../../lib/svg.js'
import { defineCardSection, type CardSection } from '../card.js'

export const PROFILE_SECTION_HEIGHT = 236
export const LEGACY_OVERLAPPING_PROFILE_SECTION_HEIGHT = 132
export const STATS_SECTION_HEIGHT = 104

export interface ProfileCardData {
  readonly login: string
  readonly name: string | null
  readonly bio: string | null
  readonly avatarDataUrl: string
  readonly followers: number
  readonly repositories: number
  readonly stars: number
  readonly contributions: number
}

const ICONS = {
  github:
    'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.65 7.65 0 0 1 8 3.87c.68.003 1.36.092 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z',
  users:
    'M10.39 8.61a3.04 3.04 0 1 0-4.78 0A4.76 4.76 0 0 0 2.5 13v.75h11V13a4.76 4.76 0 0 0-3.11-4.39zm4.36-1.36a2.2 2.2 0 1 0-2.2-2.2 2.2 2.2 0 0 0 2.2 2.2zm.75 1.5a3.9 3.9 0 0 1 2 3.4v.75h-2.1a5.7 5.7 0 0 0-.65-3.7 3.8 3.8 0 0 0-1.25-.45z',
  repo: 'M4 1.5A1.5 1.5 0 0 0 2.5 3v10.5A1.5 1.5 0 0 0 4 15h.75V1.5zm2.25 0V15h6.25A1.5 1.5 0 0 0 14 13.5V3A1.5 1.5 0 0 0 12.5 1.5zm1.5 2.25h4v1.25h-4zm0 2.5h4V7.5h-4zm0 2.5h3V10h-3z',
  star: 'M8 1.25l1.94 3.93 4.34.63-3.14 3.06.74 4.32L8 11.15l-3.88 2.04.74-4.32L1.72 5.81l4.34-.63z',
  activity: 'M9.6 1.5 6.85 8H2.5v1.5h5.15L10.4 3.2 13.15 14.5H16V13h-1.9z',
} as const

type StatKey = 'followers' | 'repositories' | 'stars' | 'contributions'

const STATS = [
  { key: 'followers', label: 'Followers', icon: 'users' },
  { key: 'repositories', label: 'Repositories', icon: 'repo' },
  { key: 'stars', label: 'Stars', icon: 'star' },
  { key: 'contributions', label: 'Contributions', icon: 'activity' },
] as const

const COUNT_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

function formatCount(value: number): string {
  return COUNT_FORMATTER.format(value)
}

function icon(
  name: keyof typeof ICONS,
  x: number,
  y: number,
  size: number,
  color: string,
): string {
  return `<g transform="translate(${x} ${y}) scale(${size / 16})" aria-hidden="true">
  <path d="${ICONS[name]}" fill="${color}" />
</g>`
}

function createProfileSectionWithHeight(
  profile: ProfileCardData,
  height: number,
): CardSection {
  const displayName = truncateText(profile.name?.trim() || profile.login, 40)
  const login = truncateText(profile.login, 39)
  const bio = truncateText(profile.bio?.trim() || 'GitHub profile', 78)

  return defineCardSection({
    id: 'profile',
    height,
    title: `${displayName} (@${login})`,
    description: bio,
    avatarAnchor: (frame) => ({
      cx: 92,
      cy: frame.y + 118,
      radius: 70,
    }),
    render: ({ frame, theme, fontFamily, avatarAnimation }) => {
      const cy = frame.y + 118
      const clip = `profile-avatar-${theme.name}-${frame.y}`
      return `<defs>
  <clipPath id="${clip}"><circle cx="92" cy="${cy}" r="70" /></clipPath>
</defs>
<g data-profile="${escapeXml(profile.login)}">
  <g>${avatarAnimation}
    <circle cx="92" cy="${cy}" r="73" fill="${theme.colors.background}" stroke="${theme.colors.accent}" stroke-width="2.5" stroke-opacity="0.85" />
    <image href="${escapeXml(profile.avatarDataUrl)}" x="22" y="${cy - 70}" width="140" height="140" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clip})" />
  </g>
  <text x="184" y="${frame.y + 52}" font-family="${fontFamily}" font-size="24" font-weight="700" fill="${theme.colors.foreground}">${escapeXml(displayName)}</text>
  <g aria-label="GitHub username">
    ${icon('github', 184, frame.y + 62, 14, theme.colors.accent)}
    <text x="204" y="${frame.y + 74}" font-family="${fontFamily}" font-size="14" fill="${theme.colors.accent}">@${escapeXml(login)}</text>
  </g>
  <text x="184" y="${frame.y + 108}" font-family="${fontFamily}" font-size="${theme.typography.bodySize}" fill="${theme.colors.muted}">${escapeXml(bio)}</text>
</g>`
    },
  })
}

export function createProfileSection(profile: ProfileCardData): CardSection {
  return createProfileSectionWithHeight(profile, PROFILE_SECTION_HEIGHT)
}

/**
 * Compatibility-only profile layout that intentionally overlaps the following
 * stats section to preserve the original 842x236 `/api/profile` card geometry.
 */
export function createLegacyOverlappingProfileSection(
  profile: ProfileCardData,
): CardSection {
  return createProfileSectionWithHeight(
    profile,
    LEGACY_OVERLAPPING_PROFILE_SECTION_HEIGHT,
  )
}

export function createStatsSection(profile: ProfileCardData): CardSection {
  const values: Record<StatKey, number> = {
    followers: profile.followers,
    repositories: profile.repositories,
    stars: profile.stars,
    contributions: profile.contributions,
  }
  const formattedValues = Object.fromEntries(
    STATS.map((stat) => [stat.key, formatCount(values[stat.key])]),
  ) as Record<StatKey, string>
  const summary = STATS.map(
    (stat) => `${formattedValues[stat.key]} ${stat.label.toLowerCase()}`,
  ).join(', ')

  return defineCardSection({
    id: 'stats',
    height: STATS_SECTION_HEIGHT,
    title: 'GitHub statistics',
    description: summary,
    render: ({ frame, theme, fontFamily }) =>
      STATS.map((stat, index) => {
        const x = 184 + index * 156
        const y = frame.y + 10
        const value = formattedValues[stat.key]
        return `<g data-stat="${stat.key}" aria-label="${escapeXml(`${stat.label}: ${value}`)}">
  <rect x="${x}" y="${y}" width="144" height="72" rx="12" fill="${theme.colors.background}" fill-opacity="0.78" stroke="${theme.colors.border}" />
  <circle cx="${x + 28}" cy="${y + 36}" r="16" fill="${theme.colors.accent}" fill-opacity="0.14" />
  ${icon(stat.icon, x + 20, y + 28, 16, theme.colors.accent)}
  <text x="${x + 52}" y="${y + 30}" font-family="${fontFamily}" font-size="18" font-weight="700" fill="${theme.colors.foreground}">${escapeXml(value)}</text>
  <text x="${x + 52}" y="${y + 50}" font-family="${fontFamily}" font-size="11" fill="${theme.colors.muted}">${escapeXml(stat.label)}</text>
</g>`
      }).join('\n'),
  })
}
