# GitHub Deco

Embeddable SVG profile cards for GitHub Markdown. Compose profile, stats, skills, pinned projects, a contribution graph, contact, donation options, and a custom Giphy GIF into one image, then style it with themes and effects.

## Embed a card

Drop this into your README and swap in your username, sections, and options:

```md
![GitHub card](https://YOUR_DEPLOYMENT_URL/api/card?sections=profile,stats,skills&username=octocat&skills=typescript,react,nodejs&theme=nebula&effects=background:aurora,card:shimmer,avatar:orbit,skills:grid)
```

Replace `YOUR_DEPLOYMENT_URL` with the service host. Section order follows the `sections` query, so you can rearrange or omit pieces:

```md
![GitHub card](https://YOUR_DEPLOYMENT_URL/api/card?sections=skills,profile,stats&username=octocat&skills=github,docker,kubernetes)
```

Skills only:

```md
![Skills](https://YOUR_DEPLOYMENT_URL/api/card?sections=skills&skills=typescript,react,nodejs&theme=nebula&labels=true)
```

## Customize with `/api/card`

`GET /api/card` returns one SVG assembled from ordered sections.image.png

| Parameter | Required | Description |
| --- | --- | --- |
| `sections` | No | Comma-separated list. Defaults to `profile,stats`. Built-ins: `profile`, `stats`, `skills`, `projects`, `contributions`, `contact`, `donate`, `giphy`. Duplicates are collapsed; order is preserved. |
| `username` | When `profile`, `stats`, `projects`, or `contributions` is included | GitHub username (1–39 chars, letters, numbers, single hyphens). |
| `skills` | When `skills` is included | Comma-separated skill IDs (see below). |
| `contact` | When `contact` is included | Comma-separated `platform:value` pairs. Platforms: `email`, `github`, `discord`, `telegram`, `whatsapp`, `x`. |
| `donate` | When `donate` is included | Comma-separated `platform:value` pairs. Platforms: `github-sponsors`, `kofi`, `buymeacoffee`, `patreon`, `paypal`, `opencollective`. |
| `giphy` | When `giphy` is included | Search term or Giphy GIF id (letters, numbers, spaces, `_`, `+`, `-`). |
| `bannerGiphy` | No | Giphy search term or GIF id for the Nebula profile banner. Requires `theme=nebula` and the `profile` section. |
| `theme` | No | `default` or `nebula`. Defaults to `default`. |
| `labels` | No | Show skill labels: `true` / `false` (also `1` / `0`). Defaults to `true`. |
| `iconTheme` | No | Skill icon color theme: `accent`, `brand`, `mono`, or `soft`. Defaults to `accent`. |
| `outline` | No | Global item tile outline: `rounded`, `square`, `soft`, or `none`. Defaults to `rounded`. |
| `effects` | No | Comma-separated `scope:name` assignments (see below). |

Example:

```text
/api/card?sections=profile,stats,skills&username=octocat&skills=typescript,react&theme=nebula&effects=card:shimmer,avatar:orbit,skills:grid
```

Animated Nebula banner:

```text
/api/card?sections=profile,stats&username=octocat&bannerGiphy=space+cat&theme=nebula
```

## Effects

Assign effects independently to the background, whole card, avatar, or a section:

```text
effects=background:aurora,card:shimmer,avatar:orbit,skills:grid
```

- `background:<name>` — animated backdrop behind all content
- `card:<name>` — whole-card atmosphere
- `avatar:<name>` — avatar motion (needs a `profile` section)
- `<section-id>:<name>` — effect inside that section (`profile`, `stats`, `skills`, `projects`, `contributions`, `contact`, `donate`, or `giphy`)

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

`default`, `nebula`

Themes are complete card renderers, not color presets. `default` keeps the
classic stacked section layout. `nebula` uses the standalone profile design:
a gradient or Giphy banner, overlapping avatar and identity row, automatic
profile badges, compact stat tiles, section dividers, skill chips, project
cards, a framed contribution graph, and branded contact/support rows.

To add a substantially different theme, implement its `renderCard` function in
`src/themes/renderers/` and register it in `src/themes/index.ts`. Every built-in
section exposes a typed semantic `payload`, so a theme can move, resize,
combine, omit, or completely redraw sections without depending on the default
section geometry. The legacy `section.render` callback remains available as a
fallback for custom sections.

## Automatic profile badges

