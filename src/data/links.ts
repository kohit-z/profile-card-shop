import {
  siBuymeacoffee,
  siDiscord,
  siGithub,
  siGmail,
  siKofi,
  siOpencollective,
  siPatreon,
  siPaypal,
  siX,
  type SimpleIcon,
} from 'simple-icons'

export interface LinkPlatform {
  readonly id: string
  readonly label: string
  readonly icon: SimpleIcon
}

export interface CardLink extends LinkPlatform {
  readonly value: string
}

export const CONTACT_CATALOG = {
  email: { id: 'email', label: 'Email', icon: siGmail },
  github: { id: 'github', label: 'GitHub', icon: siGithub },
  discord: { id: 'discord', label: 'Discord', icon: siDiscord },
  x: { id: 'x', label: 'X', icon: siX },
} as const satisfies Record<string, LinkPlatform>

export const DONATE_CATALOG = {
  'github-sponsors': {
    id: 'github-sponsors',
    label: 'GitHub Sponsors',
    icon: siGithub,
  },
  kofi: { id: 'kofi', label: 'Ko-fi', icon: siKofi },
  buymeacoffee: {
    id: 'buymeacoffee',
    label: 'Buy Me a Coffee',
    icon: siBuymeacoffee,
  },
  patreon: { id: 'patreon', label: 'Patreon', icon: siPatreon },
  paypal: { id: 'paypal', label: 'PayPal', icon: siPaypal },
  opencollective: {
    id: 'opencollective',
    label: 'Open Collective',
    icon: siOpencollective,
  },
} as const satisfies Record<string, LinkPlatform>

export const CONTACT_PLATFORM_IDS = Object.freeze(Object.keys(CONTACT_CATALOG))
export const DONATE_PLATFORM_IDS = Object.freeze(Object.keys(DONATE_CATALOG))

export function resolveCardLinks(
  entries: readonly string[],
  catalog: Readonly<Record<string, LinkPlatform>>,
): { readonly links: readonly CardLink[]; readonly unknown: string | null } {
  const links: CardLink[] = []

  for (const entry of entries) {
    const separator = entry.indexOf(':')
    const id = entry.slice(0, separator)
    const value = entry.slice(separator + 1)
    const platform = catalog[id]
    if (!platform) {
      return { links: [], unknown: id }
    }
    links.push({ ...platform, value })
  }

  return { links, unknown: null }
}
