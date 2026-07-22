import type { Theme } from '../themes/index.js'
import type { EffectName } from './registry.js'

export type EffectTarget = 'avatar' | 'card' | 'section'

export interface EffectFrame {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface AvatarAnchor {
  readonly cx: number
  readonly cy: number
  readonly radius: number
}

export interface EffectIds {
  readonly prefix: string
  readonly clip: string
}

export interface EffectRenderContext {
  readonly theme: Theme
  readonly frame: EffectFrame
  readonly ids: EffectIds
  readonly avatar?: AvatarAnchor
}

export interface EffectMarkup {
  readonly defs?: string
  readonly underlay?: string
  readonly overlay?: string
  readonly contentAnimation?: string
}

export interface EffectMeta {
  readonly name: EffectName
  readonly label: string
  readonly description: string
}
