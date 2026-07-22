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
  LEGACY_OVERLAPPING_PROFILE_SECTION_HEIGHT,
  PROFILE_SECTION_HEIGHT,
  STATS_SECTION_HEIGHT,
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

  it('pairs profile+stats into the compact overlapping composition', () => {
    const profileSection = createProfileSection(profile, { pairWithStats: true })
    const statsSection = createStatsSection(profile, { besideAvatar: true })
    const svg = renderCard({
      sections: [profileSection, statsSection],
    })

    expect(profileSection.height).toBe(LEGACY_OVERLAPPING_PROFILE_SECTION_HEIGHT)
    expect(svg).toContain(
      `height="${LEGACY_OVERLAPPING_PROFILE_SECTION_HEIGHT + STATS_SECTION_HEIGHT}"`,
    )
    expect(svg).toContain('data-layout="paired"')
    expect(svg).toContain('<rect x="184" y="142" width="144" height="72"')
  })

  it('uses a full-bleed stats row when stats are not under a profile', () => {
    const svg = renderCard({
      sections: [createStatsSection(profile)],
    })

    expect(svg).toContain('data-layout="full"')
    expect(svg).toContain('<rect x="18" y="10" width="192.5" height="72"')
    expect(svg).not.toContain('data-layout="paired"')
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
        createProfileSection(profile, { pairWithStats: true }),
        createStatsSection(profile, { besideAvatar: true }),
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
    expect(svg).toContain('data-layout="paired"')
    expect(svg.indexOf('data-section="profile"')).toBeLessThan(
      svg.indexOf('data-section="skills"'),
    )
  })

  it('renders a static card when all target effects are none', () => {
    const svg = renderCard({
      sections: [createSkillsSection([SKILL_CATALOG.typescript])],
    })

    expect(svg).toContain('data-card-effect="none"')
    expect(svg).toContain('data-background-effect="none"')
    expect(svg).not.toMatch(/<animate[ >]|<animateTransform|<animateMotion/)
  })

  it('renders a background effect behind sections and a card effect above them', () => {
    const svg = renderCard({
      sections: [createSkillsSection([SKILL_CATALOG.typescript])],
      effects: { background: 'aurora', card: 'shimmer' },
    })

    const background = svg.indexOf('data-effect-layer="background"')
    const section = svg.indexOf('data-section="skills"')
    const cardOverlay = svg.indexOf('data-effect-layer="card"')

    expect(background).toBeGreaterThan(-1)
    expect(background).toBeLessThan(section)
    expect(section).toBeLessThan(cardOverlay)
  })

  it('rejects duplicate section identifiers', () => {
    const section = createSkillsSection([SKILL_CATALOG.typescript])

    expect(() => renderCard({ sections: [section, section] })).toThrow(
      /duplicate card section/i,
    )
  })
})
