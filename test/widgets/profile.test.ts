import { describe, expect, it } from 'vitest'

import { EFFECT_NAMES } from '../../src/effects'
import { THEME_NAMES } from '../../src/themes'
import { renderProfileCard } from '../../src/widgets/profile'

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

describe('renderProfileCard effects', () => {
  it.each([...EFFECT_NAMES])('renders the %s effect candidate', (effect) => {
    const svg = renderProfileCard(profile, 'dark', effect)

    expect(svg).toContain(`data-effect="${effect}"`)
    expect(svg).toContain('data-stat="followers"')
    expect(svg).toContain('data-stat="contributions"')
    if (effect === 'none') {
      expect(svg).not.toMatch(/<animate[ >]|<animateTransform|<animateMotion/)
    } else {
      expect(svg).toMatch(/<animate[ >]|<animateTransform|<animateMotion/)
    }
  })

  it.each([...THEME_NAMES])(
    'keeps effect ids unique per theme (%s)',
    (theme) => {
      const svg = renderProfileCard(profile, theme, 'comet')

      expect(svg).toContain(`profile-comet-${theme}-comet`)
      expect(svg).toContain(`data-theme="${theme}"`)
    },
  )
})
