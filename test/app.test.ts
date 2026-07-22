import { afterEach, describe, expect, it, vi } from 'vitest'

import app from '../src/index'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('application smoke tests', () => {
  it('returns the interactive gallery from the root endpoint', async () => {
    const response = await app.request('https://example.com/')
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(body).toContain('GitHub Deco')
    expect(body).toContain('id="playground"')
    expect(body).toContain('/api/profile')
    expect(body).toContain('/api/skills')
  })

  it('returns service metadata from the meta endpoint', async () => {
    const response = await app.request('/meta')
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(body).toMatchObject({
      name: 'GitHub Deco',
      description: 'Embeddable SVG cards for GitHub profiles and skills.',
      routes: {
        gallery: {
          method: 'GET',
          path: '/',
          status: 'available',
        },
        health: {
          method: 'GET',
          path: '/health',
          status: 'available',
        },
        meta: {
          method: 'GET',
          path: '/meta',
          status: 'available',
        },
        profile: {
          method: 'GET',
          path: '/api/profile?username=<name>&theme=<theme>',
          status: 'available',
        },
        skills: {
          method: 'GET',
          path: '/api/skills?skills=<skill,skill>&theme=<theme>&labels=true',
          status: 'available',
        },
      },
      themes: ['default', 'dark', 'ocean', 'sunset'],
    })
    expect(body.skills).toContain('typescript')
    expect(body.skills).toContain('nodejs')
  })

  it('returns the health response as JSON', async () => {
    const response = await app.request('/health')

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')
    await expect(response.json()).resolves.toEqual({
      status: 'ok',
      service: 'github-deco',
    })
  })

  it('returns a standard 404 for an unknown route', async () => {
    const response = await app.request('/not-a-route')

    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toContain('text/plain')
    await expect(response.text()).resolves.toBe('404 Not Found')
  })

  it('mounts the profile route without making a network request', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)

    const response = await app.request('/api/profile')
    const svg = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe(
      'image/svg+xml; charset=UTF-8',
    )
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('x-github-deco-error')).toBe(
      'username_required',
    )
    expect(svg).toContain('Invalid profile request')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('mounts the skills route as a cacheable SVG endpoint', async () => {
    const response = await app.request('/api/skills?skills=typescript')
    const svg = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe(
      'image/svg+xml; charset=UTF-8',
    )
    expect(response.headers.get('cache-control')).toBe(
      'public, s-maxage=3600, stale-while-revalidate=86400',
    )
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.has('x-github-deco-error')).toBe(false)
    expect(svg).toContain('data-skill="typescript"')
  })
})
