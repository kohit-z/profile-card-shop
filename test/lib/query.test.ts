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
        new URLSearchParams({ username: ' Octo-Cat ', theme: ' DARK ' }),
      ),
    ).toEqual({
      ok: true,
      value: {
        username: 'octo-cat',
        theme: 'dark',
        effect: 'pulse',
      },
    })
  })

  it('accepts an explicit profile effect', () => {
    expect(
      parseProfileQuery(
        new URLSearchParams({
          username: 'octocat',
          theme: 'ocean',
          effect: ' Aurora ',
        }),
      ),
    ).toEqual({
      ok: true,
      value: {
        username: 'octocat',
        theme: 'ocean',
        effect: 'aurora',
      },
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
          theme: 'Sunset',
          labels: 'false',
        }),
      ),
    ).toEqual({
      ok: true,
      value: {
        skills: ['typescript', 'react', 'node.js'],
        theme: 'sunset',
        labels: false,
      },
    })
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
      new URLSearchParams({ skills: `git,${'a'.repeat(1000)}` }),
    )

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'skills_too_long' },
    })
  })
})

describe('parseCardQuery', () => {
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
})
