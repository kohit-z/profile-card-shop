import { imageDataUrl } from '../lib/svg.js'

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql'
// Cold GraphQL + avatar downloads often exceed 5s on residential networks.
const DEFAULT_TIMEOUT_MS = 15_000
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
      createdAt
      isGitHubStar
      hasSponsorsListing
      followers {
        totalCount
      }
      organizations(first: 1) {
        totalCount
      }
      pullRequests(first: 1) {
        totalCount
      }
      issues(first: 1) {
        totalCount
      }
      repositoriesContributedTo(
        first: 1
        contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, PULL_REQUEST_REVIEW, REPOSITORY]
      ) {
        totalCount
      }
      starredRepositories(first: 1) {
        totalCount
      }
      pinnedItems(first: 6, types: [REPOSITORY]) {
        nodes {
          ... on Repository {
            name
            description
            url
            stargazerCount
            primaryLanguage {
              name
              color
            }
          }
        }
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
          primaryLanguage {
            name
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
      contributionsCollection {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
              color
            }
          }
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

export interface PinnedRepository {
  readonly name: string
  readonly description: string | null
  readonly url: string
  readonly stargazerCount: number
  readonly primaryLanguage: {
    readonly name: string
    readonly color: string | null
  } | null
}

export const CONTRIBUTION_LEVELS = [
  'NONE',
  'FIRST_QUARTILE',
  'SECOND_QUARTILE',
  'THIRD_QUARTILE',
  'FOURTH_QUARTILE',
] as const

export type ContributionLevel = (typeof CONTRIBUTION_LEVELS)[number]

export interface ContributionDay {
  readonly date: string
  readonly contributionCount: number
  readonly contributionLevel: ContributionLevel
  readonly color: string
}

export interface ContributionWeek {
  readonly contributionDays: readonly ContributionDay[]
}

export interface ContributionCalendar {
  readonly totalContributions: number
  readonly weeks: readonly ContributionWeek[]
}

export interface GitHubActivityMetrics {
  readonly createdAt: string
  readonly organizations: number
  readonly authoredPullRequests: number
  readonly authoredIssues: number
  readonly repositoriesContributedTo: number
  readonly starredRepositories: number
  readonly commitContributions: number
  readonly issueContributions: number
  readonly pullRequestContributions: number
  readonly pullRequestReviewContributions: number
  readonly isGitHubStar: boolean
  readonly hasSponsorsListing: boolean
  readonly repositoryLanguages: readonly string[]
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
  readonly activity: GitHubActivityMetrics
  readonly contributionCalendar: ContributionCalendar
  readonly pinnedRepositories: readonly PinnedRepository[]
}

export interface FetchGitHubProfileOptions {
  readonly token?: string
  readonly timeoutMs?: number
  readonly includeAvatar?: boolean
}

interface ProfilePage {
  readonly login: string
  readonly name: string | null
  readonly bio: string | null
  readonly avatarUrl: string
  readonly followers: number
  readonly repositories: number
  readonly contributions: number
  readonly contributionCalendar: ContributionCalendar
  readonly activity: GitHubActivityMetrics
  readonly stars: number
  readonly pinnedRepositories: readonly PinnedRepository[]
  readonly hasNextPage: boolean
  readonly endCursor: string | null
}

function isContributionLevel(value: unknown): value is ContributionLevel {
  return (
    typeof value === 'string' &&
    (CONTRIBUTION_LEVELS as readonly string[]).includes(value)
  )
}

function parseContributionCalendar(
  contributionCalendar: Record<string, unknown>,
): ContributionCalendar {
  const totalContributions = readCount(
    contributionCalendar,
    'totalContributions',
  )
  if (!Array.isArray(contributionCalendar.weeks)) {
    throw new GitHubServiceError('malformed_response')
  }

  const weeks: ContributionWeek[] = []
  for (const weekValue of contributionCalendar.weeks) {
    if (!isRecord(weekValue)) {
      throw new GitHubServiceError('malformed_response')
    }
    if (!Array.isArray(weekValue.contributionDays)) {
      throw new GitHubServiceError('malformed_response')
    }

    const contributionDays: ContributionDay[] = []
    for (const dayValue of weekValue.contributionDays) {
      if (!isRecord(dayValue)) {
        throw new GitHubServiceError('malformed_response')
      }
      const contributionLevel = dayValue.contributionLevel
      if (!isContributionLevel(contributionLevel)) {
        throw new GitHubServiceError('malformed_response')
      }
      contributionDays.push({
        date: readIsoDate(dayValue, 'date'),
        contributionCount: readCount(dayValue, 'contributionCount'),
        contributionLevel,
        color: readString(dayValue, 'color'),
      })
    }

    weeks.push({ contributionDays })
  }

  return { totalContributions, weeks }
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

function readBoolean(record: Record<string, unknown>, key: string): boolean {
  const value = record[key]
  if (typeof value !== 'boolean') {
    throw new GitHubServiceError('malformed_response')
  }
  return value
}

function readIsoDate(record: Record<string, unknown>, key: string): string {
  const value = readString(record, key)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new GitHubServiceError('malformed_response')
  }

  const timestamp = Date.parse(`${value}T00:00:00Z`)
  if (
    !Number.isFinite(timestamp) ||
    new Date(timestamp).toISOString().slice(0, 10) !== value
  ) {
    throw new GitHubServiceError('malformed_response')
  }

  return value
}

const ISO_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2}))$/

