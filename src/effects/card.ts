import type { CardEffectName } from './registry.js'
import type { EffectMarkup, EffectRenderContext } from './types.js'

export function renderCardEffect(
  effect: CardEffectName,
  context: EffectRenderContext,
): EffectMarkup {
  if (effect === 'none') return {}

  const { theme, frame, ids } = context
  const { x, y, width, height } = frame
  const clip = `clip-path="url(#${ids.clip})"`

  switch (effect) {
    case 'shimmer': {
      const gradient = `${ids.prefix}-shimmer`
      return {
        defs: `<linearGradient id="${gradient}">
  <stop offset="0%" stop-color="${theme.colors.foreground}" stop-opacity="0" />
  <stop offset="50%" stop-color="${theme.colors.foreground}" stop-opacity="0.2" />
  <stop offset="100%" stop-color="${theme.colors.foreground}" stop-opacity="0" />
</linearGradient>`,
        overlay: `<rect data-effect-layer="card" x="${x - width}" y="${y}" width="${width}" height="${height}" fill="url(#${gradient})" ${clip}>
  <animate attributeName="x" values="${x - width};${x + width}" dur="3.2s" repeatCount="indefinite" />
</rect>`,
      }
    }
    case 'aurora': {
      const gradient = `${ids.prefix}-aurora`
      return {
        defs: `<linearGradient id="${gradient}" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" stop-color="${theme.gradient.from}">
    <animate attributeName="stop-color" values="${theme.gradient.from};${theme.colors.accent};${theme.gradient.to};${theme.gradient.from}" dur="8s" repeatCount="indefinite" />
  </stop>
  <stop offset="100%" stop-color="${theme.gradient.to}">
    <animate attributeName="stop-color" values="${theme.gradient.to};${theme.gradient.from};${theme.colors.accent};${theme.gradient.to}" dur="8s" repeatCount="indefinite" />
  </stop>
</linearGradient>`,
        underlay: `<rect data-effect-layer="card" x="${x}" y="${y}" width="${width}" height="${height}" fill="url(#${gradient})" ${clip} />`,
      }
    }
    case 'spark': {
      const sparks = Array.from({ length: 12 }, (_, index) => {
        const sx = x + 28 + ((index * 73) % Math.max(40, width - 56))
        const sy = y + 22 + ((index * 47) % Math.max(36, height - 44))
        return `<circle cx="${sx}" cy="${sy}" r="${1.5 + (index % 3) * 0.4}" fill="${index % 2 ? theme.colors.foreground : theme.colors.accent}" opacity="0.15">
  <animate attributeName="opacity" values="0.15;0.95;0.15" dur="${2.2 + (index % 4) * 0.35}s" begin="${index * 0.13}s" repeatCount="indefinite" />
</circle>`
      }).join('\n')
      return { overlay: `<g data-effect-layer="card" ${clip}>${sparks}</g>` }
    }
    case 'wave':
      return {
        overlay: `<path data-effect-layer="card" ${clip} fill="${theme.colors.accent}" fill-opacity="0.2" d="M${x} ${y + height - 30} Q${x + width / 4} ${y + height - 55} ${x + width / 2} ${y + height - 30} T${x + width} ${y + height - 30} V${y + height} H${x} Z">
  <animate attributeName="d" values="M${x} ${y + height - 30} Q${x + width / 4} ${y + height - 55} ${x + width / 2} ${y + height - 30} T${x + width} ${y + height - 30} V${y + height} H${x} Z;M${x} ${y + height - 30} Q${x + width / 4} ${y + height - 5} ${x + width / 2} ${y + height - 30} T${x + width} ${y + height - 30} V${y + height} H${x} Z;M${x} ${y + height - 30} Q${x + width / 4} ${y + height - 55} ${x + width / 2} ${y + height - 30} T${x + width} ${y + height - 30} V${y + height} H${x} Z" dur="4.5s" repeatCount="indefinite" />
</path>`,
      }
    case 'beam':
      return {
        overlay: `<rect data-effect-layer="card" x="${x + 1}" y="${y + 1}" width="${width - 2}" height="${height - 2}" rx="${theme.card.radius}" fill="none" stroke="${theme.colors.accent}" stroke-width="3" stroke-linecap="round" stroke-dasharray="90 260">
  <animate attributeName="stroke-dashoffset" values="0;-700" dur="7s" repeatCount="indefinite" />
</rect>`,
      }
    case 'comet': {
      const comets = [0.18, 0.48, 0.76]
        .map(
          (ratio, index) => `<g opacity="0">
  <line x1="${x - 60}" y1="${y + height * ratio - 8}" x2="${x}" y2="${y + height * ratio}" stroke="${theme.colors.accent}" stroke-width="${4 - index}" />
  <circle cx="${x}" cy="${y + height * ratio}" r="${3 - index * 0.5}" fill="${theme.colors.accent}" />
  <animateTransform attributeName="transform" type="translate" values="0 0;${width + 100} ${height * 0.12}" dur="${4 + index * 0.9}s" begin="${index * 1.2}s" repeatCount="indefinite" />
  <animate attributeName="opacity" values="0;1;1;0" dur="${4 + index * 0.9}s" begin="${index * 1.2}s" repeatCount="indefinite" />
</g>`,
        )
        .join('\n')
      return { overlay: `<g data-effect-layer="card" ${clip}>${comets}</g>` }
    }
    case 'rain': {
      const drops = Array.from({ length: 10 }, (_, index) => {
        const dx = x + 30 + (index * (width - 60)) / 9
        return `<line x1="${dx}" y1="${y - 20}" x2="${dx}" y2="${y - 4}" stroke="${theme.colors.accent}" stroke-width="2">
  <animateTransform attributeName="transform" type="translate" values="0 0;0 ${height + 40}" dur="${2.1 + (index % 4) * 0.25}s" begin="${index * 0.18}s" repeatCount="indefinite" />
</line>`
      }).join('\n')
      return { overlay: `<g data-effect-layer="card" ${clip}>${drops}</g>` }
    }
    case 'neon':
      return {
        overlay: `<g data-effect-layer="card" fill="none" stroke="${theme.colors.accent}">
  <rect x="${x + 1}" y="${y + 1}" width="${width - 2}" height="${height - 2}" rx="${theme.card.radius}" stroke-width="7" opacity="0.16">
    <animate attributeName="opacity" values="0.1;0.32;0.12;0.28;0.1" dur="3s" repeatCount="indefinite" />
  </rect>
  <rect x="${x + 1}" y="${y + 1}" width="${width - 2}" height="${height - 2}" rx="${theme.card.radius}" stroke-width="2">
    <animate attributeName="opacity" values="1;0.35;1;0.4;1" dur="3s" repeatCount="indefinite" />
  </rect>
</g>`,
      }
    case 'scan':
      return {
        overlay: `<g data-effect-layer="card" ${clip}>
  <rect x="${x}" y="${y - 34}" width="${width}" height="34" fill="${theme.colors.foreground}" opacity="0.12">
    <animate attributeName="y" values="${y - 34};${y + height}" dur="3.8s" repeatCount="indefinite" />
  </rect>
</g>`,
      }
    case 'confetti': {
      const pieces = Array.from({ length: 12 }, (_, index) => {
        const px = x + 24 + ((index * 67) % Math.max(40, width - 48))
        return `<rect x="${px}" y="${y - 12}" width="5" height="9" rx="1" fill="${index % 3 === 0 ? theme.colors.foreground : theme.colors.accent}">
  <animateTransform attributeName="transform" type="translate" values="0 0;${index % 2 ? 18 : -18} ${height + 24}" dur="${4 + (index % 5) * 0.35}s" begin="${index * 0.22}s" repeatCount="indefinite" />
</rect>`
      }).join('\n')
      return { overlay: `<g data-effect-layer="card" ${clip}>${pieces}</g>` }
    }
    case 'matrix': {
      const streams = Array.from({ length: 10 }, (_, index) => {
        const mx = x + 24 + (index * (width - 48)) / 9
        return `<text x="${mx}" y="${y - 60}" font-family="monospace" font-size="10" fill="${theme.colors.accent}" opacity="0.35">01101001
  <animate attributeName="y" values="${y - 60};${y + height + 40}" dur="${3.8 + (index % 4) * 0.5}s" begin="${index * 0.2}s" repeatCount="indefinite" />
</text>`
      }).join('\n')
      return { underlay: `<g data-effect-layer="card" ${clip}>${streams}</g>` }
    }
    case 'glitch': {
      const slices = Array.from({ length: 7 }, (_, index) => {
        const gy = y + 18 + (index * (height - 36)) / 6
        return `<rect x="${x}" y="${gy}" width="${width}" height="${4 + (index % 3) * 2}" fill="${index % 2 ? theme.colors.foreground : theme.colors.accent}" opacity="0">
  <animate attributeName="x" values="${x};${x + (index % 2 ? -22 : 22)};${x}" dur="3.6s" begin="${index * 0.06}s" repeatCount="indefinite" />
  <animate attributeName="opacity" values="0;0;0.32;0" keyTimes="0;0.76;0.82;1" dur="3.6s" begin="${index * 0.06}s" repeatCount="indefinite" />
</rect>`
      }).join('\n')
      return { overlay: `<g data-effect-layer="card" ${clip}>${slices}</g>` }
    }
    case 'ripple': {
      const circles = [0.25, 0.55, 0.82]
        .map(
          (ratio, index) => `<circle cx="${x + width * ratio}" cy="${y + height * (index % 2 ? 0.7 : 0.3)}" r="4" fill="none" stroke="${theme.colors.accent}" opacity="0">
  <animate attributeName="r" values="4;${Math.max(width, height) * 0.32}" dur="4.2s" begin="${index * 1.4}s" repeatCount="indefinite" />
  <animate attributeName="opacity" values="0;0.55;0" dur="4.2s" begin="${index * 1.4}s" repeatCount="indefinite" />
</circle>`,
        )
        .join('\n')
      return { overlay: `<g data-effect-layer="card" ${clip}>${circles}</g>` }
    }
    case 'spotlight':
      return {
        overlay: `<g data-effect-layer="card" ${clip}>
  <polygon points="${x - width * 0.4},${y} ${x - width * 0.2},${y} ${x + width * 0.1},${y + height} ${x - width * 0.2},${y + height}" fill="${theme.colors.foreground}" opacity="0.12">
    <animateTransform attributeName="transform" type="translate" values="0 0;${width * 1.5} 0;0 0" dur="7s" repeatCount="indefinite" />
  </polygon>
</g>`,
      }
  }
}
