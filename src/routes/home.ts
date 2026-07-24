import { Hono } from 'hono'

import {
  CONTACT_PLATFORM_IDS,
  DONATE_PLATFORM_IDS,
} from '../data/links.js'
import { OUTLINE_STYLE_NAMES } from '../data/outline-style.js'
import { SKILL_ICON_THEME_NAMES } from '../data/skill-style.js'
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
        path: '/api/card?sections=<section,section>&username=<name>&skills=<skill,skill>&contact=<platform:value>&donate=<platform:value>&giphy=<search-or-id>&bannerGiphy=<search-or-id>&effects=<scope:name>',
        status: 'available',
      },
      giphySearch: {
        method: 'GET',
        path: '/api/giphy/search?q=<keywords>&limit=<1-16>',
        status: 'available',
      },
      profile: {
        method: 'GET',
        path: '/api/profile?username=<name>&theme=<theme>&effect=<effect>&bannerGiphy=<search-or-id>',
        status: 'available',
      },
      skills: {
        method: 'GET',
        path: '/api/skills?skills=<skill,skill>&theme=<theme>&labels=true&iconTheme=<theme>',
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
    skillIconThemes: SKILL_ICON_THEME_NAMES,
    outlines: OUTLINE_STYLE_NAMES,
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
