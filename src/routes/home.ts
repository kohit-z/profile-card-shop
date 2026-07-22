import { Hono } from 'hono'

import { SKILL_IDS } from '../data/skills'
import { THEME_NAMES } from '../themes'

export const homeRoutes = new Hono()

homeRoutes.get('/', (context) =>
  context.json({
    name: 'GitHub Deco',
    description: 'Embeddable SVG cards for GitHub profiles and skills.',
    routes: {
      health: {
        method: 'GET',
        path: '/health',
        status: 'available',
      },
      profile: {
        method: 'GET',
        path: '/api/profile?username=<name>&theme=<theme>',
        status: 'available',
      },
      skills: {
        method: 'GET',
        path: '/api/skills?skills=<skill,skill>&theme=<theme>&labels=true',
        status: 'available',
      },
    },
    themes: THEME_NAMES,
    skills: SKILL_IDS,
  }),
)

homeRoutes.get('/health', (context) =>
  context.json({
    status: 'ok',
    service: 'github-deco',
  }),
)
