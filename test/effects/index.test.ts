import { describe, expect, expectTypeOf, it } from 'vitest'

import {
  AVATAR_EFFECT_NAMES,
  CARD_EFFECT_NAMES,
  EFFECT_CATALOG,
  EFFECT_NAMES,
  SECTION_EFFECT_NAMES,
  getEffectMeta,
  resolveAvatarEffectName,
  resolveCardEffectName,
  resolveSectionEffectName,
  type EffectMeta,
  type EffectName,
} from '../../src/effects'

describe('effect registry', () => {
  it('preserves the public effect metadata contract', () => {
    const metadata: EffectMeta = {
      name: 'pulse',
      label: 'Pulse',
      description: 'Breathing accent rings around an avatar.',
    }

    expect(metadata.name).toBe('pulse')
    expectTypeOf<keyof EffectMeta>().toEqualTypeOf<
      'name' | 'label' | 'description'
    >()
    expectTypeOf(getEffectMeta('pulse').name).toEqualTypeOf<EffectName>()
  })

  it('organizes every effect under one rendering target', () => {
    const targeted = [
      ...AVATAR_EFFECT_NAMES,
      ...CARD_EFFECT_NAMES,
      ...SECTION_EFFECT_NAMES,
    ]

    expect(new Set(targeted)).toEqual(new Set(EFFECT_NAMES))
    expect(EFFECT_CATALOG.orbit.target).toBe('avatar')
    expect(EFFECT_CATALOG.shimmer.target).toBe('card')
    expect(EFFECT_CATALOG.grid.target).toBe('section')
  })

  it('resolves names only inside the requested target', () => {
    expect(resolveAvatarEffectName(' ORBIT ')).toBe('orbit')
    expect(resolveAvatarEffectName('shimmer')).toBe('none')
    expect(resolveCardEffectName('shimmer')).toBe('shimmer')
    expect(resolveCardEffectName('orbit')).toBe('none')
    expect(resolveSectionEffectName('grid')).toBe('grid')
    expect(resolveSectionEffectName('unknown')).toBe('none')
  })
})
