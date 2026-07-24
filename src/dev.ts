import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { serve } from '@hono/node-server'

import app from './index.js'

// Local `.env` is not loaded automatically by Node/tsx — pull it in for `npm run dev`.
const envPath = resolve(process.cwd(), '.env')
if (existsSync(envPath)) {
  process.loadEnvFile(envPath)
}

const configuredPort = Number(process.env.PORT)
const port =
  Number.isInteger(configuredPort) &&
  configuredPort >= 1 &&
  configuredPort <= 65_535
    ? configuredPort
    : 3000

serve(
  {
    fetch: app.fetch,
    hostname: '127.0.0.1',
    port,
  },
  ({ address, port: listeningPort }) => {
    console.log(`GitHub Deco listening on http://${address}:${listeningPort}`)
  },
)
