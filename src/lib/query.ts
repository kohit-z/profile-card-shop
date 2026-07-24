import {
  parseOutlineStyle,
  type OutlineStyle,
} from '../data/outline-style.js'
import {
  DEFAULT_SKILL_ICON_THEME,
  parseSkillIconTheme,
  type SkillIconTheme,
} from '../data/skill-style.js'
import {
  EFFECT_CATALOG,
  effectSupportsTarget,
  resolveEffectName,
  type AvatarEffectName,
  type BackgroundEffectName,
  type CardEffectName,
  type EffectName,
  type SectionEffectName,
} from '../effects/index.js'
import { resolveThemeName, type ThemeName } from '../themes/index.js'

export const MAX_USERNAME_LENGTH = 39
export const MAX_SKILLS = 48
export const MAX_SKILL_LENGTH = 32
export const MAX_SKILLS_QUERY_LENGTH = 2048
export const MAX_CARD_SECTIONS_QUERY_LENGTH = 128
export const MAX_CARD_EFFECTS_QUERY_LENGTH = 512
export const MAX_LINK_ENTRIES = 6
export const MAX_LINK_QUERY_LENGTH = 512
export const MAX_LINK_VALUE_LENGTH = 80
export const MAX_GIPHY_QUERY_LENGTH = 80
export const CARD_SECTION_NAMES = [
  'profile',
  'stats',
  'skills',
  'projects',
  'contributions',
  'contact',
  'donate',
  'giphy',
] as const

export type CardSectionName = (typeof CARD_SECTION_NAMES)[number]

const USERNAME_PATTERN = /^(?!-)(?!.*--)[a-z0-9-]+(?<!-)$/
const SKILL_PATTERN = /^[a-z0-9][a-z0-9+#.-]*$/
const LINK_PLATFORM_PATTERN = /^[a-z0-9][a-z0-9-]*$/
const LINK_VALUE_PATTERN = /^[a-z0-9][a-z0-9@._+-]*$/
const GIPHY_QUERY_PATTERN = /^[a-z0-9][a-z0-9 _+-]*$/i

export interface QueryError {
  readonly code: string
  readonly message: string
}

export type QueryResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: QueryError }

export interface ProfileQuery {
  readonly username: string
  readonly bannerGiphy?: string
  readonly theme: ThemeName
  readonly effect: EffectName
}

export interface SkillsQuery {
  readonly skills: readonly string[]
  readonly theme: ThemeName
  readonly labels: boolean
  readonly iconTheme: SkillIconTheme
  readonly outline: OutlineStyle
}

interface SkillsFields {
  readonly skills: readonly string[]
  readonly labels: boolean
  readonly iconTheme: SkillIconTheme
  readonly outline: OutlineStyle
}

export interface CardQuery {
  readonly sections: readonly CardSectionName[]
  readonly username?: string
  readonly skills: readonly string[]
  readonly contact: readonly string[]
  readonly donate: readonly string[]
  readonly giphy?: string
  readonly bannerGiphy?: string
  readonly theme: ThemeName
  readonly labels: boolean
  readonly iconTheme: SkillIconTheme
  readonly outline: OutlineStyle
  readonly effects: {
    readonly background: BackgroundEffectName
    readonly card: CardEffectName
    readonly avatar: AvatarEffectName
    readonly sections: Readonly<Partial<Record<CardSectionName, SectionEffectName>>>
  }
}

function failure(code: string, message: string): QueryResult<never> {
  return { ok: false, error: { code, message } }
}

function parseUsername(params: URLSearchParams): QueryResult<string> {
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

  return { ok: true, value: username }
}

