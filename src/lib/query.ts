import {
  resolveEffectName,
  type EffectName,
} from '../effects/index.js'
import { resolveThemeName, type ThemeName } from '../themes/index.js'

export const MAX_USERNAME_LENGTH = 39
export const MAX_SKILLS = 20
export const MAX_SKILL_LENGTH = 32
export const MAX_SKILLS_QUERY_LENGTH = 512

const USERNAME_PATTERN = /^(?!-)(?!.*--)[a-z0-9-]+(?<!-)$/
const SKILL_PATTERN = /^[a-z0-9][a-z0-9+#.-]*$/

export interface QueryError {
  readonly code: string
  readonly message: string
}

export type QueryResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: QueryError }

export interface ProfileQuery {
  readonly username: string
  readonly theme: ThemeName
  readonly effect: EffectName
}

export interface SkillsQuery {
  readonly skills: readonly string[]
  readonly theme: ThemeName
  readonly labels: boolean
}

function failure(code: string, message: string): QueryResult<never> {
  return { ok: false, error: { code, message } }
}

export function parseProfileQuery(
  params: URLSearchParams,
): QueryResult<ProfileQuery> {
  const username = params.get('username')?.trim().toLowerCase() ?? ''

  if (!username) {
    return failure('username_required', 'The username query parameter is required.')
  }

  if (
    username.length > MAX_USERNAME_LENGTH ||
    !USERNAME_PATTERN.test(username)
  ) {
    return failure(
      'username_invalid',
      `Username must be 1-${MAX_USERNAME_LENGTH} characters using letters, numbers, and single hyphens.`,
    )
  }

  return {
    ok: true,
    value: {
      username,
      theme: resolveThemeName(params.get('theme')),
      effect: resolveEffectName(params.get('effect')),
    },
  }
}

function parseLabels(value: string | null): QueryResult<boolean> {
  if (value === null || value.trim() === '') {
    return { ok: true, value: true }
  }

  switch (value.trim().toLowerCase()) {
    case 'true':
    case '1':
      return { ok: true, value: true }
    case 'false':
    case '0':
      return { ok: true, value: false }
    default:
      return failure(
        'labels_invalid',
        'Labels must be true, false, 1, or 0.',
      )
  }
}

export function parseSkillsQuery(
  params: URLSearchParams,
): QueryResult<SkillsQuery> {
  const rawSkills = params.get('skills') ?? ''

  if (rawSkills.length > MAX_SKILLS_QUERY_LENGTH) {
    return failure(
      'skills_too_long',
      `The skills query must not exceed ${MAX_SKILLS_QUERY_LENGTH} characters.`,
    )
  }

  const normalizedSkills = rawSkills
    .split(',')
    .map((skill) => skill.trim().toLowerCase())
    .filter(Boolean)
  const skills = [...new Set(normalizedSkills)]

  if (skills.length === 0) {
    return failure('skills_required', 'At least one skill is required.')
  }

  if (skills.length > MAX_SKILLS) {
    return failure(
      'skills_limit',
      `No more than ${MAX_SKILLS} skills can be rendered.`,
    )
  }

  const invalidSkill = skills.find(
    (skill) =>
      skill.length > MAX_SKILL_LENGTH || !SKILL_PATTERN.test(skill),
  )

  if (invalidSkill) {
    return failure(
      'skill_invalid',
      `Skill identifiers must be 1-${MAX_SKILL_LENGTH} safe characters.`,
    )
  }

  const labels = parseLabels(params.get('labels'))

  if (!labels.ok) {
    return labels
  }

  return {
    ok: true,
    value: {
      skills,
      theme: resolveThemeName(params.get('theme')),
      labels: labels.value,
    },
  }
}
