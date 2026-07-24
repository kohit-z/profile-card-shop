import { describe, expect, it } from 'vitest'

import { evaluateBadges } from '../../src/data/badges'
import { SKILL_CATALOG } from '../../src/data/skills'
import { AVATAR_EFFECT_NAMES } from '../../src/effects'
import type { GitHubProfile } from '../../src/services/github'
import {
  BRANDING_FOOTER_HEIGHT,
  GITHUB_DECO_REPOSITORY_URL,
} from '../../src/themes/branding'
import { THEME_NAMES } from '../../src/themes'
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

const badgeEvaluation = evaluateBadges(
  {
    ...profile,
    contributionCalendar: { totalContributions: 987, weeks: [] },
    pinnedRepositories: [],
    activity: {
      createdAt: '2010-01-01T00:00:00Z',
      organizations: 0,
      authoredPullRequests: 0,
      authoredIssues: 0,
      repositoriesContributedTo: 0,
      starredRepositories: 0,
      commitContributions: 0,
      issueContributions: 0,
      pullRequestContributions: 0,
      pullRequestReviewContributions: 0,
      isGitHubStar: false,
      hasSponsorsListing: false,
      repositoryLanguages: [],
    },
  } satisfies GitHubProfile,
  new Date('2026-01-01T12:00:00Z'),
)

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
      expect(anchor!.cy + anchor!.radius + 20).toBeLessThan(section.height)
      expect(svg).toContain(
        `height="${PROFILE_SECTION_HEIGHT + BRANDING_FOOTER_HEIGHT}"`,
      )
      expect(svg).toContain(`data-avatar-effect="${effect}"`)
    },
  )

  it('carries semantic badge evaluation in the profile payload', () => {
    const section = createProfileSection(profile, { badgeEvaluation })

    expect(section.payload).toEqual({
      type: 'profile',
      profile,
      badgeEvaluation,
    })
  })

  it('uses the safe lower profile space for solo automatic badges', () => {
    const svg = renderCard({
      sections: [createProfileSection(profile, { badgeEvaluation })],
    })

    expect(svg).toContain(
      'data-auto-badges="true" data-badge-layout="solo" transform="translate(236 166)"',
    )
    expect(svg).toContain(`data-badge-id="${badgeEvaluation.level.id}"`)
    expect(svg).toContain('y="140"')
    expect(svg).toContain('<circle cx="124" cy="122" r="67"')
  })

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
      `height="${skills.height + PROFILE_SECTION_HEIGHT + BRANDING_FOOTER_HEIGHT}"`,
    )
    expect(anchor).toBeDefined()
    expect(anchor!.cy + anchor!.radius + 20).toBeLessThan(
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
      `height="${LEGACY_OVERLAPPING_PROFILE_SECTION_HEIGHT + STATS_SECTION_HEIGHT + BRANDING_FOOTER_HEIGHT}"`,
    )
    expect(svg).toContain('data-layout="paired"')
    expect(svg).toContain('<rect x="236" y="134" width="135.5" height="76"')
    expect(svg).not.toContain('data-section-divider="true"')
  })

  it('clamps equalizer and float avatar effects inside a paired profile section', () => {
    const sections = [
      createProfileSection(profile, { pairWithStats: true }),
      createStatsSection(profile, { besideAvatar: true }),
    ]
    const floatSvg = renderCard({ sections, effects: { avatar: 'float' } })
    const equalizerSvg = renderCard({
      sections,
      effects: { avatar: 'equalizer' },
    })

    // Unclamped float would land at cy=186 and bleed into stats.
    expect(floatSvg).toContain('cy="112"')
    expect(floatSvg).not.toContain('cy="186"')
    // Unclamped equalizer base would be 200; clamped bars stay near y≈107.
    expect(equalizerSvg).toContain('y="107"')
    expect(equalizerSvg).not.toContain('y="195"')
  })

  it('uses a full-bleed stats row when stats are not under a profile', () => {
    const svg = renderCard({
      sections: [createStatsSection(profile)],
    })

    expect(svg).toContain('data-layout="full"')
    expect(svg).toContain('<rect x="22" y="12" width="189" height="76"')
    expect(svg).not.toContain('data-layout="paired"')
  })

  it.each(THEME_NAMES)(
    'adds a linked repository star badge to the %s theme',
    (theme) => {
      const svg = renderCard({
        theme,
        sections: [createStatsSection(profile)],
      })

      expect(svg).toContain('data-github-deco-branding="true"')
      expect(svg).toContain('data-github-deco-star="true"')
      expect(svg).toContain(`href="${GITHUB_DECO_REPOSITORY_URL}"`)
      expect(svg).toContain('fill-opacity="0.68"')
      expect(svg).not.toContain('>laiger</text>')
    },
  )

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
      theme: 'nebula',
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
    expect(svg).toContain('data-theme-renderer="nebula"')
    expect(svg.indexOf('data-section="profile"')).toBeLessThan(
      svg.indexOf('data-section="skills"'),
    )
  })

  it('lets a theme replace the entire card composition', () => {
    const svg = renderCard({
      theme: 'nebula',
      sections: [
        createProfileSection(profile, { pairWithStats: true }),
        createStatsSection(profile, { besideAvatar: true }),
        createSkillsSection(
          [SKILL_CATALOG.typescript, SKILL_CATALOG.react],
          { labels: true },
        ),
      ],
    })

    expect(svg).toContain('data-theme-renderer="nebula"')
    expect(svg).toContain('data-nebula-banner="true"')
    expect(svg).toContain('data-nebula-identity="true"')
    expect(svg).not.toContain('data-nebula-status')
    expect(svg).not.toContain('Online — Building things')
    expect(svg).not.toContain('>GITHUB</text>')
    expect(svg).toContain('data-nebula-stat="followers"')
    expect(svg).toContain('data-nebula-stat-icon="followers"')
    expect(svg).toContain('data-nebula-stat-copy="followers"')
    expect(svg).toContain('data-nebula-skills="true"')
    expect(svg).not.toContain('data-layout="paired"')
  })

  it('renders an embedded Giphy GIF as the nebula profile banner', () => {
    const svg = renderCard({
      theme: 'nebula',
      bannerGif: {
        id: 'space-cat',
        title: 'Space Cat',
        width: 480,
        height: 270,
        dataUrl: 'data:image/gif;base64,R0lGODlh',
      },
      sections: [createProfileSection(profile)],
    })

    expect(svg).toContain('data-nebula-banner-gif="space-cat"')
    expect(svg).toContain('href="data:image/gif;base64,R0lGODlh"')
    expect(svg).toContain('width="842" height="200"')
    expect(svg).toContain('preserveAspectRatio="xMidYMid slice"')
  })

  it('renders a static card when all target effects are none', () => {
    const svg = renderCard({
      sections: [createSkillsSection([SKILL_CATALOG.typescript])],
    })

    expect(svg).toContain('data-card-effect="none"')
    expect(svg).toContain('data-background-effect="none"')
    expect(svg).not.toMatch(/<animate[ >]|<animateTransform|<animateMotion/)
  })

  it.each(THEME_NAMES)(
    'renders raw local skill icons without skill-specific frames in the %s theme',
    (theme) => {
      const svg = renderCard({
        theme,
        sections: [createSkillsSection([SKILL_CATALOG.typescript])],
      })

      expect(svg).toContain('data-icon="typescript"')
      expect(svg).not.toContain('data-icon-border')
      expect(svg).not.toContain('skill-clip-')
      expect(svg).not.toMatch(/clip-path="url\(#skill-/)
    },
  )

  it.each(THEME_NAMES)(
    'removes the skill tile stroke for outline none in the %s theme',
    (theme) => {
      const svg = renderCard({
        theme,
        outline: 'none',
        sections: [createSkillsSection([SKILL_CATALOG.typescript])],
      })

      expect(svg).toMatch(
        /data-skill="typescript"[\s\S]*?<rect[^>]*stroke="none"/,
      )
    },
  )

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

  it('normalizes an unsafe outline passed through the programmatic API', () => {
    const svg = renderCard({
      sections: [createSkillsSection([SKILL_CATALOG.typescript])],
      outline: '"/><script>alert(1)</script>' as never,
    })

    expect(svg).toContain('data-outline="rounded"')
    expect(svg).not.toContain('<script>')
  })

  it('rejects duplicate accessibility identifiers', () => {
    expect(() =>
      renderCard({
        sections: [createSkillsSection([SKILL_CATALOG.typescript])],
        accessibilityIds: { title: 'card-label', description: 'card-label' },
      }),
    ).toThrow(/accessibility ids must be distinct/i)
  })
})
