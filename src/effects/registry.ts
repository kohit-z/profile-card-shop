import type { EffectMeta, EffectTarget } from './types.js'

interface TargetedEffectMeta<
  Name extends string = string,
  Target extends EffectTarget = EffectTarget,
> {
  readonly name: Name
  readonly target: Target
  readonly targets: readonly EffectTarget[]
  readonly label: string
  readonly description: string
}

const definitions = [
  { name: 'none', target: 'card', targets: ['card', 'avatar', 'section'], label: 'None', description: 'Static content with no motion.' },
  { name: 'pulse', target: 'avatar', targets: ['avatar'], label: 'Pulse', description: 'Breathing accent rings around an avatar.' },
  { name: 'shimmer', target: 'card', targets: ['card'], label: 'Shimmer', description: 'A light sweep across the card.' },
  { name: 'orbit', target: 'avatar', targets: ['avatar'], label: 'Orbit', description: 'Accent dots orbiting an avatar.' },
  { name: 'aurora', target: 'card', targets: ['card'], label: 'Aurora', description: 'A shifting gradient atmosphere.' },
  { name: 'spark', target: 'card', targets: ['card'], label: 'Spark', description: 'Twinkling particles across the card.' },
  { name: 'wave', target: 'card', targets: ['card'], label: 'Wave', description: 'An undulating ribbon along the card base.' },
  { name: 'glow', target: 'avatar', targets: ['avatar'], label: 'Glow', description: 'A radial glow blooming behind an avatar.' },
  { name: 'beam', target: 'card', targets: ['card'], label: 'Beam', description: 'Light beams racing around the card border.' },
  { name: 'comet', target: 'card', targets: ['card'], label: 'Comet', description: 'Comets streaking across the card.' },
  { name: 'rain', target: 'card', targets: ['card'], label: 'Rain', description: 'Accent streaks raining behind the content.' },
  { name: 'halo', target: 'avatar', targets: ['avatar'], label: 'Halo', description: 'Counter-rotating rings around an avatar.' },
  { name: 'equalizer', target: 'avatar', targets: ['avatar'], label: 'Equalizer', description: 'Bouncing bars beneath an avatar.' },
  { name: 'float', target: 'avatar', targets: ['avatar'], label: 'Float', description: 'An avatar hovering over a drifting shadow.' },
  { name: 'neon', target: 'card', targets: ['card'], label: 'Neon', description: 'A flickering neon card border.' },
  { name: 'scan', target: 'card', targets: ['card'], label: 'Scan', description: 'A retro scanline sweeping down the card.' },
  { name: 'confetti', target: 'card', targets: ['card'], label: 'Confetti', description: 'Confetti tumbling down the card.' },
  { name: 'matrix', target: 'card', targets: ['card'], label: 'Matrix', description: 'Digital glyph streams behind the content.' },
  { name: 'glitch', target: 'card', targets: ['card'], label: 'Glitch', description: 'Chromatic slices snapping sideways.' },
  { name: 'radar', target: 'section', targets: ['section'], label: 'Radar', description: 'A scanner sweep inside a section.' },
  { name: 'constellation', target: 'section', targets: ['section'], label: 'Constellation', description: 'Connected stars inside a section.' },
  { name: 'ripple', target: 'card', targets: ['card'], label: 'Ripple', description: 'Energy rings traveling across the card.' },
  { name: 'spotlight', target: 'card', targets: ['card'], label: 'Spotlight', description: 'A broad light cone crossing the card.' },
  { name: 'vortex', target: 'avatar', targets: ['avatar'], label: 'Vortex', description: 'Elliptical arcs spiraling around an avatar.' },
  { name: 'grid', target: 'section', targets: ['section'], label: 'Energy Grid', description: 'A perspective energy grid inside a section.' },
] as const satisfies readonly TargetedEffectMeta[]

type EffectDefinition = (typeof definitions)[number]

export type EffectName = EffectDefinition['name']
export type EffectNameForTarget<Target extends EffectTarget> =
  EffectDefinition extends infer Definition
    ? Definition extends {
        readonly name: infer Name
        readonly targets: readonly EffectTarget[]
      }
      ? Target extends Definition['targets'][number]
        ? Name
        : never
      : never
    : never

export type AvatarEffectName = EffectNameForTarget<'avatar'>
export type CardEffectName = EffectNameForTarget<'card'>
export type SectionEffectName = EffectNameForTarget<'section'>

function definitionSupportsTarget(
  definition: EffectDefinition,
  target: EffectTarget,
): boolean {
  return (definition.targets as readonly EffectTarget[]).includes(target)
}

export const EFFECT_NAMES = definitions.map(
  (definition) => definition.name,
) as readonly EffectName[]
export const AVATAR_EFFECT_NAMES = definitions
  .filter((definition) => definitionSupportsTarget(definition, 'avatar'))
  .map((definition) => definition.name) as readonly AvatarEffectName[]
export const CARD_EFFECT_NAMES = definitions
  .filter((definition) => definitionSupportsTarget(definition, 'card'))
  .map((definition) => definition.name) as readonly CardEffectName[]
export const SECTION_EFFECT_NAMES = definitions
  .filter((definition) => definitionSupportsTarget(definition, 'section'))
  .map((definition) => definition.name) as readonly SectionEffectName[]

export const EFFECT_CATALOG = Object.fromEntries(
  definitions.map((definition) => [definition.name, definition]),
) as unknown as Readonly<Record<EffectName, EffectDefinition>>

export const DEFAULT_EFFECT_NAME: EffectName = 'pulse'

export function effectSupportsTarget(
  name: EffectName,
  target: EffectTarget,
): boolean {
  return definitionSupportsTarget(EFFECT_CATALOG[name], target)
}

function normalize(value: string | null | undefined): string | undefined {
  return value?.trim().toLowerCase() || undefined
}

export function resolveEffectName(
  value: string | null | undefined,
): EffectName {
  const name = normalize(value)
  return name && Object.hasOwn(EFFECT_CATALOG, name)
    ? (name as EffectName)
    : DEFAULT_EFFECT_NAME
}

export function resolveEffectNameForTarget<Target extends EffectTarget>(
  value: string | null | undefined,
  target: Target,
): EffectNameForTarget<Target> {
  const name = normalize(value)
  const effect = name
    ? EFFECT_CATALOG[name as EffectName]
    : undefined
  return effect && effectSupportsTarget(effect.name, target)
    ? (effect.name as EffectNameForTarget<Target>)
    : ('none' as EffectNameForTarget<Target>)
}

export const resolveAvatarEffectName = (
  value: string | null | undefined,
): AvatarEffectName => resolveEffectNameForTarget(value, 'avatar')

export const resolveCardEffectName = (
  value: string | null | undefined,
): CardEffectName => resolveEffectNameForTarget(value, 'card')

export const resolveSectionEffectName = (
  value: string | null | undefined,
): SectionEffectName => resolveEffectNameForTarget(value, 'section')

export function getEffectMeta(value?: string | null): EffectMeta {
  return EFFECT_CATALOG[resolveEffectName(value)]
}
