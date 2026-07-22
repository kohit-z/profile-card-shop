export const THEME_NAMES = ['default', 'dark', 'ocean', 'sunset'] as const

export type ThemeName = (typeof THEME_NAMES)[number]

export interface Theme {
  readonly name: ThemeName
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
      radius: 12,
      borderWidth: 1,
      shadow: '0 4px 12px rgba(31,35,40,0.08)',
    },
  },
  dark: {
    name: 'dark',
    colors: {
      background: '#0d1117',
      foreground: '#e6edf3',
      muted: '#8b949e',
      accent: '#58a6ff',
      border: '#30363d',
      error: '#ff7b72',
    },
    gradient: {
      from: '#161b22',
      to: '#0d1117',
      angle: 135,
    },
    typography: {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      bodySize: 14,
      titleSize: 20,
    },
    card: {
      radius: 12,
      borderWidth: 1,
      shadow: '0 4px 16px rgba(0,0,0,0.3)',
    },
  },
  ocean: {
    name: 'ocean',
    colors: {
      background: '#071e2b',
      foreground: '#e1f5fe',
      muted: '#90caf9',
      accent: '#29b6f6',
      border: '#1565c0',
      error: '#ff8a80',
    },
    gradient: {
      from: '#0d47a1',
      to: '#006064',
      angle: 135,
    },
    typography: {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      bodySize: 14,
      titleSize: 20,
    },
    card: {
      radius: 12,
      borderWidth: 1,
      shadow: '0 5px 18px rgba(0,96,100,0.3)',
    },
  },
  sunset: {
    name: 'sunset',
    colors: {
      background: '#2d1b35',
      foreground: '#fff3e0',
      muted: '#ffccbc',
      accent: '#ff8a65',
      border: '#ab47bc',
      error: '#ffab91',
    },
    gradient: {
      from: '#6a1b9a',
      to: '#e65100',
      angle: 135,
    },
    typography: {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      bodySize: 14,
      titleSize: 20,
    },
    card: {
      radius: 12,
      borderWidth: 1,
      shadow: '0 5px 18px rgba(74,20,140,0.3)',
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
