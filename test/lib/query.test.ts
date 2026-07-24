import { describe, expect, it } from 'vitest'

import {
  MAX_SKILLS,
  parseCardQuery,
  parseProfileQuery,
  parseSkillsQuery,
} from '../../src/lib/query'

describe('parseProfileQuery', () => {
  it('trims and normalizes a valid profile query', () => {
    expect(
      parseProfileQuery(
        new URLSearchParams({ username: ' Octo-Cat ', theme: ' NEBULA ' }),
      ),
    ).toEqual({
      ok: true,
      value: {
        username: 'octo-cat',
        theme: 'nebula',
        effect: 'pulse',
      },
    })
  })

  it('accepts an explicit profile effect', () => {
    expect(
      parseProfileQuery(
        new URLSearchParams({
          username: 'octocat',
          theme: 'nebula',
          effect: ' Aurora ',
        }),
      ),
    ).toEqual({
      ok: true,
      value: {
        username: 'octocat',
        theme: 'nebula',
        effect: 'aurora',
      },
    })
  })

  it('accepts a Giphy GIF for the nebula banner', () => {
    expect(
      parseProfileQuery(
        new URLSearchParams({
          username: 'octocat',
          theme: 'nebula',
          bannerGiphy: '  Space Cat  ',
        }),
      ),
    ).toMatchObject({
      ok: true,
      value: { bannerGiphy: 'Space Cat' },
    })
  })

  it('rejects a banner GIF outside the nebula theme', () => {
    expect(
      parseProfileQuery(
        new URLSearchParams({
          username: 'octocat',
          bannerGiphy: 'space cat',
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'banner_giphy_theme_required' },
    })
  })

  it('falls back to the default effect for an unknown effect', () => {
    const result = parseProfileQuery(
      new URLSearchParams({ username: 'octocat', effect: 'disco' }),
    )

    expect(result).toMatchObject({
      ok: true,
      value: { effect: 'pulse' },
    })
  })

  it.each([
    ['', 'username_required'],
    ['-leading', 'username_invalid'],
    ['trailing-', 'username_invalid'],
    ['double--dash', 'username_invalid'],
    ['contains space', 'username_invalid'],
    ['a'.repeat(40), 'username_invalid'],
  ])('rejects invalid username %j', (username, code) => {
    const result = parseProfileQuery(new URLSearchParams({ username }))

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe(code)
    }
  })

  it('falls back to the default theme for an unknown theme', () => {
    const result = parseProfileQuery(
      new URLSearchParams({ username: 'octocat', theme: 'neon' }),
    )

    expect(result).toMatchObject({
      ok: true,
      value: { theme: 'default' },
    })
  })
})

describe('parseSkillsQuery', () => {
  it('normalizes, removes duplicates, and parses labels', () => {
    expect(
      parseSkillsQuery(
        new URLSearchParams({
          skills: ' TypeScript, react,typescript,Node.js ',
          theme: 'Nebula',
          labels: 'false',
        }),
      ),
    ).toEqual({
      ok: true,
      value: {
        skills: ['typescript', 'react', 'node.js'],
        theme: 'nebula',
        labels: false,
        iconTheme: 'accent',
        outline: 'rounded',
      },
    })
  })

  it('parses skill icon theme and global outline options', () => {
    expect(
      parseSkillsQuery(
        new URLSearchParams({
          skills: 'react',
          iconTheme: 'Brand',
          outline: 'Soft',
        }),
      ),
    ).toMatchObject({
      ok: true,
      value: {
        iconTheme: 'brand',
        outline: 'soft',
      },
    })

    expect(
      parseSkillsQuery(
        new URLSearchParams({ skills: 'react', iconTheme: 'neon' }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'icon_theme_invalid' },
    })

    expect(
      parseSkillsQuery(
        new URLSearchParams({ skills: 'react', outline: 'bevel' }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'outline_invalid' },
    })
  })

  it('ignores stale iconBorder input for skills and card queries', () => {
    const skills = parseSkillsQuery(
      new URLSearchParams({ skills: 'react', iconBorder: 'glow' }),
    )
    const card = parseCardQuery(
      new URLSearchParams({
        sections: 'skills',
        skills: 'react',
        iconBorder: 'circle',
      }),
    )

    expect(skills).toMatchObject({ ok: true })
    expect(card).toMatchObject({ ok: true })
    if (skills.ok) expect(skills.value).not.toHaveProperty('iconBorder')
    if (card.ok) expect(card.value).not.toHaveProperty('iconBorder')
  })

  it('requires at least one skill', () => {
    const result = parseSkillsQuery(
      new URLSearchParams({ skills: ' ,  , ' }),
    )

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'skills_required' },
    })
  })

  it('rejects invalid skill identifiers and label values', () => {
    expect(
      parseSkillsQuery(new URLSearchParams({ skills: '<script>' })),
    ).toMatchObject({
      ok: false,
      error: { code: 'skill_invalid' },
    })

    expect(
      parseSkillsQuery(
        new URLSearchParams({ skills: 'git', labels: 'sometimes' }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'labels_invalid' },
    })
  })

  it('accepts boolean aliases', () => {
    expect(
      parseSkillsQuery(new URLSearchParams({ skills: 'git', labels: '1' })),
    ).toMatchObject({ ok: true, value: { labels: true } })
    expect(
      parseSkillsQuery(new URLSearchParams({ skills: 'git', labels: '0' })),
    ).toMatchObject({ ok: true, value: { labels: false } })
  })

  it('enforces the bounded skill count', () => {
    const skills = Array.from(
      { length: MAX_SKILLS + 1 },
      (_, index) => `skill-${index}`,
    ).join(',')
    const result = parseSkillsQuery(new URLSearchParams({ skills }))

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'skills_limit' },
    })
  })

  it('rejects oversized raw query values before parsing', () => {
    const result = parseSkillsQuery(
      new URLSearchParams({ skills: `git,${'a'.repeat(3000)}` }),
    )

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'skills_too_long' },
    })
  })
})

