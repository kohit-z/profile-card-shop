import {
  renderAvatarEffect,
  renderBackgroundEffect,
  renderCardEffect,
  renderSectionEffect,
  resolveAvatarEffectName,
  resolveBackgroundEffectName,
  resolveCardEffectName,
  resolveSectionEffectName,
  type AvatarAnchor,
  type AvatarEffectName,
  type BackgroundEffectName,
  type CardEffectName,
  type EffectFrame,
  type EffectMarkup,
  type SectionEffectName,
} from '../effects/index.js'
import { escapeXml } from '../lib/svg.js'
import { getTheme, type Theme, type ThemeName } from '../themes/index.js'

export const CARD_WIDTH = 842

const SECTION_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/
const XML_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_.:-]*$/
const DATA_KEY_PATTERN = /^[a-z][a-z0-9-]*$/

export interface CardSectionRenderContext {
  readonly frame: EffectFrame
  readonly theme: Theme
  readonly fontFamily: string
  readonly avatarAnimation: string
}

export interface CardSection {
  readonly id: string
  readonly height: number
  readonly title: string
  readonly description: string
  readonly avatarAnchor?: (frame: EffectFrame) => AvatarAnchor
  readonly render: (context: CardSectionRenderContext) => string
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
  readonly width?: number
  readonly effects?: CardEffects
  readonly title?: string
  readonly description?: string
  readonly accessibilityIds?: {
    readonly title: string
    readonly description: string
  }
  readonly rootData?: Readonly<Record<string, string>>
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

function combineMarkup(markups: readonly EffectMarkup[], key: keyof EffectMarkup) {
  return markups.map((markup) => markup[key] ?? '').filter(Boolean).join('\n')
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
  const width = options.width ?? CARD_WIDTH
  const height = sections.reduce((total, section) => total + section.height, 0)
  const theme = getTheme(options.theme)
  const fontFamily = escapeXml(theme.typography.fontFamily)
  const backgroundEffect = resolveBackgroundEffectName(options.effects?.background)
  const cardEffect = resolveCardEffectName(options.effects?.card)
  const avatarEffect = resolveAvatarEffectName(options.effects?.avatar)
  const prefix =
    backgroundEffect === 'none'
      ? `card-${theme.name}-${cardEffect}-${avatarEffect}`
      : `card-${theme.name}-background-${backgroundEffect}-${cardEffect}-${avatarEffect}`
  const cardClip = `${prefix}-clip`
  const gradient = `${prefix}-gradient`
  const cardFrame = { x: 0, y: 0, width, height }
  const backgroundMarkup = renderBackgroundEffect(backgroundEffect, {
    theme,
    frame: cardFrame,
    ids: { prefix: `${prefix}-background`, clip: cardClip },
  })
  const cardMarkup = renderCardEffect(cardEffect, {
    theme,
    frame: cardFrame,
    ids: { prefix, clip: cardClip },
  })

  let y = 0
  const laidOutSections = sections.map((section) => {
    const frame = { x: 0, y, width, height: section.height }
    y += section.height
    const sectionEffect = resolveSectionEffectName(
      options.effects?.sections?.[section.id],
    )
    const sectionClip = `${prefix}-section-${section.id}-clip`
    const effectContext = {
      theme,
      frame,
      ids: {
        prefix: `${prefix}-${section.id}`,
        clip: sectionClip,
      },
    }
    const sectionMarkup = renderSectionEffect(sectionEffect, effectContext)
    const anchor = section.avatarAnchor?.(frame)
    const avatarMarkup = anchor
      ? renderAvatarEffect(avatarEffect, { ...effectContext, avatar: anchor })
      : {}

    return {
      section,
      frame,
      sectionEffect,
      sectionClip,
      sectionMarkup,
      avatarMarkup,
    }
  })

  const scopedMarkups = laidOutSections.flatMap((section) => [
    section.sectionMarkup,
    section.avatarMarkup,
  ])
  const sectionGroups = laidOutSections
    .map(({ section, frame, sectionEffect, sectionMarkup, avatarMarkup }) => {
      const content = section.render({
        frame,
        theme,
        fontFamily,
        avatarAnimation: avatarMarkup.contentAnimation ?? '',
      })
      return `<g data-section="${escapeXml(section.id)}" data-section-effect="${sectionEffect}">
${sectionMarkup.underlay ?? ''}
${avatarMarkup.underlay ?? ''}
${content}
${avatarMarkup.overlay ?? ''}
${sectionMarkup.overlay ?? ''}
</g>`
    })
    .join('\n')

  const sectionNames = sections.map((section) => section.id).join(',')
  const title =
    options.title ?? sections.map((section) => section.title).join(' · ')
  const description =
    options.description ??
    sections.map((section) => section.description).join(' ')
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
  const cardClipDefinition =
    backgroundEffect === 'none' && cardEffect === 'none'
      ? ''
      : `    <clipPath id="${cardClip}">
      <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${theme.card.radius}" />
    </clipPath>`
  const sectionClipDefinitions = laidOutSections
    .filter(({ sectionEffect }) => sectionEffect !== 'none')
    .map(
      ({ frame, sectionClip }) => `    <clipPath id="${sectionClip}">
      <rect x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" />
    </clipPath>`,
    )
    .join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${resolvedTitleId} ${resolvedDescriptionId}" data-theme="${theme.name}" data-sections="${escapeXml(sectionNames)}" data-background-effect="${backgroundEffect}" data-card-effect="${cardEffect}" data-avatar-effect="${avatarEffect}"${rootData}>
  <title id="${resolvedTitleId}">${escapeXml(title)}</title>
  <desc id="${resolvedDescriptionId}">${escapeXml(description)}</desc>
  <defs>
    <linearGradient id="${gradient}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.gradient.from}" />
      <stop offset="100%" stop-color="${theme.gradient.to}" />
    </linearGradient>
${cardClipDefinition}
${sectionClipDefinitions}
${backgroundMarkup.defs ?? ''}
${cardMarkup.defs ?? ''}
${combineMarkup(scopedMarkups, 'defs')}
  </defs>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${theme.card.radius}" fill="url(#${gradient})" stroke="${theme.colors.border}" stroke-width="${theme.card.borderWidth}" />
${backgroundMarkup.underlay ?? ''}
${cardMarkup.underlay ?? ''}
${sectionGroups}
${cardMarkup.overlay ?? ''}
</svg>`
}
