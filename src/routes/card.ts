import { Hono } from 'hono'

import {
  CONTACT_CATALOG,
  DONATE_CATALOG,
  resolveCardLinks,
} from '../data/links.js'
import { evaluateBadges, type BadgeEvaluation } from '../data/badges.js'
import { DEFAULT_OUTLINE_STYLE } from '../data/outline-style.js'
import { resolveSkills } from '../data/skills.js'
import { parseCardQuery } from '../lib/query.js'
import { svgErrorResponse, svgResponse, truncateText } from '../lib/svg.js'
import {
  fetchGitHubProfile,
  GitHubServiceError,
  type GitHubProfile,
} from '../services/github.js'
import {
  fetchGiphyGif,
  GiphyServiceError,
  type GiphyGif,
} from '../services/giphy.js'
import { DEFAULT_THEME_NAME } from '../themes/index.js'
import { CARD_WIDTH, renderCard, type CardSection } from '../widgets/card.js'
import {
  createProfileSection,
  createStatsSection,
} from '../widgets/sections/profile.js'
import { createSkillsSection } from '../widgets/sections/skills.js'
import {
  createContactSection,
  createDonateSection,
} from '../widgets/sections/links.js'
import { createProjectsSection } from '../widgets/sections/projects.js'
import { createContributionsSection } from '../widgets/sections/contributions.js'
import { createGiphySection } from '../widgets/sections/giphy.js'

export const cardRoutes = new Hono()

function isSameSearchParams(
  left: URLSearchParams,
  right: URLSearchParams,
): boolean {
  const leftEntries = [...left.entries()]
  const rightEntries = [...right.entries()]
  if (leftEntries.length !== rightEntries.length) {
    return false
  }

  return leftEntries.every(
    ([key, value], index) =>
      key === rightEntries[index]?.[0] && value === rightEntries[index]?.[1],
  )
}

