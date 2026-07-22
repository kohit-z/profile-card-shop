import { Hono } from 'hono'

import {
  CONTACT_PLATFORM_IDS,
  DONATE_PLATFORM_IDS,
} from '../data/links.js'
import { SKILL_IDS } from '../data/skills.js'
import {
  AVATAR_EFFECT_NAMES,
  BACKGROUND_EFFECT_NAMES,
  CARD_EFFECT_NAMES,
  EFFECT_NAMES,
  SECTION_EFFECT_NAMES,
} from '../effects/index.js'
import { CARD_SECTION_NAMES } from '../lib/query.js'
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
      card: {
        method: 'GET',
        path: '/api/card?sections=<section,section>&username=<name>&skills=<skill,skill>&contact=<platform:value>&donate=<platform:value>&effects=<scope:name>',
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
    effectGroups: {
      background: BACKGROUND_EFFECT_NAMES,
      card: CARD_EFFECT_NAMES,
      avatar: AVATAR_EFFECT_NAMES,
      section: SECTION_EFFECT_NAMES,
    },
    sections: CARD_SECTION_NAMES,
    skills: SKILL_IDS,
    contactPlatforms: CONTACT_PLATFORM_IDS,
    donatePlatforms: DONATE_PLATFORM_IDS,
  }),
)

homeRoutes.get('/health', (context) =>
  context.json({
    status: 'ok',
    service: 'github-deco',
  }),
)
