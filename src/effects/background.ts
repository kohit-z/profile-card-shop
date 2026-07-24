import { renderAtmosphereEffect } from './atmosphere.js'
import type { BackgroundEffectName } from './registry.js'
import type { EffectMarkup, EffectRenderContext } from './types.js'

export function renderBackgroundEffect(
  effect: BackgroundEffectName,
  context: EffectRenderContext,
): EffectMarkup {
  if (effect === 'none') return {}

  switch (effect) {
    case 'aurora':
    case 'matrix':
      return renderAtmosphereEffect(effect, context, 'background')
  }
}
