import {
  iconOutlineRadius,
  renderItemOutlineRect,
} from '../../data/outline-style.js'
import type { BadgeEvaluation } from '../../data/badges.js'
import { escapeXml, truncateText } from '../../lib/svg.js'
import { renderAutomaticBadges } from '../badges.js'
import { defineCardSection, type CardSection } from '../card.js'

export const PROFILE_SECTION_HEIGHT = 214
export const LEGACY_OVERLAPPING_PROFILE_SECTION_HEIGHT = 122
export const STATS_SECTION_HEIGHT = 100

const AVATAR_CX = 124
const AVATAR_RADIUS = 64
const AVATAR_CY_OFFSET = 122
const TEXT_X = 236

/** Shared outer inset for avatar column, text, and stats. */
const CARD_PADDING = 22
const STATS_GAP = 14
const STAT_TILE_HEIGHT = 76
const STAT_PAD_X = 14
const STAT_LABEL_SIZE = 8
const STAT_VALUE_SIZE = 18
const STAT_TEXT_GAP = 6
/** Equal to the label + number stack height. */
const BADGE_SIZE = STAT_LABEL_SIZE + STAT_TEXT_GAP + STAT_VALUE_SIZE
const STAT_ICON_GAP = 10

/** Name → handle → bio baselines relative to the profile frame. */
const PAIRED_TEXT_Y = { name: 66, handle: 88, bio: 118 } as const
const SOLO_TEXT_Y = { name: 86, handle: 108, bio: 140 } as const

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

export interface ProfileSectionOptions {
  /**
   * Compact height that lets a following stats section nest beside the avatar
   * (the classic profile+stats composition).
   */
  readonly pairWithStats?: boolean
  /** Precomputed once by a route; omitted only for direct compatibility use. */
  readonly badgeEvaluation?: BadgeEvaluation
}

export interface StatsSectionOptions {
  /**
   * Keep the indent so tiles sit beside the avatar. When false, tiles
   * span the full card width.
   */
  readonly besideAvatar?: boolean
}

