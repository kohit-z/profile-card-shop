import type { EffectMarkup, EffectRenderContext, EffectTarget } from './types.js'

/** Shared aurora/matrix markup for background and card scopes. */
export function renderAtmosphereEffect(
  effect: 'aurora' | 'matrix',
  context: EffectRenderContext,
  layer: Extract<EffectTarget, 'background' | 'card'>,
): EffectMarkup {
  const { theme, frame, ids } = context
  const { x, y, width, height } = frame
  const clip = `clip-path="url(#${ids.clip})"`

  if (effect === 'aurora') {
    const gradient = `${ids.prefix}-${layer}-aurora`
    return {
      defs: `<linearGradient id="${gradient}" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" stop-color="${theme.gradient.from}">
    <animate attributeName="stop-color" values="${theme.gradient.from};${theme.colors.accent};${theme.gradient.to};${theme.gradient.from}" dur="8s" repeatCount="indefinite" />
  </stop>
  <stop offset="100%" stop-color="${theme.gradient.to}">
    <animate attributeName="stop-color" values="${theme.gradient.to};${theme.gradient.from};${theme.colors.accent};${theme.gradient.to}" dur="8s" repeatCount="indefinite" />
  </stop>
</linearGradient>`,
      underlay: `<rect data-effect-layer="${layer}" x="${x}" y="${y}" width="${width}" height="${height}" fill="url(#${gradient})" ${clip} />`,
    }
  }

  const streams = Array.from({ length: 10 }, (_, index) => {
    const mx = x + 24 + (index * (width - 48)) / 9
    return `<text x="${mx}" y="${y - 60}" font-family="monospace" font-size="10" fill="${theme.colors.accent}" opacity="0.35">01101001
  <animate attributeName="y" values="${y - 60};${y + height + 40}" dur="${3.8 + (index % 4) * 0.5}s" begin="${index * 0.2}s" repeatCount="indefinite" />
</text>`
  }).join('\n')

  return {
    underlay: `<g data-effect-layer="${layer}" ${clip}>${streams}</g>`,
  }
}
