import type {
  AchievementBadgeDefinition,
  BadgeAward,
  BadgeEvaluation,
} from '../data/badges.js'
import { escapeXml } from '../lib/svg.js'

const CHIP_HEIGHT = 24
const CHIP_GAP = 6
const CHIP_BASE_WIDTH = 34
const LABEL_CHARACTER_WIDTH = 6
const OVERFLOW_BASE_WIDTH = 34

export interface AutomaticBadgeRenderOptions {
  readonly evaluation?: BadgeEvaluation
  readonly x: number
  readonly y: number
  readonly maxWidth: number
  /** XML-escaped font-family attribute value supplied by the theme renderer. */
  readonly escapedFontFamily: string
  readonly layout: 'paired' | 'solo' | 'banner'
  readonly variant: 'classic' | 'nebula'
}

interface BadgeDisplay {
  readonly awards: readonly BadgeAward[]
  readonly hiddenAchievements: readonly AchievementBadgeDefinition[]
}

function labelLength(label: string): number {
  return Array.from(label).length
}

function chipWidth(award: BadgeAward): number {
  return CHIP_BASE_WIDTH + labelLength(award.label) * LABEL_CHARACTER_WIDTH
}

function overflowWidth(count: number): number {
  return OVERFLOW_BASE_WIDTH + String(count).length * LABEL_CHARACTER_WIDTH
}

function displayWidth(display: BadgeDisplay): number {
  const widths = display.awards.map(chipWidth)
  if (display.hiddenAchievements.length > 0) {
    widths.push(overflowWidth(display.hiddenAchievements.length))
  }
  return widths.reduce((total, width) => total + width, 0) +
    Math.max(0, widths.length - 1) * CHIP_GAP
}

function resolveDisplay(
  evaluation: BadgeEvaluation,
  maxWidth: number,
): BadgeDisplay {
  const visibleAchievements = [...evaluation.visibleAchievements]
  const hiddenAchievements = [...(evaluation.overflow?.awards ?? [])]

  while (true) {
    const display = {
      awards: [evaluation.level, ...visibleAchievements],
      hiddenAchievements,
    } satisfies BadgeDisplay
    if (displayWidth(display) <= maxWidth || visibleAchievements.length === 0) {
      return display
    }
    hiddenAchievements.unshift(visibleAchievements.pop()!)
  }
}

function renderAward(
  award: BadgeAward,
  x: number,
  fontFamily: string,
  variant: AutomaticBadgeRenderOptions['variant'],
): string {
  const width = chipWidth(award)
  const fillOpacity = variant === 'nebula' ? 0.96 : 0.88
  const strokeOpacity = variant === 'nebula' ? 0.95 : 0.78

  return `<g data-badge-id="${escapeXml(award.id)}" data-badge-kind="${escapeXml(award.kind)}" transform="translate(${x} 0)" role="img" aria-label="${escapeXml(`${award.label}: ${award.description}`)}">
  <title>${escapeXml(award.description)}</title>
  <rect width="${width}" height="${CHIP_HEIGHT}" rx="12" fill="${escapeXml(award.palette.background)}" fill-opacity="${fillOpacity}" stroke="${escapeXml(award.palette.accent)}" stroke-opacity="${strokeOpacity}" />
  <g transform="translate(8 6) scale(0.75)" aria-hidden="true"><path d="${escapeXml(award.icon.path)}" fill="${escapeXml(award.palette.accent)}" /></g>
  <text x="25" y="16" font-family="${fontFamily}" font-size="10" font-weight="700" fill="${escapeXml(award.palette.foreground)}">${escapeXml(award.label)}</text>
</g>`
}

function renderOverflow(
  hidden: readonly AchievementBadgeDefinition[],
  x: number,
  fontFamily: string,
  variant: AutomaticBadgeRenderOptions['variant'],
): string {
  const title = hidden.map((award) => award.label).join(', ')
  const width = overflowWidth(hidden.length)
  const fill = variant === 'nebula' ? '#17181c' : '#1f2937'

  return `<g data-badge-overflow="${hidden.length}" transform="translate(${x} 0)" role="img" aria-label="${escapeXml(`${hidden.length} more badges: ${title}`)}">
  <title>${escapeXml(title)}</title>
  <rect width="${width}" height="${CHIP_HEIGHT}" rx="12" fill="${fill}" fill-opacity="0.94" stroke="#94a3b8" stroke-opacity="0.72" />
  <text x="${width / 2}" y="16" text-anchor="middle" font-family="${fontFamily}" font-size="10" font-weight="800" fill="#f8fafc">+${hidden.length}</text>
</g>`
}

export function renderAutomaticBadges(
  options: AutomaticBadgeRenderOptions,
): string {
  if (!options.evaluation) {
    return ''
  }

  const display = resolveDisplay(options.evaluation, options.maxWidth)
  let x = 0
  const awards = display.awards.map((award) => {
    const markup = renderAward(
      award,
      x,
      options.escapedFontFamily,
      options.variant,
    )
    x += chipWidth(award) + CHIP_GAP
    return markup
  })
  const overflow =
    display.hiddenAchievements.length > 0
      ? renderOverflow(
          display.hiddenAchievements,
          x,
          options.escapedFontFamily,
          options.variant,
        )
      : ''

  return `<g data-auto-badges="true" data-badge-layout="${options.layout}" transform="translate(${options.x} ${options.y})" role="group" aria-label="Automatic GitHub badges">
  ${awards.join('\n  ')}
  ${overflow}
</g>`
}
