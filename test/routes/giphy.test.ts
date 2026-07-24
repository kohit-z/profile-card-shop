import { afterEach, describe, expect, it, vi } from 'vitest'

import app from '../../src/index'

const originalGiphyKey = process.env.GIPHY_API_KEY

afterEach(() => {
  vi.unstubAllGlobals()
  if (originalGiphyKey === undefined) {
    delete process.env.GIPHY_API_KEY
  } else {
    process.env.GIPHY_API_KEY = originalGiphyKey
  }
})

describe('GET /api/giphy/search', () => {
  it('returns GIF candidates for a keyword search', async () => {
    process.env.GIPHY_API_KEY = 'test-giphy-key'
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        Response.json({
          data: [
            {
              id: 'abc123',
              title: 'Coding cat',
              images: {
                fixed_height_small: {
                  url: 'https://media1.giphy.com/media/abc123/100.gif',
                  width: '100',
                  height: '80',
                },
              },
            },
            {
              id: 'def456',
              title: 'Keyboard cat',
              images: {
                fixed_height_small: {
                  url: 'https://media2.giphy.com/media/def456/100.gif',
                  width: '120',
                  height: '90',
                },
              },
            },
          ],
        }),
      ),
    )

    const response = await app.request('/api/giphy/search?q=coding&limit=8')
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(body).toEqual({
      query: 'coding',
      results: [
        {
          id: 'abc123',
          title: 'Coding cat',
          previewUrl: 'https://media1.giphy.com/media/abc123/100.gif',
          width: 100,
          height: 80,
        },
        {
          id: 'def456',
          title: 'Keyboard cat',
          previewUrl: 'https://media2.giphy.com/media/def456/100.gif',
          width: 120,
          height: 90,
        },
      ],
    })
  })

  it('rejects an invalid search query', async () => {
    const response = await app.request('/api/giphy/search?q=bad!query')
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toMatchObject({
      error: { code: 'giphy_invalid' },
    })
  })

  it('returns 503 when Giphy is not configured', async () => {
    delete process.env.GIPHY_API_KEY

    const response = await app.request('/api/giphy/search?q=coding')
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toMatchObject({
      error: { code: 'missing_api_key' },
    })
  })
})