cardRoutes.get('/card', async (context) => {
  const requestUrl = new URL(context.req.url)
  const query = parseCardQuery(requestUrl.searchParams)

  if (!query.ok) {
    return svgErrorResponse({
      code: query.error.code,
      title: 'Invalid card request',
      message: query.error.message,
      width: CARD_WIDTH,
      height: 120,
      status: 200,
    })
  }

  const resolvedSkills = resolveSkills(query.value.skills)
  if (resolvedSkills.unknown) {
    return svgErrorResponse({
      code: 'skill_unknown',
      title: 'Invalid card request',
      message: `Unknown skill identifier: ${truncateText(resolvedSkills.unknown, 32)}.`,
      theme: query.value.theme,
      width: CARD_WIDTH,
      height: 120,
      status: 200,
    })
  }
  const resolvedContact = resolveCardLinks(query.value.contact, CONTACT_CATALOG)
  if (resolvedContact.unknown) {
    return svgErrorResponse({
      code: 'contact_unknown',
      title: 'Invalid card request',
      message: `Unknown contact platform: ${truncateText(resolvedContact.unknown, 32)}.`,
      theme: query.value.theme,
      width: CARD_WIDTH,
      height: 120,
      status: 200,
    })
  }
  const resolvedDonate = resolveCardLinks(query.value.donate, DONATE_CATALOG)
  if (resolvedDonate.unknown) {
    return svgErrorResponse({
      code: 'donate_unknown',
      title: 'Invalid card request',
      message: `Unknown donation platform: ${truncateText(resolvedDonate.unknown, 32)}.`,
      theme: query.value.theme,
      width: CARD_WIDTH,
      height: 120,
      status: 200,
    })
  }

  const canonicalParams = new URLSearchParams({
    sections: query.value.sections.join(','),
  })
  if (query.value.username) {
    canonicalParams.set('username', query.value.username)
  }
  if (query.value.sections.includes('skills')) {
    canonicalParams.set(
      'skills',
      resolvedSkills.skills.map((skill) => skill.id).join(','),
    )
    if (!query.value.labels) {
      canonicalParams.set('labels', 'false')
    }
    if (query.value.iconTheme !== 'accent') {
      canonicalParams.set('iconTheme', query.value.iconTheme)
    }
  }
  if (query.value.sections.includes('contact')) {
    canonicalParams.set(
      'contact',
      resolvedContact.links.map((link) => `${link.id}:${link.value}`).join(','),
    )
  }
  if (query.value.sections.includes('donate')) {
    canonicalParams.set(
      'donate',
      resolvedDonate.links.map((link) => `${link.id}:${link.value}`).join(','),
    )
  }
  if (query.value.giphy) {
    canonicalParams.set('giphy', query.value.giphy)
  }
  if (query.value.bannerGiphy) {
    canonicalParams.set('bannerGiphy', query.value.bannerGiphy)
  }
  if (query.value.theme !== DEFAULT_THEME_NAME) {
    canonicalParams.set('theme', query.value.theme)
  }
  if (query.value.outline !== DEFAULT_OUTLINE_STYLE) {
    canonicalParams.set('outline', query.value.outline)
  }

  const effects: string[] = []
  if (query.value.effects.background !== 'none') {
    effects.push(`background:${query.value.effects.background}`)
  }
  if (query.value.effects.card !== 'none') {
    effects.push(`card:${query.value.effects.card}`)
  }
  if (query.value.effects.avatar !== 'none' && query.value.sections.includes('profile')) {
    effects.push(`avatar:${query.value.effects.avatar}`)
  }
  for (const section of query.value.sections) {
    const effect = query.value.effects.sections[section]
    if (effect && effect !== 'none') {
      effects.push(`${section}:${effect}`)
    }
  }
  if (effects.length > 0) {
    canonicalParams.set('effects', effects.join(','))
  }

  // Compare decoded params so Vercel’s percent-encoded req.url cannot 307-loop
  // against the readable unencoded Location form.
  if (!isSameSearchParams(requestUrl.searchParams, canonicalParams)) {
    const canonicalQuery = canonicalParams
      .toString()
      .replaceAll('%2C', ',')
      .replaceAll('%3A', ':')
    return context.redirect(`${requestUrl.pathname}?${canonicalQuery}`, 307)
  }

  let profile: GitHubProfile | undefined
  let badgeEvaluation: BadgeEvaluation | undefined
  if (query.value.username) {
    try {
      profile = await fetchGitHubProfile(query.value.username, {
        token: process.env.GITHUB_TOKEN,
        includeAvatar: query.value.sections.includes('profile'),
      })
      if (query.value.sections.includes('profile')) {
        badgeEvaluation = evaluateBadges(profile)
      }
    } catch (error) {
      const serviceError =
        error instanceof GitHubServiceError
          ? error
          : new GitHubServiceError('upstream_error')
      return svgErrorResponse({
        code: serviceError.code,
        title: 'Card unavailable',
        message: serviceError.message,
        theme: query.value.theme,
        width: CARD_WIDTH,
        height: 120,
        status: 200,
      })
    }
  }

  let giphyGif: GiphyGif | undefined
  if (query.value.giphy) {
    try {
      giphyGif = await fetchGiphyGif(query.value.giphy, {
        apiKey: process.env.GIPHY_API_KEY,
      })
    } catch (error) {
      const serviceError =
        error instanceof GiphyServiceError
          ? error
          : new GiphyServiceError('upstream_error')
      return svgErrorResponse({
        code: serviceError.code,
        title: 'Card unavailable',
        message: serviceError.message,
        theme: query.value.theme,
        width: CARD_WIDTH,
        height: 120,
        status: 200,
      })
    }
  }

  let bannerGif: GiphyGif | undefined
  if (query.value.bannerGiphy) {
    if (
      query.value.bannerGiphy === query.value.giphy &&
      giphyGif !== undefined
    ) {
      bannerGif = giphyGif
    } else {
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
          title: 'Card unavailable',
          message: serviceError.message,
          theme: query.value.theme,
          width: CARD_WIDTH,
          height: 120,
          status: 200,
        })
      }
    }
  }

  const sections: CardSection[] = query.value.sections.map((name, index, list) => {
    switch (name) {
      case 'profile':
        return createProfileSection(profile!, {
          pairWithStats: list[index + 1] === 'stats',
          badgeEvaluation: badgeEvaluation!,
        })
      case 'stats':
        return createStatsSection(profile!, {
          besideAvatar: list[index - 1] === 'profile',
        })
      case 'skills':
        return createSkillsSection(resolvedSkills.skills, {
          labels: query.value.labels,
          iconTheme: query.value.iconTheme,
        })
      case 'projects':
        return createProjectsSection(profile!.pinnedRepositories)
      case 'contributions':
        return createContributionsSection(profile!.contributionCalendar)
      case 'contact':
        return createContactSection(resolvedContact.links)
      case 'donate':
        return createDonateSection(resolvedDonate.links)
      case 'giphy':
        return createGiphySection(giphyGif!)
    }
  })

  return svgResponse(
    renderCard({
      theme: query.value.theme,
      bannerGif,
      outline: query.value.outline,
      sections,
      effects: query.value.effects,
    }),
  )
})