describe('parseCardQuery', () => {
  it('parses background effects and contact and donate sections', () => {
    expect(
      parseCardQuery(
        new URLSearchParams({
          sections: 'contact,donate',
          contact: ' Email:Hello@Example.com, GitHub:Octocat ',
          donate: 'Kofi:Octocat,github-sponsors:Octocat',
          effects: 'background:aurora,contact:grid',
        }),
      ),
    ).toMatchObject({
      ok: true,
      value: {
        sections: ['contact', 'donate'],
        contact: ['email:hello@example.com', 'github:octocat'],
        donate: ['kofi:octocat', 'github-sponsors:octocat'],
        effects: {
          background: 'aurora',
          sections: { contact: 'grid' },
        },
      },
    })
  })

  it('requires a username for the projects section', () => {
    expect(
      parseCardQuery(new URLSearchParams({ sections: 'projects' })),
    ).toMatchObject({
      ok: false,
      error: { code: 'username_required' },
    })
    expect(
      parseCardQuery(
        new URLSearchParams({ sections: 'projects', username: 'octocat' }),
      ),
    ).toMatchObject({
      ok: true,
      value: { sections: ['projects'], username: 'octocat' },
    })
  })

  it('requires a username for the contributions section', () => {
    expect(
      parseCardQuery(new URLSearchParams({ sections: 'contributions' })),
    ).toMatchObject({
      ok: false,
      error: { code: 'username_required' },
    })
    expect(
      parseCardQuery(
        new URLSearchParams({
          sections: 'contributions',
          username: 'octocat',
        }),
      ),
    ).toMatchObject({
      ok: true,
      value: { sections: ['contributions'], username: 'octocat' },
    })
  })

  it('parses a giphy search query', () => {
    expect(
      parseCardQuery(
        new URLSearchParams({
          sections: 'giphy',
          giphy: '  Coding Cat  ',
          effects: 'giphy:grid',
        }),
      ),
    ).toMatchObject({
      ok: true,
      value: {
        sections: ['giphy'],
        giphy: 'Coding Cat',
        effects: { sections: { giphy: 'grid' } },
      },
    })
  })

  it('parses a Giphy GIF for a nebula profile banner', () => {
    expect(
      parseCardQuery(
        new URLSearchParams({
          sections: 'profile,stats',
          username: 'octocat',
          theme: 'nebula',
          bannerGiphy: '  Space Cat  ',
        }),
      ),
    ).toMatchObject({
      ok: true,
      value: { bannerGiphy: 'Space Cat' },
    })
  })

  it.each([
    [
      {
        sections: 'profile',
        username: 'octocat',
        bannerGiphy: 'space cat',
      },
      'banner_giphy_theme_required',
    ],
    [
      {
        sections: 'skills',
        skills: 'typescript',
        theme: 'nebula',
        bannerGiphy: 'space cat',
      },
      'banner_giphy_profile_required',
    ],
    [
      {
        sections: 'profile',
        username: 'octocat',
        theme: 'nebula',
        bannerGiphy: 'bad!query',
      },
      'banner_giphy_invalid',
    ],
  ])('rejects an invalid banner Giphy composition %#', (query, code) => {
    expect(parseCardQuery(new URLSearchParams(query))).toMatchObject({
      ok: false,
      error: { code },
    })
  })

  it.each([
    [{ sections: 'contact' }, 'contact_required'],
    [{ sections: 'donate' }, 'donate_required'],
    [{ sections: 'giphy' }, 'giphy_required'],
    [{ sections: 'giphy', giphy: 'bad!query' }, 'giphy_invalid'],
    [{ sections: 'contact', contact: 'email:https://example.com' }, 'contact_invalid'],
  ])('rejects invalid link section fields %#', (query, code) => {
    expect(parseCardQuery(new URLSearchParams(query))).toMatchObject({
      ok: false,
      error: { code },
    })
  })

  it.each([
    [
      'avatar',
      { sections: 'stats', username: 'octocat', effects: 'avatar:pulse' },
    ],
    [
      'skills',
      { sections: 'profile', username: 'octocat', effects: 'skills:grid' },
    ],
  ])('rejects an effect for an absent %s target', (_scope, query) => {
    expect(parseCardQuery(new URLSearchParams(query))).toMatchObject({
      ok: false,
      error: { code: 'effect_invalid' },
    })
  })

  it('allows none effects for absent targets', () => {
    expect(
      parseCardQuery(
        new URLSearchParams({
          sections: 'skills',
          skills: 'typescript',
          effects: 'avatar:none,profile:none,stats:none',
        }),
      ),
    ).toMatchObject({
      ok: true,
      value: {
        effects: {
          avatar: 'none',
          sections: { profile: 'none', stats: 'none' },
        },
      },
    })
  })

  it('still rejects effects used with the wrong target type', () => {
    expect(
      parseCardQuery(
        new URLSearchParams({
          sections: 'profile',
          username: 'octocat',
          effects: 'avatar:shimmer',
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: {
        code: 'effect_invalid',
        message: 'Effect "shimmer" cannot target "avatar".',
      },
    })
  })

  it('rejects non-background effects on the background target', () => {
    expect(
      parseCardQuery(
        new URLSearchParams({
          sections: 'skills',
          skills: 'typescript',
          effects: 'background:shimmer',
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: {
        code: 'effect_invalid',
        message: 'Effect "shimmer" cannot target "background".',
      },
    })
  })
})