export function parseProfileQuery(
  params: URLSearchParams,
): QueryResult<ProfileQuery> {
  const username = parseUsername(params)
  if (!username.ok) return username
  const theme = resolveThemeName(params.get('theme'))
  const bannerGiphy = parseBannerGiphyQuery(params)
  if (!bannerGiphy.ok) return bannerGiphy
  if (bannerGiphy.value && theme !== 'nebula') {
    return failure(
      'banner_giphy_theme_required',
      'The bannerGiphy setting is only available with the nebula theme.',
    )
  }

  return {
    ok: true,
    value: {
      username: username.value,
      ...(bannerGiphy.value ? { bannerGiphy: bannerGiphy.value } : {}),
      theme,
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

function parseSkillsFields(
  params: URLSearchParams,
): QueryResult<SkillsFields> {
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

  const iconTheme = parseSkillIconTheme(params.get('iconTheme'))
  if (!iconTheme.ok) {
    return failure(iconTheme.error.code, iconTheme.error.message)
  }

  const outline = parseOutlineStyle(params.get('outline'))
  if (!outline.ok) {
    return failure(outline.error.code, outline.error.message)
  }

  return {
    ok: true,
    value: {
      skills,
      labels: labels.value,
      iconTheme: iconTheme.value,
      outline: outline.value,
    },
  }
}

export function parseSkillsQuery(
  params: URLSearchParams,
): QueryResult<SkillsQuery> {
  const fields = parseSkillsFields(params)
  if (!fields.ok) return fields

  return {
    ok: true,
    value: {
      ...fields.value,
      theme: resolveThemeName(params.get('theme')),
    },
  }
}

function parseLinkEntries(
  params: URLSearchParams,
  field: 'contact' | 'donate',
): QueryResult<readonly string[]> {
  const rawValue = params.get(field) ?? ''
  if (rawValue.length > MAX_LINK_QUERY_LENGTH) {
    return failure(
      `${field}_too_long`,
      `The ${field} query must not exceed ${MAX_LINK_QUERY_LENGTH} characters.`,
    )
  }

  const entries = [
    ...new Set(
      rawValue
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    ),
  ]
  if (entries.length === 0) {
    return failure(`${field}_required`, `At least one ${field} option is required.`)
  }
  if (entries.length > MAX_LINK_ENTRIES) {
    return failure(
      `${field}_limit`,
      `No more than ${MAX_LINK_ENTRIES} ${field} options can be rendered.`,
    )
  }

  for (const entry of entries) {
    const [platform, value, extra] = entry.split(':')
    if (
      !platform ||
      !value ||
      extra !== undefined ||
      !LINK_PLATFORM_PATTERN.test(platform) ||
      value.length > MAX_LINK_VALUE_LENGTH ||
      !LINK_VALUE_PATTERN.test(value)
    ) {
      return failure(
        `${field}_invalid`,
        `${field[0].toUpperCase()}${field.slice(1)} options must use platform:value with a safe value up to ${MAX_LINK_VALUE_LENGTH} characters.`,
      )
    }
  }

  return { ok: true, value: entries }
}

export function normalizeGiphyQuery(rawValue: string): QueryResult<string> {
  const trimmed = rawValue.trim()
  if (!trimmed) {
    return failure(
      'giphy_required',
      'The giphy query parameter is required for the giphy section.',
    )
  }
  if (trimmed.length > MAX_GIPHY_QUERY_LENGTH) {
    return failure(
      'giphy_too_long',
      `The giphy query must not exceed ${MAX_GIPHY_QUERY_LENGTH} characters.`,
    )
  }
  if (!GIPHY_QUERY_PATTERN.test(trimmed)) {
    return failure(
      'giphy_invalid',
      `Giphy queries must be 1-${MAX_GIPHY_QUERY_LENGTH} characters using letters, numbers, spaces, underscores, plus, or hyphens.`,
    )
  }

  return { ok: true, value: trimmed.replace(/\s+/g, ' ') }
}

function parseGiphyQuery(params: URLSearchParams): QueryResult<string> {
  return normalizeGiphyQuery(params.get('giphy') ?? '')
}

function parseBannerGiphyQuery(
  params: URLSearchParams,
): QueryResult<string | undefined> {
  const rawValue = params.get('bannerGiphy')
  if (rawValue === null) {
    return { ok: true, value: undefined }
  }

  const normalized = normalizeGiphyQuery(rawValue)
  if (normalized.ok) {
    return normalized
  }

  const code = normalized.error.code.replace(/^giphy_/, 'banner_giphy_')
  return failure(
    code,
    normalized.error.message.replaceAll('giphy', 'bannerGiphy'),
  )
}

export function parseCardQuery(
  params: URLSearchParams,
): QueryResult<CardQuery> {
  const rawSections = params.get('sections') ?? 'profile,stats'
  if (rawSections.length > MAX_CARD_SECTIONS_QUERY_LENGTH) {
    return failure(
      'sections_too_long',
      `The sections query must not exceed ${MAX_CARD_SECTIONS_QUERY_LENGTH} characters.`,
    )
  }
  const sections = [
    ...new Set(
      rawSections
        .split(',')
        .map((section) => section.trim().toLowerCase())
        .filter(Boolean),
    ),
  ]
  const unknownSection = sections.find(
    (section) => !(CARD_SECTION_NAMES as readonly string[]).includes(section),
  )

  if (sections.length === 0) {
    return failure('sections_required', 'At least one card section is required.')
  }
  if (unknownSection) {
    return failure('section_unknown', `Unknown card section: ${unknownSection}.`)
  }

  const typedSections = sections as CardSectionName[]
  const theme = resolveThemeName(params.get('theme'))
  const needsProfile =
    typedSections.includes('profile') ||
    typedSections.includes('stats') ||
    typedSections.includes('projects') ||
    typedSections.includes('contributions')
  const username = needsProfile ? parseUsername(params) : undefined
  if (username && !username.ok) return username

  let skills: readonly string[] = []
  let labels = true
  let iconTheme: SkillIconTheme = DEFAULT_SKILL_ICON_THEME
  let outline: OutlineStyle
  if (typedSections.includes('skills')) {
    const parsedSkills = parseSkillsFields(params)
    if (!parsedSkills.ok) return parsedSkills
    skills = parsedSkills.value.skills
    labels = parsedSkills.value.labels
    iconTheme = parsedSkills.value.iconTheme
    outline = parsedSkills.value.outline
  } else {
    const parsedOutline = parseOutlineStyle(params.get('outline'))
    if (!parsedOutline.ok) {
      return failure(parsedOutline.error.code, parsedOutline.error.message)
    }
    outline = parsedOutline.value
  }

  let contact: readonly string[] = []
  if (typedSections.includes('contact')) {
    const parsedContact = parseLinkEntries(params, 'contact')
    if (!parsedContact.ok) return parsedContact
    contact = parsedContact.value
  }

  let donate: readonly string[] = []
  if (typedSections.includes('donate')) {
    const parsedDonate = parseLinkEntries(params, 'donate')
    if (!parsedDonate.ok) return parsedDonate
    donate = parsedDonate.value
  }

  let giphy: string | undefined
  if (typedSections.includes('giphy')) {
    const parsedGiphy = parseGiphyQuery(params)
    if (!parsedGiphy.ok) return parsedGiphy
    giphy = parsedGiphy.value
  }

  const parsedBannerGiphy = parseBannerGiphyQuery(params)
  if (!parsedBannerGiphy.ok) return parsedBannerGiphy
  const bannerGiphy = parsedBannerGiphy.value
  if (bannerGiphy && theme !== 'nebula') {
    return failure(
      'banner_giphy_theme_required',
      'The bannerGiphy setting is only available with the nebula theme.',
    )
  }
  if (bannerGiphy && !typedSections.includes('profile')) {
    return failure(
      'banner_giphy_profile_required',
      'The bannerGiphy setting requires the profile section.',
    )
  }

  let background: BackgroundEffectName = 'none'
  let card: CardEffectName = 'none'
  let avatar: AvatarEffectName = 'none'
  const sectionEffects: Partial<Record<CardSectionName, SectionEffectName>> = {}
  const rawEffects = params.get('effects')?.trim() ?? ''
  if (rawEffects.length > MAX_CARD_EFFECTS_QUERY_LENGTH) {
    return failure(
      'effects_too_long',
      `The effects query must not exceed ${MAX_CARD_EFFECTS_QUERY_LENGTH} characters.`,
    )
  }

  for (const assignment of rawEffects.split(',').filter(Boolean)) {
    const [rawScope, rawName, extra] = assignment.split(':')
    const scope = rawScope?.trim().toLowerCase()
    const name = rawName?.trim().toLowerCase()
    const metadata =
      name && Object.hasOwn(EFFECT_CATALOG, name)
        ? EFFECT_CATALOG[name as EffectName]
        : undefined

    if (!scope || !name || extra !== undefined || !metadata) {
      return failure(
        'effect_invalid',
        'Effects must use a supported scope:name pair.',
      )
    }

    if (
      scope === 'background' &&
      effectSupportsTarget(name as EffectName, 'background')
    ) {
      background = name as BackgroundEffectName
      continue
    }
    if (scope === 'card' && effectSupportsTarget(name as EffectName, 'card')) {
      card = name as CardEffectName
      continue
    }
    if (
      scope === 'avatar' &&
      effectSupportsTarget(name as EffectName, 'avatar')
    ) {
      if (name !== 'none' && !typedSections.includes('profile')) {
        return failure(
          'effect_invalid',
          `Effect "${name}" requires the "profile" section for target "avatar".`,
        )
      }
      avatar = name as AvatarEffectName
      continue
    }
    if (
      (CARD_SECTION_NAMES as readonly string[]).includes(scope) &&
      effectSupportsTarget(name as EffectName, 'section')
    ) {
      if (
        name !== 'none' &&
        !typedSections.includes(scope as CardSectionName)
      ) {
        return failure(
          'effect_invalid',
          `Effect "${name}" cannot target absent section "${scope}".`,
        )
      }
      sectionEffects[scope as CardSectionName] = name as SectionEffectName
      continue
    }

    return failure(
      'effect_invalid',
      `Effect "${name}" cannot target "${scope}".`,
    )
  }

  return {
    ok: true,
    value: {
      sections: typedSections,
      username: username?.value,
      skills,
      contact,
      donate,
      giphy,
      ...(bannerGiphy ? { bannerGiphy } : {}),
      theme,
      labels,
      iconTheme,
      outline,
      effects: { background, card, avatar, sections: sectionEffects },
    },
  }
}
