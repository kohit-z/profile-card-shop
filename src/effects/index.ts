export const EFFECT_NAMES = [
  'none',
  'pulse',
  'shimmer',
  'orbit',
  'aurora',
  'spark',
  'wave',
  'glow',
  'beam',
  'comet',
  'rain',
  'halo',
  'equalizer',
  'float',
  'neon',
  'scan',
  'confetti',
  'matrix',
  'glitch',
  'radar',
  'constellation',
  'ripple',
  'spotlight',
  'vortex',
  'grid',
] as const

export type EffectName = (typeof EFFECT_NAMES)[number]

export const DEFAULT_EFFECT_NAME: EffectName = 'pulse'

export interface EffectMeta {
  readonly name: EffectName
  readonly label: string
  readonly description: string
}

export const EFFECT_CATALOG = {
  none: {
    name: 'none',
    label: 'None',
    description: 'Static card with no motion.',
  },
  pulse: {
    name: 'pulse',
    label: 'Pulse',
    description: 'Breathing accent ring around the avatar.',
  },
  shimmer: {
    name: 'shimmer',
    label: 'Shimmer',
    description: 'Diagonal light sweep across the card.',
  },
  orbit: {
    name: 'orbit',
    label: 'Orbit',
    description: 'Accent dots orbiting the avatar.',
  },
  aurora: {
    name: 'aurora',
    label: 'Aurora',
    description: 'Shifting multi-stop gradient atmosphere.',
  },
  spark: {
    name: 'spark',
    label: 'Spark',
    description: 'Twinkling particles across the card.',
  },
  wave: {
    name: 'wave',
    label: 'Wave',
    description: 'Soft undulating ribbon along the base.',
  },
  glow: {
    name: 'glow',
    label: 'Glow',
    description: 'Warm radial glow blooming behind the avatar.',
  },
  beam: {
    name: 'beam',
    label: 'Beam',
    description: 'Light beams racing around the card border.',
  },
  comet: {
    name: 'comet',
    label: 'Comet',
    description: 'Comets streaking across the card.',
  },
  rain: {
    name: 'rain',
    label: 'Rain',
    description: 'Accent streaks raining down behind the content.',
  },
  halo: {
    name: 'halo',
    label: 'Halo',
    description: 'Counter-rotating dashed rings around the avatar.',
  },
  equalizer: {
    name: 'equalizer',
    label: 'Equalizer',
    description: 'Bouncing equalizer bars beneath the avatar.',
  },
  float: {
    name: 'float',
    label: 'Float',
    description: 'Avatar hovering gently over a drifting shadow.',
  },
  neon: {
    name: 'neon',
    label: 'Neon',
    description: 'Flickering neon border glow.',
  },
  scan: {
    name: 'scan',
    label: 'Scan',
    description: 'Retro scanline sweeping down the card.',
  },
  confetti: {
    name: 'confetti',
    label: 'Confetti',
    description: 'Confetti pieces tumbling down the card.',
  },
  matrix: {
    name: 'matrix',
    label: 'Matrix',
    description: 'Digital glyph columns streaming behind the profile.',
  },
  glitch: {
    name: 'glitch',
    label: 'Glitch',
    description: 'Chromatic slices snapping sideways in short bursts.',
  },
  radar: {
    name: 'radar',
    label: 'Radar',
    description: 'A rotating scanner sweep with pulsing target points.',
  },
  constellation: {
    name: 'constellation',
    label: 'Constellation',
    description: 'Connected stars drifting and blinking behind the stats.',
  },
  ripple: {
    name: 'ripple',
    label: 'Ripple',
    description: 'Expanding energy rings traveling across the card.',
  },
  spotlight: {
    name: 'spotlight',
    label: 'Spotlight',
    description: 'A broad theatrical light cone sweeps across the profile.',
  },
  vortex: {
    name: 'vortex',
    label: 'Vortex',
    description: 'Layered elliptical arcs spiral around the avatar.',
  },
  grid: {
    name: 'grid',
    label: 'Energy Grid',
    description: 'A perspective grid surges with traveling energy pulses.',
  },
} as const satisfies Record<EffectName, EffectMeta>

const effectNames = new Set<string>(EFFECT_NAMES)

export function resolveEffectName(
  value: string | null | undefined,
): EffectName {
  const normalized = value?.trim().toLowerCase()

  return normalized && effectNames.has(normalized)
    ? (normalized as EffectName)
    : DEFAULT_EFFECT_NAME
}

export function getEffectMeta(value?: string | null): EffectMeta {
  return EFFECT_CATALOG[resolveEffectName(value)]
}
