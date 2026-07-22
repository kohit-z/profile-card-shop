# GitHub Deco

Embeddable SVG profile cards for GitHub Markdown. Compose profile, stats, skills, contact, and donation options into one image, then style it with themes and effects.

## Embed a card

Drop this into your README and swap in your username, sections, and options:

```md
![GitHub card](https://YOUR_DEPLOYMENT_URL/api/card?sections=profile,stats,skills&username=octocat&skills=typescript,react,nodejs&theme=dark&effects=background:aurora,card:shimmer,avatar:orbit,skills:grid)
```

Replace `YOUR_DEPLOYMENT_URL` with the service host. Section order follows the `sections` query, so you can rearrange or omit pieces:

```md
![GitHub card](https://YOUR_DEPLOYMENT_URL/api/card?sections=skills,profile,stats&username=octocat&skills=github,docker,kubernetes)
```

Skills only:

```md
![Skills](https://YOUR_DEPLOYMENT_URL/api/card?sections=skills&skills=typescript,react,nodejs&theme=ocean&labels=true)
```

## Customize with `/api/card`

`GET /api/card` returns one SVG assembled from ordered sections.

| Parameter | Required | Description |
| --- | --- | --- |
| `sections` | No | Comma-separated list. Defaults to `profile,stats`. Built-ins: `profile`, `stats`, `skills`, `contact`, `donate`. Duplicates are collapsed; order is preserved. |
| `username` | When `profile` or `stats` is included | GitHub username (1–39 chars, letters, numbers, single hyphens). |
| `skills` | When `skills` is included | Comma-separated skill IDs (see below). |
| `contact` | When `contact` is included | Comma-separated `platform:value` pairs. Platforms: `email`, `github`, `discord`, `x`. |
| `donate` | When `donate` is included | Comma-separated `platform:value` pairs. Platforms: `github-sponsors`, `kofi`, `buymeacoffee`, `patreon`, `paypal`, `opencollective`. |
| `theme` | No | `default`, `dark`, `ocean`, or `sunset`. Defaults to `default`. |
| `labels` | No | Show skill labels: `true` / `false` (also `1` / `0`). Defaults to `true`. |
| `effects` | No | Comma-separated `scope:name` assignments (see below). |

Example:

```text
/api/card?sections=profile,stats,skills&username=octocat&skills=typescript,react&theme=dark&effects=card:shimmer,avatar:orbit,skills:grid
```

## Effects

Assign effects independently to the background, whole card, avatar, or a section:

```text
effects=background:aurora,card:shimmer,avatar:orbit,skills:grid
```

- `background:<name>` — animated backdrop behind all content
- `card:<name>` — whole-card atmosphere
- `avatar:<name>` — avatar motion (needs a `profile` section)
- `<section-id>:<name>` — effect inside that section (`profile`, `stats`, `skills`, `contact`, or `donate`)

Every target also accepts `none`. An effect assigned to the wrong target returns an SVG error card.

**Avatar:** `pulse`, `orbit`, `glow`, `halo`, `equalizer`, `float`, `vortex`

**Background:** `aurora`, `matrix`

**Card:** `shimmer`, `aurora`, `spark`, `wave`, `beam`, `comet`, `rain`, `neon`, `scan`, `confetti`, `matrix`, `glitch`, `ripple`, `spotlight`

**Section:** `radar`, `constellation`, `grid`

| Effect | Character |
| --- | --- |
| `none` | Static, no motion |
| `pulse` | Breathing accent ring around the avatar |
| `orbit` | Accent dots orbiting the avatar |
| `glow` | Warm radial glow behind the avatar |
| `halo` | Counter-rotating dashed rings around the avatar |
| `equalizer` | Bouncing bars beneath the avatar |
| `float` | Avatar hovering over a drifting shadow |
| `vortex` | Elliptical arcs spiraling around the avatar |
| `shimmer` | Diagonal light sweep across the card |
| `aurora` | Shifting multi-stop gradient atmosphere |
| `spark` | Twinkling particles across the card |
| `wave` | Soft undulating ribbon along the base |
| `beam` | Light beams racing around the card border |
| `comet` | Comets streaking across the card |
| `rain` | Accent streaks raining behind the content |
| `neon` | Flickering neon border glow |
| `scan` | Retro scanline sweeping down the card |
| `confetti` | Confetti tumbling down the card |
| `matrix` | Digital glyph columns streaming behind the content |
| `glitch` | Chromatic slices snapping sideways |
| `ripple` | Expanding energy rings across the card |
| `spotlight` | Broad light cones sweeping the card |
| `radar` | Rotating scanner sweep inside a section |
| `constellation` | Connected stars inside a section |
| `grid` | Perspective energy grid inside a section |

## Themes

`default`, `dark`, `ocean`, `sunset`

## Skills

Up to 20 unique identifiers (max 32 chars each). Canonical IDs:

- Languages: `javascript`, `typescript`, `python`, `go`, `rust`
- Frameworks: `react`, `nextjs`, `vue`, `nodejs`, `hono`
- Tools: `git`, `docker`, `npm`, `pnpm`, `postgres`
- Platforms: `github`, `kubernetes`, `vercel`, `cloudflare`, `linux`

Aliases: `node` and `node.js` → `nodejs`. Duplicates that resolve to the same skill render once.

## Contact and donate

Contact and donation sections are informational because links inside an SVG image embedded in GitHub Markdown are not reliably clickable.

```text
/api/card?sections=contact,donate&contact=email:hello@example.com,github:octocat&donate=github-sponsors:octocat,kofi:octocat&effects=background:matrix,contact:grid
```

Each section accepts up to six `platform:value` entries. Values may use letters, numbers, `@`, `.`, `_`, `+`, and `-`.

## Compatibility endpoints

Older single-purpose URLs still work:

- `/api/profile?username=octocat&theme=dark&effect=orbit` — profile + stats card
- `/api/skills?skills=typescript,react,nodejs&theme=ocean&labels=true` — skills card

Prefer `/api/card` for new embeds so you can mix sections and target effects independently.
