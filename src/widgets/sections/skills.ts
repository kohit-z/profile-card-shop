import { renderItemOutlineRect } from '../../data/outline-style.js'
import type { SkillIconTheme } from '../../data/skill-style.js'
import {
  resolveSkillIconBody,
  resolveSkillIconName,
  type SkillDefinition,
} from '../../data/skills.js'
import { escapeXml, truncateText } from '../../lib/svg.js'
import type { ThemeName } from '../../themes/index.js'
import { CARD_WIDTH, defineCardSection, type CardSection } from '../card.js'

const CARD_PADDING = 22
const TITLE_HEIGHT = 46
const CELL_GAP = 12
const LABELED_CELL_WIDTH = 150
const ICON_CELL_WIDTH = 68
const LABELED_CELL_HEIGHT = 74
const ICON_CELL_HEIGHT = 60
const ICON_SIZE = 34
const ICON_VIEWBOX = 256
const MIN_LABELED_CELL_WIDTH = 118
const MIN_ICON_CELL_WIDTH = 52
const LABEL_INSET_LEFT = 14
const LABEL_GAP_AFTER_ICON = 12
const LABEL_INSET_RIGHT = 12
const LABEL_FONT_SIZE = 13.5
/** Approximate advance width for semibold label text at `LABEL_FONT_SIZE`. */
const LABEL_CHAR_WIDTH = LABEL_FONT_SIZE * 0.58

export interface SkillsSectionOptions {
  readonly labels?: boolean
  readonly columns?: number
  readonly width?: number
  readonly iconTheme?: SkillIconTheme
}

export interface SkillsLayout {
  readonly columns: number
  readonly rows: number
  readonly preferredCellWidth: number
  readonly cellWidth: number
  readonly cellHeight: number
  readonly width: number
  readonly height: number
}

function preferredCellWidthFor(labels: boolean): number {
  return labels ? LABELED_CELL_WIDTH : ICON_CELL_WIDTH
}

function minCellWidthFor(labels: boolean): number {
  return labels ? MIN_LABELED_CELL_WIDTH : MIN_ICON_CELL_WIDTH
}

/** How many skill cells fit across `availableWidth` at the preferred size. */
export function getSkillsColumnCount(
  skillCount: number,
  availableWidth?: number,
  labels = true,
): number {
  const preferred = preferredCellWidthFor(labels)
  const minCell = minCellWidthFor(labels)
  const width = availableWidth ?? CARD_WIDTH - CARD_PADDING * 2
  const maxByPreferred = Math.max(
    1,
    Math.floor((width + CELL_GAP) / (preferred + CELL_GAP)),
  )
  let columns = Math.min(Math.max(1, skillCount), maxByPreferred)

  while (columns > 1) {
    const cellWidth =
      (width - Math.max(0, columns - 1) * CELL_GAP) / columns
    if (cellWidth >= minCell) break
    columns -= 1
  }

  return columns
}

function resolveCellWidth(
  columns: number,
  availableWidth: number,
  labels: boolean,
): number {
  const preferred = preferredCellWidthFor(labels)
  const minCell = minCellWidthFor(labels)
  const gaps = Math.max(0, columns - 1) * CELL_GAP
  const stretched = (availableWidth - gaps) / columns
  // Prefer compact cells; only shrink when the row cannot fit preferred width.
  if (stretched >= preferred) return preferred
  return Math.max(minCell, stretched)
}

export function resolveSkillsLayout(
  skillCount: number,
  options: SkillsSectionOptions = {},
): SkillsLayout {
  const labels = options.labels ?? true
  const frameWidth = options.width ?? CARD_WIDTH
  const available = frameWidth - CARD_PADDING * 2
  const columns = Math.max(
    1,
    Math.floor(
      options.columns ?? getSkillsColumnCount(skillCount, available, labels),
    ),
  )
  const rows = Math.ceil(skillCount / columns)
  const preferredCellWidth = preferredCellWidthFor(labels)
  const cellWidth = resolveCellWidth(columns, available, labels)
  const cellHeight = labels ? LABELED_CELL_HEIGHT : ICON_CELL_HEIGHT
  return {
    columns,
    rows,
    preferredCellWidth,
    cellWidth,
    cellHeight,
    width: frameWidth,
    height:
      TITLE_HEIGHT +
      rows * cellHeight +
      Math.max(0, rows - 1) * CELL_GAP +
      CARD_PADDING,
  }
}

