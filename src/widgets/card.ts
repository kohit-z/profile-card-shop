import {
  DEFAULT_OUTLINE_STYLE,
  resolveOutlineStyle,
  type OutlineStyle,
} from '../data/outline-style.js'
import type { BadgeEvaluation } from '../data/badges.js'
import {
  resolveAvatarEffectName,
  resolveBackgroundEffectName,
  resolveCardEffectName,
  resolveSectionEffectName,
  type AvatarAnchor,
  type AvatarEffectName,
  type BackgroundEffectName,
  type CardEffectName,
  type EffectFrame,
  type SectionEffectName,
} from '../effects/index.js'
import type { CardLink } from '../data/links.js'
import type { SkillIconTheme } from '../data/skill-style.js'
import type { SkillDefinition } from '../data/skills.js'
import { escapeXml } from '../lib/svg.js'
import type { GiphyGif } from '../services/giphy.js'
import type {
  ContributionCalendar,
  PinnedRepository,
} from '../services/github.js'
import { getTheme, type Theme, type ThemeName } from '../themes/index.js'
import type { ProfileCardData } from './sections/profile.js'

export const CARD_WIDTH = 842

const SECTION_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/
const XML_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_.:-]*$/
const DATA_KEY_PATTERN = /^[a-z][a-z0-9-]*$/

export interface CardSectionRenderContext {
  readonly frame: EffectFrame
  readonly theme: Theme
  readonly fontFamily: string
  readonly avatarAnimation: string
  readonly outline: OutlineStyle
}

export interface CardSection {
  readonly id: string
  readonly height: number
  readonly title: string
  readonly description: string
  /**
   * Semantic content for full-layout themes. A theme can ignore the legacy
   * frame and compose these values anywhere in its own SVG.
   */
  readonly payload?: CardSectionPayload
  readonly avatarAnchor?: (frame: EffectFrame) => AvatarAnchor
  readonly render: (context: CardSectionRenderContext) => string
}

export type CardSectionPayload =
  | {
      readonly type: 'profile'
      readonly profile: ProfileCardData
      readonly badgeEvaluation?: BadgeEvaluation
    }
  | {
      readonly type: 'stats'
      readonly profile: ProfileCardData
      readonly besideAvatar: boolean
    }
  | {
      readonly type: 'skills'
      readonly skills: readonly SkillDefinition[]
      readonly labels: boolean
      readonly iconTheme: SkillIconTheme
    }
  | {
      readonly type: 'projects'
      readonly projects: readonly PinnedRepository[]
    }
  | {
      readonly type: 'contributions'
      readonly calendar: ContributionCalendar
    }
  | {
      readonly type: 'links'
      readonly kind: 'contact' | 'donate'
      readonly links: readonly CardLink[]
    }
  | {
      readonly type: 'giphy'
      readonly gif: GiphyGif
    }

export interface CardEffects {
  readonly background?: BackgroundEffectName | string | null
  readonly card?: CardEffectName | string | null
  readonly avatar?: AvatarEffectName | string | null
  readonly sections?: Readonly<Record<string, SectionEffectName | string | null>>
}

export interface RenderCardOptions {
  readonly sections: readonly CardSection[]
  readonly theme?: ThemeName
  readonly bannerGif?: GiphyGif
  readonly width?: number
  readonly outline?: OutlineStyle
  readonly effects?: CardEffects
  readonly title?: string
  readonly description?: string
  readonly accessibilityIds?: {
    readonly title: string
    readonly description: string
  }
  readonly rootData?: Readonly<Record<string, string>>
}

export interface ResolvedCardEffects {
  readonly background: BackgroundEffectName
  readonly card: CardEffectName
  readonly avatar: AvatarEffectName
  readonly sections: Readonly<Record<string, SectionEffectName>>
}

export interface ThemeRenderContext {
  readonly sections: readonly CardSection[]
  readonly theme: Theme
  readonly bannerGif?: GiphyGif
  readonly width: number
  readonly outline: OutlineStyle
  readonly effects: ResolvedCardEffects
  readonly title: string
  readonly description: string
  readonly titleId: string
  readonly descriptionId: string
  readonly rootData: string
}

export function defineCardSection(section: CardSection): CardSection {
  if (!SECTION_ID_PATTERN.test(section.id)) {
    throw new Error(`Invalid card section id: ${section.id}`)
  }
  if (!Number.isFinite(section.height) || section.height <= 0) {
    throw new Error(`Card section "${section.id}" must have a positive height.`)
  }
  return section
}

export function renderCard(options: RenderCardOptions): string {
  if (options.sections.length === 0) {
    throw new Error('A card requires at least one section.')
  }

  const sectionIds = new Set<string>()
  const sections = options.sections.map((section) => {
    const defined = defineCardSection(section)
    if (sectionIds.has(defined.id)) {
      throw new Error(`Duplicate card section id: ${defined.id}`)
    }
    sectionIds.add(defined.id)
    return defined
  })

  const titleId = options.accessibilityIds?.title
  const descriptionId = options.accessibilityIds?.description
  if (
    (titleId && !XML_ID_PATTERN.test(titleId)) ||
    (descriptionId && !XML_ID_PATTERN.test(descriptionId))
  ) {
    throw new Error('Card accessibility IDs must be valid XML identifiers.')
  }
  if (titleId && descriptionId && titleId === descriptionId) {
    throw new Error('Card accessibility IDs must be distinct.')
  }
  const width = options.width ?? CARD_WIDTH
  if (!Number.isFinite(width) || width <= 0) {
    throw new Error('Card width must be a positive number.')
  }
  const theme = getTheme(options.theme)
  const outline = resolveOutlineStyle(options.outline ?? DEFAULT_OUTLINE_STYLE)
  const backgroundEffect = resolveBackgroundEffectName(options.effects?.background)
  const cardEffect = resolveCardEffectName(options.effects?.card)
  const avatarEffect = resolveAvatarEffectName(options.effects?.avatar)
  const sectionEffects = Object.fromEntries(
    sections.map((section) => [
      section.id,
      resolveSectionEffectName(options.effects?.sections?.[section.id]),
    ]),
  )
  const title =
    options.title ?? sections.map((section) => section.title).join(' · ')
  const description =
    options.description ??
    sections.map((section) => section.description).join(' ')
  const prefix =
    backgroundEffect === 'none'
      ? `card-${theme.name}-${cardEffect}-${avatarEffect}`
      : `card-${theme.name}-background-${backgroundEffect}-${cardEffect}-${avatarEffect}`
  const resolvedTitleId = titleId ?? `${prefix}-title`
  const resolvedDescriptionId = descriptionId ?? `${prefix}-description`
  const rootData = Object.entries(options.rootData ?? {})
    .map(([key, value]) => {
      if (!DATA_KEY_PATTERN.test(key)) {
        throw new Error(`Invalid card data attribute: ${key}`)
      }
      return ` data-${key}="${escapeXml(value)}"`
    })
    .join('')

  return theme.renderCard({
    sections,
    theme,
    bannerGif: options.bannerGif,
    width,
    outline,
    effects: {
      background: backgroundEffect,
      card: cardEffect,
      avatar: avatarEffect,
      sections: sectionEffects,
    },
    title,
    description,
    titleId: resolvedTitleId,
    descriptionId: resolvedDescriptionId,
    rootData,
  })
}
