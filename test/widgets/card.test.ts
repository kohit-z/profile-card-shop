import { describe, expect, it } from 'vitest'

import { SKILL_CATALOG } from '../../src/data/skills'
import { AVATAR_EFFECT_NAMES } from '../../src/effects'
import {
  defineCardSection,
  renderCard,
} from '../../src/widgets/card'
import {
  createProfileSection,
  createStatsSection,
  PROFILE_SECTION_HEIGHT,
} from '../../src/widgets/sections/profile'
import { createSkillsSection } from '../../src/widgets/sections/skills'

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

describe('renderCard', () => {
  it.each([...AVATAR_EFFECT_NAMES])(
    'keeps a profile-only card self-contained with the %s avatar effect',
    (effect) => {
      const section = createProfileSection(profile)
      const frame = {
        x: 0,
        y: 0,
        width: 842,
        height: section.height,
      }
      const anchor = section.avatarAnchor?.(frame)
      const svg = renderCard({
        sections: [section],
        effects: { avatar: effect },
      })

      expect(section.height).toBe(PROFILE_SECTION_HEIGHT)
      expect(anchor).toBeDefined()
      expect(anchor!.cy + anchor!.radius + 36).toBeLessThan(section.height)
      expect(svg).toContain(`height="${PROFILE_SECTION_HEIGHT}"`)
      expect(svg).toContain(`data-avatar-effect="${effect}"`)
    },
  )

  it('keeps a profile section self-contained when composed last', () => {
    const skills = createSkillsSection([SKILL_CATALOG.typescript])
    const profileSection = createProfileSection(profile)
    const profileFrame = {
      x: 0,
      y: skills.height,
      width: 842,
      height: profileSection.height,
    }
    const anchor = profileSection.avatarAnchor?.(profileFrame)
    const svg = renderCard({
      sections: [skills, profileSection],
      effects: { avatar: 'equalizer' },
    })

    expect(svg).toContain('data-sections="skills,profile"')
    expect(svg).toContain(
      `height="${skills.height + PROFILE_SECTION_HEIGHT}"`,
    )
    expect(anchor).toBeDefined()
    expect(anchor!.cy + anchor!.radius + 36).toBeLessThan(
      profileFrame.y + profileFrame.height,
    )
    expect(svg.indexOf('data-section="skills"')).toBeLessThan(
      svg.indexOf('data-section="profile"'),
    )
  })

  it('composes profile, stats, skills, and custom sections in order', () => {
    const custom = defineCardSection({
      id: 'custom',
      height: 64,
      title: 'Custom',
      description: 'A user-defined card section.',
      render: ({ frame }) =>
        `<text data-custom="true" x="18" y="${frame.y + 32}">Custom</text>`,
    })
    const svg = renderCard({
      theme: 'dark',
      sections: [
        createProfileSection(profile),
        createStatsSection(profile),
        createSkillsSection(
          [SKILL_CATALOG.typescript, SKILL_CATALOG.react],
          { labels: true },
        ),
        custom,
      ],
      effects: {
        card: 'shimmer',
        avatar: 'orbit',
        sections: { skills: 'grid' },
      },
    })

    expect(svg).toContain('data-sections="profile,stats,skills,custom"')
    expect(svg).toContain('data-card-effect="shimmer"')
    expect(svg).toContain('data-avatar-effect="orbit"')
    expect(svg).toContain('data-section-effect="grid"')
    expect(svg).toContain('data-custom="true"')
    expect(svg.indexOf('data-section="profile"')).toBeLessThan(
      svg.indexOf('data-section="skills"'),
    )
  })

  it('renders a static card when all target effects are none', () => {
    const svg = renderCard({
      sections: [createSkillsSection([SKILL_CATALOG.typescript])],
    })

    expect(svg).toContain('data-card-effect="none"')
    expect(svg).not.toMatch(/<animate[ >]|<animateTransform|<animateMotion/)
  })

  it('rejects duplicate section identifiers', () => {
    const section = createSkillsSection([SKILL_CATALOG.typescript])

    expect(() => renderCard({ sections: [section, section] })).toThrow(
      /duplicate card section/i,
    )
  })
})
