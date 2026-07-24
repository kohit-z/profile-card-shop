export const SKILL_ICON_THEME_NAMES = [
  'accent',
  'brand',
  'mono',
  'soft',
] as const

export type SkillIconTheme = (typeof SKILL_ICON_THEME_NAMES)[number]

export const DEFAULT_SKILL_ICON_THEME: SkillIconTheme = 'accent'

export function resolveSkillIconTheme(
  value: string | null | undefined,
): SkillIconTheme {
  if (!value) return DEFAULT_SKILL_ICON_THEME
  const normalized = value.trim().toLowerCase()
  return (SKILL_ICON_THEME_NAMES as readonly string[]).includes(normalized)
    ? (normalized as SkillIconTheme)
    : DEFAULT_SKILL_ICON_THEME
}

export function parseSkillIconTheme(
  value: string | null | undefined,
):
  | { readonly ok: true; readonly value: SkillIconTheme }
  | { readonly ok: false; readonly error: { readonly code: string; readonly message: string } } {
  if (value === null || value === undefined || value.trim() === '') {
    return { ok: true, value: DEFAULT_SKILL_ICON_THEME }
  }

  const normalized = value.trim().toLowerCase()
  if ((SKILL_ICON_THEME_NAMES as readonly string[]).includes(normalized)) {
    return { ok: true, value: normalized as SkillIconTheme }
  }

  return {
    ok: false,
    error: {
      code: 'icon_theme_invalid',
      message: `Icon theme must be one of: ${SKILL_ICON_THEME_NAMES.join(', ')}.`,
    },
  }
}
