import { Hono } from 'hono'

import { normalizeGiphyQuery } from '../lib/query.js'
import {
  DEFAULT_GIPHY_SEARCH_LIMIT,
  GiphyServiceError,
  MAX_GIPHY_SEARCH_LIMIT,
  searchGiphyGifs,
} from '../services/giphy.js'

export const giphyRoutes = new Hono()

function parseLimit(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_GIPHY_SEARCH_LIMIT
  }
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) {
    return DEFAULT_GIPHY_SEARCH_LIMIT
  }
  return Math.min(
    MAX_GIPHY_SEARCH_LIMIT,
    Math.max(1, Math.floor(parsed)),
  )
}

giphyRoutes.get('/giphy/search', async (context) => {
  const params = new URL(context.req.url).searchParams
  const query = normalizeGiphyQuery(params.get('q') ?? '')

  if (!query.ok) {
    return context.json(
      {
        error: {
          code: query.error.code,
          message: query.error.message,
        },
      },
      400,
    )
  }

  try {
    const results = await searchGiphyGifs(query.value, {
      apiKey: process.env.GIPHY_API_KEY,
      limit: parseLimit(params.get('limit') ?? undefined),
    })

    return context.json({
      query: query.value,
      results,
    })
  } catch (error) {
    const serviceError =
      error instanceof GiphyServiceError
        ? error
        : new GiphyServiceError('upstream_error')

    const status =
      serviceError.code === 'missing_api_key'
        ? 503
        : serviceError.code === 'gif_not_found'
          ? 404
          : serviceError.code === 'rate_limited'
            ? 429
            : serviceError.code === 'timeout'
              ? 504
              : 502

    return context.json(
      {
        error: {
          code: serviceError.code,
          message: serviceError.message,
        },
      },
      status,
    )
  }
})