function renderSkillIcon(
  skill: SkillDefinition,
  themeName: ThemeName,
  iconX: number,
  iconY: number,
): string {
  const body = resolveSkillIconBody(skill, themeName)
  const iconName = resolveSkillIconName(skill, themeName)
  const scale = ICON_SIZE / ICON_VIEWBOX

  return `<g transform="translate(${iconX} ${iconY}) scale(${scale})" data-icon="${escapeXml(iconName)}">${body}</g>`
}

export function createSkillsSection(
  skills: readonly SkillDefinition[],
  options: SkillsSectionOptions = {},
): CardSection {
  if (skills.length === 0) {
    throw new Error('The skills section requires at least one skill.')
  }

  const labels = options.labels ?? true
  const iconTheme = options.iconTheme ?? 'accent'
  const layout = resolveSkillsLayout(skills.length, options)
  const { columns, rows, cellWidth, cellHeight, height } = layout
  const names = skills.map((skill) => skill.label).join(', ')

  return defineCardSection({
    id: 'skills',
    height,
    title: `Skills: ${names}`,
    description: `A skills section showing ${skills.length} ${skills.length === 1 ? 'skill' : 'skills'}: ${names}.`,
    payload: { type: 'skills', skills, labels, iconTheme },
    render: ({ frame, theme, fontFamily, outline }) => {
      const groups = skills
        .map((skill, index) => {
          const column = index % columns
          const row = Math.floor(index / columns)
          const x = CARD_PADDING + column * (cellWidth + CELL_GAP)
          const y = frame.y + TITLE_HEIGHT + row * (cellHeight + CELL_GAP)
          const iconX = labels
            ? x + LABEL_INSET_LEFT
            : x + (cellWidth - ICON_SIZE) / 2
          const iconY = y + (cellHeight - ICON_SIZE) / 2
          const labelX = iconX + ICON_SIZE + LABEL_GAP_AFTER_ICON
          const maxLabelWidth = Math.max(
            0,
            cellWidth - (labelX - x) - LABEL_INSET_RIGHT,
          )
          const maxLabelChars = Math.max(
            1,
            Math.floor(maxLabelWidth / LABEL_CHAR_WIDTH),
          )
          const label = labels
            ? `<text x="${labelX}" y="${y + cellHeight / 2 + 5}" font-family="${fontFamily}" font-size="${LABEL_FONT_SIZE}" font-weight="600" fill="${theme.colors.foreground}">${escapeXml(truncateText(skill.label, maxLabelChars))}</text>`
            : ''
          return `<g data-skill="${escapeXml(skill.id)}" data-category="${skill.category}" aria-label="${escapeXml(skill.label)}">
  ${renderItemOutlineRect({
    x,
    y,
    width: cellWidth,
    height: cellHeight,
    fill: theme.colors.background,
    fillOpacity: 0.75,
    borderColor: theme.colors.border,
    outline,
    radiusFallback: 10,
  })}
  ${renderSkillIcon(skill, theme.name, iconX, iconY)}
  ${label}
</g>`
        })
        .join('\n')

      return `<g data-labels="${labels}" data-columns="${columns}" data-rows="${rows}" data-icon-theme="${iconTheme}" data-outline="${outline}">
  <text x="${CARD_PADDING}" y="${frame.y + 30}" font-family="${fontFamily}" font-size="17" font-weight="700" fill="${theme.colors.foreground}">Skills</text>
${groups}
</g>`
    },
  })
}
