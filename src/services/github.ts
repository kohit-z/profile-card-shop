import { imageDataUrl } from '../lib/svg'

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql'
const DEFAULT_TIMEOUT_MS = 5_000
const MAX_TIMEOUT_MS = 30_000
export const MAX_AVATAR_BYTES = 2_000_000
export const MAX_REPOSITORY_PAGES = 10

const GITHUB_AVATAR_HOSTS = new Set(['avatars.githubusercontent.com'])
const AVATAR_MEDIA_TYPES = new Set([
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
])

const PROFILE_QUERY = `
  query GitHubDecoProfile($login: String!, $after: String) {
    user(login: $login) {
      login
      name
      bio
      avatarUrl
      followers {
        totalCount
      }
      repositories(
        first: 100
        after: $after
        ownerAffiliations: OWNER
        privacy: PUBLIC
      ) {
        totalCount
        nodes {
          stargazerCount
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
      contributionsCollection {
        contributionCalendar {
          totalContributions
        }
      }
    }
  }
`

export type GitHubServiceErrorCode =
  | 'missing_token'
  | 'user_not_found'
  | 'graphql_error'
  | 'malformed_response'
  | 'rate_limited'
  | 'upstream_error'
  | 'timeout'
  | 'repository_page_limit'
  | 'avatar_untrusted_host'
  | 'avatar_unsupported_type'
  | 'avatar_too_large'

const ERROR_MESSAGES: Readonly<Record<GitHubServiceErrorCode, string>> = {
  missing_token: 'GitHub access is not configured.',
  user_not_found: 'The requested GitHub user was not found.',
  graphql_error: 'GitHub could not provide this profile.',
  malformed_response: 'GitHub returned an unexpected response.',
  rate_limited: 'GitHub rate limiting is temporarily preventing this request.',
  upstream_error: 'GitHub is temporarily unavailable.',
  timeout: 'GitHub took too long to respond.',
  repository_page_limit:
    'This profile has too many repositories to process safely.',
  avatar_untrusted_host: 'The GitHub avatar location was not trusted.',
  avatar_unsupported_type: 'The GitHub avatar format was not supported.',
  avatar_too_large: 'The GitHub avatar was too large.',
}

export class GitHubServiceError extends Error {
  readonly code: GitHubServiceErrorCode

  constructor(code: GitHubServiceErrorCode) {
    super(ERROR_MESSAGES[code])
    this.name = 'GitHubServiceError'
    this.code = code
  }
}

export interface GitHubProfile {
  readonly login: string
  readonly name: string | null
  readonly bio: string | null
  readonly avatarDataUrl: string
  readonly followers: number
  readonly repositories: number
  readonly stars: number
  readonly contributions: number
}

export interface FetchGitHubProfileOptions {
  readonly token?: string
  readonly timeoutMs?: number
}

interface ProfilePage {
  readonly login: string
  readonly name: string | null
  readonly bio: string | null
  readonly avatarUrl: string
  readonly followers: number
  readonly repositories: number
  readonly contributions: number
  readonly stars: number
  readonly hasNextPage: boolean
  readonly endCursor: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readRecord(
  record: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const value = record[key]
  if (!isRecord(value)) {
    throw new GitHubServiceError('malformed_response')
  }
  return value
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  if (typeof value !== 'string') {
    throw new GitHubServiceError('malformed_response')
  }
  return value
}

function readNullableString(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key]
  if (value !== null && typeof value !== 'string') {
    throw new GitHubServiceError('malformed_response')
  }
  return value
}

function readCount(record: Record<string, unknown>, key: string): number {
  const value = record[key]
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new GitHubServiceError('malformed_response')
  }
  return value as number
}

function graphQlErrorCode(value: unknown): unknown {
  if (!isRecord(value)) {
    return undefined
  }

  return isRecord(value.extensions)
    ? (value.extensions.type ?? value.extensions.code ?? value.type)
    : value.type
}

function isNotFoundError(value: unknown): boolean {
  return graphQlErrorCode(value) === 'NOT_FOUND'
}

function isRateLimitError(value: unknown): boolean {
  const code = graphQlErrorCode(value)
  return code === 'RATE_LIMITED' || code === 'RATE_LIMIT'
}

function parseProfilePage(payload: unknown): ProfilePage {
  if (!isRecord(payload)) {
    throw new GitHubServiceError('malformed_response')
  }

  if (payload.errors !== undefined) {
    if (!Array.isArray(payload.errors)) {
      throw new GitHubServiceError('malformed_response')
    }
    if (payload.errors.some(isNotFoundError)) {
      throw new GitHubServiceError('user_not_found')
    }
    if (payload.errors.some(isRateLimitError)) {
      throw new GitHubServiceError('rate_limited')
    }
    if (payload.errors.length > 0) {
      throw new GitHubServiceError('graphql_error')
    }
  }

  const data = readRecord(payload, 'data')
  if (data.user === null) {
    throw new GitHubServiceError('user_not_found')
  }

  const user = readRecord(data, 'user')
  const followers = readRecord(user, 'followers')
  const repositories = readRecord(user, 'repositories')
  const contributionsCollection = readRecord(
    user,
    'contributionsCollection',
  )
  const contributionCalendar = readRecord(
    contributionsCollection,
    'contributionCalendar',
  )
  const pageInfo = readRecord(repositories, 'pageInfo')

  if (!Array.isArray(repositories.nodes)) {
    throw new GitHubServiceError('malformed_response')
  }

  let stars = 0
  for (const node of repositories.nodes) {
    if (!isRecord(node)) {
      throw new GitHubServiceError('malformed_response')
    }
    stars += readCount(node, 'stargazerCount')
    if (!Number.isSafeInteger(stars)) {
      throw new GitHubServiceError('malformed_response')
    }
  }

  if (typeof pageInfo.hasNextPage !== 'boolean') {
    throw new GitHubServiceError('malformed_response')
  }

  const endCursor = readNullableString(pageInfo, 'endCursor')
  if (pageInfo.hasNextPage && endCursor === null) {
    throw new GitHubServiceError('malformed_response')
  }

  return {
    login: readString(user, 'login'),
    name: readNullableString(user, 'name'),
    bio: readNullableString(user, 'bio'),
    avatarUrl: readString(user, 'avatarUrl'),
    followers: readCount(followers, 'totalCount'),
    repositories: readCount(repositories, 'totalCount'),
    contributions: readCount(contributionCalendar, 'totalContributions'),
    stars,
    hasNextPage: pageInfo.hasNextPage,
    endCursor,
  }
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

async function fetchFromGitHub(
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
      throw new GitHubServiceError('timeout')
    }
    throw new GitHubServiceError('upstream_error')
  }
}

