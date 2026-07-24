import skillIcons from '@iconify-json/skill-icons/icons.json' with { type: 'json' }
import type { ThemeName } from '../themes/index.js'

export type SkillCategory =
  | 'language'
  | 'framework'
  | 'tool'
  | 'platform'

export interface SkillIconRef {
  /** Iconify name for dark card themes, when a pair exists. */
  readonly dark: string | null
  /** Iconify name for light card themes, when a pair exists. */
  readonly light: string | null
  /** Iconify name when the skill has a single theme-agnostic icon. */
  readonly single: string | null
}

export interface SkillDefinition {
  readonly id: string
  readonly label: string
  readonly category: SkillCategory
  readonly icon: SkillIconRef
}

const ICON_BODIES = skillIcons.icons as Readonly<
  Record<string, { readonly body: string }>
>

const LABEL_OVERRIDES: Readonly<Record<string, string>> = {
  aftereffects: 'After Effects',
  alpinejs: 'Alpine.js',
  androidstudio: 'Android Studio',
  autocad: 'AutoCAD',
  aws: 'AWS',
  cpp: 'C++',
  cs: 'C#',
  css: 'CSS',
  d3: 'D3',
  discordbots: 'Discord Bots',
  discordjs: 'Discord.js',
  dynamodb: 'DynamoDB',
  expressjs: 'Express.js',
  fastapi: 'FastAPI',
  gcp: 'Google Cloud',
  github: 'GitHub',
  githubactions: 'GitHub Actions',
  gitlab: 'GitLab',
  gmail: 'Gmail',
  golang: 'Go',
  graphql: 'GraphQL',
  gtk: 'GTK',
  html: 'HTML',
  htmx: 'HTMX',
  idea: 'IntelliJ IDEA',
  ipfs: 'IPFS',
  jquery: 'jQuery',
  kafka: 'Apache Kafka',
  latex: 'LaTeX',
  linkedin: 'LinkedIn',
  materialui: 'Material UI',
  mongodb: 'MongoDB',
  mysql: 'MySQL',
  neovim: 'Neovim',
  nestjs: 'NestJS',
  nextjs: 'Next.js',
  nginx: 'Nginx',
  nodejs: 'Node.js',
  npm: 'npm',
  nuxtjs: 'Nuxt.js',
  opencv: 'OpenCV',
  p5js: 'p5.js',
  phpstorm: 'PhpStorm',
  planetscale: 'PlanetScale',
  pnpm: 'pnpm',
  postgresql: 'PostgreSQL',
  powershell: 'PowerShell',
  pycharm: 'PyCharm',
  pytorch: 'PyTorch',
  qt: 'Qt',
  r: 'R',
  rabbitmq: 'RabbitMQ',
  raspberrypi: 'Raspberry Pi',
  reactivex: 'ReactiveX',
  regex: 'RegEx',
  rollupjs: 'Rollup',
  ros: 'ROS',
  scikitlearn: 'scikit-learn',
  solidjs: 'SolidJS',
  sqlite: 'SQLite',
  stackoverflow: 'Stack Overflow',
  styledcomponents: 'Styled Components',
  svg: 'SVG',
  tailwindcss: 'Tailwind CSS',
  tensorflow: 'TensorFlow',
  threejs: 'Three.js',
  typescript: 'TypeScript',
  unrealengine: 'Unreal Engine',
  v: 'V',
  visualstudio: 'Visual Studio',
  vitest: 'Vitest',
  vscode: 'VS Code',
  vscodium: 'VSCodium',
  vuejs: 'Vue.js',
  webassembly: 'WebAssembly',
  webstorm: 'WebStorm',
  windicss: 'Windi CSS',
  wordpress: 'WordPress',
  workers: 'Cloudflare Workers',
  xd: 'Adobe XD',
}

