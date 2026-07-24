import {
  renderAvatarEffect,
  renderBackgroundEffect,
  renderCardEffect,
  renderSectionEffect,
  type EffectMarkup,
} from '../../effects/index.js'
import { escapeXml } from '../../lib/svg.js'
import type { ThemeRenderContext } from '../../widgets/card.js'
import {
  BRANDING_FOOTER_HEIGHT,
  renderRepositoryBadge,
} from '../branding.js'

function combineMarkup(
  markups: readonly EffectMarkup[],
  key: keyof EffectMarkup,
): string {
  return markups.map((markup) => markup[key] ?? '').filter(Boolean).join('\n')
}

export function renderClassicCard(context: ThemeRenderContext): string {
  const {
    sections,
    width,
    theme,
    outline,
    effects,
    title,
    description,
    titleId,
    descriptionId,
    rootData,
  } = context
  const contentHeight = sections.reduce(
    (total, section) => total + section.height,
    0,
  )
  const height = contentHeight + BRANDING_FOOTER_HEIGHT
  const fontFamily = escapeXml(theme.typography.fontFamily)
  const { background: backgroundEffect, card: cardEffect, avatar: avatarEffect } =
    effects
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
    const sectionEffect = effects.sections[section.id] ?? 'none'
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
        outline,
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

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${titleId} ${descriptionId}" data-theme="${theme.name}" data-outline="${outline}" data-sections="${escapeXml(sections.map((section) => section.id).join(','))}" data-background-effect="${backgroundEffect}" data-card-effect="${cardEffect}" data-avatar-effect="${avatarEffect}"${rootData}>
  <title id="${titleId}">${escapeXml(title)}</title>
  <desc id="${descriptionId}">${escapeXml(description)}</desc>
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
${renderRepositoryBadge({
  width,
  height,
})}
</svg>`
}
