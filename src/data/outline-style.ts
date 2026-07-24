export const OUTLINE_STYLE_NAMES = [
  'rounded',
  'square',
  'soft',
  'none',
] as const

export type OutlineStyle = (typeof OUTLINE_STYLE_NAMES)[number]

export const DEFAULT_OUTLINE_STYLE: OutlineStyle = 'rounded'

export function resolveOutlineStyle(
  value: string | null | undefined,
): OutlineStyle {
  if (!value) return DEFAULT_OUTLINE_STYLE
  const normalized = value.trim().toLowerCase()
  return (OUTLINE_STYLE_NAMES as readonly string[]).includes(normalized)
    ? (normalized as OutlineStyle)
    : DEFAULT_OUTLINE_STYLE
}

export function parseOutlineStyle(
  value: string | null | undefined,
):
  | { readonly ok: true; readonly value: OutlineStyle }
  | {
      readonly ok: false
      readonly error: { readonly code: string; readonly message: string }
    } {
  if (value === null || value === undefined || value.trim() === '') {
    return { ok: true, value: DEFAULT_OUTLINE_STYLE }
  }

  const normalized = value.trim().toLowerCase()
  if ((OUTLINE_STYLE_NAMES as readonly string[]).includes(normalized)) {
    return { ok: true, value: normalized as OutlineStyle }
  }

  return {
    ok: false,
    error: {
      code: 'outline_invalid',
      message: `Outline must be one of: ${OUTLINE_STYLE_NAMES.join(', ')}.`,
    },
  }
}

/** Corner radius for rectangular item tiles. */
export function itemOutlineRadius(
  style: OutlineStyle,
  height: number,
  fallback = 10,
): number {
  switch (style) {
    case 'square':
      return 2
    case 'soft':
      return Math.min(20, Math.max(fallback, height * 0.28))
    case 'none':
    case 'rounded':
    default:
      return fallback
  }
}

/** Corner radius for square icon badges inside items. */
export function iconOutlineRadius(
  style: OutlineStyle,
  size: number,
  fallback = 9,
): number {
  switch (style) {
    case 'square':
      return 2
    case 'soft':
      return Math.min(size / 2, Math.max(fallback, size * 0.36))
    case 'none':
      return 0
    case 'rounded':
    default:
      return fallback
  }
}

export function itemOutlineStroke(
  style: OutlineStyle,
  borderColor: string,
): { readonly stroke: string; readonly strokeOpacity: number } {
  if (style === 'none') {
    return { stroke: 'none', strokeOpacity: 0 }
  }
  return { stroke: borderColor, strokeOpacity: 1 }
}

export function renderItemOutlineRect(options: {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly fill: string
  readonly fillOpacity?: number
  readonly borderColor: string
  readonly outline: OutlineStyle
  readonly radiusFallback?: number
}): string {
  const radius = itemOutlineRadius(
    options.outline,
    options.height,
    options.radiusFallback ?? 10,
  )
  const { stroke, strokeOpacity } = itemOutlineStroke(
    options.outline,
    options.borderColor,
  )
  const fillOpacity = options.fillOpacity ?? 0.75
  const strokeAttr =
    stroke === 'none'
      ? 'stroke="none"'
      : `stroke="${stroke}" stroke-opacity="${strokeOpacity}"`
  return `<rect x="${options.x}" y="${options.y}" width="${options.width}" height="${options.height}" rx="${radius}" fill="${options.fill}" fill-opacity="${fillOpacity}" ${strokeAttr} />`
}
