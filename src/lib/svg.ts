import { getTheme, type ThemeName } from '../themes'

export const SVG_CONTENT_TYPE = 'image/svg+xml; charset=UTF-8'
export const SVG_CACHE_CONTROL =
  'public, s-maxage=3600, stale-while-revalidate=86400'
export const SVG_ERROR_HEADER = 'X-GitHub-Deco-Error'

const SUPPORTED_IMAGE_TYPES = new Set([
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
])

const XML_REPLACEMENTS: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

export function escapeXml(value: unknown): string {
  return String(value).replace(
    /[&<>"']/g,
    (character) => XML_REPLACEMENTS[character],
  )
}

export function truncateText(value: string, maxLength: number): string {
  const limit = Math.max(0, Math.floor(maxLength))
  const characters = Array.from(value)

  if (characters.length <= limit) {
    return value
  }

  if (limit === 0) {
    return ''
  }

  return `${characters.slice(0, limit - 1).join('')}…`
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }

  return btoa(binary)
}

export function imageDataUrl(
  contentType: string,
  bytes: Uint8Array,
): string {
  const normalizedType = contentType.trim().toLowerCase()

  if (!SUPPORTED_IMAGE_TYPES.has(normalizedType)) {
    throw new TypeError(`Unsupported image type: ${contentType}`)
  }

  return `data:${normalizedType};base64,${encodeBase64(bytes)}`
}

export interface SvgResponseOptions {
  readonly status?: number
  readonly cacheControl?: string
  readonly headers?: HeadersInit
}

export function svgResponse(
  svg: string,
  options: SvgResponseOptions = {},
): Response {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', SVG_CONTENT_TYPE)
  headers.set('Cache-Control', options.cacheControl ?? SVG_CACHE_CONTROL)
  headers.set('X-Content-Type-Options', 'nosniff')

  return new Response(svg, {
    status: options.status ?? 200,
    headers,
  })
}

export interface ErrorCardOptions {
  readonly title: string
  readonly message: string
  readonly theme?: ThemeName | string
  readonly width?: number
  readonly height?: number
}

export function renderErrorCard({
  title,
  message,
  theme: themeName,
  width = 480,
  height = 120,
}: ErrorCardOptions): string {
  const theme = getTheme(themeName)
  const safeTitle = escapeXml(truncateText(title, 48))
  const safeMessage = escapeXml(truncateText(message, 96))
  const safeWidth = Math.min(1200, Math.max(240, Math.floor(width)))
  const safeHeight = Math.min(600, Math.max(96, Math.floor(height)))
  const gradientId = `error-gradient-${theme.name}`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${safeWidth}" height="${safeHeight}" viewBox="0 0 ${safeWidth} ${safeHeight}" role="img" aria-labelledby="error-title error-description">
  <title id="error-title">${safeTitle}</title>
  <desc id="error-description">${safeMessage}</desc>
  <defs>
    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.gradient.from}" />
      <stop offset="100%" stop-color="${theme.gradient.to}" />
    </linearGradient>
  </defs>
  <rect x="0.5" y="0.5" width="${safeWidth - 1}" height="${safeHeight - 1}" rx="${theme.card.radius}" fill="url(#${gradientId})" stroke="${theme.colors.border}" stroke-width="${theme.card.borderWidth}" />
  <circle cx="38" cy="42" r="14" fill="${theme.colors.error}" opacity="0.16" />
  <text x="38" y="48" text-anchor="middle" font-family="${theme.typography.fontFamily}" font-size="20" font-weight="700" fill="${theme.colors.error}">!</text>
  <text x="64" y="43" font-family="${theme.typography.fontFamily}" font-size="${theme.typography.titleSize}" font-weight="600" fill="${theme.colors.foreground}">${safeTitle}</text>
  <text x="24" y="82" font-family="${theme.typography.fontFamily}" font-size="${theme.typography.bodySize}" fill="${theme.colors.muted}">${safeMessage}</text>
</svg>`
}

export interface SvgErrorResponseOptions extends ErrorCardOptions {
  readonly code: string
  readonly status?: number
}

export function svgErrorResponse({
  code,
  status = 400,
  ...cardOptions
}: SvgErrorResponseOptions): Response {
  const safeCode = /^[a-z0-9_-]{1,64}$/i.test(code)
    ? code.toLowerCase()
    : 'internal_error'

  return svgResponse(renderErrorCard(cardOptions), {
    status,
    cacheControl: 'no-store',
    headers: {
      [SVG_ERROR_HEADER]: safeCode,
    },
  })
}