const CATEGORY_OVERRIDES: Readonly<Record<string, SkillCategory>> = {
  bash: 'language',
  c: 'language',
  clojure: 'language',
  coffeescript: 'language',
  cpp: 'language',
  crystal: 'language',
  cs: 'language',
  css: 'language',
  dart: 'language',
  elixir: 'language',
  forth: 'language',
  fortran: 'language',
  golang: 'language',
  haskell: 'language',
  haxe: 'language',
  html: 'language',
  java: 'language',
  javascript: 'language',
  julia: 'language',
  kotlin: 'language',
  lua: 'language',
  nim: 'language',
  ocaml: 'language',
  perl: 'language',
  php: 'language',
  python: 'language',
  r: 'language',
  ruby: 'language',
  rust: 'language',
  scala: 'language',
  solidity: 'language',
  swift: 'language',
  typescript: 'language',
  v: 'language',
  vala: 'language',
  verilog: 'language',
  zig: 'language',
  actix: 'framework',
  adonis: 'framework',
  alpinejs: 'framework',
  angular: 'framework',
  apollo: 'framework',
  astro: 'framework',
  bevy: 'framework',
  bootstrap: 'framework',
  bun: 'framework',
  deno: 'framework',
  django: 'framework',
  electron: 'framework',
  elysia: 'framework',
  ember: 'framework',
  emotion: 'framework',
  expressjs: 'framework',
  fastapi: 'framework',
  flask: 'framework',
  flutter: 'framework',
  gatsby: 'framework',
  godot: 'framework',
  graphql: 'framework',
  haxeflixel: 'framework',
  hibernate: 'framework',
  htmx: 'framework',
  jquery: 'framework',
  ktor: 'framework',
  laravel: 'framework',
  less: 'framework',
  lit: 'framework',
  materialui: 'framework',
  nestjs: 'framework',
  nextjs: 'framework',
  nodejs: 'framework',
  nuxtjs: 'framework',
  p5js: 'framework',
  pinia: 'framework',
  processing: 'framework',
  pug: 'framework',
  qt: 'framework',
  rails: 'framework',
  react: 'framework',
  reactivex: 'framework',
  redux: 'framework',
  remix: 'framework',
  rocket: 'framework',
  rollupjs: 'framework',
  ros: 'framework',
  sass: 'framework',
  sequelize: 'framework',
  solidjs: 'framework',
  spring: 'framework',
  styledcomponents: 'framework',
  svelte: 'framework',
  symfony: 'framework',
  tailwindcss: 'framework',
  tauri: 'framework',
  threejs: 'framework',
  vuejs: 'framework',
  vuetify: 'framework',
  windicss: 'framework',
  yew: 'framework',
  apple: 'platform',
  arch: 'platform',
  aws: 'platform',
  azure: 'platform',
  bitbucket: 'platform',
  bsd: 'platform',
  cloudflare: 'platform',
  debian: 'platform',
  discord: 'platform',
  fediverse: 'platform',
  gcp: 'platform',
  github: 'platform',
  gitlab: 'platform',
  heroku: 'platform',
  instagram: 'platform',
  ipfs: 'platform',
  kali: 'platform',
  linkedin: 'platform',
  linux: 'platform',
  mastodon: 'platform',
  mint: 'platform',
  misskey: 'platform',
  netlify: 'platform',
  notion: 'platform',
  obsidian: 'platform',
  openshift: 'platform',
  openstack: 'platform',
  planetscale: 'platform',
  raspberrypi: 'platform',
  redhat: 'platform',
  replit: 'platform',
  robloxstudio: 'platform',
  spotify: 'platform',
  stackoverflow: 'platform',
  supabase: 'platform',
  twitter: 'platform',
  ubuntu: 'platform',
  vercel: 'platform',
  webflow: 'platform',
  windows: 'platform',
  wordpress: 'platform',
  workers: 'platform',
}

