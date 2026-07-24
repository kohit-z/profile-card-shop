import { describe, expect, it } from 'vitest'

import { SKILL_CATALOG, SKILL_IDS } from '../../src/data/skills'
import app from '../../src/index'
import { MAX_SKILLS } from '../../src/lib/query'
import { THEME_NAMES } from '../../src/themes'
import { renderSkillsCard } from '../../src/widgets/skills'

const SAMPLE_SKILLS = [
  'javascript',
  'typescript',
  'python',
  'golang',
  'rust',
  'react',
  'nextjs',
  'vuejs',
  'nodejs',
  'nestjs',
  'git',
  'github',
  'docker',
  'kubernetes',
  'npm',
  'pnpm',
  'vercel',
  'cloudflare',
  'postgresql',
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
      path: '/api/skills?skills=<skill,skill>&theme=<theme>&labels=true&iconTheme=<theme>',
      status: 'available',
    })
    expect(body.skills).toEqual([...SKILL_IDS])
    expect(body.skills.length).toBeGreaterThan(100)
    expect(body.skillIconThemes).toEqual(['accent', 'brand', 'mono', 'soft'])
    expect(body).not.toHaveProperty('skillIconBorders')
    expect(body.outlines).toEqual(['rounded', 'square', 'soft', 'none'])
  })

  it('renders one labeled skill as a compact accessible SVG', async () => {
    const { response, svg } = await requestSkills(
      'skills=typescript&theme=nebula&labels=true',
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
    expect(svg).toContain('aria-label="TypeScript"')
    expect(svg).toContain('data-theme="nebula"')
    expect(svg).toContain('data-icon="typescript"')
    expect(svg).toContain('data-icon-theme="accent"')
    expect(svg).not.toContain('data-icon-border')
    expect(svg).toContain('data-outline="rounded"')
  })

  it('packs skills into as many columns as the card width allows', async () => {
    const five = await requestSkills(
      'skills=javascript,typescript,python,go,rust',
    )
    const many = await requestSkills(`skills=${SAMPLE_SKILLS.join(',')}`)
    const iconsOnly = await requestSkills(
      `skills=${SAMPLE_SKILLS.slice(0, 10).join(',')}&labels=false`,
    )

    expect(five.svg).toContain('data-columns="5"')
    expect(five.svg).toContain('data-rows="1"')
    expect(many.response.status).toBe(200)
    expect(many.svg).toContain('data-columns="5"')
    expect(many.svg).toContain('data-rows="4"')
    expect(iconsOnly.svg).toContain('data-columns="10"')
    expect(iconsOnly.svg).toContain('data-rows="1"')
    for (const id of SAMPLE_SKILLS) {
      expect(many.svg).toContain(`data-skill="${id}"`)
    }
  })

  it('supports icon themes and canonicalizes stale icon-border input away', async () => {
    const stale = await app.request(
      '/api/skills?skills=react,git&iconTheme=brand&iconBorder=circle',
    )
    expect(stale.status).toBe(308)
    expect(stale.headers.get('location')).toBe(
      '/api/skills?skills=react%2Cgit&iconTheme=brand',
    )

    const { svg } = await requestSkills('skills=react,git&iconTheme=brand')

    expect(svg).toContain('data-icon-theme="brand"')
    expect(svg).not.toContain('data-icon-border')
    expect(svg).toContain('data-icon="react-light"')
    expect(svg).toContain('data-icon="git"')
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
    const githubIcon = theme === 'nebula' ? 'github-dark' : 'github-light'
    const cloudflareIcon =
      theme === 'nebula' ? 'cloudflare-dark' : 'cloudflare-light'
    const linuxIcon = theme === 'nebula' ? 'linux-dark' : 'linux-light'

    expect(svg).toContain(`data-theme="${theme}"`)
    expect(svg).toContain(`data-icon="${githubIcon}"`)
    expect(svg).toContain(`data-icon="${cloudflareIcon}"`)
    expect(svg).toContain(`data-icon="${linuxIcon}"`)
    expect(svg).not.toMatch(/<image\b/i)
    expect(svg).not.toContain('skill-clip-')
  })

  it('keeps classic skill tile outlines controlled by the global outline', async () => {
    const square = await requestSkills('skills=typescript&outline=square')
    const none = await requestSkills('skills=typescript&outline=none')

    expect(square.svg).toMatch(
      /data-skill="typescript"[\s\S]*?<rect[^>]*rx="2"[^>]*stroke=/,
    )
    expect(none.svg).toMatch(
      /data-skill="typescript"[\s\S]*?<rect[^>]*stroke="none"/,
    )
    expect(square.svg).toContain('data-icon="typescript"')
    expect(none.svg).toContain('data-icon="typescript"')
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
    [`skills=${'a'.repeat(2049)}`, 'skills_too_long'],
    [
      `skills=${Array.from({ length: MAX_SKILLS + 1 }, (_, index) => `skill${index}`).join(',')}`,
      'skills_limit',
    ],
    ['skills=typescript,not-a-real-skill', 'skill_unknown'],
    ['skills=constructor', 'skill_unknown'],
    ['skills=typescript&labels=maybe', 'labels_invalid'],
    ['skills=typescript&iconTheme=neon', 'icon_theme_invalid'],
    ['skills=typescript&outline=bevel', 'outline_invalid'],
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
