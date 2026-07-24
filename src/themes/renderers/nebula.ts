import { renderItemOutlineRect } from '../../data/outline-style.js'
import { resolveSkillIconBody, resolveSkillIconName } from '../../data/skills.js'
import {
  renderAvatarEffect,
  renderBackgroundEffect,
  renderCardEffect,
  renderSectionEffect,
  type EffectFrame,
  type EffectMarkup,
} from '../../effects/index.js'
import { escapeXml, truncateText } from '../../lib/svg.js'
import { renderAutomaticBadges } from '../../widgets/badges.js'
import type {
  CardSection,
  CardSectionPayload,
  ThemeRenderContext,
} from '../../widgets/card.js'
import {
  BRANDING_FOOTER_HEIGHT,
  renderRepositoryBadge,
} from '../branding.js'

const PAD = 32
const GAP = 12
const FONT = "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif"
const BANNER_HEIGHT = 200
const PROFILE_CONTENT_HEIGHT = BANNER_HEIGHT + 136
const CARD_RADIUS = 24
const PANEL_RADIUS = 14
const TILE_RADIUS = 12

function renderGlowFilters(prefix: string): string {
  return `<filter id="${prefix}-card-glow" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="10" result="cardBlur" />
      <feOffset dy="8" result="cardOffset" />
      <feFlood flood-color="#05060a" flood-opacity="0.55" result="cardShadowColor" />
      <feComposite in="cardShadowColor" in2="cardOffset" operator="in" result="cardShadow" />
      <feGaussianBlur in="SourceAlpha" stdDeviation="16" result="cardGlowBlur" />
      <feFlood flood-color="#a855f7" flood-opacity="0.34" result="cardGlowColor" />
      <feComposite in="cardGlowColor" in2="cardGlowBlur" operator="in" result="cardGlow" />
      <feMerge>
        <feMergeNode in="cardShadow" />
        <feMergeNode in="cardGlow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="${prefix}-panel-glow" x="-18%" y="-28%" width="136%" height="164%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="panelBlur" />
      <feOffset dy="4" result="panelOffset" />
      <feFlood flood-color="#000000" flood-opacity="0.42" result="panelShadowColor" />
      <feComposite in="panelShadowColor" in2="panelOffset" operator="in" result="panelShadow" />
      <feGaussianBlur in="SourceAlpha" stdDeviation="7" result="panelGlowBlur" />
      <feFlood flood-color="#8b5cf6" flood-opacity="0.22" result="panelGlowColor" />
      <feComposite in="panelGlowColor" in2="panelGlowBlur" operator="in" result="panelGlow" />
      <feMerge>
        <feMergeNode in="panelShadow" />
        <feMergeNode in="panelGlow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="${prefix}-divider-glow" x="-4%" y="-120%" width="108%" height="340%" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="1.4" />
    </filter>`
}

function renderNebulaPanel(options: {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly radius?: number
  readonly fill?: string
  readonly filterId: string
  readonly glow?: boolean
}): string {
  const radius = options.radius ?? PANEL_RADIUS
  const fill = options.fill ?? '#232428'
  const filter =
    options.glow === false ? '' : ` filter="url(#${options.filterId})"`
  return `<rect x="${options.x}" y="${options.y}" width="${options.width}" height="${options.height}" rx="${radius}" fill="${fill}"${filter} />`
}

const STAT_ICONS = {
  followers:
    'M10.39 8.61a3.04 3.04 0 1 0-4.78 0A4.76 4.76 0 0 0 2.5 13v.75h11V13a4.76 4.76 0 0 0-3.11-4.39zm4.36-1.36a2.2 2.2 0 1 0-2.2-2.2 2.2 2.2 0 0 0 2.2 2.2zm.75 1.5a3.9 3.9 0 0 1 2 3.4v.75h-2.1a5.7 5.7 0 0 0-.65-3.7 3.8 3.8 0 0 0-1.25-.45z',
  repositories:
    'M4 1.5A1.5 1.5 0 0 0 2.5 3v10.5A1.5 1.5 0 0 0 4 15h.75V1.5zm2.25 0V15h6.25A1.5 1.5 0 0 0 14 13.5V3A1.5 1.5 0 0 0 12.5 1.5zm1.5 2.25h4v1.25h-4zm0 2.5h4V7.5h-4zm0 2.5h3V10h-3z',
  stars:
    'M8 1.25l1.94 3.93 4.34.63-3.14 3.06.74 4.32L8 11.15l-3.88 2.04.74-4.32L1.72 5.81l4.34-.63z',
  contributions:
    'M9.6 1.5 6.85 8H2.5v1.5h5.15L10.4 3.2 13.15 14.5H16V13h-1.9z',
} as const