const ICONS = {
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

function tintedBadge(
  x: number,
  y: number,
  size: number,
  path: string,
  color: string,
  outlineRadius = size * 0.28,
): string {
  const inset = size * 0.24
  const scale = (size * 0.52) / 16
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${outlineRadius}" fill="${color}" fill-opacity="0.14" />
  <g transform="translate(${x + inset} ${y + inset}) scale(${scale})" aria-hidden="true">
  <path d="${path}" fill="${color}" />
</g>`
}

function createProfileSectionWithHeight(
  profile: ProfileCardData,
  height: number,
  badgeEvaluation?: BadgeEvaluation,
): CardSection {
  const displayName = truncateText(profile.name?.trim() || profile.login, 40)
  const login = truncateText(profile.login, 39)
  const bio = truncateText(profile.bio?.trim() || 'GitHub profile', 78)
  const paired = height === LEGACY_OVERLAPPING_PROFILE_SECTION_HEIGHT
  const textY = paired ? PAIRED_TEXT_Y : SOLO_TEXT_Y

  return defineCardSection({
    id: 'profile',
    height,
    title: `${displayName} (@${login})`,
    description: bio,
    payload: { type: 'profile', profile, badgeEvaluation },
    avatarAnchor: (frame) => ({
      cx: AVATAR_CX,
      cy: frame.y + AVATAR_CY_OFFSET,
      radius: AVATAR_RADIUS,
    }),
    render: ({ frame, theme, fontFamily, avatarAnimation }) => {
      const cy = frame.y + AVATAR_CY_OFFSET
      const clip = `profile-avatar-${theme.name}-${frame.y}`
      const badges = renderAutomaticBadges({
        evaluation: badgeEvaluation,
        x: TEXT_X,
        y: frame.y + (paired ? 16 : 166),
        maxWidth: frame.width - TEXT_X - CARD_PADDING,
        escapedFontFamily: fontFamily,
        layout: paired ? 'paired' : 'solo',
        variant: 'classic',
      })
      return `<defs>
  <clipPath id="${clip}"><circle cx="${AVATAR_CX}" cy="${cy}" r="${AVATAR_RADIUS}" /></clipPath>
</defs>
<g data-profile="${escapeXml(profile.login)}">
  <g>${avatarAnimation}
    <circle cx="${AVATAR_CX}" cy="${cy}" r="${AVATAR_RADIUS + 3}" fill="${theme.colors.background}" stroke="${theme.colors.accent}" stroke-width="2.5" stroke-opacity="0.85" />
    <image href="${escapeXml(profile.avatarDataUrl)}" x="${AVATAR_CX - AVATAR_RADIUS}" y="${cy - AVATAR_RADIUS}" width="${AVATAR_RADIUS * 2}" height="${AVATAR_RADIUS * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clip})" />
  </g>
  <text x="${TEXT_X}" y="${frame.y + textY.name}" font-family="${fontFamily}" font-size="23" font-weight="700" fill="${theme.colors.foreground}">${escapeXml(displayName)}</text>
  <text x="${TEXT_X}" y="${frame.y + textY.handle}" font-family="${fontFamily}" font-size="13.5" fill="${theme.colors.accent}" aria-label="GitHub username">@${escapeXml(login)}</text>
  <text x="${TEXT_X}" y="${frame.y + textY.bio}" font-family="${fontFamily}" font-size="${theme.typography.bodySize}" fill="${theme.colors.muted}">${escapeXml(bio)}</text>
  ${badges}
</g>`
    },
  })
}

export function createProfileSection(
  profile: ProfileCardData,
  options: ProfileSectionOptions = {},
): CardSection {
  return createProfileSectionWithHeight(
    profile,
    options.pairWithStats
      ? LEGACY_OVERLAPPING_PROFILE_SECTION_HEIGHT
      : PROFILE_SECTION_HEIGHT,
    options.badgeEvaluation,
  )
}

/**
 * Compact profile layout that nests beside a following stats section.
 */
export function createLegacyOverlappingProfileSection(
  profile: ProfileCardData,
  badgeEvaluation?: BadgeEvaluation,
): CardSection {
  return createProfileSection(profile, {
    pairWithStats: true,
    badgeEvaluation,
  })
}

export function createStatsSection(
  profile: ProfileCardData,
  options: StatsSectionOptions = {},
): CardSection {
  const besideAvatar = options.besideAvatar ?? false
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
    payload: { type: 'stats', profile, besideAvatar },
    render: ({ frame, theme, fontFamily, outline }) => {
      const y = frame.y + 12
      const startX = besideAvatar ? TEXT_X : CARD_PADDING
      const endX = frame.width - CARD_PADDING
      const width =
        (endX - startX - STATS_GAP * (STATS.length - 1)) / STATS.length
      const badgeRadius = iconOutlineRadius(outline, BADGE_SIZE, BADGE_SIZE * 0.28)

      return STATS.map((stat, index) => {
        const x = startX + index * (width + STATS_GAP)
        const value = formattedValues[stat.key]
        const contentTop = y + (STAT_TILE_HEIGHT - BADGE_SIZE) / 2
        const textX = x + STAT_PAD_X + BADGE_SIZE + STAT_ICON_GAP
        const labelY = contentTop + STAT_LABEL_SIZE
        const valueY = contentTop + BADGE_SIZE - STAT_VALUE_SIZE * 0.12
        return `<g data-stat="${stat.key}" data-layout="${besideAvatar ? 'paired' : 'full'}" aria-label="${escapeXml(`${stat.label}: ${value}`)}">
  ${renderItemOutlineRect({
    x,
    y,
    width,
    height: STAT_TILE_HEIGHT,
    fill: theme.colors.background,
    fillOpacity: 0.8,
    borderColor: theme.colors.border,
    outline,
    radiusFallback: 12,
  })}
  ${tintedBadge(x + STAT_PAD_X, contentTop, BADGE_SIZE, ICONS[stat.icon], theme.colors.accent, badgeRadius)}
  <text x="${textX}" y="${labelY}" font-family="${fontFamily}" font-size="${STAT_LABEL_SIZE}" letter-spacing="0.04em" fill="${theme.colors.muted}">${escapeXml(stat.label.toUpperCase())}</text>
  <text x="${textX}" y="${valueY}" font-family="${fontFamily}" font-size="${STAT_VALUE_SIZE}" font-weight="700" fill="${theme.colors.foreground}">${escapeXml(value)}</text>
</g>`
      }).join('\n')
    },
  })
}
