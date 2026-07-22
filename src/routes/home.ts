import { Hono } from 'hono'

import { SKILL_IDS } from '../data/skills.js'
import { EFFECT_NAMES } from '../effects/index.js'
import { THEME_NAMES } from '../themes/index.js'
import { renderGalleryPage } from '../ui/gallery.js'

export const homeRoutes = new Hono()

homeRoutes.get('/', (context) => {
  const url = new URL(context.req.url)
  const origin = `${url.protocol}//${url.host}`

  return context.html(renderGalleryPage(origin))
})

homeRoutes.get('/meta', (context) =>
  context.json({
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
        path: '/api/profile?username=<name>&theme=<theme>&effect=<effect>',
        status: 'available',
      },
      skills: {
        method: 'GET',
        path: '/api/skills?skills=<skill,skill>&theme=<theme>&labels=true',
        status: 'available',
      },
    },
    themes: THEME_NAMES,
    effects: EFFECT_NAMES,
    skills: SKILL_IDS,
  }),
)

homeRoutes.get('/health', (context) =>
  context.json({
    status: 'ok',
    service: 'github-deco',
  }),
)