const STAT_COLORS = {
  followers: '#5865f2',
  repositories: '#8776ff',
  stars: '#f0b232',
  contributions: '#23a55a',
} as const

const CONTRIBUTION_COLORS = {
  NONE: '#2b2d31',
  FIRST_QUARTILE: '#54469a',
  SECOND_QUARTILE: '#7560ce',
  THIRD_QUARTILE: '#9b7cf4',
  FOURTH_QUARTILE: '#c7a9ff',
} as const

type Payload<T extends CardSectionPayload['type']> = Extract<
  CardSectionPayload,
  { readonly type: T }
>

interface LaidOutSection {
  readonly section: CardSection
  readonly frame: EffectFrame
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

function rows(count: number, columns: number): number {
  return Math.max(1, Math.ceil(Math.max(1, count) / columns))
}

function sectionHeight(section: CardSection, width: number): number {
  const payload = section.payload
  if (!payload) return section.height

  switch (payload.type) {
    case 'profile':
      return PROFILE_CONTENT_HEIGHT
    case 'stats':
      return 126
    case 'skills': {
      const columns = payload.labels ? 5 : Math.min(10, payload.skills.length)
      return 68 + rows(payload.skills.length, Math.max(1, columns)) * 50 + 20
    }
    case 'projects':
      return 64 + rows(payload.projects.length, 2) * 104 + 20
    case 'contributions':
      return 204
    case 'links': {
      const columns = payload.kind === 'donate' ? 1 : 2
      return 64 + rows(payload.links.length, columns) * 70 + 24
    }
    case 'giphy': {
      const maxWidth = width - PAD * 2
      const scale = Math.min(1, maxWidth / payload.gif.width, 220 / payload.gif.height)
      return 64 + Math.max(1, Math.round(payload.gif.height * scale)) + 28
    }
  }
}

function layoutSections(
  sections: readonly CardSection[],
  width: number,
): readonly LaidOutSection[] {
  let y = 0
  return sections.map((section) => {
    const height = sectionHeight(section, width)
    const frame = { x: 0, y, width, height }
    y += height
    return { section, frame }
  })
}

function renderProfile(
  payload: Payload<'profile'>,
  frame: EffectFrame,
  width: number,
  avatarMarkup: EffectMarkup,
  bannerGif: ThemeRenderContext['bannerGif'],
): string {
  const profile = payload.profile
  const name = truncateText(profile.name?.trim() || profile.login, 34)
  const bio = truncateText(profile.bio?.trim() || 'GitHub profile', 76)
  const avatar = { cx: 92, cy: frame.y + BANNER_HEIGHT, radius: 52 }
  const clip = `nebula-avatar-${frame.y}`
  const bannerClip = `nebula-banner-${frame.y}`
  const nameX = 168
  const badgeMaxWidth = Math.min(584, width - PAD * 2)
  const banner = bannerGif
    ? `<defs><clipPath id="${bannerClip}"><rect x="0" y="${frame.y}" width="${width}" height="${BANNER_HEIGHT}" /></clipPath></defs>
  <image href="${escapeXml(bannerGif.dataUrl)}" x="0" y="${frame.y}" width="${width}" height="${BANNER_HEIGHT}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${bannerClip})" />
  <rect x="0" y="${frame.y}" width="${width}" height="${BANNER_HEIGHT}" fill="#000000" fill-opacity="0.18" />`
    : `<rect x="0" y="${frame.y}" width="${width}" height="${BANNER_HEIGHT}" fill="url(#nebula-banner)" />`
  const bannerData = bannerGif
    ? ` data-nebula-banner-gif="${escapeXml(bannerGif.id)}"`
    : ''
  const badges = renderAutomaticBadges({
    evaluation: payload.badgeEvaluation,
    x: width - PAD - badgeMaxWidth,
    y: frame.y + 22,
    maxWidth: badgeMaxWidth,
    escapedFontFamily: escapeXml(FONT),
    layout: 'banner',
    variant: 'nebula',
  })

  return `<g data-nebula-banner="true"${bannerData}>
  ${banner}
  <circle cx="${width * 0.28}" cy="${frame.y + 52}" r="${width * 0.28}" fill="#ffffff" fill-opacity="0.08" />
</g>
${badges}
${avatarMarkup.underlay ?? ''}
<g data-nebula-identity="true" data-profile="${escapeXml(profile.login)}">
  <defs><clipPath id="${clip}"><circle cx="${avatar.cx}" cy="${avatar.cy}" r="${avatar.radius}" /></clipPath></defs>
  <g>${avatarMarkup.contentAnimation ?? ''}
    <circle cx="${avatar.cx}" cy="${avatar.cy}" r="59" fill="#232428" />
    <circle cx="${avatar.cx}" cy="${avatar.cy}" r="55" fill="none" stroke="url(#nebula-avatar-ring)" stroke-width="5" />
    <image href="${escapeXml(profile.avatarDataUrl)}" x="${avatar.cx - avatar.radius}" y="${avatar.cy - avatar.radius}" width="${avatar.radius * 2}" height="${avatar.radius * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clip})" />
  </g>
  <text x="${nameX}" y="${frame.y + BANNER_HEIGHT + 34}" font-family="${FONT}" font-size="25" font-weight="800" fill="#f2f3f5">${escapeXml(name)}</text>
  <text x="${nameX}" y="${frame.y + BANNER_HEIGHT + 57}" font-family="${FONT}" font-size="14" font-weight="600" fill="#949ba4">@${escapeXml(profile.login)}</text>
  <text x="${PAD}" y="${frame.y + BANNER_HEIGHT + 106}" font-family="${FONT}" font-size="14.5" font-style="italic" fill="#dbdee1">“${escapeXml(bio)}”</text>
</g>
${avatarMarkup.overlay ?? ''}`
}

function renderStats(payload: Payload<'stats'>, frame: EffectFrame): string {
  const stats = [
    ['followers', 'Followers', payload.profile.followers],
    ['repositories', 'Repositories', payload.profile.repositories],
    ['stars', 'Stars', payload.profile.stars],
    ['contributions', 'Contributions', payload.profile.contributions],
  ] as const
  const cellWidth = (frame.width - PAD * 2 - GAP * 3) / 4

  return `<g data-nebula-stats="true">${stats
    .map(([key, label, value], index) => {
      const x = PAD + index * (cellWidth + GAP)
      const y = frame.y + 18
      return `<g data-nebula-stat="${key}" data-stat="${key}" aria-label="${escapeXml(`${label}: ${formatCount(value)}`)}">
  ${renderNebulaPanel({
    x,
    y,
    width: cellWidth,
    height: 90,
    filterId: 'nebula-panel-glow',
  })}
  <g data-nebula-stat-icon="${key}">
    <rect x="${x + 14}" y="${y + 27}" width="36" height="36" rx="10" fill="${STAT_COLORS[key]}" fill-opacity="0.28" />
    <g transform="translate(${x + 24} ${y + 37})" fill="${STAT_COLORS[key]}"><path d="${STAT_ICONS[key]}" /></g>
  </g>
  <g data-nebula-stat-copy="${key}">
    <text x="${x + 64}" y="${y + 43}" font-family="${FONT}" font-size="19" font-weight="800" fill="#f2f3f5">${formatCount(value)}</text>
    <text x="${x + 64}" y="${y + 62}" font-family="${FONT}" font-size="10.5" font-weight="700" letter-spacing="0.6" fill="#949ba4">${label.toUpperCase()}</text>
  </g>
</g>`
    })
    .join('')}</g>`
}

function renderSkills(
  payload: Payload<'skills'>,
  frame: EffectFrame,
  outline: ThemeRenderContext['outline'],
): string {
  const columns = Math.max(
    1,
    payload.labels ? Math.min(5, payload.skills.length) : Math.min(10, payload.skills.length),
  )
  const cellWidth = (frame.width - PAD * 2 - GAP * (columns - 1)) / columns

  const skills = payload.skills
    .map((skill, index) => {
      const column = index % columns
      const row = Math.floor(index / columns)
      const x = PAD + column * (cellWidth + GAP)
      const y = frame.y + 52 + row * 50
      const iconSize = 26
      const iconX = payload.labels ? x + 10 : x + (cellWidth - iconSize) / 2
      const iconY = y + 7
      const iconName = resolveSkillIconName(skill, 'nebula')
      const label = payload.labels
        ? `<text x="${iconX + iconSize + 9}" y="${y + 25}" font-family="${FONT}" font-size="12.5" font-weight="600" fill="#dbdee1">${escapeXml(truncateText(skill.label, 16))}</text>`
        : ''
      return `<g data-skill="${escapeXml(skill.id)}" data-category="${skill.category}" aria-label="${escapeXml(skill.label)}">
  ${
    outline === 'none'
      ? renderItemOutlineRect({
          x,
          y,
          width: cellWidth,
          height: 40,
          fill: '#232428',
          fillOpacity: 1,
          borderColor: '#3a3c42',
          outline,
          radiusFallback: TILE_RADIUS,
        })
      : renderNebulaPanel({
          x,
          y,
          width: cellWidth,
          height: 40,
          radius: TILE_RADIUS,
          filterId: 'nebula-panel-glow',
        })
  }
  <g transform="translate(${iconX} ${iconY}) scale(${iconSize / 256})" data-icon="${escapeXml(iconName)}">${resolveSkillIconBody(skill, 'nebula')}</g>
  ${label}
</g>`
    })
    .join('')

  return `<g data-nebula-skills="true" data-labels="${payload.labels}" data-columns="${columns}" data-rows="${rows(payload.skills.length, columns)}" data-icon-theme="${payload.iconTheme}">
  <text x="${PAD}" y="${frame.y + 32}" font-family="${FONT}" font-size="15" font-weight="800" fill="#f2f3f5">Skills</text>
  ${skills}
</g>`
}

function renderProjects(payload: Payload<'projects'>, frame: EffectFrame): string {
  const columns = 2
  const cellWidth = (frame.width - PAD * 2 - GAP) / columns
  const cards =
    payload.projects.length === 0
      ? `<text x="${PAD}" y="${frame.y + 82}" font-family="${FONT}" font-size="13" fill="#949ba4" data-projects-empty="true">No pinned repositories</text>`
      : payload.projects
          .map((project, index) => {
            const column = index % columns
            const row = Math.floor(index / columns)
            const x = PAD + column * (cellWidth + GAP)
            const y = frame.y + 52 + row * 104
            const language = project.primaryLanguage?.name ?? 'Unknown'
            const color = project.primaryLanguage?.color ?? '#949ba4'
            return `<a href="${escapeXml(project.url)}" target="_blank" rel="noopener noreferrer" data-project="${escapeXml(project.name)}">
  ${renderNebulaPanel({
    x,
    y,
    width: cellWidth,
    height: 92,
    filterId: 'nebula-panel-glow',
  })}
  <path d="M0 0h11l3 3h12v18H0z" transform="translate(${x + 15} ${y + 15}) scale(.55)" fill="#949ba4" />
  <text x="${x + 38}" y="${y + 27}" font-family="${FONT}" font-size="14" font-weight="700" fill="#f2f3f5">${escapeXml(truncateText(project.name, 28))}</text>
  <text x="${x + 15}" y="${y + 50}" font-family="${FONT}" font-size="12.5" fill="#949ba4">${escapeXml(truncateText(project.description?.trim() || 'No description', 48))}</text>
  <circle cx="${x + 20}" cy="${y + 72}" r="4.5" fill="${escapeXml(color)}" />
  <text x="${x + 31}" y="${y + 76}" font-family="${FONT}" font-size="11.5" font-weight="600" fill="#b5bac1">${escapeXml(truncateText(language, 18))}</text>
  <text x="${x + cellWidth - 54}" y="${y + 76}" font-family="${FONT}" font-size="11.5" font-weight="700" fill="#f0b232">★ ${project.stargazerCount}</text>
</a>`
          })
          .join('')

  return `<g data-nebula-projects="true" data-columns="2">
  <text x="${PAD}" y="${frame.y + 32}" font-family="${FONT}" font-size="15" font-weight="800" fill="#f2f3f5">Pinned Projects</text>
  ${cards}
</g>`
}

function renderContributions(
  payload: Payload<'contributions'>,
  frame: EffectFrame,
): string {
  const cell = 10
  const gap = 3
  const weeks = payload.calendar.weeks.length
  const panelX = PAD
  const panelY = frame.y + 50
  const panelWidth = frame.width - PAD * 2
  const panelHeight = 130
  const graphWidth =
    weeks === 0 ? 0 : weeks * cell + Math.max(0, weeks - 1) * gap
  const graphHeight = 7 * cell + 6 * gap
  const graphX = panelX + Math.max(0, (panelWidth - graphWidth) / 2)
  const graphY = panelY + Math.max(0, (panelHeight - graphHeight) / 2)
  const cells = payload.calendar.weeks
    .flatMap((week, weekIndex) =>
      week.contributionDays.map(
        (day, dayIndex) =>
          `<rect data-contribution-day="${escapeXml(day.date)}" data-contribution-level="${day.contributionLevel}" data-contribution-count="${day.contributionCount}" x="${graphX + weekIndex * (cell + gap)}" y="${graphY + dayIndex * (cell + gap)}" width="${cell}" height="${cell}" rx="2.5" fill="${CONTRIBUTION_COLORS[day.contributionLevel]}"><title>${escapeXml(`${day.contributionCount} contribution${day.contributionCount === 1 ? '' : 's'} on ${day.date}`)}</title></rect>`,
      ),
    )
    .join('')

  return `<g data-nebula-contributions="true" data-contributions="true" data-contribution-weeks="${weeks}" data-contribution-total="${payload.calendar.totalContributions}">
  <text x="${PAD}" y="${frame.y + 32}" font-family="${FONT}" font-size="15" font-weight="800" fill="#f2f3f5">Contributions</text>
  ${renderNebulaPanel({
    x: panelX,
    y: panelY,
    width: panelWidth,
    height: panelHeight,
    filterId: 'nebula-panel-glow',
  })}
  ${cells}
</g>`
}

function renderLinks(payload: Payload<'links'>, frame: EffectFrame): string {
  const columns = payload.kind === 'donate' ? 1 : 2
  const cellWidth = (frame.width - PAD * 2 - GAP * (columns - 1)) / columns
  const title = payload.kind === 'donate' ? 'Support My Work' : 'Contact'
  const cards = payload.links
    .map((link, index) => {
      const column = index % columns
      const row = Math.floor(index / columns)
      const x = PAD + column * (cellWidth + GAP)
      const y = frame.y + 52 + row * 70
      const brand = `#${link.icon.hex}`
      const fill =
        payload.kind === 'donate'
          ? 'url(#nebula-support)'
          : '#232428'
      return `<g data-${payload.kind}="${escapeXml(link.id)}" aria-label="${escapeXml(`${link.label}: ${link.value}`)}">
  ${renderNebulaPanel({
    x,
    y,
    width: cellWidth,
    height: 58,
    radius: TILE_RADIUS,
    fill,
    filterId: 'nebula-panel-glow',
  })}
  <rect x="${x + 14}" y="${y + 12}" width="34" height="34" rx="9" fill="${brand}" />
  <g transform="translate(${x + 21} ${y + 19}) scale(${20 / 24})" fill="#ffffff"><path d="${escapeXml(link.icon.path)}" /></g>
  <text x="${x + 60}" y="${y + 24}" font-family="${FONT}" font-size="10.5" font-weight="700" letter-spacing="0.5" fill="${payload.kind === 'donate' ? '#c9b8ff' : '#949ba4'}">${escapeXml(link.label.toUpperCase())}</text>
  <text x="${x + 60}" y="${y + 43}" font-family="${FONT}" font-size="13" font-weight="600" fill="#f2f3f5">${escapeXml(truncateText(link.value, 34))}</text>
</g>`
    })
    .join('')

  return `<g data-nebula-links="${payload.kind}">
  <text x="${PAD}" y="${frame.y + 32}" font-family="${FONT}" font-size="15" font-weight="800" fill="#f2f3f5">${title}</text>
  ${cards}
</g>`
}

function renderGiphy(payload: Payload<'giphy'>, frame: EffectFrame): string {
  const maxWidth = frame.width - PAD * 2
  const scale = Math.min(1, maxWidth / payload.gif.width, 220 / payload.gif.height)
  const imageWidth = Math.max(1, Math.round(payload.gif.width * scale))
  const imageHeight = Math.max(1, Math.round(payload.gif.height * scale))
  const x = (frame.width - imageWidth) / 2
  const y = frame.y + 52
  const clip = `nebula-giphy-${frame.y}`
  return `<g data-nebula-giphy="true" data-giphy="${escapeXml(payload.gif.id)}" aria-label="${escapeXml(payload.gif.title)}">
  <text x="${PAD}" y="${frame.y + 32}" font-family="${FONT}" font-size="15" font-weight="800" fill="#f2f3f5">Giphy</text>
  <defs><clipPath id="${clip}"><rect x="${x}" y="${y}" width="${imageWidth}" height="${imageHeight}" rx="${PANEL_RADIUS}" /></clipPath></defs>
  ${renderNebulaPanel({
    x,
    y,
    width: imageWidth,
    height: imageHeight,
    filterId: 'nebula-panel-glow',
  })}
  <image href="${escapeXml(payload.gif.dataUrl)}" x="${x}" y="${y}" width="${imageWidth}" height="${imageHeight}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${clip})" />
</g>`
}

function renderSectionContent(
  section: CardSection,
  frame: EffectFrame,
  context: ThemeRenderContext,
  avatarMarkup: EffectMarkup,
): string {
  const payload = section.payload
  if (!payload) {
    return section.render({
      frame,
      theme: context.theme,
      fontFamily: escapeXml(FONT),
      avatarAnimation: avatarMarkup.contentAnimation ?? '',
      outline: context.outline,
    })
  }

  switch (payload.type) {
    case 'profile':
      return renderProfile(
        payload,
        frame,
        context.width,
        avatarMarkup,
        context.bannerGif,
      )
    case 'stats':
      return renderStats(payload, frame)
    case 'skills':
      return renderSkills(payload, frame, context.outline)
    case 'projects':
      return renderProjects(payload, frame)
    case 'contributions':
      return renderContributions(payload, frame)
    case 'links':
      return renderLinks(payload, frame)
    case 'giphy':
      return renderGiphy(payload, frame)
  }
}

function markupPart(markups: readonly EffectMarkup[], key: keyof EffectMarkup): string {
  return markups.map((markup) => markup[key] ?? '').filter(Boolean).join('\n')
}

export function renderNebulaCard(context: ThemeRenderContext): string {
  const { sections, theme, width, effects } = context
  const laidOut = layoutSections(sections, width)
  const contentHeight = laidOut.reduce(
    (maximum, item) => Math.max(maximum, item.frame.y + item.frame.height),
    0,
  )
  const height = contentHeight + BRANDING_FOOTER_HEIGHT
  const prefix =
    effects.background === 'none'
      ? `card-nebula-${effects.card}-${effects.avatar}`
      : `card-nebula-background-${effects.background}-${effects.card}-${effects.avatar}`
  const cardClip = `${prefix}-clip`
  const cardFrame = { x: 0, y: 0, width, height }
  const backgroundMarkup = renderBackgroundEffect(effects.background, {
    theme,
    frame: cardFrame,
    ids: { prefix: `${prefix}-background`, clip: cardClip },
  })
  const cardMarkup = renderCardEffect(effects.card, {
    theme,
    frame: cardFrame,
    ids: { prefix, clip: cardClip },
  })

  const renderedSections = laidOut.map(({ section, frame }, index) => {
    const effect = effects.sections[section.id] ?? 'none'
    const sectionClip = `${prefix}-${section.id}-${index}-clip`
    const sectionMarkup = renderSectionEffect(effect, {
      theme,
      frame,
      ids: { prefix: `${prefix}-${section.id}-${index}`, clip: sectionClip },
    })
    const avatar =
      section.payload?.type === 'profile'
        ? { cx: 92, cy: frame.y + BANNER_HEIGHT, radius: 52 }
        : undefined
    const avatarMarkup = avatar
      ? renderAvatarEffect(effects.avatar, {
          theme,
          frame,
          avatar,
          ids: { prefix: `${prefix}-avatar-${index}`, clip: sectionClip },
        })
      : {}
    const divider =
      index === 0
        ? ''
        : `<line x1="${PAD}" y1="${frame.y}" x2="${width - PAD}" y2="${frame.y}" stroke="#a78bfa" stroke-opacity="0.28" stroke-width="1.25" filter="url(#nebula-divider-glow)" />`
    const content = renderSectionContent(
      section,
      frame,
      context,
      avatarMarkup,
    )
    const externalAvatarLayers = section.payload?.type === 'profile'
      ? { underlay: '', overlay: '' }
      : {
          underlay: avatarMarkup.underlay ?? '',
          overlay: avatarMarkup.overlay ?? '',
        }

    return {
      markup: `<g data-section="${escapeXml(section.id)}" data-section-effect="${effect}">
${divider}
${sectionMarkup.underlay ?? ''}
${externalAvatarLayers.underlay}
${content}
${externalAvatarLayers.overlay}
${sectionMarkup.overlay ?? ''}
</g>`,
      sectionMarkup,
      avatarMarkup,
      sectionClip,
      effect,
      frame,
    }
  })
  const scopedMarkups = renderedSections.flatMap((section) => [
    section.sectionMarkup,
    section.avatarMarkup,
  ])
  const sectionClips = renderedSections
    .filter((section) => section.effect !== 'none')
    .map(
      ({ frame, sectionClip }) =>
        `<clipPath id="${sectionClip}"><rect x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" /></clipPath>`,
    )
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${context.titleId} ${context.descriptionId}" data-theme="nebula" data-theme-renderer="nebula" data-outline="${context.outline}" data-sections="${escapeXml(sections.map((section) => section.id).join(','))}" data-background-effect="${effects.background}" data-card-effect="${effects.card}" data-avatar-effect="${effects.avatar}" data-nebula-surface="glow"${context.rootData}>
  <title id="${context.titleId}">${escapeXml(context.title)}</title>
  <desc id="${context.descriptionId}">${escapeXml(context.description)}</desc>
  <defs>
    <linearGradient id="nebula-card" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#2b2d31" /><stop offset="100%" stop-color="#232428" /></linearGradient>
    <linearGradient id="nebula-banner" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#8b5cf6" /><stop offset="48%" stop-color="#a855f7" /><stop offset="100%" stop-color="#6d7cff" /></linearGradient>
    <linearGradient id="nebula-avatar-ring" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#c4a4ff" /><stop offset="100%" stop-color="#a46cff" /></linearGradient>
    <linearGradient id="nebula-support" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4b2b70" /><stop offset="100%" stop-color="#3d285e" /></linearGradient>
    ${renderGlowFilters('nebula')}
    <clipPath id="${cardClip}"><rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${CARD_RADIUS}" ry="${CARD_RADIUS}" /></clipPath>
    ${sectionClips}
    ${backgroundMarkup.defs ?? ''}
    ${cardMarkup.defs ?? ''}
    ${markupPart(scopedMarkups, 'defs')}
  </defs>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${CARD_RADIUS}" ry="${CARD_RADIUS}" fill="url(#nebula-card)" filter="url(#nebula-card-glow)" data-nebula-card-shell="true" />
  <g clip-path="url(#${cardClip})" data-nebula-card-content="true">
  ${backgroundMarkup.underlay ?? ''}
  ${cardMarkup.underlay ?? ''}
  ${renderedSections.map((section) => section.markup).join('\n')}
  ${cardMarkup.overlay ?? ''}
  ${renderRepositoryBadge({
    width,
    height,
  })}
  </g>
</svg>`
}
