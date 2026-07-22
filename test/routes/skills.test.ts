import { describe, expect, it } from 'vitest'

import { SKILL_CATALOG } from '../../src/data/skills'
import app from '../../src/index'
import { THEME_NAMES } from '../../src/themes'
import { renderSkillsCard } from '../../src/widgets/skills'

const MAX_SKILLS = [
  'javascript',
  'typescript',
  'python',
  'go',
  'rust',
  'react',
  'nextjs',
  'vue',
  'nodejs',
  'hono',
  'git',
  'github',
  'docker',
  'kubernetes',
  'npm',
  'pnpm',
  'vercel',
  'cloudflare',
  'postgres',
  'linux',
] as const

async function requestSkills(query: string): Promise<{
  readonly response: Response
  readonly svg: string
}> {
  const response = await app.request(`/api/skills?${query}`)
  return { response, svg: await response.text() }
}

describe('GET /api/skills', () => {
  it('is advertised as available with its supported identifiers', async () => {
    const response = await app.request('/meta')
    const body = await response.json()

    expect(body.routes.skills).toMatchObject({
      method: 'GET',
      path: '/api/skills?skills=<skill,skill>&theme=<theme>&labels=true',
      status: 'available',
    })
    expect(body.skills).toEqual(MAX_SKILLS)
  })

  it('renders one labeled skill as a compact accessible SVG', async () => {
    const { response, svg } = await requestSkills(
      'skills=typescript&theme=dark&labels=true',
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe(
      'image/svg+xml; charset=UTF-8',
    )
    expect(response.headers.get('cache-control')).toBe(
      'public, s-maxage=3600, stale-while-revalidate=86400',
    )
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.has('x-github-deco-error')).toBe(false)
    expect(svg).toMatch(/width="\d+" height="\d+"/)
    expect(svg).toContain('role="img"')
    expect(svg).toContain('aria-labelledby="skills-title skills-description"')
    expect(svg).toContain('<title id="skills-title">Skills: TypeScript</title>')
    expect(svg).toContain('<desc id="skills-description">')
    expect(svg).toContain('>TypeScript</text>')
    expect(svg).toContain('<path d="')
  })

  it('uses deterministic multi-row layouts that adapt through the maximum', async () => {
    const five = await requestSkills(
      'skills=javascript,typescript,python,go,rust',
    )
    const maximum = await requestSkills(`skills=${MAX_SKILLS.join(',')}`)

    expect(five.svg).toContain('data-columns="3"')
    expect(five.svg).toContain('data-rows="2"')
    expect(maximum.response.status).toBe(200)
    expect(maximum.svg).toContain('data-columns="5"')
    expect(maximum.svg).toContain('data-rows="4"')
    for (const id of MAX_SKILLS) {
      expect(maximum.svg).toContain(`data-skill="${id}"`)
    }
  })

  it('supports hidden labels while retaining accessible icon names', async () => {
    const labeled = await requestSkills('skills=react,git&labels=true')
    const iconsOnly = await requestSkills('skills=react,git&labels=false')

    expect(labeled.svg).toContain('>React</text>')
    expect(labeled.svg).toContain('>Git</text>')
    expect(iconsOnly.svg).not.toContain('>React</text>')
    expect(iconsOnly.svg).not.toContain('>Git</text>')
    expect(iconsOnly.svg).toContain('aria-label="React"')
    expect(iconsOnly.svg).toContain('aria-label="Git"')
    expect(iconsOnly.svg).toContain('data-labels="false"')
  })

  it('normalizes aliases and removes canonical duplicates deterministically', async () => {
    const { svg } = await requestSkills(
      'skills=node,node.js,nodejs,typescript,typescript',
    )

    expect(svg.match(/data-skill="nodejs"/g)).toHaveLength(1)
    expect(svg.match(/data-skill="typescript"/g)).toHaveLength(1)
    expect(svg).toContain('Skills: Node.js, TypeScript')
  })

  it.each(THEME_NAMES)('renders visible local icons for the %s theme', async (theme) => {
    const { svg } = await requestSkills(
      `skills=github,cloudflare,linux&theme=${theme}`,
    )

    expect(svg).toContain(`data-theme="${theme}"`)
    expect(svg).toContain('fill="currentColor"')
    expect(svg).not.toMatch(/<image\b/i)
    expect(svg).not.toMatch(/(?:href|src)="https?:\/\//i)
  })

  it('escapes registry labels in visible and accessible text', () => {
    const svg = renderSkillsCard(
      [{ ...SKILL_CATALOG.typescript, label: 'Type <& "safe"' }],
      'default',
      true,
    )

    expect(svg).toContain('Type &lt;&amp; &quot;safe&quot;')
    expect(svg).not.toContain('Type <&')
  })

  it.each([
    ['', 'skills_required'],
    ['skills=', 'skills_required'],
    ['skills=%3Cscript%3E', 'skill_invalid'],
    [`skills=${'a'.repeat(513)}`, 'skills_too_long'],
    [
      `skills=${[...MAX_SKILLS, 'extra'].join(',')}`,
      'skills_limit',
    ],
    ['skills=typescript,not-a-real-skill', 'skill_unknown'],
    ['skills=constructor', 'skill_unknown'],
    ['skills=typescript&labels=maybe', 'labels_invalid'],
  ])(
    'returns an HTTP-200 no-store SVG error for %s',
    async (query, expectedCode) => {
      const { response, svg } = await requestSkills(query)

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe(
        'image/svg+xml; charset=UTF-8',
      )
      expect(response.headers.get('cache-control')).toBe('no-store')
      expect(response.headers.get('x-github-deco-error')).toBe(expectedCode)
      expect(svg).toContain('role="img"')
      expect(svg).toContain('Invalid skills request')
    },
  )

  it('lists only the first bounded safe unknown identifier', async () => {
    const unknown = `unknown-${'x'.repeat(24)}`
    const { svg } = await requestSkills(
      `skills=${unknown},another-unknown`,
    )

    expect(svg).toContain(unknown)
    expect(svg).not.toContain('another-unknown')
  })
})