Cards with a `profile` section automatically receive one experience level
(`New`, `Beginner`, `Junior`, `Senior`, `Staff`, `Principal`, or `Master`) and
earned activity badges. Badges are calculated from public GitHub account age,
contributions, repositories, pull requests, reviews, collaboration, stars, and
activity patterns. They cannot be manually granted, reordered, or edited.

Achievement badges include `Star`, `Hard Worker`, `Volunteer`, `Voter`,
`Collaborator`, `24/7 Developer`, `Open Source`, `Maintainer`, `Mentor`,
`Marathon`, `Polyglot`, `Community Builder`, `GitHub Star`, and `Sponsor`.
Themes render the same awards in their own visual style. Up to five achievement
chips are shown alongside the level; additional awards are summarized by a
`+N` chip. The `24/7 Developer` badge represents consistency inferred from
daily contribution activity, not hour-by-hour tracking.

Levels use a capped score derived from account age, annual contributions,
repositories, authored pull requests, reviews, collaboration, and received
stars. Account-age maximum-rank caps by created date are currently disabled.

Core achievement thresholds are: 500 stars or 1,000 followers for `Star`;
1,000 annual contributions or 240 active days for `Hard Worker`; 75 annual
pull-request/issue contributions across five repositories for `Volunteer`; 50
annual reviews for `Voter`; 15 contributed repositories for `Collaborator`;
and 180 active days across six weekdays with 20 weekend days for `24/7
Developer`. Extra awards recognize official GitHub Star/Sponsor status, 100
authored pull requests or 25 contributed repositories, maintainership,
mentorship, a 30-day streak, four repository languages, and sustained community
issue work.

Badge changes follow the normal SVG cache window. Private activity and
organization data may be absent when GitHub does not expose it to the configured
token.

## Skills

Up to 48 unique identifiers (max 32 chars each). Icons come from the [Skill Icons](https://icon-sets.iconify.design/skill-icons/) set (languages, frameworks, tools, and platforms). See `/meta` for the full live list.

When a skill has light/dark variants, the card theme picks one: `theme=nebula` uses the dark icon, otherwise the light icon. Skills with a single artwork always use that icon.

Icons pack into as many columns as fit the card width (wider when labels are hidden). Style them with:

- `iconTheme=accent|brand|mono|soft` — select the icon color theme
- `outline=rounded|square|soft|none` — style the skill tile outlines

```text
/api/card?sections=skills&skills=typescript,react,golang,docker,kubernetes&iconTheme=brand&outline=soft
```

Aliases include `node` / `node.js` → `nodejs`, `ts` → `typescript`, `go` → `golang`, `k8s` → `kubernetes`, and more. Duplicates that resolve to the same skill render once.

## Pinned projects

The `projects` section renders repositories pinned on the GitHub profile (up to six). Requires `username`. Profiles with no pins still render the section empty.

```text
/api/card?sections=profile,projects&username=octocat&effects=projects:grid
```

## Contribution graph

The `contributions` section renders the last-year GitHub contribution calendar as a heatmap. Requires `username`. Cell intensity follows the card theme accent.

```text
/api/card?sections=profile,contributions&username=octocat&effects=contributions:grid
```

## Contact and donate

Contact and donation sections are informational because links inside an SVG image embedded in GitHub Markdown are not reliably clickable.

```text
/api/card?sections=contact,donate&contact=email:hello@example.com,github:octocat&donate=github-sponsors:octocat,kofi:octocat&effects=background:matrix,contact:grid
```

Each section accepts up to six `platform:value` entries. Values may use letters, numbers, `@`, `.`, `_`, `+`, and `-`.

## Custom Giphy GIF

The `giphy` section embeds a GIF from Giphy by search term or GIF id. Requires a server-side `GIPHY_API_KEY` (see `.env.example`).

In the gallery, type keywords in the Giphy field to load candidate GIFs, then pick one from the dropdown. The embed URL stores the selected GIF id.

```text
/api/card?sections=giphy&giphy=coding&effects=giphy:grid
/api/card?sections=profile,giphy&username=octocat&giphy=YRtLgsajXrz1FNJ6oy
/api/giphy/search?q=coding&limit=8
```

`/api/giphy/search` returns JSON candidates (`id`, `title`, `previewUrl`, `width`, `height`) for the gallery picker.
## Compatibility endpoints

Older single-purpose URLs still work:

- `/api/profile?username=octocat&theme=nebula&effect=orbit` — profile + stats card
- `/api/skills?skills=typescript,react,nodejs&theme=nebula&labels=true&iconTheme=brand` — skills card

Prefer `/api/card` for new embeds so you can mix sections and target effects independently.
