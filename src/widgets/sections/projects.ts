import {
  renderItemOutlineRect,
} from '../../data/outline-style.js'
import { escapeXml, truncateText } from '../../lib/svg.js'
import type { PinnedRepository } from '../../services/github.js'
import { defineCardSection, type CardSection } from '../card.js'

const CARD_PADDING = 22
const TITLE_HEIGHT = 46
const CELL_GAP = 12
const CELL_HEIGHT = 92
const COLUMNS = 2
const STAR_ICON =
  'M12 2.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 15.9 6.7 18.6l1-5.8L3.5 8.7l5.9-.9L12 2.5z'

export function createProjectsSection(
  projects: readonly PinnedRepository[],
): CardSection {
  if (projects.length === 0) {
    return defineCardSection({
      id: 'projects',
      height: TITLE_HEIGHT + CARD_PADDING,
      title: 'Pinned Projects',
      description: 'A projects section with no pinned repositories.',
      payload: { type: 'projects', projects },
      render: ({ frame, theme, fontFamily }) =>
        `<g data-columns="${COLUMNS}" data-rows="0" data-projects-empty="true">
  <text x="${CARD_PADDING}" y="${frame.y + 30}" font-family="${fontFamily}" font-size="17" font-weight="700" fill="${theme.colors.foreground}">Pinned Projects</text>
</g>`,
    })
  }

  const rows = Math.ceil(projects.length / COLUMNS)
  const height =
    TITLE_HEIGHT +
    rows * CELL_HEIGHT +
    Math.max(0, rows - 1) * CELL_GAP +
    CARD_PADDING
  const names = projects.map((project) => project.name).join(', ')

  return defineCardSection({
    id: 'projects',
    height,
    title: `Projects: ${names}`,
    description: `A projects section showing ${projects.length} pinned ${projects.length === 1 ? 'repository' : 'repositories'}: ${names}.`,
    payload: { type: 'projects', projects },
    render: ({ frame, theme, fontFamily, outline }) => {
      const available = frame.width - CARD_PADDING * 2 - CELL_GAP
      const cellWidth = available / COLUMNS
      const groups = projects
        .map((project, index) => {
          const column = index % COLUMNS
          const row = Math.floor(index / COLUMNS)
          const x = CARD_PADDING + column * (cellWidth + CELL_GAP)
          const y = frame.y + TITLE_HEIGHT + row * (CELL_HEIGHT + CELL_GAP)
          const language = project.primaryLanguage
          const languageColor = language?.color ?? theme.colors.muted
          const languageLabel = language?.name ?? 'Unknown'
          const description = project.description?.trim()
            ? truncateText(project.description.trim(), 48)
            : 'No description'
          return `<a href="${escapeXml(project.url)}" target="_blank" rel="noopener noreferrer" data-project="${escapeXml(project.name)}" aria-label="${escapeXml(`${project.name}: ${project.stargazerCount} stars`)}">
  ${renderItemOutlineRect({
    x,
    y,
    width: cellWidth,
    height: CELL_HEIGHT,
    fill: theme.colors.background,
    fillOpacity: 0.75,
    borderColor: theme.colors.border,
    outline,
    radiusFallback: 10,
  })}
  <text x="${x + 16}" y="${y + 28}" font-family="${fontFamily}" font-size="14" font-weight="700" fill="${theme.colors.foreground}">${escapeXml(truncateText(project.name, 28))}</text>
  <text x="${x + 16}" y="${y + 50}" font-family="${fontFamily}" font-size="12" fill="${theme.colors.muted}">${escapeXml(description)}</text>
  <circle cx="${x + 22}" cy="${y + 70}" r="5" fill="${escapeXml(languageColor)}" />
  <text x="${x + 34}" y="${y + 74}" font-family="${fontFamily}" font-size="11.5" fill="${theme.colors.muted}">${escapeXml(truncateText(languageLabel, 16))}</text>
  <g transform="translate(${x + cellWidth - 70} ${y + 62}) scale(0.55)" color="${theme.colors.accent}">
    <path d="${STAR_ICON}" fill="currentColor" />
  </g>
  <text x="${x + cellWidth - 40}" y="${y + 74}" font-family="${fontFamily}" font-size="12" font-weight="600" fill="${theme.colors.foreground}">${project.stargazerCount}</text>
</a>`
        })
        .join('\n')

      return `<g data-columns="${COLUMNS}" data-rows="${rows}" data-outline="${outline}">
  <text x="${CARD_PADDING}" y="${frame.y + 30}" font-family="${fontFamily}" font-size="17" font-weight="700" fill="${theme.colors.foreground}">Pinned Projects</text>
${groups}
</g>`
    },
  })
}
