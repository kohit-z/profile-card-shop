import { Hono } from 'hono'

import { cardRoutes } from './routes/card.js'
import { homeRoutes } from './routes/home.js'
import { profileRoutes } from './routes/profile.js'
import { skillsRoutes } from './routes/skills.js'

const app = new Hono()

app.route('/', homeRoutes)
app.route('/api', cardRoutes)
app.route('/api', profileRoutes)
app.route('/api', skillsRoutes)

export default app
