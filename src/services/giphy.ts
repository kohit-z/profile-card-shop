import { imageDataUrl } from '../lib/svg.js'

const GIPHY_API_BASE = 'https://api.giphy.com/v1/gifs'
const DEFAULT_TIMEOUT_MS = 15_000
const MAX_TIMEOUT_MS = 30_000
export const MAX_GIPHY_BYTES = 1_500_000

const GIPHY_MEDIA_HOST_PATTERN = /^(?:media\d*\.giphy\.com|i\.giphy\.com)$/i
const GIF_MEDIA_TYPES = new Set(['image/gif', 'image/webp'])
const GIF_ID_PATTERN = /^[a-zA-Z0-9]+$/

export type GiphyServiceErrorCode =
  | 'missing_api_key'
  | 'gif_not_found'
  | 'malformed_response'
  | 'rate_limited'
  | 'upstream_error'
  | 'timeout'
  | 'gif_untrusted_host'
  | 'gif_unsupported_type'
  | 'gif_too_large'

const ERROR_MESSAGES: Readonly<Record<GiphyServiceErrorCode, string>> = {
  missing_api_key: 'Giphy access is not configured.',
  gif_not_found: 'No Giphy GIF matched that search or id.',
  malformed_response: 'Giphy returned an unexpected response.',
  rate_limited: 'Giphy rate limiting is temporarily preventing this request.',
  upstream_error: 'Giphy is temporarily unavailable.',
  timeout: 'Giphy took too long to respond.',
  gif_untrusted_host: 'The Giphy media location was not trusted.',
  gif_unsupported_type: 'The Giphy media format was not supported.',
  gif_too_large: 'The Giphy GIF was too large.',
}

export class GiphyServiceError extends Error {
  readonly code: GiphyServiceErrorCode

  constructor(code: GiphyServiceErrorCode) {
    super(ERROR_MESSAGES[code])
    this.name = 'GiphyServiceError'
    this.code = code
  }
}

export interface GiphyGif {
  readonly id: string
  readonly title: string
  readonly width: number
  readonly height: number
  readonly dataUrl: string
}

export interface GiphySearchHit {
  readonly id: string
  readonly title: string
  readonly previewUrl: string
  readonly width: number
  readonly height: number
}

export interface FetchGiphyGifOptions {
  readonly apiKey?: string
  readonly timeoutMs?: number
}

export interface SearchGiphyGifsOptions extends FetchGiphyGifOptions {
  readonly limit?: number
}

export const DEFAULT_GIPHY_SEARCH_LIMIT = 8
export const MAX_GIPHY_SEARCH_LIMIT = 16

interface ParsedGifMeta {
  readonly id: string
  readonly title: string
  readonly width: number
  readonly height: number
  readonly url: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  if (typeof value !== 'string') {
    throw new GiphyServiceError('malformed_response')
  }
  return value
}

function readPositiveInt(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value)
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed)
    }
  }
  return undefined
}

function normalizeTimeout(timeoutMs: number | undefined): number {
  if (!Number.isFinite(timeoutMs)) {
    return DEFAULT_TIMEOUT_MS
  }
  return Math.min(
    MAX_TIMEOUT_MS,
    Math.max(1, Math.floor(timeoutMs as number)),
  )
}

async function fetchFromGiphy(
  input: string,
  init: RequestInit,
  signal: AbortSignal,
): Promise<Response> {
  try {
    return await fetch(input, { ...init, signal })
  } catch (error) {
    if (
      signal.aborted ||
      (error instanceof DOMException && error.name === 'AbortError')
    ) {
      throw new GiphyServiceError('timeout')
    }
    throw new GiphyServiceError('upstream_error')
  }
}

function classifyHttpFailure(response: Response): never {
  if (response.status === 404) {
    throw new GiphyServiceError('gif_not_found')
  }
  if (response.status === 429 || response.status === 403) {
    throw new GiphyServiceError('rate_limited')
  }
  throw new GiphyServiceError('upstream_error')
}

function pickNamedRendition(
  images: Record<string, unknown>,
  preferred: readonly string[],
): {
  readonly url: string
  readonly width: number
  readonly height: number
} {
  for (const name of preferred) {
    const rendition = images[name]
    if (!isRecord(rendition)) {
      continue
    }
    const url = rendition.url
    const width = readPositiveInt(rendition.width)
    const height = readPositiveInt(rendition.height)
    if (typeof url === 'string' && url && width && height) {
      return { url, width, height }
    }
  }

  throw new GiphyServiceError('malformed_response')
}

