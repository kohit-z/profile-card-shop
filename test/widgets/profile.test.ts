import { describe, expect, it } from 'vitest'

import { EFFECT_NAMES } from '../../src/effects'
import { THEME_NAMES } from '../../src/themes'
import {
  PROFILE_CARD_HEIGHT,
  PROFILE_CARD_WIDTH,
  renderProfileCard,
} from '../../src/widgets/profile'

const profile = {
  login: 'octocat',
  name: 'The Octocat',
  bio: 'GitHub mascot and demo profile',
  avatarDataUrl: 'data:image/png;base64,iVBORw==',
  followers: 1200,
  repositories: 8,
  stars: 42,
  contributions: 987,
} as const

function svgIds(svg: string): string[] {
  return [...svg.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])
}

function expectValidSvgIds(svg: string): void {
  const ids = svgIds(svg)
  const references = [...svg.matchAll(/url\(#([^)]+)\)/g)].map(
    (match) => match[1],
  )

  expect(new Set(ids).size).toBe(ids.length)
  expect(references.length).toBeGreaterThan(0)
  for (const reference of references) {
    expect(ids).toContain(reference)
  }
}

describe('renderProfileCard effects', () => {
  it('preserves the legacy 842x236 overlapping profile geometry', () => {
    const svg = renderProfileCard(profile, 'dark', 'none')

    expect(PROFILE_CARD_WIDTH).toBe(842)
    expect(PROFILE_CARD_HEIGHT).toBe(236)
    expect(svg).toContain('width="842" height="236"')
    expect(svg).toContain('<circle cx="92" cy="118" r="73"')
    expect(svg).toContain('<rect x="184" y="142" width="144" height="72"')
  })

  it.each([...EFFECT_NAMES])('renders the %s effect candidate', (effect) => {
    const svg = renderProfileCard(profile, 'dark', effect)

    expect(svg).toContain(`data-effect="${effect}"`)
    expect(svg).not.toContain('data-legacy-effect-id')
    expect(svg).toContain('data-stat="followers"')
    expect(svg).toContain('data-stat="contributions"')
    expectValidSvgIds(svg)
    if (effect === 'none') {
      expect(svg).not.toMatch(/<animate[ >]|<animateTransform|<animateMotion/)
    } else {
      expect(svg).toMatch(/<animate[ >]|<animateTransform|<animateMotion/)
    }
  })

  it.each([...THEME_NAMES])(
    'namespaces generated effect ids for the %s theme',
    (theme) => {
      const svg = renderProfileCard(profile, theme, 'shimmer')
      const namespace = `card-${theme}-shimmer-none`
      const generatedCardIds = svgIds(svg).filter((id) =>
        id.startsWith('card-'),
      )

      expect(svg).toContain(`data-theme="${theme}"`)
      expect(generatedCardIds).toContain(`${namespace}-shimmer`)
      expect(
        generatedCardIds.every((id) => id.startsWith(`${namespace}-`)),
      ).toBe(true)
    },
  )
})
