import type { ThemeRenderContext } from '../widgets/card.js'
import { renderClassicCard } from './renderers/classic.js'
import { renderNebulaCard } from './renderers/nebula.js'

export const THEME_NAMES = ['default', 'nebula'] as const

export type ThemeName = (typeof THEME_NAMES)[number]

export interface Theme {
  readonly name: ThemeName
  /**
   * Themes own the complete SVG composition. They may use, move, resize, or
   * replace every section while reading its semantic payload.
   */
  readonly renderCard: (context: ThemeRenderContext) => string
  readonly colors: {
    readonly background: string
    readonly foreground: string
    readonly muted: string
    readonly accent: string
    readonly border: string
    readonly error: string
  }
  readonly gradient: {
    readonly from: string
    readonly to: string
    readonly angle: number
  }
  readonly typography: {
    readonly fontFamily: string
    readonly bodySize: number
    readonly titleSize: number
  }
  readonly card: {
    readonly radius: number
    readonly borderWidth: number
    readonly shadow: string
  }
}

export const DEFAULT_THEME_NAME: ThemeName = 'default'

export const THEMES = {
  default: {
    name: 'default',
    renderCard: renderClassicCard,
    colors: {
      background: '#ffffff',
      foreground: '#24292f',
      muted: '#57606a',
      accent: '#0969da',
      border: '#d0d7de',
      error: '#cf222e',
    },
    gradient: {
      from: '#ffffff',
      to: '#f6f8fa',
      angle: 135,
    },
    typography: {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      bodySize: 14,
      titleSize: 20,
    },
    card: {
      radius: 14,
      borderWidth: 1,
      shadow: '0 4px 12px rgba(31,35,40,0.08)',
    },
  },
  nebula: {
    name: 'nebula',
    renderCard: renderNebulaCard,
    colors: {
      background: '#232428',
      foreground: '#f2f3f5',
      muted: '#949ba4',
      accent: '#8776ff',
      border: '#3a3c42',
      error: '#ff8a80',
    },
    gradient: {
      from: '#2b2d31',
      to: '#232428',
      angle: 180,
    },
    typography: {
      fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif",
      bodySize: 14,
      titleSize: 20,
    },
    card: {
      radius: 24,
      borderWidth: 1,
      shadow: '0 30px 80px -20px rgba(0,0,0,0.6)',
    },
  },
} as const satisfies Record<ThemeName, Theme>

const themeNames = new Set<string>(THEME_NAMES)

export function resolveThemeName(value: string | null | undefined): ThemeName {
  const normalized = value?.trim().toLowerCase()

  return normalized && themeNames.has(normalized)
    ? (normalized as ThemeName)
    : DEFAULT_THEME_NAME
}

export function getTheme(value?: string | null): Theme {
  return THEMES[resolveThemeName(value)]
}