function pickRendition(images: Record<string, unknown>): {
  readonly url: string
  readonly width: number
  readonly height: number
} {
  return pickNamedRendition(images, [
    'fixed_height',
    'fixed_width',
    'downsized',
    'downsized_medium',
    'original',
  ])
}

function pickPreviewRendition(images: Record<string, unknown>): {
  readonly url: string
  readonly width: number
  readonly height: number
} {
  return pickNamedRendition(images, [
    'fixed_height_small',
    'fixed_width_small',
    'preview_gif',
    'fixed_height',
    'fixed_width',
    'downsized',
    'original',
  ])
}

function parseGifObject(value: unknown): ParsedGifMeta {
  if (!isRecord(value)) {
    throw new GiphyServiceError('malformed_response')
  }

  const images = value.images
  if (!isRecord(images)) {
    throw new GiphyServiceError('malformed_response')
  }

  const rendition = pickRendition(images)
  const title = typeof value.title === 'string' ? value.title.trim() : ''

  return {
    id: readString(value, 'id'),
    title: title || 'Giphy GIF',
    width: rendition.width,
    height: rendition.height,
    url: rendition.url,
  }
}

function parseSearchHit(value: unknown): GiphySearchHit {
  if (!isRecord(value)) {
    throw new GiphyServiceError('malformed_response')
  }

  const images = value.images
  if (!isRecord(images)) {
    throw new GiphyServiceError('malformed_response')
  }

  const rendition = pickPreviewRendition(images)
  const previewUrl = validateMediaUrl(rendition.url).toString()
  const title = typeof value.title === 'string' ? value.title.trim() : ''

  return {
    id: readString(value, 'id'),
    title: title || 'Giphy GIF',
    previewUrl,
    width: rendition.width,
    height: rendition.height,
  }
}

function parseSearchPayload(payload: unknown): ParsedGifMeta {
  if (!isRecord(payload)) {
    throw new GiphyServiceError('malformed_response')
  }

  if (!Array.isArray(payload.data)) {
    throw new GiphyServiceError('malformed_response')
  }
  if (payload.data.length === 0) {
    throw new GiphyServiceError('gif_not_found')
  }

  return parseGifObject(payload.data[0])
}

function parseSearchHitsPayload(payload: unknown): readonly GiphySearchHit[] {
  if (!isRecord(payload)) {
    throw new GiphyServiceError('malformed_response')
  }

  if (!Array.isArray(payload.data)) {
    throw new GiphyServiceError('malformed_response')
  }

  return payload.data.map((item) => parseSearchHit(item))
}

function normalizeSearchLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) {
    return DEFAULT_GIPHY_SEARCH_LIMIT
  }
  return Math.min(
    MAX_GIPHY_SEARCH_LIMIT,
    Math.max(1, Math.floor(limit as number)),
  )
}

function parseIdPayload(payload: unknown): ParsedGifMeta {
  if (!isRecord(payload)) {
    throw new GiphyServiceError('malformed_response')
  }

  if (payload.data === null || payload.data === undefined) {
    throw new GiphyServiceError('gif_not_found')
  }

  return parseGifObject(payload.data)
}

function validateMediaUrl(value: string): URL {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new GiphyServiceError('gif_untrusted_host')
  }

  if (
    url.protocol !== 'https:' ||
    url.username !== '' ||
    url.password !== '' ||
    !GIPHY_MEDIA_HOST_PATTERN.test(url.hostname)
  ) {
    throw new GiphyServiceError('gif_untrusted_host')
  }
  return url
}

async function readBoundedGif(response: Response): Promise<Uint8Array> {
  const declaredSize = Number(response.headers.get('content-length'))
  if (Number.isFinite(declaredSize) && declaredSize > MAX_GIPHY_BYTES) {
    throw new GiphyServiceError('gif_too_large')
  }

  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer())
    if (bytes.byteLength > MAX_GIPHY_BYTES) {
      throw new GiphyServiceError('gif_too_large')
    }
    return bytes
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      total += value.byteLength
      if (total > MAX_GIPHY_BYTES) {
        await reader.cancel()
        throw new GiphyServiceError('gif_too_large')
      }
      chunks.push(value)
    }
  } catch (error) {
    if (error instanceof GiphyServiceError) {
      throw error
    }
    throw new GiphyServiceError('upstream_error')
  }

  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

