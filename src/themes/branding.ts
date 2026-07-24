export const BRANDING_FOOTER_HEIGHT = 30
export const GITHUB_DECO_REPOSITORY_URL =
  'https://github.com/kohit-z/profile-card-shop'

interface RepositoryBadgeOptions {
  readonly width: number
  readonly height: number
}

export function renderRepositoryBadge({
  width,
  height,
}: RepositoryBadgeOptions): string {
  const x = Math.max(8, width - 36)
  const y = Math.max(6, height - 25)

  return `<a href="${GITHUB_DECO_REPOSITORY_URL}" target="_blank" rel="noopener noreferrer" aria-label="Star GitHub Deco on GitHub" data-github-deco-branding="true">
  <title>Star GitHub Deco on GitHub</title>
  <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.164.75a.53.53 0 0 1 .294.904l-3.736 3.64a2.12 2.12 0 0 0-.61 1.878l.882 5.14a.53.53 0 0 1-.769.558l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.4 21.004a.53.53 0 0 1-.77-.559l.883-5.139a2.12 2.12 0 0 0-.61-1.879l-3.736-3.64a.53.53 0 0 1 .294-.903l5.165-.75a2.12 2.12 0 0 0 1.594-1.16z" transform="translate(${x} ${y}) scale(0.82)" fill="#e3b341" fill-opacity="0.68" stroke="#e3b341" stroke-opacity="0.68" stroke-width="0.8" stroke-linejoin="round" data-github-deco-star="true" />
</a>`
}
