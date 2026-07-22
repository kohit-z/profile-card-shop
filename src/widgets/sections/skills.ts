import type { SkillDefinition } from '../../data/skills.js'
import { escapeXml } from '../../lib/svg.js'
import { defineCardSection, type CardSection } from '../card.js'

const CARD_PADDING = 18
const TITLE_HEIGHT = 48
const CELL_GAP = 12
const LABELED_CELL_WIDTH = 150
const ICON_CELL_WIDTH = 68
const LABELED_CELL_HEIGHT = 72
const ICON_CELL_HEIGHT = 60
const ICON_SIZE = 34

export interface SkillsSectionOptions {
  readonly labels?: boolean
  readonly columns?: number
}

export interface SkillsLayout {
  readonly columns: number
  readonly rows: number
  readonly preferredCellWidth: number
  readonly cellHeight: number
  readonly width: number
  readonly height: number
}

export function getSkillsColumnCount(skillCount: number): number {
  return Math.min(5, Math.max(1, Math.ceil(Math.sqrt(skillCount))))
}

export function resolveSkillsLayout(
  skillCount: number,
  options: SkillsSectionOptions = {},
): SkillsLayout {
  const labels = options.labels ?? true
  const columns = Math.min(
    5,
    Math.max(1, Math.floor(options.columns ?? getSkillsColumnCount(skillCount))),
  )
  const rows = Math.ceil(skillCount / columns)
  const preferredCellWidth = labels ? LABELED_CELL_WIDTH : ICON_CELL_WIDTH
  const cellHeight = labels ? LABELED_CELL_HEIGHT : ICON_CELL_HEIGHT
  return {
    columns,
    rows,
    preferredCellWidth,
    cellHeight,
    width:
      CARD_PADDING * 2 +
      columns * preferredCellWidth +
      Math.max(0, columns - 1) * CELL_GAP,
    height:
      TITLE_HEIGHT +
      rows * cellHeight +
      Math.max(0, rows - 1) * CELL_GAP +
      CARD_PADDING,
  }
}

export function createSkillsSection(
  skills: readonly SkillDefinition[],
  options: SkillsSectionOptions = {},
): CardSection {
  if (skills.length === 0) {
    throw new Error('The skills section requires at least one skill.')
  }

  const labels = options.labels ?? true
  const layout = resolveSkillsLayout(skills.length, options)
  const { columns, rows, cellHeight, height } = layout
  const names = skills.map((skill) => skill.label).join(', ')

  return defineCardSection({
    id: 'skills',
    height,
    title: `Skills: ${names}`,
    description: `A skills section showing ${skills.length} ${skills.length === 1 ? 'skill' : 'skills'}: ${names}.`,
    render: ({ frame, theme, fontFamily }) => {
      const available =
        frame.width - CARD_PADDING * 2 - Math.max(0, columns - 1) * CELL_GAP
      const cellWidth = available / columns
      const groups = skills
        .map((skill, index) => {
          const column = index % columns
          const row = Math.floor(index / columns)
          const x = CARD_PADDING + column * (cellWidth + CELL_GAP)
          const y = frame.y + TITLE_HEIGHT + row * (cellHeight + CELL_GAP)
          const iconX = labels ? x + 16 : x + (cellWidth - ICON_SIZE) / 2
          const iconY = labels ? y + 19 : y + (cellHeight - ICON_SIZE) / 2
          const label = labels
            ? `<text x="${iconX + ICON_SIZE + 12}" y="${y + 42}" font-family="${fontFamily}" font-size="14" font-weight="600" fill="${theme.colors.foreground}">${escapeXml(skill.label)}</text>`
            : ''
          return `<g data-skill="${escapeXml(skill.id)}" data-category="${skill.category}" aria-label="${escapeXml(skill.label)}">
  <rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" rx="9" fill="${theme.colors.background}" fill-opacity="0.72" stroke="${theme.colors.border}" />
  <g transform="translate(${iconX} ${iconY}) scale(${ICON_SIZE / 24})" color="${theme.colors.foreground}">
    <path d="${escapeXml(skill.icon.path)}" fill="currentColor" />
  </g>
  ${label}
</g>`
        })
        .join('\n')

      return `<g data-labels="${labels}" data-columns="${columns}" data-rows="${rows}">
  <text x="${CARD_PADDING}" y="${frame.y + 32}" font-family="${fontFamily}" font-size="${theme.typography.titleSize}" font-weight="700" fill="${theme.colors.foreground}">Skills</text>
${groups}
</g>`
    },
  })
}