function formatSkillLabel(id: string): string {
  if (LABEL_OVERRIDES[id]) return LABEL_OVERRIDES[id]
  return id
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function buildSkillCatalog(): Record<string, SkillDefinition> {
  const variants = new Map<
    string,
    { dark: string | null; light: string | null; single: string | null }
  >()

  for (const name of Object.keys(ICON_BODIES)) {
    let base = name
    let kind: 'dark' | 'light' | 'single' = 'single'
    if (name.endsWith('-dark')) {
      base = name.slice(0, -5)
      kind = 'dark'
    } else if (name.endsWith('-light')) {
      base = name.slice(0, -6)
      kind = 'light'
    }

    const entry = variants.get(base) ?? {
      dark: null,
      light: null,
      single: null,
    }
    entry[kind] = name
    variants.set(base, entry)
  }

  const catalog: Record<string, SkillDefinition> = {}
  for (const id of [...variants.keys()].sort()) {
    const icon = variants.get(id)!
    catalog[id] = {
      id,
      label: formatSkillLabel(id),
      category: CATEGORY_OVERRIDES[id] ?? 'tool',
      icon,
    }
  }
  return catalog
}

export const SKILL_CATALOG: Readonly<Record<string, SkillDefinition>> =
  buildSkillCatalog()

export type SkillId = keyof typeof SKILL_CATALOG | string

export const SKILL_IDS = Object.freeze(Object.keys(SKILL_CATALOG))

const SKILL_ALIASES: Readonly<Record<string, string>> = {
  'c#': 'cs',
  'c++': 'cpp',
  'node.js': 'nodejs',
  adonisjs: 'adonis',
  alpine: 'alpinejs',
  antd: 'materialui',
  archlinux: 'arch',
  cfworkers: 'workers',
  cloudflareworkers: 'workers',
  cplusplus: 'cpp',
  csharp: 'cs',
  dotnet: 'cs',
  express: 'expressjs',
  'gh-actions': 'githubactions',
  go: 'golang',
  googlecloud: 'gcp',
  html5: 'html',
  intellij: 'idea',
  intellijidea: 'idea',
  js: 'javascript',
  k8s: 'kubernetes',
  mui: 'materialui',
  nest: 'nestjs',
  next: 'nextjs',
  node: 'nodejs',
  nuxt: 'nuxtjs',
  nvim: 'neovim',
  openjdk: 'java',
  pgsql: 'postgresql',
  postgres: 'postgresql',
  rubyonrails: 'rails',
  scss: 'sass',
  sh: 'bash',
  shell: 'bash',
  solid: 'solidjs',
  tailwind: 'tailwindcss',
  tf: 'tensorflow',
  three: 'threejs',
  threedotjs: 'threejs',
  ts: 'typescript',
  vue: 'vuejs',
  wasm: 'webassembly',
}

/** Whether the card theme should prefer dark skill-icon variants. */
export function prefersDarkSkillIcons(themeName: ThemeName): boolean {
  return themeName === 'nebula'
}

/** Resolve the Iconify icon name for a skill under the given card theme. */
export function resolveSkillIconName(
  skill: SkillDefinition,
  themeName: ThemeName,
): string {
  const preferDark = prefersDarkSkillIcons(themeName)
  if (preferDark) {
    return skill.icon.dark ?? skill.icon.single ?? skill.icon.light!
  }
  return skill.icon.light ?? skill.icon.single ?? skill.icon.dark!
}

/** SVG body (inner markup) for a skill under the given card theme. */
export function resolveSkillIconBody(
  skill: SkillDefinition,
  themeName: ThemeName,
): string {
  const name = resolveSkillIconName(skill, themeName)
  const icon = ICON_BODIES[name]
  if (!icon) {
    throw new Error(`Missing skill icon body for "${name}".`)
  }
  return icon.body
}

/** Preview body for the gallery (light variant when available). */
export function resolveSkillIconPreviewBody(skill: SkillDefinition): string {
  const name =
    skill.icon.light ?? skill.icon.single ?? skill.icon.dark
  if (!name) {
    throw new Error(`Missing skill icon preview for "${skill.id}".`)
  }
  return ICON_BODIES[name]!.body
}

export function normalizeSkillId(value: string): string {
  return SKILL_ALIASES[value] ?? value
}

export function resolveSkills(ids: readonly string[]): {
  readonly skills: readonly SkillDefinition[]
  readonly unknown: string | null
} {
  const normalizedIds = [...new Set(ids.map(normalizeSkillId))]
  const skills: SkillDefinition[] = []

  for (const id of normalizedIds) {
    if (!Object.hasOwn(SKILL_CATALOG, id)) {
      return { skills: [], unknown: id }
    }

    skills.push(SKILL_CATALOG[id]!)
  }

  return { skills, unknown: null }
}
