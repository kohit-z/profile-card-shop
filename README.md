# GitHub Deco

GitHub Deco serves embeddable SVG image responses for GitHub Markdown. Use the profile card to show public GitHub profile statistics and the skills card to show a themed set of technology icons.

The service index and health check return JSON; the `/api/profile` and `/api/skills` endpoints return `image/svg+xml`.

## Prerequisites

- Node.js 20 or newer
- npm
- A GitHub access token for profile cards
- A Vercel account only if you want to deploy the service

## Local setup

Install dependencies and create your local environment file:

```sh
npm install
cp .env.example .env
```

Set `GITHUB_TOKEN` in `.env`:

```dotenv
GITHUB_TOKEN=your_github_token
```

The token is used server-side to query GitHub's GraphQL API for public profile data. Keep it secret: never put it in a card URL, GitHub README, browser code, commit, or log. Use a least-privilege token and revoke or rotate it if it is exposed. The skills endpoint does not require the token.

Start the local development server:

```sh
npm run dev
```

Quality commands:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run build` type-checks the project and bundles the application into `dist/`
as a production-oriented smoke check. Vercel still deploys the source entrypoint
directly through its native Hono support.

## Deploy to Vercel

This project uses Vercel's zero-configuration Hono support: `src/index.ts` exports the Hono application as the default export, so no `vercel.json` is required.

Import the repository into Vercel or run `npx vercel`, then add `GITHUB_TOKEN` in the project's Environment Variables settings for every environment that should render profile cards. Redeploy after adding or changing the variable. These are deployment instructions only; this repository does not imply that a deployment has occurred.

## Use in GitHub Markdown

Replace `YOUR_DEPLOYMENT_URL` with your deployment hostname.

Profile card:

```md
![GitHub profile](https://YOUR_DEPLOYMENT_URL/api/profile?username=octocat&theme=dark)
```

Skills card:

```md
![Skills](https://YOUR_DEPLOYMENT_URL/api/skills?skills=typescript,react,nodejs&theme=ocean&labels=true)
```

Icons without visible labels:

```md
![Skills](https://YOUR_DEPLOYMENT_URL/api/skills?skills=github,docker,kubernetes&theme=sunset&labels=false)
```

## Endpoints

### `GET /`

Returns JSON service metadata, including the available routes, themes, and canonical skill IDs.

### `GET /health`

Returns a JSON health response:

```json
{
  "status": "ok",
  "service": "github-deco"
}
```

### `GET /api/profile`

Returns an SVG profile card.

- `username` is required. It is trimmed, lowercased, and must be 1-39 characters using letters, numbers, and single hyphens. It cannot begin or end with a hyphen or contain consecutive hyphens.
- `theme` is optional and defaults to `default`. An omitted or unsupported value also resolves to `default`.
- The endpoint requires a configured `GITHUB_TOKEN`.
- Requests are redirected to one canonical query form before GitHub is called. Repository star totals are paginated up to 1,000 public owned repositories; larger profiles receive a safe SVG error instead of a partial total.

Example request:

```text
/api/profile?username=octocat&theme=dark
```

### `GET /api/skills`

Returns an SVG skills card.

- `skills` is required and accepts comma-separated identifiers. Values are trimmed and lowercased, empty entries are removed, and duplicates are collapsed.
- The raw `skills` query is limited to 512 characters.
- At most 20 unique submitted identifiers can be rendered.
- Each identifier is limited to 32 characters and may use lowercase letters, numbers, `+`, `#`, `.`, and `-`; it must begin with a letter or number.
- Unknown but syntactically valid identifiers return an SVG error card.
- `theme` is optional and defaults to `default`. An omitted or unsupported value also resolves to `default`.
- `labels` is optional and defaults to `true`. Accepted values are `true`, `false`, `1`, and `0`; an empty value also uses `true`.

Example request:

```text
/api/skills?skills=typescript,react,nodejs&theme=ocean&labels=true
```

## Themes

Supported themes are `default`, `dark`, `ocean`, and `sunset`.

## Skill identifiers

Supported canonical IDs:

- Languages: `javascript`, `typescript`, `python`, `go`, `rust`
- Frameworks: `react`, `nextjs`, `vue`, `nodejs`, `hono`
- Tools: `git`, `docker`, `npm`, `pnpm`, `postgres`
- Platforms: `github`, `kubernetes`, `vercel`, `cloudflare`, `linux`

Supported aliases:

- `node` → `nodejs`
- `node.js` → `nodejs`

Aliases and canonical IDs that resolve to the same skill are rendered once.

## Caching and errors

Successful SVG cards include:

```text
Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
Content-Type: image/svg+xml; charset=UTF-8
X-Content-Type-Options: nosniff
```

This allows a shared cache to serve a successful card for one hour and continue serving it stale for up to one day while revalidating.

Validation, configuration, and upstream failures are rendered as readable SVG error cards with HTTP status `200`. Returning an image with status `200` lets GitHub Markdown display the error instead of a broken image. Error responses use `Cache-Control: no-store` and include an `X-GitHub-Deco-Error` header containing a machine-readable code such as `username_required`, `skill_unknown`, or `missing_token`.

The profile endpoint spends your deployment's shared GitHub API quota. Before
publishing a high-traffic instance, configure request-rate rules in Vercel
Firewall for `/api/profile`; canonical redirects and CDN caching reduce duplicate
work but are not a substitute for deployment-level abuse protection.

Unknown routes are normal HTTP `404` responses rather than SVG cards.

## Project structure

```text
src/index.ts          Hono application and route mounting
src/routes/           Service, health, profile, and skills handlers
src/services/         GitHub API integration
src/widgets/          Profile and skills SVG renderers
src/themes/           Theme definitions and fallback behavior
src/data/             Skill catalog and aliases
src/lib/              Query validation and safe SVG helpers
test/                 Unit, route, service, and app smoke tests
```

## Security

- Secrets stay in environment variables; `.env` files are ignored by Git.
- User-controlled text is validated, bounded, and XML-escaped before entering SVG.
- Profile avatars are accepted only from GitHub's trusted HTTPS avatar host, restricted to supported image media types, limited to 2 MB, and embedded as data URLs.
- Skill icons are bundled locally rather than loaded from third-party URLs.
- Error cards expose stable error codes and safe messages without leaking tokens or raw upstream details.
