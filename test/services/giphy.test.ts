import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchGiphyGif, searchGiphyGifs } from '../../src/services/giphy'

const originalKey = process.env.GIPHY_API_KEY

function searchResponse({
  id = 'abc123',
  title = 'Coding cat',
  url = 'https://media1.giphy.com/media/abc123/200.gif',
  width = '320',
  height = '200',
  empty = false,
  items,
}: {
  id?: string
  title?: string
  url?: string
  width?: string
  height?: string
  empty?: boolean
  items?: readonly {
    id: string
    title: string
    url: string
    width?: string
    height?: string
  }[]
} = {}): Response {
  const data = empty
    ? []
    : (items ?? [
        {
          id,
          title,
          url,
          width,
          height,
        },
      ]).map((item) => ({
        id: item.id,
        title: item.title,
        images: {
          fixed_height_small: {
            url: item.url,
            width: item.width ?? width,
            height: item.height ?? height,
          },
          fixed_height: {
            url: item.url,
            width: item.width ?? width,
            height: item.height ?? height,
          },
        },
      }))

  return Response.json({ data })
}

function idResponse({
  id = 'abc123',
  title = 'Coding cat',
  url = 'https://media1.giphy.com/media/abc123/200.gif',
}: {
  id?: string
  title?: string
  url?: string
} = {}): Response {
  return Response.json({
    data: {
      id,
      title,
      images: {
        fixed_height: { url, width: '320', height: '200' },
      },
    },
  })
}

function gifResponse(
  contentType = 'image/gif',
  bytes = new Uint8Array([0, 1, 2]),
): Response {
  return new Response(bytes, {
    headers: { 'Content-Type': contentType },
  })
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  if (originalKey === undefined) {
    delete process.env.GIPHY_API_KEY
  } else {
    process.env.GIPHY_API_KEY = originalKey
  }
})

describe('fetchGiphyGif', () => {
  it('searches Giphy and embeds the GIF as a data URL', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(searchResponse())
      .mockResolvedValueOnce(gifResponse())
    vi.stubGlobal('fetch', fetchMock)

    const gif = await fetchGiphyGif('coding cat', {
      apiKey: 'secret-key',
    })

    expect(gif).toEqual({
      id: 'abc123',
      title: 'Coding cat',
      width: 320,
      height: 200,
      dataUrl: 'data:image/gif;base64,AAEC',
    })

    const searchUrl = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(searchUrl.origin + searchUrl.pathname).toBe(
      'https://api.giphy.com/v1/gifs/search',
    )
    expect(searchUrl.searchParams.get('q')).toBe('coding cat')
    expect(searchUrl.searchParams.get('api_key')).toBe('secret-key')
    expect(searchUrl.searchParams.get('limit')).toBe('1')
  })

  it('fetches by GIF id when the query looks like an id', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(idResponse({ id: 'YRtLgsajXrz1FNJ6oy' }))
      .mockResolvedValueOnce(gifResponse())
    vi.stubGlobal('fetch', fetchMock)

    const gif = await fetchGiphyGif('YRtLgsajXrz1FNJ6oy', {
      apiKey: 'secret-key',
    })

    expect(gif.id).toBe('YRtLgsajXrz1FNJ6oy')
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      '/v1/gifs/YRtLgsajXrz1FNJ6oy?',
    )
  })

  it('falls back to search when an id-shaped query is not found', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(searchResponse({ id: 'fallback1' }))
      .mockResolvedValueOnce(gifResponse())
    vi.stubGlobal('fetch', fetchMock)

    const gif = await fetchGiphyGif('FakeGifId123', {
      apiKey: 'secret-key',
    })

    expect(gif.id).toBe('fallback1')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('rejects a missing API key', async () => {
    await expect(fetchGiphyGif('coding', { apiKey: '  ' })).rejects.toMatchObject({
      name: 'GiphyServiceError',
      code: 'missing_api_key',
    })
  })

  it('rejects empty search results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(searchResponse({ empty: true })),
    )

    await expect(
      fetchGiphyGif('zzzzz', { apiKey: 'secret-key' }),
    ).rejects.toMatchObject({
      name: 'GiphyServiceError',
      code: 'gif_not_found',
    })
  })

  it('rejects untrusted media hosts', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          searchResponse({
            url: 'https://evil.example/media.gif',
          }),
        ),
    )

    await expect(
      fetchGiphyGif('coding', { apiKey: 'secret-key' }),
    ).rejects.toMatchObject({ code: 'gif_untrusted_host' })
  })

  it('rejects oversized GIFs', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(searchResponse())
        .mockResolvedValueOnce(
          new Response(new Uint8Array(10), {
            headers: {
              'Content-Type': 'image/gif',
              'Content-Length': '2000000',
            },
          }),
        ),
    )

    await expect(
      fetchGiphyGif('coding', { apiKey: 'secret-key' }),
    ).rejects.toMatchObject({ code: 'gif_too_large' })
  })
})

describe('searchGiphyGifs', () => {
  it('returns multiple preview candidates for a keyword', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      searchResponse({
        items: [
          {
            id: 'gif1',
            title: 'Cat one',
            url: 'https://media1.giphy.com/media/gif1/100.gif',
            width: '100',
            height: '80',
          },
          {
            id: 'gif2',
            title: 'Cat two',
            url: 'https://media2.giphy.com/media/gif2/100.gif',
            width: '120',
            height: '90',
          },
        ],
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const results = await searchGiphyGifs('coding cat', {
      apiKey: 'secret-key',
      limit: 8,
    })

    expect(results).toEqual([
      {
        id: 'gif1',
        title: 'Cat one',
        previewUrl: 'https://media1.giphy.com/media/gif1/100.gif',
        width: 100,
        height: 80,
      },
      {
        id: 'gif2',
        title: 'Cat two',
        previewUrl: 'https://media2.giphy.com/media/gif2/100.gif',
        width: 120,
        height: 90,
      },
    ])

    const searchUrl = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(searchUrl.origin + searchUrl.pathname).toBe(
      'https://api.giphy.com/v1/gifs/search',
    )
    expect(searchUrl.searchParams.get('q')).toBe('coding cat')
    expect(searchUrl.searchParams.get('limit')).toBe('8')
  })

  it('returns an empty list when nothing matches', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(searchResponse({ empty: true })),
    )

    await expect(
      searchGiphyGifs('zzzzz', { apiKey: 'secret-key' }),
    ).resolves.toEqual([])
  })

  it('rejects a missing API key', async () => {
    await expect(
      searchGiphyGifs('coding', { apiKey: '' }),
    ).rejects.toMatchObject({
      name: 'GiphyServiceError',
      code: 'missing_api_key',
    })
  })
})