function readIsoDateTime(
  record: Record<string, unknown>,
  key: string,
): string {
  const value = readString(record, key)
  const match = ISO_DATE_TIME_PATTERN.exec(value)
  if (!match) {
    throw new GitHubServiceError('malformed_response')
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6])
  const offsetHour = match[7] === undefined ? 0 : Number(match[7])
  const offsetMinute = match[8] === undefined ? 0 : Number(match[8])
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ]

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > (daysInMonth[month - 1] ?? 0) ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    offsetHour > 23 ||
    offsetMinute > 59 ||
    !Number.isFinite(Date.parse(value))
  ) {
    throw new GitHubServiceError('malformed_response')
  }

  return value
}

function readRepositoryUrl(record: Record<string, unknown>): string {
  const value = readString(record, 'url')
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new GitHubServiceError('malformed_response')
  }

  if (
    url.protocol !== 'https:' ||
    url.username !== '' ||
    url.password !== '' ||
    url.hostname.toLowerCase() !== 'github.com'
  ) {
    throw new GitHubServiceError('malformed_response')
  }

  return url.toString()
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
  const organizations = readRecord(user, 'organizations')
  const pullRequests = readRecord(user, 'pullRequests')
  const issues = readRecord(user, 'issues')
  const repositoriesContributedTo = readRecord(
    user,
    'repositoriesContributedTo',
  )
  const starredRepositories = readRecord(user, 'starredRepositories')
  const repositories = readRecord(user, 'repositories')
  const pinnedItems = readRecord(user, 'pinnedItems')
  const contributionsCollection = readRecord(
    user,
    'contributionsCollection',
  )
  const contributionCalendar = readRecord(
    contributionsCollection,
    'contributionCalendar',
  )
  const pageInfo = readRecord(repositories, 'pageInfo')

  if (!Array.isArray(repositories.nodes) || !Array.isArray(pinnedItems.nodes)) {
    throw new GitHubServiceError('malformed_response')
  }

  let stars = 0
  const repositoryLanguages = new Set<string>()
  for (const node of repositories.nodes) {
    if (!isRecord(node)) {
      throw new GitHubServiceError('malformed_response')
    }
    stars += readCount(node, 'stargazerCount')
    if (!Number.isSafeInteger(stars)) {
      throw new GitHubServiceError('malformed_response')
    }

    const languageValue = node.primaryLanguage
    if (languageValue !== null) {
      if (!isRecord(languageValue)) {
        throw new GitHubServiceError('malformed_response')
      }
      const language = readString(languageValue, 'name')
      if (language.trim() === '') {
        throw new GitHubServiceError('malformed_response')
      }
      repositoryLanguages.add(language)
    }
  }

  const pinnedRepositories: PinnedRepository[] = []
  for (const node of pinnedItems.nodes) {
    // GraphQL may return null for deleted or inaccessible pins.
    if (node === null) {
      continue
    }
    if (!isRecord(node)) {
      throw new GitHubServiceError('malformed_response')
    }
    const languageValue = node.primaryLanguage
    let primaryLanguage: PinnedRepository['primaryLanguage'] = null
    if (languageValue !== null && languageValue !== undefined) {
      if (!isRecord(languageValue)) {
        throw new GitHubServiceError('malformed_response')
      }
      primaryLanguage = {
        name: readString(languageValue, 'name'),
        color: readNullableString(languageValue, 'color'),
      }
    }
    pinnedRepositories.push({
      name: readString(node, 'name'),
      description: readNullableString(node, 'description'),
      url: readRepositoryUrl(node),
      stargazerCount: readCount(node, 'stargazerCount'),
      primaryLanguage,
    })
  }

  if (typeof pageInfo.hasNextPage !== 'boolean') {
    throw new GitHubServiceError('malformed_response')
  }

  const endCursor = readNullableString(pageInfo, 'endCursor')
  if (pageInfo.hasNextPage && endCursor === null) {
    throw new GitHubServiceError('malformed_response')
  }

  const calendar = parseContributionCalendar(contributionCalendar)

  return {
    login: readString(user, 'login'),
    name: readNullableString(user, 'name'),
    bio: readNullableString(user, 'bio'),
    avatarUrl: readString(user, 'avatarUrl'),
    followers: readCount(followers, 'totalCount'),
    repositories: readCount(repositories, 'totalCount'),
    contributions: calendar.totalContributions,
    contributionCalendar: calendar,
    activity: {
      createdAt: readIsoDateTime(user, 'createdAt'),
      organizations: readCount(organizations, 'totalCount'),
      authoredPullRequests: readCount(pullRequests, 'totalCount'),
      authoredIssues: readCount(issues, 'totalCount'),
      repositoriesContributedTo: readCount(
        repositoriesContributedTo,
        'totalCount',
      ),
      starredRepositories: readCount(starredRepositories, 'totalCount'),
      commitContributions: readCount(
        contributionsCollection,
        'totalCommitContributions',
      ),
      issueContributions: readCount(
        contributionsCollection,
        'totalIssueContributions',
      ),
      pullRequestContributions: readCount(
        contributionsCollection,
        'totalPullRequestContributions',
      ),
      pullRequestReviewContributions: readCount(
        contributionsCollection,
        'totalPullRequestReviewContributions',
      ),
      isGitHubStar: readBoolean(user, 'isGitHubStar'),
      hasSponsorsListing: readBoolean(user, 'hasSponsorsListing'),
      repositoryLanguages: [...repositoryLanguages],
    },
    stars,
    pinnedRepositories,
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
  includeAvatar: boolean,
): Promise<GitHubProfile> {
  const seenCursors = new Set<string>()
  let after: string | null = null
  let firstPage: ProfilePage | undefined
  let pageCount = 0
  let stars = 0
  const repositoryLanguages = new Set<string>()

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
    for (const language of page.activity.repositoryLanguages) {
      repositoryLanguages.add(language)
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
    avatarDataUrl: includeAvatar
      ? await fetchAvatarDataUrl(firstPage.avatarUrl, signal)
      : '',
    followers: firstPage.followers,
    repositories: firstPage.repositories,
    stars,
    contributions: firstPage.contributions,
    activity: {
      ...firstPage.activity,
      repositoryLanguages: [...repositoryLanguages],
    },
    contributionCalendar: firstPage.contributionCalendar,
    pinnedRepositories: firstPage.pinnedRepositories,
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
        options.includeAvatar ?? true,
      ),
      timeout,
    ])
  } finally {
    clearTimeout(timer)
  }
}
