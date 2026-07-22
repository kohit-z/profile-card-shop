import { Hono } from 'hono'

import { parseProfileQuery } from '../lib/query.js'
import { svgErrorResponse, svgResponse } from '../lib/svg.js'
import {
  GitHubServiceError,
  fetchGitHubProfile,
} from '../services/github.js'
import { DEFAULT_THEME_NAME } from '../themes/index.js'
import { renderProfileCard } from '../widgets/profile.js'

export const profileRoutes = new Hono()

profileRoutes.get('/profile', async (context) => {
  const requestUrl = new URL(context.req.url)
  const query = parseProfileQuery(requestUrl.searchParams)

  if (!query.ok) {
    return svgErrorResponse({
      code: query.error.code,
      title: 'Invalid profile request',
      message: query.error.message,
      width: 842,
      height: 220,
      status: 200,
    })
  }

  const canonicalParams = new URLSearchParams({
    username: query.value.username,
  })
  if (query.value.theme !== DEFAULT_THEME_NAME) {
    canonicalParams.set('theme', query.value.theme)
  }

  const canonicalQuery = canonicalParams.toString()
  if (requestUrl.search.slice(1) !== canonicalQuery) {
    return context.redirect(
      `${requestUrl.pathname}?${canonicalQuery}`,
      307,
    )
  }

  try {
    const profile = await fetchGitHubProfile(query.value.username, {
      token: process.env.GITHUB_TOKEN,
    })

    return svgResponse(renderProfileCard(profile, query.value.theme))
  } catch (error) {
    const serviceError =
      error instanceof GitHubServiceError
        ? error
        : new GitHubServiceError('upstream_error')

    return svgErrorResponse({
      code: serviceError.code,
      title: 'Profile unavailable',
      message: serviceError.message,
      theme: query.value.theme,
      width: 842,
      height: 220,
      status: 200,
    })
  }
})