function classifyHttpFailure(response: Response): never {
  if (
    response.status === 429 ||
    response.status === 403 ||
    response.headers.get('x-ratelimit-remaining') === '0'
  ) {
    throw new GitHubServiceError('rate_limited')
  }
  throw new GitHubServiceError('upstream_error')
}

async function fetchProfilePage(
  username: string,
  after: string | null,
  token: string,
  signal: AbortSignal,
): Promise<ProfilePage> {
  const response = await fetchFromGitHub(
    GITHUB_GRAPHQL_URL,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'github-deco',
      },
      body: JSON.stringify({
        query: PROFILE_QUERY,
        variables: {
          login: username,
          after,
        },
      }),
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
    throw new GitHubServiceError('malformed_response')
  }

  return parseProfilePage(payload)
}

function validateAvatarUrl(value: string): URL {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new GitHubServiceError('avatar_untrusted_host')
  }

  if (
    url.protocol !== 'https:' ||
    url.username !== '' ||
    url.password !== '' ||
    !GITHUB_AVATAR_HOSTS.has(url.hostname.toLowerCase())
  ) {
    throw new GitHubServiceError('avatar_untrusted_host')
  }
  return url
}

async function readBoundedAvatar(response: Response): Promise<Uint8Array> {
  const declaredSize = Number(response.headers.get('content-length'))
  if (Number.isFinite(declaredSize) && declaredSize > MAX_AVATAR_BYTES) {
    throw new GitHubServiceError('avatar_too_large')
  }

  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer())
    if (bytes.byteLength > MAX_AVATAR_BYTES) {
      throw new GitHubServiceError('avatar_too_large')
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
      if (total > MAX_AVATAR_BYTES) {
        await reader.cancel()
        throw new GitHubServiceError('avatar_too_large')
      }
      chunks.push(value)
    }
  } catch (error) {
    if (error instanceof GitHubServiceError) {
      throw error
    }
    throw new GitHubServiceError('upstream_error')
  }

  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

async function fetchAvatarDataUrl(
  avatarUrl: string,
  signal: AbortSignal,
): Promise<string> {
  const url = validateAvatarUrl(avatarUrl)
  const response = await fetchFromGitHub(
    url.toString(),
    {
      redirect: 'error',
    },
    signal,
  )

  if (!response.ok) {
    classifyHttpFailure(response)
  }
  if (response.url) {
    validateAvatarUrl(response.url)
  }

  const contentType =
    response.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() ??
    ''
  if (!AVATAR_MEDIA_TYPES.has(contentType)) {
    throw new GitHubServiceError('avatar_unsupported_type')
  }

  const bytes = await readBoundedAvatar(response)
  return imageDataUrl(contentType, bytes)
}

async function fetchGitHubProfileWithinDeadline(
  username: string,
  token: string,
  signal: AbortSignal,
): Promise<GitHubProfile> {
  const seenCursors = new Set<string>()
  let after: string | null = null
  let firstPage: ProfilePage | undefined
  let pageCount = 0
  let stars = 0

  while (true) {
    if (pageCount >= MAX_REPOSITORY_PAGES) {
      throw new GitHubServiceError('repository_page_limit')
    }

    const page = await fetchProfilePage(username, after, token, signal)
    pageCount += 1
    firstPage ??= page
    stars += page.stars
    if (!Number.isSafeInteger(stars)) {
      throw new GitHubServiceError('malformed_response')
    }
    if (!page.hasNextPage) {
      break
    }

    const nextCursor = page.endCursor
    if (nextCursor === null || seenCursors.has(nextCursor)) {
      throw new GitHubServiceError('malformed_response')
    }
    seenCursors.add(nextCursor)
    after = nextCursor
  }

  if (!firstPage) {
    throw new GitHubServiceError('malformed_response')
  }

  return {
    login: firstPage.login,
    name: firstPage.name,
    bio: firstPage.bio,
    avatarDataUrl: await fetchAvatarDataUrl(firstPage.avatarUrl, signal),
    followers: firstPage.followers,
    repositories: firstPage.repositories,
    stars,
    contributions: firstPage.contributions,
  }
}

export async function fetchGitHubProfile(
  username: string,
  options: FetchGitHubProfileOptions = {},
): Promise<GitHubProfile> {
  const token = options.token?.trim()
  if (!token) {
    throw new GitHubServiceError('missing_token')
  }

  const controller = new AbortController()
  const timeoutMs = normalizeTimeout(options.timeoutMs)
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new GitHubServiceError('timeout'))
      controller.abort()
    }, timeoutMs)
  })

  try {
    return await Promise.race([
      fetchGitHubProfileWithinDeadline(
        username,
        token,
        controller.signal,
      ),
      timeout,
    ])
  } finally {
    clearTimeout(timer)
  }
}
