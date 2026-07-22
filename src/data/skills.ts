import {
  siCloudflare,
  siDocker,
  siGit,
  siGithub,
  siGo,
  siHono,
  siJavascript,
  siKubernetes,
  siLinux,
  siNextdotjs,
  siNodedotjs,
  siNpm,
  siPnpm,
  siPostgresql,
  siPython,
  siReact,
  siRust,
  siTypescript,
  siVercel,
  siVuedotjs,
  type SimpleIcon,
} from 'simple-icons'

export type SkillCategory =
  | 'language'
  | 'framework'
  | 'tool'
  | 'platform'

export interface SkillDefinition {
  readonly id: string
  readonly label: string
  readonly category: SkillCategory
  readonly icon: SimpleIcon
}

export const SKILL_CATALOG = {
  javascript: {
    id: 'javascript',
    label: 'JavaScript',
    category: 'language',
    icon: siJavascript,
  },
  typescript: {
    id: 'typescript',
    label: 'TypeScript',
    category: 'language',
    icon: siTypescript,
  },
  python: {
    id: 'python',
    label: 'Python',
    category: 'language',
    icon: siPython,
  },
  go: { id: 'go', label: 'Go', category: 'language', icon: siGo },
  rust: {
    id: 'rust',
    label: 'Rust',
    category: 'language',
    icon: siRust,
  },
  react: {
    id: 'react',
    label: 'React',
    category: 'framework',
    icon: siReact,
  },
  nextjs: {
    id: 'nextjs',
    label: 'Next.js',
    category: 'framework',
    icon: siNextdotjs,
  },
  vue: {
    id: 'vue',
    label: 'Vue.js',
    category: 'framework',
    icon: siVuedotjs,
  },
  nodejs: {
    id: 'nodejs',
    label: 'Node.js',
    category: 'framework',
    icon: siNodedotjs,
  },
  hono: {
    id: 'hono',
    label: 'Hono',
    category: 'framework',
    icon: siHono,
  },
  git: { id: 'git', label: 'Git', category: 'tool', icon: siGit },
  github: {
    id: 'github',
    label: 'GitHub',
    category: 'platform',
    icon: siGithub,
  },
  docker: {
    id: 'docker',
    label: 'Docker',
    category: 'tool',
    icon: siDocker,
  },
  kubernetes: {
    id: 'kubernetes',
    label: 'Kubernetes',
    category: 'platform',
    icon: siKubernetes,
  },
  npm: { id: 'npm', label: 'npm', category: 'tool', icon: siNpm },
  pnpm: { id: 'pnpm', label: 'pnpm', category: 'tool', icon: siPnpm },
  vercel: {
    id: 'vercel',
    label: 'Vercel',
    category: 'platform',
    icon: siVercel,
  },
  cloudflare: {
    id: 'cloudflare',
    label: 'Cloudflare',
    category: 'platform',
    icon: siCloudflare,
  },
  postgres: {
    id: 'postgres',
    label: 'PostgreSQL',
    category: 'tool',
    icon: siPostgresql,
  },
  linux: {
    id: 'linux',
    label: 'Linux',
    category: 'platform',
    icon: siLinux,
  },
} as const satisfies Record<string, SkillDefinition>

export type SkillId = keyof typeof SKILL_CATALOG

export const SKILL_IDS = Object.freeze(
  Object.keys(SKILL_CATALOG) as SkillId[],
)

const SKILL_ALIASES: Readonly<Record<string, SkillId>> = {
  node: 'nodejs',
  'node.js': 'nodejs',
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

    skills.push(SKILL_CATALOG[id as SkillId])
  }

  return { skills, unknown: null }
}
