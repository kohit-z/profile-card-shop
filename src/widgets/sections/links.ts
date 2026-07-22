import type { CardLink } from '../../data/links.js'
import { escapeXml, truncateText } from '../../lib/svg.js'
import { defineCardSection, type CardSection } from '../card.js'

const CARD_PADDING = 18
const TITLE_HEIGHT = 48
const CELL_GAP = 12
const CELL_HEIGHT = 64
const ICON_SIZE = 30
const COLUMNS = 2

function createLinksSection(
  id: 'contact' | 'donate',
  title: string,
  links: readonly CardLink[],
): CardSection {
  if (links.length === 0) {
    throw new Error(`The ${id} section requires at least one entry.`)
  }

  const rows = Math.ceil(links.length / COLUMNS)
  const height =
    TITLE_HEIGHT + rows * CELL_HEIGHT + Math.max(0, rows - 1) * CELL_GAP + CARD_PADDING
  const names = links.map((link) => `${link.label}: ${link.value}`).join(', ')

  return defineCardSection({
    id,
    height,
    title: `${title}: ${names}`,
    description: `A ${id} section with ${links.length} ${links.length === 1 ? 'option' : 'options'}: ${names}.`,
    render: ({ frame, theme, fontFamily }) => {
      const available = frame.width - CARD_PADDING * 2 - CELL_GAP
      const cellWidth = available / COLUMNS
      const groups = links
        .map((link, index) => {
          const column = index % COLUMNS
          const row = Math.floor(index / COLUMNS)
          const x = CARD_PADDING + column * (cellWidth + CELL_GAP)
          const y = frame.y + TITLE_HEIGHT + row * (CELL_HEIGHT + CELL_GAP)
          const iconX = x + 16
          const iconY = y + (CELL_HEIGHT - ICON_SIZE) / 2
          const textX = iconX + ICON_SIZE + 12
          return `<g data-${id}="${escapeXml(link.id)}" aria-label="${escapeXml(`${link.label}: ${link.value}`)}">
  <rect x="${x}" y="${y}" width="${cellWidth}" height="${CELL_HEIGHT}" rx="9" fill="${theme.colors.background}" fill-opacity="0.72" stroke="${theme.colors.border}" />
  <g transform="translate(${iconX} ${iconY}) scale(${ICON_SIZE / 24})" color="${theme.colors.accent}">
    <path d="${escapeXml(link.icon.path)}" fill="currentColor" />
  </g>
  <text x="${textX}" y="${y + 25}" font-family="${fontFamily}" font-size="13" font-weight="700" fill="${theme.colors.foreground}">${escapeXml(link.label)}</text>
  <text x="${textX}" y="${y + 45}" font-family="${fontFamily}" font-size="12" fill="${theme.colors.muted}">${escapeXml(truncateText(link.value, 36))}</text>
</g>`
        })
        .join('\n')

      return `<g data-columns="${COLUMNS}" data-rows="${rows}">
  <text x="${CARD_PADDING}" y="${frame.y + 32}" font-family="${fontFamily}" font-size="${theme.typography.titleSize}" font-weight="700" fill="${theme.colors.foreground}">${title}</text>
${groups}
</g>`
    },
  })
}

export function createContactSection(links: readonly CardLink[]): CardSection {
  return createLinksSection('contact', 'Contact', links)
}

export function createDonateSection(links: readonly CardLink[]): CardSection {
  return createLinksSection('donate', 'Support My Work', links)
}
