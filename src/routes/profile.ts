import { Hono } from 'hono'

import { evaluateBadges, type BadgeEvaluation } from '../data/badges.js'
import { parseProfileQuery } from '../lib/query.js'
import { svgErrorResponse, svgResponse } from '../lib/svg.js'
import {
  GitHubServiceError,
  fetchGitHubProfile,
  type GitHubProfile,
} from '../services/github.js'
import {
  fetchGiphyGif,
  GiphyServiceError,
  type GiphyGif,
} from '../services/giphy.js'
import { DEFAULT_EFFECT_NAME } from '../effects/index.js'
import { DEFAULT_THEME_NAME } from '../themes/index.js'
import {
  PROFILE_CARD_HEIGHT,
  PROFILE_CARD_WIDTH,
  renderProfileCard,
} from '../widgets/profile.js'

export const profileRoutes = new Hono()

profileRoutes.get('/profile', async (context) => {
  const requestUrl = new URL(context.req.url)
  const query = parseProfileQuery(requestUrl.searchParams)

  if (!query.ok) {
    return svgErrorResponse({
      code: query.error.code,
      title: 'Invalid profile request',
      message: query.error.message,
      width: PROFILE_CARD_WIDTH,
      height: PROFILE_CARD_HEIGHT,
      status: 200,
    })
  }

  const canonicalParams = new URLSearchParams({
    username: query.value.username,
  })
  if (query.value.theme !== DEFAULT_THEME_NAME) {
    canonicalParams.set('theme', query.value.theme)
  }
  if (query.value.effect !== DEFAULT_EFFECT_NAME) {
    canonicalParams.set('effect', query.value.effect)
  }
  if (query.value.bannerGiphy) {
    canonicalParams.set('bannerGiphy', query.value.bannerGiphy)
  }

  const canonicalQuery = canonicalParams.toString()
  if (requestUrl.search.slice(1) !== canonicalQuery) {
    return context.redirect(
      `${requestUrl.pathname}?${canonicalQuery}`,
      307,
    )
  }

  let profile: GitHubProfile
  let badgeEvaluation: BadgeEvaluation
  try {
    profile = await fetchGitHubProfile(query.value.username, {
      token: process.env.GITHUB_TOKEN,
    })
    badgeEvaluation = evaluateBadges(profile)
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
      width: PROFILE_CARD_WIDTH,
      height: PROFILE_CARD_HEIGHT,
      status: 200,
    })
  }

  let bannerGif: GiphyGif | undefined
  if (query.value.bannerGiphy) {
    try {
      bannerGif = await fetchGiphyGif(query.value.bannerGiphy, {
        apiKey: process.env.GIPHY_API_KEY,
      })
    } catch (error) {
      const serviceError =
        error instanceof GiphyServiceError
          ? error
          : new GiphyServiceError('upstream_error')
      return svgErrorResponse({
        code: serviceError.code,
        title: 'Profile unavailable',
        message: serviceError.message,
        theme: query.value.theme,
        width: PROFILE_CARD_WIDTH,
        height: PROFILE_CARD_HEIGHT,
        status: 200,
      })
    }
  }

  return svgResponse(
    renderProfileCard(
      profile,
      query.value.theme,
      query.value.effect,
      { bannerGif, badgeEvaluation },
    ),
  )
})
