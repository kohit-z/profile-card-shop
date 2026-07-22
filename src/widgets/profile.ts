import { escapeXml, truncateText } from '../lib/svg'
import { getTheme, type ThemeName } from '../themes'

export const PROFILE_CARD_WIDTH = 842
export const PROFILE_CARD_HEIGHT = 220

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

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(
    value,
  )
}

export function renderProfileCard(
  profile: ProfileCardData,
  themeName: ThemeName,
): string {
  const theme = getTheme(themeName)
  const displayName = truncateText(profile.name?.trim() || profile.login, 40)
  const login = truncateText(profile.login, 39)
  const bio = truncateText(profile.bio?.trim() || 'GitHub profile', 78)
  const title = escapeXml(`${displayName} (@${login})`)
  const description = escapeXml(
    `${bio}. ${formatCount(profile.followers)} followers, ${formatCount(profile.repositories)} repositories, ${formatCount(profile.stars)} stars, and ${formatCount(profile.contributions)} contributions.`,
  )
  const fontFamily = escapeXml(theme.typography.fontFamily)
  const avatarDataUrl = escapeXml(profile.avatarDataUrl)
  const gradientId = `profile-gradient-${theme.name}`
  const clipId = `profile-avatar-${theme.name}`
  const stats = [
    ['Followers', profile.followers],
    ['Repositories', profile.repositories],
    ['Stars', profile.stars],
    ['Contributions', profile.contributions],
  ] as const

  const statBlocks = stats
    .map(([label, value], index) => {
      const x = 184 + index * 156
      return `  <g aria-label="${escapeXml(`${label}: ${formatCount(value)}`)}">
    <rect x="${x}" y="130" width="144" height="68" rx="9" fill="${theme.colors.background}" fill-opacity="0.72" stroke="${theme.colors.border}" />
    <text x="${x + 16}" y="159" font-family="${fontFamily}" font-size="20" font-weight="700" fill="${theme.colors.foreground}">${escapeXml(formatCount(value))}</text>
    <text x="${x + 16}" y="182" font-family="${fontFamily}" font-size="12" fill="${theme.colors.muted}">${escapeXml(label)}</text>
  </g>`
    })
    .join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PROFILE_CARD_WIDTH}" height="${PROFILE_CARD_HEIGHT}" viewBox="0 0 ${PROFILE_CARD_WIDTH} ${PROFILE_CARD_HEIGHT}" role="img" aria-labelledby="profile-title profile-description">
  <title id="profile-title">${title}</title>
  <desc id="profile-description">${description}</desc>
  <defs>
    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.gradient.from}" />
      <stop offset="100%" stop-color="${theme.gradient.to}" />
    </linearGradient>
    <clipPath id="${clipId}">
      <circle cx="92" cy="110" r="70" />
    </clipPath>
  </defs>
  <rect x="0.5" y="0.5" width="${PROFILE_CARD_WIDTH - 1}" height="${PROFILE_CARD_HEIGHT - 1}" rx="${theme.card.radius}" fill="url(#${gradientId})" stroke="${theme.colors.border}" stroke-width="${theme.card.borderWidth}" />
  <circle cx="92" cy="110" r="73" fill="${theme.colors.background}" stroke="${theme.colors.border}" stroke-width="2" />
  <image href="${avatarDataUrl}" x="22" y="40" width="140" height="140" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" />
  <text x="184" y="46" font-family="${fontFamily}" font-size="24" font-weight="700" fill="${theme.colors.foreground}">${escapeXml(displayName)}</text>
  <text x="184" y="72" font-family="${fontFamily}" font-size="14" fill="${theme.colors.accent}">@${escapeXml(login)}</text>
  <text x="184" y="105" font-family="${fontFamily}" font-size="${theme.typography.bodySize}" fill="${theme.colors.muted}">${escapeXml(bio)}</text>
${statBlocks}
</svg>`
}
