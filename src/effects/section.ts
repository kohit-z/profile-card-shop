import type { SectionEffectName } from './registry.js'
import type { EffectMarkup, EffectRenderContext } from './types.js'

export function renderSectionEffect(
  effect: SectionEffectName,
  context: EffectRenderContext,
): EffectMarkup {
  if (effect === 'none') return {}

  const { theme, frame, ids } = context
  const { x, y, width, height } = frame
  const clip = `clip-path="url(#${ids.clip})"`

  switch (effect) {
    case 'radar': {
      const radius = Math.min(70, height * 0.42)
      const cx = x + width - radius - 24
      const cy = y + height / 2
      return {
        underlay: `<g data-effect-layer="section" data-section-effect="radar" ${clip} fill="none" stroke="${theme.colors.accent}" transform="translate(${cx} ${cy})">
  <circle r="${radius}" stroke-opacity="0.16" />
  <circle r="${radius * 0.66}" stroke-opacity="0.2" />
  <circle r="${radius * 0.33}" stroke-opacity="0.24" />
  <path d="M0 0 L${radius} 0 A${radius} ${radius} 0 0 1 ${radius * 0.7} ${radius * 0.7} Z" fill="${theme.colors.accent}" fill-opacity="0.16" stroke="none">
    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="5s" repeatCount="indefinite" />
  </path>
</g>`,
      }
    }
    case 'constellation': {
      const nodes = Array.from({ length: 10 }, (_, index) => ({
        x: x + 24 + ((index * 79) % Math.max(40, width - 48)),
        y: y + 18 + ((index * 43) % Math.max(30, height - 36)),
      }))
      const lines = nodes
        .slice(1)
        .map(
          (node, index) =>
            `<line x1="${nodes[index].x}" y1="${nodes[index].y}" x2="${node.x}" y2="${node.y}" />`,
        )
        .join('\n')
      const stars = nodes
        .map(
          (node, index) => `<circle cx="${node.x}" cy="${node.y}" r="${index % 3 ? 2 : 3}" fill="${theme.colors.accent}" stroke="none">
  <animate attributeName="opacity" values="0.25;0.95;0.25" dur="${2.2 + (index % 4) * 0.4}s" begin="${index * 0.16}s" repeatCount="indefinite" />
</circle>`,
        )
        .join('\n')
      return {
        underlay: `<g data-effect-layer="section" data-section-effect="constellation" ${clip} stroke="${theme.colors.accent}" stroke-opacity="0.18">
${lines}
${stars}
</g>`,
      }
    }
    case 'grid': {
      const verticals = Array.from({ length: 9 }, (_, index) => {
        const gx = x + (index * width) / 8
        return `<line x1="${gx}" y1="${y + height}" x2="${x + width / 2 + (gx - x - width / 2) * 0.22}" y2="${y}" />`
      }).join('\n')
      const horizontals = Array.from({ length: 6 }, (_, index) => {
        const gy = y + (index * height) / 5
        return `<line x1="${x}" y1="${gy}" x2="${x + width}" y2="${gy}">
  <animate attributeName="opacity" values="0.12;0.55;0.12" dur="2.8s" begin="${index * 0.18}s" repeatCount="indefinite" />
</line>`
      }).join('\n')
      return {
        underlay: `<g data-effect-layer="section" data-section-effect="grid" ${clip} stroke="${theme.colors.accent}" stroke-opacity="0.2">
${verticals}
${horizontals}
</g>`,
      }
    }
  }
}