async function fetchGifDataUrl(
  mediaUrl: string,
  signal: AbortSignal,
): Promise<string> {
  const url = validateMediaUrl(mediaUrl)
  const response = await fetchFromGiphy(
    url.toString(),
    { redirect: 'error' },
    signal,
  )

  if (!response.ok) {
    classifyHttpFailure(response)
  }
  if (response.url) {
    validateMediaUrl(response.url)
  }

  const contentType =
    response.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() ??
    ''
  if (!GIF_MEDIA_TYPES.has(contentType)) {
    throw new GiphyServiceError('gif_unsupported_type')
  }

  const bytes = await readBoundedGif(response)
  return imageDataUrl(contentType, bytes)
}

function looksLikeGifId(query: string): boolean {
  if (!GIF_ID_PATTERN.test(query) || query.length < 6 || query.length > 64) {
    return false
  }

  // Plain lowercase words are search terms; Giphy ids are mixed-case and/or digit-rich.
  const hasDigit = /\d/.test(query)
  const hasUpper = /[A-Z]/.test(query)
  const hasLower = /[a-z]/.test(query)
  return hasDigit || (hasUpper && hasLower)
}

async function resolveGifMeta(
  query: string,
  apiKey: string,
  signal: AbortSignal,
): Promise<ParsedGifMeta> {
  if (looksLikeGifId(query)) {
    const response = await fetchFromGiphy(
      `${GIPHY_API_BASE}/${encodeURIComponent(query)}?${new URLSearchParams({
        api_key: apiKey,
        rating: 'g',
      }).toString()}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'github-deco',
        },
      },
      signal,
    )

    if (response.ok) {
      let payload: unknown
      try {
        payload = await response.json()
      } catch {
        throw new GiphyServiceError('malformed_response')
      }
      return parseIdPayload(payload)
    }

    // Fall through to search when the id-shaped query is not a real GIF id.
    if (response.status !== 404) {
      classifyHttpFailure(response)
    }
  }

  const response = await fetchFromGiphy(
    `${GIPHY_API_BASE}/search?${new URLSearchParams({
      api_key: apiKey,
      q: query,
      limit: '1',
      rating: 'g',
      lang: 'en',
    }).toString()}`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'github-deco',
      },
    },
    signal,
  )

  if (!response.ok) {
    classifyHttpFailure(response)
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new GiphyServiceError('malformed_response')
  }

  return parseSearchPayload(payload)
}

async function fetchGiphyGifWithinDeadline(
  query: string,
  apiKey: string,
  signal: AbortSignal,
): Promise<GiphyGif> {
  const meta = await resolveGifMeta(query, apiKey, signal)
  return {
    id: meta.id,
    title: meta.title,
    width: meta.width,
    height: meta.height,
    dataUrl: await fetchGifDataUrl(meta.url, signal),
  }
}

async function withGiphyDeadline<T>(
  options: FetchGiphyGifOptions,
  run: (apiKey: string, signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const apiKey = options.apiKey?.trim()
  if (!apiKey) {
    throw new GiphyServiceError('missing_api_key')
  }

  const controller = new AbortController()
  const timeoutMs = normalizeTimeout(options.timeoutMs)
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new GiphyServiceError('timeout'))
      controller.abort()
    }, timeoutMs)
  })

  try {
    return await Promise.race([run(apiKey, controller.signal), timeout])
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchGiphyGif(
  query: string,
  options: FetchGiphyGifOptions = {},
): Promise<GiphyGif> {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) {
    throw new GiphyServiceError('gif_not_found')
  }

  return withGiphyDeadline(options, (apiKey, signal) =>
    fetchGiphyGifWithinDeadline(normalizedQuery, apiKey, signal),
  )
}

async function searchGiphyGifsWithinDeadline(
  query: string,
  apiKey: string,
  limit: number,
  signal: AbortSignal,
): Promise<readonly GiphySearchHit[]> {
  const response = await fetchFromGiphy(
    `${GIPHY_API_BASE}/search?${new URLSearchParams({
      api_key: apiKey,
      q: query,
      limit: String(limit),
      rating: 'g',
      lang: 'en',
    }).toString()}`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'github-deco',
      },
    },
    signal,
  )

  if (!response.ok) {
    classifyHttpFailure(response)
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new GiphyServiceError('malformed_response')
  }

  return parseSearchHitsPayload(payload)
}

export async function searchGiphyGifs(
  query: string,
  options: SearchGiphyGifsOptions = {},
): Promise<readonly GiphySearchHit[]> {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) {
    throw new GiphyServiceError('gif_not_found')
  }

  const limit = normalizeSearchLimit(options.limit)
  return withGiphyDeadline(options, (apiKey, signal) =>
    searchGiphyGifsWithinDeadline(normalizedQuery, apiKey, limit, signal),
  )
}
