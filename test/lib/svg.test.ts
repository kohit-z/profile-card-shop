import { describe, expect, it } from 'vitest'

import {
  escapeXml,
  imageDataUrl,
  renderErrorCard,
  svgErrorResponse,
  svgResponse,
  truncateText,
} from '../../src/lib/svg'
import {
  DEFAULT_THEME_NAME,
  THEME_NAMES,
  getTheme,
  resolveThemeName,
} from '../../src/themes'

describe('theme registry', () => {
  it('provides all supported themes with typed card tokens', () => {
    expect(THEME_NAMES).toEqual(['default', 'dark', 'ocean', 'sunset'])

    for (const name of THEME_NAMES) {
      const theme = getTheme(name)

      expect(theme.name).toBe(name)
      expect(theme.gradient.from).toMatch(/^#[0-9a-f]{6}$/i)
      expect(theme.card.radius).toBeGreaterThan(0)
      expect(theme.typography.fontFamily).toContain('sans-serif')
    }
  })

  it('normalizes known theme names and falls back predictably', () => {
    expect(resolveThemeName(' OCEAN ')).toBe('ocean')
    expect(resolveThemeName('unknown')).toBe(DEFAULT_THEME_NAME)
    expect(resolveThemeName(undefined)).toBe(DEFAULT_THEME_NAME)
  })
})

describe('SVG utilities', () => {
  it('XML-escapes every markup-sensitive character', () => {
    expect(escapeXml(`<script alert="x">'&</script>`)).toBe(
      '&lt;script alert=&quot;x&quot;&gt;&apos;&amp;&lt;/script&gt;',
    )
  })

  it('truncates by Unicode code point without exceeding the limit', () => {
    expect(truncateText('hello', 5)).toBe('hello')
    expect(truncateText('A🙂BC', 3)).toBe('A🙂…')
    expect(truncateText('anything', 0)).toBe('')
  })

  it('renders escaped, bounded error-card text', () => {
    const svg = renderErrorCard({
      title: '<Invalid>',
      message: `Retry & ${'x'.repeat(200)}`,
      theme: 'ocean',
    })

    expect(svg).toContain('&lt;Invalid&gt;')
    expect(svg).toContain('&amp;')
    expect(svg).not.toContain('<Invalid>')
    expect(svg).not.toContain('x'.repeat(200))
    expect(svg).toContain('role="img"')
  })

  it('returns cacheable SVG responses on success', async () => {
    const response = svgResponse('<svg />')

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe(
      'image/svg+xml; charset=UTF-8',
    )
    expect(response.headers.get('cache-control')).toBe(
      'public, s-maxage=3600, stale-while-revalidate=86400',
    )
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(await response.text()).toBe('<svg />')
  })

  it('returns displayable no-store SVG errors with a stable error code', async () => {
    const response = svgErrorResponse({
      code: 'invalid_query',
      title: 'Invalid request',
      message: 'A required value is missing.',
      status: 400,
    })

    expect(response.status).toBe(400)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('x-github-deco-error')).toBe('invalid_query')
    expect(await response.text()).toContain('<svg')
  })

  it('only builds data URLs for supported image media types', () => {
    expect(imageDataUrl('image/png', new Uint8Array([0, 1, 2]))).toBe(
      'data:image/png;base64,AAEC',
    )
    expect(() =>
      imageDataUrl('image/svg+xml', new TextEncoder().encode('<svg />')),
    ).toThrow(/unsupported image type/i)
  })
})
