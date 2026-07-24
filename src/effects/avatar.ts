import type { AvatarEffectName } from './registry.js'
import type { EffectMarkup, EffectRenderContext } from './types.js'

function requireAvatar(context: EffectRenderContext) {
  if (!context.avatar) {
    throw new Error('Avatar effects require an avatar anchor.')
  }
  return context.avatar
}

export function renderAvatarEffect(
  effect: AvatarEffectName,
  context: EffectRenderContext,
): EffectMarkup {
  if (effect === 'none') return {}

  const { theme, frame } = context
  const { cx, cy, radius } = requireAvatar(context)
  // Keep bars/shadow inside the hosting section (paired profile is shorter).
  const maxY = frame.y + frame.height - 10

  switch (effect) {
    case 'pulse':
      return {
        underlay: `<g data-effect-layer="avatar">
  <circle cx="${cx}" cy="${cy}" r="${radius + 4}" fill="none" stroke="${theme.colors.accent}" stroke-opacity="0.55" stroke-width="2">
    <animate attributeName="r" values="${radius + 4};${radius + 12};${radius + 4}" dur="2.4s" repeatCount="indefinite" />
    <animate attributeName="stroke-opacity" values="0.55;0.12;0.55" dur="2.4s" repeatCount="indefinite" />
  </circle>
  <circle cx="${cx}" cy="${cy}" r="${radius + 10}" fill="none" stroke="${theme.colors.accent}" stroke-opacity="0.28">
    <animate attributeName="r" values="${radius + 10};${radius + 20};${radius + 10}" dur="2.4s" begin="0.35s" repeatCount="indefinite" />
  </circle>
</g>`,
      }
    case 'orbit':
      return {
        underlay: `<g data-effect-layer="avatar" transform="translate(${cx} ${cy})">
  <g>
    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="7s" repeatCount="indefinite" />
    <circle cy="-${radius + 16}" r="4.5" fill="${theme.colors.accent}" />
    <circle cx="${radius + 4}" cy="40" r="3" fill="${theme.colors.accent}" fill-opacity="0.75" />
    <circle cx="-${radius + 4}" cy="40" r="3" fill="${theme.colors.accent}" fill-opacity="0.75" />
  </g>
</g>`,
      }
    case 'glow': {
      const id = `${context.ids.prefix}-avatar-glow`
      return {
        defs: `<radialGradient id="${id}">
  <stop offset="0%" stop-color="${theme.colors.accent}" stop-opacity="0.6">
    <animate attributeName="stop-opacity" values="0.35;0.7;0.35" dur="2.8s" repeatCount="indefinite" />
  </stop>
  <stop offset="100%" stop-color="${theme.colors.accent}" stop-opacity="0" />
</radialGradient>`,
        underlay: `<circle data-effect-layer="avatar" cx="${cx}" cy="${cy}" r="${radius + 28}" fill="url(#${id})" />`,
      }
    }
    case 'halo':
      return {
        underlay: `<g data-effect-layer="avatar" fill="none">
  <circle cx="${cx}" cy="${cy}" r="${radius + 11}" stroke="${theme.colors.accent}" stroke-opacity="0.6" stroke-width="2" stroke-dasharray="4 12">
    <animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="10s" repeatCount="indefinite" />
  </circle>
  <circle cx="${cx}" cy="${cy}" r="${radius + 18}" stroke="${theme.colors.accent}" stroke-opacity="0.3" stroke-dasharray="2 10">
    <animateTransform attributeName="transform" type="rotate" from="360 ${cx} ${cy}" to="0 ${cx} ${cy}" dur="16s" repeatCount="indefinite" />
  </circle>
</g>`,
      }
    case 'equalizer': {
      const base = Math.min(cy + radius + 30, maxY)
      const bars = Array.from({ length: 9 }, (_, index) => {
        const x = cx - 43 + index * 10
        const first = 5 + (index % 4) * 2.4
        return `<rect x="${x}" y="${base - first}" width="6" height="${first}" rx="2" fill="${theme.colors.accent}">
  <animate attributeName="height" values="${first};${first + 10};${first + 3};${first}" dur="${1.05 + (index % 5) * 0.1}s" begin="${index * 0.08}s" repeatCount="indefinite" />
  <animate attributeName="y" values="${base - first};${base - first - 10};${base - first - 3};${base - first}" dur="${1.05 + (index % 5) * 0.1}s" begin="${index * 0.08}s" repeatCount="indefinite" />
</rect>`
      }).join('\n')
      return {
        underlay: `<g data-effect-layer="avatar">${bars}</g>`,
      }
    }
    case 'float': {
      const shadowY = Math.min(cy + radius + 16, maxY)
      return {
        underlay: `<ellipse data-effect-layer="avatar" cx="${cx}" cy="${shadowY}" rx="34" ry="5" fill="${theme.colors.foreground}" opacity="0.14">
  <animate attributeName="rx" values="34;29;34;38;34" dur="5s" repeatCount="indefinite" />
</ellipse>`,
        contentAnimation: `<animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0;0 5;0 0" keyTimes="0;0.25;0.5;0.75;1" dur="5s" repeatCount="indefinite" />`,
      }
    }
    case 'vortex':
      return {
        underlay: `<g data-effect-layer="avatar" transform="translate(${cx} ${cy})" fill="none" stroke="${theme.colors.accent}" stroke-linecap="round">
  <ellipse rx="${radius + 18}" ry="24" stroke-width="2" stroke-opacity="0.7" stroke-dasharray="34 18">
    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="5s" repeatCount="indefinite" />
  </ellipse>
  <ellipse rx="${radius + 18}" ry="36" stroke-opacity="0.4" stroke-dasharray="18 14">
    <animateTransform attributeName="transform" type="rotate" from="120" to="-240" dur="8s" repeatCount="indefinite" />
  </ellipse>
</g>`,
      }
  }
}
