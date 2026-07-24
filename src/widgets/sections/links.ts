import {
  iconOutlineRadius,
  renderItemOutlineRect,
} from '../../data/outline-style.js'
import type { CardLink } from '../../data/links.js'
import { escapeXml, truncateText } from '../../lib/svg.js'
import { defineCardSection, type CardSection } from '../card.js'

const CARD_PADDING = 22
const TITLE_HEIGHT = 46
const CELL_GAP = 12
const CELL_HEIGHT = 66
const ICON_SIZE = 30
const ICON_SLOT_RADIUS = 8
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
    payload: { type: 'links', kind: id, links },
    render: ({ frame, theme, fontFamily, outline }) => {
      const available = frame.width - CARD_PADDING * 2 - CELL_GAP
      const cellWidth = available / COLUMNS
      const badgeRadius = iconOutlineRadius(outline, ICON_SIZE, ICON_SLOT_RADIUS)
      const groups = links
        .map((link, index) => {
          const column = index % COLUMNS
          const row = Math.floor(index / COLUMNS)
          const x = CARD_PADDING + column * (cellWidth + CELL_GAP)
          const y = frame.y + TITLE_HEIGHT + row * (CELL_HEIGHT + CELL_GAP)
          const iconX = x + 14
          const iconY = y + (CELL_HEIGHT - ICON_SIZE) / 2
          const textX = iconX + ICON_SIZE + 12
          const iconInset = ICON_SIZE * 0.18
          const badge =
            outline === 'none'
              ? ''
              : `<rect x="${iconX}" y="${iconY}" width="${ICON_SIZE}" height="${ICON_SIZE}" rx="${badgeRadius}" fill="${theme.colors.accent}" fill-opacity="0.14" />`
          return `<g data-${id}="${escapeXml(link.id)}" aria-label="${escapeXml(`${link.label}: ${link.value}`)}">
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
  ${badge}
  <g transform="translate(${iconX + iconInset} ${iconY + iconInset}) scale(${(ICON_SIZE * 0.64) / 24})" color="${theme.colors.accent}">
    <path d="${escapeXml(link.icon.path)}" fill="currentColor" />
  </g>
  <text x="${textX}" y="${y + CELL_HEIGHT / 2 - 5}" font-family="${fontFamily}" font-size="12.5" font-weight="700" fill="${theme.colors.foreground}">${escapeXml(link.label)}</text>
  <text x="${textX}" y="${y + CELL_HEIGHT / 2 + 14}" font-family="${fontFamily}" font-size="11.5" fill="${theme.colors.muted}">${escapeXml(truncateText(link.value, 26))}</text>
</g>`
        })
        .join('\n')

      return `<g data-columns="${COLUMNS}" data-rows="${rows}" data-outline="${outline}">
  <text x="${CARD_PADDING}" y="${frame.y + 30}" font-family="${fontFamily}" font-size="17" font-weight="700" fill="${theme.colors.foreground}">${title}</text>
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
