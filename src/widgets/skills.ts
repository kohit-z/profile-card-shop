import type { SkillDefinition } from '../data/skills.js'
import { escapeXml } from '../lib/svg.js'
import { getTheme, type ThemeName } from '../themes/index.js'

const CARD_PADDING = 18
const CARD_TOP = 62
const CELL_GAP = 12
const LABELED_CELL_WIDTH = 150
const ICON_CELL_WIDTH = 68
const LABELED_CELL_HEIGHT = 76
const ICON_CELL_HEIGHT = 64
const ICON_SIZE = 34

function columnCount(skillCount: number): number {
  return Math.min(5, Math.ceil(Math.sqrt(skillCount)))
}

export function renderSkillsCard(
  skills: readonly SkillDefinition[],
  themeName: ThemeName,
  labels: boolean,
): string {
  const theme = getTheme(themeName)
  const columns = columnCount(skills.length)
  const rows = Math.ceil(skills.length / columns)
  const cellWidth = labels ? LABELED_CELL_WIDTH : ICON_CELL_WIDTH
  const cellHeight = labels ? LABELED_CELL_HEIGHT : ICON_CELL_HEIGHT
  const width =
    CARD_PADDING * 2 + columns * cellWidth + (columns - 1) * CELL_GAP
  const height =
    CARD_TOP +
    rows * cellHeight +
    (rows - 1) * CELL_GAP +
    CARD_PADDING
  const titleText = `Skills: ${skills.map((skill) => skill.label).join(', ')}`
  const descriptionText = `A skills card showing ${skills.length} ${skills.length === 1 ? 'skill' : 'skills'}: ${skills.map((skill) => skill.label).join(', ')}.`
  const fontFamily = escapeXml(theme.typography.fontFamily)
  const gradientId = `skills-gradient-${theme.name}`

  const skillGroups = skills
    .map((skill, index) => {
      const column = index % columns
      const row = Math.floor(index / columns)
      const x = CARD_PADDING + column * (cellWidth + CELL_GAP)
      const y = CARD_TOP + row * (cellHeight + CELL_GAP)
      const iconX = labels ? x + 16 : x + (cellWidth - ICON_SIZE) / 2
      const iconY = labels ? y + 15 : y + (cellHeight - ICON_SIZE) / 2
      const iconScale = ICON_SIZE / 24
      const safeId = escapeXml(skill.id)
      const safeLabel = escapeXml(skill.label)
      const label = labels
        ? `\n    <text x="${iconX + ICON_SIZE + 12}" y="${y + 44}" font-family="${fontFamily}" font-size="14" font-weight="600" fill="${theme.colors.foreground}">${safeLabel}</text>`
        : ''

      return `  <g data-skill="${safeId}" data-category="${skill.category}" aria-label="${safeLabel}">
    <rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" rx="9" fill="${theme.colors.background}" fill-opacity="0.72" stroke="${theme.colors.border}" />
    <g transform="translate(${iconX} ${iconY}) scale(${iconScale})" color="${theme.colors.foreground}">
      <path d="${escapeXml(skill.icon.path)}" fill="currentColor" />
    </g>${label}
  </g>`
    })
    .join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="skills-title skills-description" data-theme="${theme.name}" data-labels="${labels}" data-columns="${columns}" data-rows="${rows}">
  <title id="skills-title">${escapeXml(titleText)}</title>
  <desc id="skills-description">${escapeXml(descriptionText)}</desc>
  <defs>
    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.gradient.from}" />
      <stop offset="100%" stop-color="${theme.gradient.to}" />
    </linearGradient>
  </defs>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${theme.card.radius}" fill="url(#${gradientId})" stroke="${theme.colors.border}" stroke-width="${theme.card.borderWidth}" />
  <text x="${CARD_PADDING}" y="38" font-family="${fontFamily}" font-size="${theme.typography.titleSize}" font-weight="700" fill="${theme.colors.foreground}">Skills</text>
${skillGroups}
</svg>`
}
