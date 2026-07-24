import { escapeXml } from '../../lib/svg.js'
import {
  type ContributionCalendar,
  type ContributionLevel,
} from '../../services/github.js'
import type { Theme } from '../../themes/index.js'
import { CARD_WIDTH, defineCardSection, type CardSection } from '../card.js'

const CARD_PADDING = 22
const TITLE_BASELINE = 30
const GRAPH_TOP = 46
const CELL = 11
const GAP = 3
const DAYS = 7
const BOTTOM_PADDING = 20

const LEVEL_OPACITY: Readonly<Record<ContributionLevel, number>> = {
  NONE: 0,
  FIRST_QUARTILE: 0.28,
  SECOND_QUARTILE: 0.48,
  THIRD_QUARTILE: 0.72,
  FOURTH_QUARTILE: 1,
}

function graphHeight(): number {
  return DAYS * CELL + (DAYS - 1) * GAP
}

function sectionHeight(): number {
  return GRAPH_TOP + graphHeight() + BOTTOM_PADDING
}

function cellFill(level: ContributionLevel, theme: Theme): string {
  if (level === 'NONE') {
    return theme.colors.border
  }
  return theme.colors.accent
}

function cellOpacity(level: ContributionLevel): number {
  return level === 'NONE' ? 0.55 : LEVEL_OPACITY[level]
}

/** Deterministic 0..1 hash so pulse timing stays stable across renders. */
function pulseSeed(date: string, weekIndex: number, dayIndex: number): number {
  let hash = 2166136261
  const key = `${date}:${weekIndex}:${dayIndex}`
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 0xffffffff
}

function cells(
  calendar: ContributionCalendar,
  theme: Theme,
  originX: number,
  originY: number,
): string {
  return calendar.weeks
    .flatMap((week, weekIndex) =>
      week.contributionDays.map((day, dayIndex) => {
        const x = originX + weekIndex * (CELL + GAP)
        const y = originY + dayIndex * (CELL + GAP)
        const fill = cellFill(day.contributionLevel, theme)
        const opacity = cellOpacity(day.contributionLevel)
        const seed = pulseSeed(day.date, weekIndex, dayIndex)
        const dur = (1.6 + seed * 2.4).toFixed(2)
        const begin = (seed * 3.2).toFixed(2)
        const peak = Math.min(1, opacity + 0.35).toFixed(2)
        const base = opacity.toFixed(2)
        return `<rect data-contribution-day="${escapeXml(day.date)}" data-contribution-level="${day.contributionLevel}" data-contribution-count="${day.contributionCount}" x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" ry="2" fill="${escapeXml(fill)}" fill-opacity="${opacity}"><title>${escapeXml(`${day.contributionCount} contribution${day.contributionCount === 1 ? '' : 's'} on ${day.date}`)}</title><animate attributeName="fill-opacity" values="${base};${peak};${base}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite" /></rect>`
      }),
    )
    .join('\n')
}

export function createContributionsSection(
  calendar: ContributionCalendar,
): CardSection {
  const total = calendar.totalContributions
  const height = sectionHeight()
  const weeks = calendar.weeks.length

  return defineCardSection({
    id: 'contributions',
    height,
    title: 'Contribution graph',
    description: `A contribution graph with ${total} contribution${total === 1 ? '' : 's'}.`,
    payload: { type: 'contributions', calendar },
    render: ({ frame, theme, fontFamily }) => {
      const graphY = frame.y + GRAPH_TOP
      const available = CARD_WIDTH - CARD_PADDING * 2
      const needed =
        weeks === 0 ? 0 : weeks * CELL + Math.max(0, weeks - 1) * GAP
      const cellsX = CARD_PADDING + Math.max(0, (available - needed) / 2)

      return `<g data-contributions="true" data-contribution-weeks="${weeks}" data-contribution-total="${total}">
  <text x="${CARD_PADDING}" y="${frame.y + TITLE_BASELINE}" font-family="${fontFamily}" font-size="17" font-weight="700" fill="${theme.colors.foreground}">Contributions</text>
${cells(calendar, theme, cellsX, graphY)}
</g>`
    },
  })
}
