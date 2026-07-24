import {
  EFFECT_CATALOG,
  resolveEffectName,
  type EffectName,
} from '../effects/index.js'
import type { BadgeEvaluation } from '../data/badges.js'
import { truncateText } from '../lib/svg.js'
import type { GiphyGif } from '../services/giphy.js'
import type { ThemeName } from '../themes/index.js'
import { CARD_WIDTH, renderCard, type CardEffects } from './card.js'
import {
  createLegacyOverlappingProfileSection,
  createStatsSection,
  LEGACY_OVERLAPPING_PROFILE_SECTION_HEIGHT,
  STATS_SECTION_HEIGHT,
  type ProfileCardData,
} from './sections/profile.js'

export type { ProfileCardData } from './sections/profile.js'

export const PROFILE_CARD_WIDTH = CARD_WIDTH
export const PROFILE_CARD_HEIGHT =
  LEGACY_OVERLAPPING_PROFILE_SECTION_HEIGHT + STATS_SECTION_HEIGHT

export interface RenderProfileCardOptions {
  readonly bannerGif?: GiphyGif
  readonly badgeEvaluation?: BadgeEvaluation
}

function legacyEffectSelection(effectName?: EffectName | string | null): CardEffects {
  const effect = resolveEffectName(effectName)
  const target = EFFECT_CATALOG[effect].target

  if (effect === 'none') return {}
  if (target === 'avatar') return { avatar: effect }
  if (target === 'section') return { sections: { stats: effect } }
  return { card: effect }
}

/** Compatibility wrapper around the composable card renderer. */
export function renderProfileCard(
  profile: ProfileCardData,
  themeName: ThemeName,
  effectName?: EffectName | string | null,
  options: RenderProfileCardOptions = {},
): string {
  const effect = resolveEffectName(effectName)
  const bio = truncateText(profile.bio?.trim() || 'GitHub profile', 78)
  return renderCard({
    theme: themeName,
    bannerGif: options.bannerGif,
    sections: [
      createLegacyOverlappingProfileSection(profile, options.badgeEvaluation),
      createStatsSection(profile, { besideAvatar: true }),
    ],
    effects: legacyEffectSelection(effect),
    title: `${profile.name?.trim() || profile.login} (@${profile.login})`,
    description: `${bio}. ${profile.followers} followers, ${profile.repositories} repositories, ${profile.stars} stars, and ${profile.contributions} contributions.`,
    rootData: {
      effect,
    },
  })
}
