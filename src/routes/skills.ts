import { Hono } from 'hono'

import { resolveSkills } from '../data/skills.js'
import { parseSkillsQuery } from '../lib/query.js'
import {
  svgErrorResponse,
  svgResponse,
  truncateText,
} from '../lib/svg.js'
import { resolveThemeName } from '../themes/index.js'
import { renderSkillsCard } from '../widgets/skills.js'

export const skillsRoutes = new Hono()

skillsRoutes.get('/skills', (context) => {
  const requestUrl = new URL(context.req.url)
  if (requestUrl.searchParams.has('iconBorder')) {
    requestUrl.searchParams.delete('iconBorder')
    return context.redirect(
      `${requestUrl.pathname}${requestUrl.search}`,
      308,
    )
  }

  const params = requestUrl.searchParams
  const query = parseSkillsQuery(params)
  const theme = resolveThemeName(params.get('theme'))

  if (!query.ok) {
    return svgErrorResponse({
      code: query.error.code,
      title: 'Invalid skills request',
      message: query.error.message,
      theme,
      width: 520,
      height: 120,
      status: 200,
    })
  }

  const resolved = resolveSkills(query.value.skills)

  if (resolved.unknown) {
    const unknown = truncateText(resolved.unknown, 32)

    return svgErrorResponse({
      code: 'skill_unknown',
      title: 'Invalid skills request',
      message: `Unknown skill identifier: ${unknown}.`,
      theme: query.value.theme,
      width: 520,
      height: 120,
      status: 200,
    })
  }

  return svgResponse(
    renderSkillsCard(resolved.skills, query.value.theme, {
      labels: query.value.labels,
      iconTheme: query.value.iconTheme,
      outline: query.value.outline,
    }),
  )
})
