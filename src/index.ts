import { Hono } from 'hono'

import { homeRoutes } from './routes/home'
import { profileRoutes } from './routes/profile'
import { skillsRoutes } from './routes/skills'

const app = new Hono()

app.route('/', homeRoutes)
app.route('/api', profileRoutes)
app.route('/api', skillsRoutes)

export default app
