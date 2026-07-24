import {
  itemOutlineRadius,
  renderItemOutlineRect,
} from '../../data/outline-style.js'
import { escapeXml, truncateText } from '../../lib/svg.js'
import type { GiphyGif } from '../../services/giphy.js'
import { CARD_WIDTH, defineCardSection, type CardSection } from '../card.js'

const CARD_PADDING = 22
const DIVIDER_SPACE = 28
const MAX_GIF_DISPLAY_HEIGHT = 200
const MAX_GIF_DISPLAY_WIDTH = CARD_WIDTH - CARD_PADDING * 2

export function createGiphySection(gif: GiphyGif): CardSection {
  const scale = Math.min(
    1,
    MAX_GIF_DISPLAY_WIDTH / gif.width,
    MAX_GIF_DISPLAY_HEIGHT / gif.height,
  )
  const displayWidth = Math.max(1, Math.round(gif.width * scale))
  const displayHeight = Math.max(1, Math.round(gif.height * scale))
  const height = DIVIDER_SPACE + displayHeight + CARD_PADDING
  const title = truncateText(gif.title, 64)

  return defineCardSection({
    id: 'giphy',
    height,
    title: `Giphy: ${title}`,
    description: `A custom GIF section showing "${title}" from Giphy.`,
    payload: { type: 'giphy', gif },
    render: ({ frame, theme, outline }) => {
      const imageX = CARD_PADDING + (MAX_GIF_DISPLAY_WIDTH - displayWidth) / 2
      const imageY = frame.y + DIVIDER_SPACE
      const clip = `giphy-frame-${theme.name}-${frame.y}`
      const radius = itemOutlineRadius(outline, displayHeight, 12)
      const lineY = frame.y + 14

      return `<defs>
  <clipPath id="${clip}">
    <rect x="${imageX}" y="${imageY}" width="${displayWidth}" height="${displayHeight}" rx="${radius}" />
  </clipPath>
</defs>
<g data-giphy="${escapeXml(gif.id)}" data-outline="${outline}" aria-label="${escapeXml(title)}">
  <line x1="${CARD_PADDING}" y1="${lineY}" x2="${CARD_WIDTH - CARD_PADDING}" y2="${lineY}" stroke="${theme.colors.border}" stroke-width="1" stroke-linecap="round" />
  ${renderItemOutlineRect({
    x: imageX,
    y: imageY,
    width: displayWidth,
    height: displayHeight,
    fill: theme.colors.background,
    fillOpacity: 0.75,
    borderColor: theme.colors.border,
    outline,
    radiusFallback: 12,
  })}
  <image href="${escapeXml(gif.dataUrl)}" x="${imageX}" y="${imageY}" width="${displayWidth}" height="${displayHeight}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${clip})" />
</g>`
    },
  })
}
