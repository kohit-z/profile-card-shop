import {
  CONTACT_CATALOG,
  CONTACT_PLATFORM_IDS,
  DONATE_CATALOG,
  DONATE_PLATFORM_IDS,
} from '../data/links.js'
import {
  DEFAULT_OUTLINE_STYLE,
  OUTLINE_STYLE_NAMES,
} from '../data/outline-style.js'
import {
  resolveSkillIconPreviewBody,
  SKILL_CATALOG,
  SKILL_IDS,
} from '../data/skills.js'
import {
  AVATAR_EFFECT_NAMES,
  BACKGROUND_EFFECT_NAMES,
  CARD_EFFECT_NAMES,
  EFFECT_CATALOG,
  SECTION_EFFECT_NAMES,
  type EffectName,
} from '../effects/index.js'
import {
  CARD_SECTION_NAMES,
  MAX_SKILLS,
  type CardSectionName,
} from '../lib/query.js'
import { THEMES, THEME_NAMES } from '../themes/index.js'

const DEFAULT_SKILLS = ['typescript', 'react', 'nodejs', 'docker', 'github'] as const
const DEFAULT_CONTACT: Readonly<Record<string, { on: boolean; value: string }>> = {
  email: { on: true, value: 'hello@example.com' },
  github: { on: true, value: 'octocat' },
  discord: { on: false, value: '' },
  telegram: { on: false, value: '' },
  whatsapp: { on: false, value: '' },
  x: { on: false, value: '' },
}
const DEFAULT_DONATE: Readonly<Record<string, { on: boolean; value: string }>> = {
  'github-sponsors': { on: true, value: 'octocat' },
  kofi: { on: false, value: '' },
  buymeacoffee: { on: false, value: '' },
  patreon: { on: false, value: '' },
  paypal: { on: false, value: '' },
  opencollective: { on: false, value: '' },
}

const SECTION_META: Readonly<
  Record<CardSectionName, { label: string; hint: string; icon: string }>
> = {
  profile: {
    label: 'Profile',
    hint: 'Avatar & bio',
    icon: '<path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.3 0-6 1.7-6 3.8V20h12v-2.2c0-2.1-2.7-3.8-6-3.8Z"/>',
  },
  stats: {
    label: 'Stats',
    hint: 'Followers & stars',
    icon: '<path d="M4 19V9h3v10H4Zm6.5 0V5h3v14h-3ZM17 19v-6h3v6h-3Z"/>',
  },
  skills: {
    label: 'Skills',
    hint: 'Tech stack',
    icon: '<path d="m9.4 16.6-1.4-1.4L12.2 11 8 6.8l1.4-1.4L15 11l-5.6 5.6Zm5.2 0L20 11l-5.4-5.6-1.4 1.4L17.2 11l-4 4.2 1.4 1.4Z"/>',
  },
  projects: {
    label: 'Projects',
    hint: 'Pinned repos',
    icon: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3h5l2 2H18.5A1.5 1.5 0 0 1 20 6.5v11A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-13Z"/>',
  },
  contributions: {
    label: 'Contributions',
    hint: 'Activity graph',
    icon: '<path d="M4 16h2v4H4v-4Zm3.5-6h2v10h-2V10ZM11 4h2v16h-2V4Zm3.5 8h2v8h-2v-8ZM18 12h2v8h-2v-8Z"/>',
  },
  contact: {
    label: 'Contact',
    hint: 'How to reach you',
    icon: '<path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v11A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-11Zm1.7.7 6.3 4.4 6.3-4.4H5.7Zm12.8 1.8-5.9 4.1a1.5 1.5 0 0 1-1.7 0L5.1 9V17h13.4V9Z"/>',
  },
  donate: {
    label: 'Donate',
    hint: 'Support links',
    icon: '<path d="M12 20.4 10.6 19C5.4 14.4 2 11.3 2 7.5A4.5 4.5 0 0 1 6.5 3 5.2 5.2 0 0 1 12 5.1 5.2 5.2 0 0 1 17.5 3 4.5 4.5 0 0 1 22 7.5c0 3.8-3.4 6.9-8.6 11.5L12 20.4Z"/>',
  },
  giphy: {
    label: 'Giphy',
    hint: 'Custom GIF',
    icon: '<path d="M5 4h10a1 1 0 0 1 1 1v3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-3H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm10 4V6H6v9h2V9a1 1 0 0 1 1-1h6Zm3 2h-8v8h8V10Z"/>',
  },
}

const PLATFORM_ICONS: Readonly<Record<string, string>> = {
  email:
    '<path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v11A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-11Zm2 1.2 6 4.2 6-4.2V7H6v.7Zm12 1.9-5.2 3.6a1.5 1.5 0 0 1-1.6 0L6 9.6V17h12V9.6Z"/>',
  github:
    '<path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.7s.8-.3 2.8 1a9.6 9.6 0 0 1 5 0c2-1.3 2.8-1 2.8-1a3.6 3.6 0 0 1 .1 2.7 3.9 3.9 0 0 1 1 2.7c0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2Z"/>',
  discord:
    '<path d="M18.6 5.4A15.4 15.4 0 0 0 14.9 4l-.3.6a13.5 13.5 0 0 1 3.4 1.3 12.4 12.4 0 0 0-11 0A13 13 0 0 1 9.4 4.6 15.2 15.2 0 0 0 5.4 5.4C2.8 9.3 2.1 13.1 2.4 16.9A15.5 15.5 0 0 0 7.3 20l.8-1.1a10 10 0 0 1-1.4-.7l.3-.3a11 11 0 0 0 10 0l.4.3a10 10 0 0 1-1.4.7l.8 1.1a15.4 15.4 0 0 0 4.9-3.1c.4-4.3-.6-8-2.7-11.5ZM9.4 14.7c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8 1.7.8 1.6 1.8-.7 1.8-1.6 1.8Zm5.2 0c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8 1.7.8 1.6 1.8-.7 1.8-1.6 1.8Z"/>',
  telegram:
    '<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>',
  whatsapp:
    '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>',
  x: '<path d="M4 4h4.2l4 5.5L16.8 4H20l-6.2 7.3L20.3 20h-4.2l-4.4-6-4.8 6H3.5l6.6-7.8L4 4Z"/>',
  'github-sponsors':
    '<path d="M12 20.4 10.6 19C5.4 14.4 2 11.3 2 7.5A4.5 4.5 0 0 1 6.5 3 5.2 5.2 0 0 1 12 5.1 5.2 5.2 0 0 1 17.5 3 4.5 4.5 0 0 1 22 7.5c0 3.8-3.4 6.9-8.6 11.5L12 20.4Z"/>',
  kofi: '<path d="M4 7h12.5A3.5 3.5 0 0 1 20 10.5 3.5 3.5 0 0 1 16.5 14H15l-1 5H5l1-12Zm3.2 2-.5 6h5.6l.3-3H16.5a1.5 1.5 0 0 0 0-3H7.2Z"/>',
  buymeacoffee:
    '<path d="M5 4h11l1 8h1.5A2.5 2.5 0 0 0 21 9.5 2.5 2.5 0 0 0 18.5 7H17V5h1.5A4.5 4.5 0 0 1 23 9.5 4.5 4.5 0 0 1 18.5 14H16l-1 6H6L5 4Zm2.2 2-.8 8h6.9l.5-5H9.5V9h3.1l.2-2H7.2Z"/>',
  patreon:
    '<path d="M4 3h3.2v18H4V3Zm8.3 0A6.7 6.7 0 1 1 12.3 16.4 6.7 6.7 0 0 1 12.3 3Z"/>',
  paypal:
    '<path d="M8.2 20.5 9 15h2.7c3.5 0 5.7-1.6 6.3-4.5.8-3.7-1.4-5.5-4.9-5.5H7.1L4.5 20.5h3.7Zm3.3-13h1.7c1.7 0 2.6.7 2.3 2.1-.4 1.7-1.5 2.2-3.3 2.2H10.5l.9-4.3h.1Z"/>',
  opencollective:
    '<path d="M12 3a9 9 0 1 0 8.6 11.7A6.5 6.5 0 0 1 12 16.5 6.5 6.5 0 0 1 12 3.5V3Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z"/>',
}

/** Brand accents for gallery platform chips (hex without #). */
const PLATFORM_COLORS: Readonly<Record<string, { brand: string; ink: string }>> = {
  email: { brand: 'EA4335', ink: 'ffffff' },
  github: { brand: '24292F', ink: 'ffffff' },
  discord: { brand: '5865F2', ink: 'ffffff' },
  telegram: { brand: '26A5E4', ink: 'ffffff' },
  whatsapp: { brand: '25D366', ink: 'ffffff' },
  x: { brand: '0F1419', ink: 'ffffff' },
  'github-sponsors': { brand: 'EA4AAA', ink: 'ffffff' },
  kofi: { brand: 'FF5E5B', ink: 'ffffff' },
  buymeacoffee: { brand: 'FFDD00', ink: '1A1A1A' },
  patreon: { brand: 'FF424D', ink: 'ffffff' },
  paypal: { brand: '003087', ink: 'ffffff' },
  opencollective: { brand: '7FADF2', ink: '0B1F3A' },
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function icon(paths: string, size = 16): string {
  return `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">${paths}</svg>`
}

function platformRows(
  kind: 'contact' | 'donate',
  ids: readonly string[],
  catalog: Readonly<Record<string, { label: string }>>,
  defaults: Readonly<Record<string, { on: boolean; value: string }>>,
): string {
  return ids
    .map((id) => {
      const row = defaults[id] ?? { on: false, value: '' }
      const label = catalog[id]?.label ?? id
      const glyph = PLATFORM_ICONS[id] ?? SECTION_META.contact.icon
      const colors = PLATFORM_COLORS[id] ?? { brand: '0EA5E9', ink: 'ffffff' }
      const style = `--p:#${colors.brand};--p-ink:#${colors.ink};--p-soft:color-mix(in oklab,#${colors.brand} 12%,white);--p-mid:color-mix(in oklab,#${colors.brand} 22%,white);--p-glow:color-mix(in oklab,#${colors.brand} 16%,transparent)`
      return `<div class="platform-row${row.on ? ' on' : ''}" data-platform-kind="${kind}" data-platform="${escapeHtml(id)}" style="${style}">
  <button type="button" class="platform-chip${row.on ? ' on' : ''}" data-platform-toggle aria-pressed="${row.on}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">${icon(glyph, 20)}</button>
  <input data-platform-value value="${escapeHtml(row.value)}" placeholder="${escapeHtml(label)}" autocomplete="off" spellcheck="false" />
</div>`
    })
    .join('')
}

function searchSelectMount(
  id: string,
  placeholder: string,
  mode: 'single' | 'multi',
): string {
  return `<div class="search-select" id="${escapeHtml(id)}" data-mode="${mode}">
  <div class="search-select-tags" data-tags></div>
  <div class="search-select-control">
    <span class="search-select-lead">${icon('<path d="M10.5 3a7.5 7.5 0 1 0 4.7 13.3l3.8 3.8 1.4-1.4-3.8-3.8A7.5 7.5 0 0 0 10.5 3Zm0 2a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z"/>', 15)}</span>
    <span class="search-select-value" data-value hidden></span>
    <input class="search-select-input" type="search" placeholder="${escapeHtml(placeholder)}" autocomplete="off" spellcheck="false" aria-autocomplete="list" />
  </div>
  <ul class="search-select-menu" data-menu role="listbox" hidden></ul>
</div>`
}

function effectOptions(names: readonly EffectName[]) {
  return names.map((name) => ({
    id: name,
    label: EFFECT_CATALOG[name].label,
    hint: EFFECT_CATALOG[name].description,
  }))
}

export function renderGalleryPage(origin: string): string {
  const pageOrigin = origin.replace(/\/$/, '')
  const sectionOptions = CARD_SECTION_NAMES.map((name) => ({
    id: name,
    label: SECTION_META[name].label,
    hint: SECTION_META[name].hint,
  }))
  const skillOptions = SKILL_IDS.map((id) => ({
    id,
    label: SKILL_CATALOG[id]!.label,
    category: SKILL_CATALOG[id]!.category,
    body: resolveSkillIconPreviewBody(SKILL_CATALOG[id]!),
  }))
  const outlineOptions = OUTLINE_STYLE_NAMES.map((id) => ({
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1),
    hint:
      id === 'rounded'
        ? 'Default rounded tiles'
        : id === 'square'
          ? 'Sharp square tiles'
          : id === 'soft'
            ? 'Extra soft corners'
            : 'No tile outline',
  }))
  const themeOptions = THEME_NAMES.map((name) => {
    const theme = THEMES[name]
    return {
      id: name,
      label: name.charAt(0).toUpperCase() + name.slice(1),
      hint: 'Preview look',
      swatch: `linear-gradient(135deg,${theme.gradient.from},${theme.gradient.to})`,
    }
  })
  const effectCatalog = {
    background: effectOptions(BACKGROUND_EFFECT_NAMES),
    card: effectOptions(CARD_EFFECT_NAMES),
    avatar: effectOptions(AVATAR_EFFECT_NAMES),
    stats: effectOptions(SECTION_EFFECT_NAMES),
    skills: effectOptions(SECTION_EFFECT_NAMES),
    projects: effectOptions(SECTION_EFFECT_NAMES),
    contributions: effectOptions(SECTION_EFFECT_NAMES),
    contact: effectOptions(SECTION_EFFECT_NAMES),
    donate: effectOptions(SECTION_EFFECT_NAMES),
    giphy: effectOptions(SECTION_EFFECT_NAMES),
  }

  const contentIcon =
    '<path d="M5 5h6v6H5V5Zm8 0h6v4h-6V5ZM5 13h4v6H5v-6Zm6 2h8v4h-8v-4Z"/>'
  const appearanceIcon =
    '<path d="M12 3a9 9 0 1 0 9 9h-3.2A5.8 5.8 0 1 1 12 6.2V3Zm1.5 1.1A7.5 7.5 0 0 1 19.9 10.5H14.8a4.2 4.2 0 0 0-1.3-2.7V4.1Z"/>'
  const motionIcon =
    '<path d="M11 3h2v5.2l3.8-2.2 1 1.8-3.8 2.2 3.8 2.2-1 1.8-3.8-2.2V19h-2v-5.2l-3.8 2.2-1-1.8 3.8-2.2-3.8-2.2 1-1.8 3.8 2.2V3Z"/>'
  const userIcon =
    '<path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.3 0-6 1.7-6 3.8V20h12v-2.2c0-2.1-2.7-3.8-6-3.8Z"/>'
  const gifIcon = SECTION_META.giphy.icon
  const sparkIcon =
    '<path d="M12 2.5 13.2 8l5.3 1.2L13.2 10.4 12 16l-1.2-5.6L5.5 9.2 10.8 8 12 2.5Zm6.5 9.5.8 3.5 3.5.8-3.5.8-.8 3.5-.8-3.5-3.5-.8 3.5-.8.8-3.5Z"/>'

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GitHub Deco — Card builder</title>
  <meta name="description" content="Compose a live GitHub README card from profile, stats, skills, projects, contributions, contact, donate, Giphy GIFs, and motion effects." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&amp;family=IBM+Plex+Sans:wght@400;500;600&amp;display=swap" rel="stylesheet" />
  <style>
    :root {
      color-scheme: light;
      --ink: oklch(0.22 0.02 250);
      --muted: oklch(0.48 0.02 250);
      --paper: oklch(0.97 0.01 240);
      --panel: #fff;
      --accent: oklch(0.48 0.12 230);
      --accent-soft: oklch(0.94 0.03 230);
      --accent-deep: oklch(0.4 0.12 230);
      --warn: oklch(0.55 0.14 40);
      --ok: oklch(0.55 0.12 155);
      --display: "Space Grotesk", ui-sans-serif, sans-serif;
      --body: "IBM Plex Sans", ui-sans-serif, sans-serif;
      --shadow: 0 12px 30px oklch(0.35 0.03 250 / 0.08);
      --shadow-soft: 0 1px 0 oklch(1 0 0 / 0.82) inset, 0 8px 22px oklch(0.4 0.03 250 / 0.055);
      --shadow-control: 0 1px 0 oklch(1 0 0 / 0.86) inset, 0 3px 10px oklch(0.4 0.03 250 / 0.065);
      --shadow-lift: 0 1px 0 oklch(1 0 0 / 0.9) inset, 0 7px 16px oklch(0.4 0.03 250 / 0.09);
      --glow: 0 0 0 3px oklch(0.48 0.12 230 / 0.12), 0 5px 16px oklch(0.48 0.12 230 / 0.11);
      --glow-strong: 0 0 0 3px oklch(0.48 0.12 230 / 0.16), 0 7px 18px oklch(0.48 0.12 230 / 0.15);
      --ease: cubic-bezier(0.22, 1, 0.36, 1);
      --ease-in: cubic-bezier(0.4, 0, 1, 1);
      --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
      --dur-fast: 160ms;
      --dur-med: 260ms;
      --dur-slow: 420ms;
    }
    * { box-sizing: border-box; }
    button, input, .ico, .panel-badge, .panel-count, .search-tag,
    .search-select-value, .platform-heading, .giphy-selected {
      transition:
        color var(--dur-med) var(--ease),
        background-color var(--dur-med) var(--ease),
        opacity var(--dur-med) var(--ease),
        transform var(--dur-med) var(--ease),
        box-shadow var(--dur-med) var(--ease),
        filter var(--dur-med) var(--ease);
    }
    @keyframes rise-in {
      from { opacity: 0; transform: translateY(14px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pop-in {
      from { opacity: 0; transform: scale(0.88) translateY(4px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes bump {
      0%, 100% { transform: scale(1); }
      40% { transform: scale(1.08); }
      70% { transform: scale(0.97); }
    }
    @keyframes shimmer {
      0% { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 6px 16px oklch(0.22 0.02 250 / 0.28); }
      50% { box-shadow: 0 8px 22px oklch(0.55 0.12 155 / 0.35), 0 0 24px oklch(0.55 0.12 155 / 0.28); }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
    body {
      margin: 0;
      color: var(--ink);
      font: 15px/1.5 var(--body);
      background:
        radial-gradient(circle at 12% -10%, oklch(0.9 0.04 230), transparent 42%),
        radial-gradient(circle at 88% 0%, oklch(0.93 0.03 200), transparent 36%),
        linear-gradient(180deg, oklch(0.985 0.01 230), var(--paper));
    }
    a { color: var(--accent); }
    ::selection { background: oklch(0.48 0.12 230 / 0.22); }
    main { padding: clamp(24px, 4vw, 48px); display: grid; gap: 28px; }
    code {
      background: oklch(0.93 0.01 240);
      padding: 1px 6px;
      border-radius: 5px;
      font-size: 0.92em;
      box-shadow: 0 1px 4px oklch(0.4 0.02 250 / 0.08);
    }
    .layout {
      display: grid;
      grid-template-columns: minmax(320px, 400px) minmax(0, 1fr);
      gap: 20px;
      align-items: start;
    }
    .stack { display: grid; gap: 14px; position: sticky; top: 24px; max-height: calc(100vh - 48px); overflow: auto; padding-right: 4px; }
    .stack::-webkit-scrollbar { width: 8px; }
    .stack::-webkit-scrollbar-thumb { background: oklch(0.84 0.01 240); border-radius: 999px; }
    .panel {
      background: linear-gradient(180deg, oklch(1 0 0), oklch(0.995 0.005 230));
      border: 0;
      border-radius: 18px;
      padding: 16px;
      display: grid;
      gap: 16px;
      box-shadow: var(--shadow-soft);
      position: relative;
      overflow: visible;
      animation: rise-in var(--dur-slow) var(--ease-out) both;
      transition: box-shadow var(--dur-med) var(--ease);
    }
    .stack .panel:nth-child(1) { animation-delay: 40ms; }
    .stack .panel:nth-child(2) { animation-delay: 100ms; }
    .stack .panel:nth-child(3) { animation-delay: 160ms; }
    .panel:hover {
      box-shadow: 0 1px 0 oklch(1 0 0 / 0.84) inset, 0 10px 26px oklch(0.4 0.03 250 / 0.075);
    }
    .panel-title {
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      font-family: var(--display);
      font-weight: 600;
      font-size: 13px;
      letter-spacing: 0.02em;
      color: oklch(0.34 0.03 240);
    }
    .panel-title-left { display: flex; align-items: center; gap: 10px; }
    .panel-badge {
      width: 30px; height: 30px; border-radius: 10px; display: grid; place-items: center;
      background: var(--accent-soft); color: var(--accent-deep);
      border: 0;
      box-shadow: 0 3px 9px oklch(0.48 0.12 230 / 0.1);
    }
    .panel-badge .ico { display: block; }
    .panel-count {
      font: 700 11px var(--body);
      color: var(--accent-deep);
      background: var(--accent-soft);
      border: 0;
      border-radius: 999px;
      padding: 4px 9px;
      letter-spacing: 0.02em;
      box-shadow: 0 2px 7px oklch(0.48 0.12 230 / 0.09);
      transition: box-shadow var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease);
    }
    .panel-count.bump { animation: bump var(--dur-med) var(--ease-out); }
    .field {
      display: grid;
      gap: 8px;
      opacity: 1;
      transform: translateY(0);
      max-height: 1400px;
      overflow: visible;
      transition:
        opacity var(--dur-med) var(--ease-out),
        transform var(--dur-med) var(--ease-out),
        max-height var(--dur-slow) var(--ease),
        margin var(--dur-med) var(--ease),
        gap var(--dur-med) var(--ease),
        visibility 0s linear 0s;
    }
    .field.hidden {
      opacity: 0;
      transform: translateY(-8px);
      max-height: 0;
      gap: 0;
      margin: 0;
      overflow: hidden;
      pointer-events: none;
      visibility: hidden;
      transition:
        opacity var(--dur-fast) var(--ease-in),
        transform var(--dur-fast) var(--ease-in),
        max-height var(--dur-med) var(--ease-in),
        margin var(--dur-med) var(--ease-in),
        gap var(--dur-fast) var(--ease-in),
        visibility 0s linear var(--dur-med);
    }
    label, .label {
      font-size: 11.5px;
      font-weight: 700;
      color: var(--muted);
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .field-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .field-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
    .linkish {
      border: 0; background: var(--accent-soft); color: var(--accent-deep);
      font: 600 12px var(--body); cursor: pointer; padding: 6px 10px; border-radius: 999px;
      box-shadow: 0 2px 8px oklch(0.48 0.12 230 / 0.09);
      transition: background var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease);
    }
    .linkish:hover {
      background: oklch(0.9 0.04 230);
      box-shadow: 0 5px 13px oklch(0.48 0.12 230 / 0.13);
      transform: translateY(-1px);
    }
    .linkish:active { transform: translateY(0) scale(0.97); }
    .linkish:focus-visible {
      outline: none;
      box-shadow: var(--glow);
    }
    .linkish:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }
    .input-shell {
      display: grid;
      grid-template-columns: 40px 1fr;
      align-items: stretch;
      border: 0;
      border-radius: 12px;
      background: white;
      overflow: hidden;
      box-shadow: var(--shadow-control);
      transition: box-shadow var(--dur-med) var(--ease), transform var(--dur-med) var(--ease);
    }
    .input-shell:focus-within {
      box-shadow: var(--glow), var(--shadow-lift);
      transform: translateY(-1px);
    }
    .input-shell .lead {
      display: grid; place-items: center;
      background: oklch(0.97 0.01 230);
      color: var(--accent-deep);
      box-shadow: inset -1px 0 0 oklch(0.48 0.12 230 / 0.08);
      transition: color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease);
    }
    .input-shell:focus-within .lead {
      color: var(--accent);
      background: oklch(0.95 0.025 230);
    }
    .input-shell input {
      border: 0;
      border-radius: 0;
      min-height: 44px;
      box-shadow: none;
      outline: none;
    }
    input {
      width: 100%;
      border: 0;
      border-radius: 10px;
      padding: 10px 12px;
      min-height: 44px;
      font: 500 14px ui-monospace, monospace;
      background: white;
      color: var(--ink);
      box-shadow: var(--shadow-control);
      transition: box-shadow var(--dur-med) var(--ease), transform var(--dur-med) var(--ease), background var(--dur-fast) var(--ease);
    }
    input:focus {
      outline: none;
      box-shadow: var(--glow), var(--shadow-lift);
      transform: translateY(-1px);
    }
    .search-select { position: relative; display: grid; gap: 8px; }
    .search-select-tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .search-select-tags:empty { display: none; }
    .search-tag {
      display: inline-flex; align-items: center; gap: 6px;
      border: 0;
      background: var(--accent-soft);
      color: var(--accent-deep);
      border-radius: 999px;
      padding: 5px 8px 5px 10px;
      font: 600 11.5px var(--body);
      max-width: 100%;
      user-select: none;
      box-shadow: 0 2px 8px oklch(0.48 0.12 230 / 0.09);
      transition: box-shadow var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease), opacity var(--dur-fast) var(--ease);
      animation: pop-in var(--dur-med) var(--ease-out) both;
    }
    .search-tag[draggable="true"] { cursor: grab; }
    .search-tag.dragging {
      opacity: 0.45;
      cursor: grabbing;
      transition: opacity var(--dur-fast) var(--ease);
    }
    .search-tag.drag-over {
      box-shadow: var(--glow-strong);
      transform: translateY(-1px) scale(1.03);
    }
    .search-tag .swatch {
      width: 14px; height: 14px; border-radius: 4px; border: 0;
      box-shadow: 0 2px 6px oklch(0.35 0.03 250 / 0.18);
    }
    .search-tag button {
      border: 0; background: transparent; color: inherit; cursor: pointer;
      width: 18px; height: 18px; border-radius: 50%;
      display: grid; place-items: center; font: 700 12px var(--body); line-height: 1;
      padding: 0;
    }
    .search-tag button:hover { background: oklch(0.48 0.12 230 / 0.14); }
    .search-select-control {
      display: flex;
      align-items: center;
      border: 0;
      border-radius: 12px;
      background: white;
      min-height: 44px;
      overflow: hidden;
      box-shadow: var(--shadow-control);
      transition: box-shadow var(--dur-med) var(--ease), transform var(--dur-med) var(--ease);
      position: relative;
    }
    .search-select.open .search-select-control,
    .search-select-control:focus-within {
      box-shadow: var(--glow), var(--shadow-lift);
      transform: translateY(-1px);
    }
    .search-select-lead {
      display: grid; place-items: center;
      width: 36px;
      flex-shrink: 0;
      color: var(--accent-deep);
      align-self: stretch;
      background: oklch(0.97 0.01 230);
      border-radius: 10.5px 0 0 10.5px;
      box-shadow: inset -1px 0 0 oklch(0.48 0.12 230 / 0.08);
    }
    .search-select-input {
      border: 0 !important;
      outline: none !important;
      box-shadow: none !important;
      min-height: 42px;
      border-radius: 0;
      padding: 8px 10px;
      font: 500 13.5px var(--body);
      background: transparent;
      width: 100%;
      min-width: 0;
      flex: 1;
    }
    .search-select-value {
      font: 600 11.5px var(--body);
      color: var(--accent-deep);
      white-space: nowrap;
      max-width: 7.5rem;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-left: 8px;
      padding: 4px 8px;
      border-radius: 999px;
      background: var(--accent-soft);
      line-height: 1.2;
      flex-shrink: 1;
      box-shadow: 0 2px 6px oklch(0.48 0.12 230 / 0.09);
      transition: opacity var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease);
      animation: pop-in var(--dur-fast) var(--ease-out) both;
    }
    .search-select-value[hidden] { display: none; }
    .search-select-menu,
    .giphy-menu {
      opacity: 1;
      transform: translateY(0) scale(1);
      transform-origin: top center;
      transition:
        opacity var(--dur-fast) var(--ease-out),
        transform var(--dur-med) var(--ease-out),
        box-shadow var(--dur-med) var(--ease);
    }
    .search-select-menu.is-entering,
    .search-select-menu.is-leaving,
    .giphy-menu.is-entering,
    .giphy-menu.is-leaving {
      opacity: 0;
      transform: translateY(-8px) scale(0.97);
      pointer-events: none;
    }
    .search-select-menu {
      list-style: none;
      margin: 0;
      padding: 6px;
      position: absolute;
      top: calc(100% + 4px);
      left: 0; right: 0;
      z-index: 40;
      max-height: 220px;
      overflow: auto;
      background: white;
      border: 0;
      border-radius: 12px;
      box-shadow: 0 14px 32px oklch(0.35 0.03 250 / 0.14), 0 4px 12px oklch(0.48 0.12 230 / 0.06);
    }
    .search-select-menu.is-fixed {
      position: fixed;
      right: auto;
      z-index: 1000;
    }
    .search-select-menu[hidden] { display: none; }
    .search-option {
      width: 100%;
      border: 0;
      background: transparent;
      text-align: left;
      border-radius: 9px;
      padding: 8px 10px;
      cursor: pointer;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 8px;
      align-items: center;
      color: var(--ink);
      font: 500 13px var(--body);
      transition: background var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease);
    }
    .search-option:hover, .search-option.active {
      background: var(--accent-soft);
      box-shadow: 0 4px 12px oklch(0.48 0.12 230 / 0.1);
      transform: translateX(2px);
    }
    .search-option.on {
      background: oklch(0.94 0.03 230);
      color: var(--accent-deep);
      font-weight: 600;
      box-shadow: 0 3px 10px oklch(0.48 0.12 230 / 0.1);
    }
    .search-option .swatch {
      width: 18px; height: 18px; border-radius: 6px; border: 0;
      box-shadow: 0 2px 6px oklch(0.35 0.03 250 / 0.18);
    }
    .search-option-copy { display: grid; gap: 1px; min-width: 0; }
    .search-option-label { font: 600 12.5px var(--display); }
    .search-option-hint {
      font: 500 11px var(--body); color: var(--muted);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .search-empty {
      padding: 12px 10px;
      color: var(--muted);
      font: 500 12.5px var(--body);
    }
    .giphy-picker { position: relative; display: grid; gap: 8px; }
    .giphy-picker .input-shell {
      display: flex;
      align-items: stretch;
    }
    .giphy-picker .input-shell .lead {
      flex: 0 0 40px;
    }
    .giphy-picker .input-shell input {
      flex: 1 1 auto;
      min-width: 4rem;
      width: auto;
    }
    .giphy-picker.open .input-shell {
      box-shadow: var(--glow-strong), var(--shadow-lift);
      transform: translateY(-1px);
    }
    .giphy-menu {
      list-style: none;
      margin: 0;
      padding: 8px;
      position: absolute;
      top: calc(100% + 4px);
      left: 0; right: 0;
      z-index: 40;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px;
      max-height: 280px;
      overflow: auto;
      background: white;
      border: 0;
      border-radius: 12px;
      box-shadow: 0 14px 32px oklch(0.35 0.03 250 / 0.14), 0 4px 12px oklch(0.48 0.12 230 / 0.06);
    }
    .giphy-menu.is-fixed {
      position: fixed;
      right: auto;
      z-index: 1000;
    }
    .giphy-menu[hidden] { display: none; }
    .giphy-menu > li { min-width: 0; }
    .giphy-menu > .search-empty { grid-column: 1 / -1; }
    .giphy-option {
      width: 100%;
      border: 0;
      background: transparent;
      border-radius: 10px;
      padding: 3px;
      cursor: pointer;
      display: block;
      color: var(--ink);
      transition: background var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease);
      animation: pop-in var(--dur-med) var(--ease-out) both;
    }
    .giphy-menu > li:nth-child(1) .giphy-option { animation-delay: 0ms; }
    .giphy-menu > li:nth-child(2) .giphy-option { animation-delay: 30ms; }
    .giphy-menu > li:nth-child(3) .giphy-option { animation-delay: 60ms; }
    .giphy-menu > li:nth-child(4) .giphy-option { animation-delay: 90ms; }
    .giphy-menu > li:nth-child(5) .giphy-option { animation-delay: 120ms; }
    .giphy-menu > li:nth-child(6) .giphy-option { animation-delay: 150ms; }
    .giphy-menu > li:nth-child(7) .giphy-option { animation-delay: 180ms; }
    .giphy-menu > li:nth-child(8) .giphy-option { animation-delay: 210ms; }
    .giphy-option:hover {
      background: var(--accent-soft);
      box-shadow: 0 6px 14px oklch(0.48 0.12 230 / 0.14);
      transform: translateY(-2px);
    }
    .giphy-option.on {
      background: var(--accent-soft);
      box-shadow: var(--glow);
    }
    .giphy-thumb {
      width: 100%;
      height: 72px;
      border-radius: 8px;
      object-fit: cover;
      background: oklch(0.95 0.01 230);
      border: 0;
      display: block;
      box-shadow: 0 4px 12px oklch(0.35 0.03 250 / 0.12);
      transition: transform var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease);
    }
    .giphy-option:hover .giphy-thumb {
      box-shadow: 0 8px 16px oklch(0.35 0.03 250 / 0.18);
    }
    .giphy-selected {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      max-width: 48%;
      padding: 0 0 0 8px;
      flex: 0 1 auto;
    }
    .giphy-selected[hidden] { display: none; }
    .giphy-selected-thumb {
      width: 36px;
      height: 26px;
      border-radius: 6px;
      object-fit: cover;
      border: 0;
      background: oklch(0.95 0.01 230);
      flex: 0 0 auto;
      box-shadow: 0 3px 8px oklch(0.35 0.03 250 / 0.16);
    }
    .giphy-selected-label {
      font: 600 12px var(--display);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }
    .skill-picker { display: grid; gap: 10px; }
    .skill-icon-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      max-height: 320px;
      overflow: auto;
      padding: 4px;
    }
    .skill-icon-btn {
      border: 0;
      background: white;
      border-radius: 12px;
      min-height: 72px;
      padding: 8px 6px;
      display: grid;
      gap: 6px;
      justify-items: center;
      align-content: center;
      cursor: pointer;
      color: var(--ink);
      box-shadow: var(--shadow-control);
      transition: background var(--dur-med) var(--ease), transform var(--dur-med) var(--ease), box-shadow var(--dur-med) var(--ease);
      animation: pop-in var(--dur-med) var(--ease-out) both;
    }
    .skill-icon-btn:nth-child(3n+1) { animation-delay: 0ms; }
    .skill-icon-btn:nth-child(3n+2) { animation-delay: 40ms; }
    .skill-icon-btn:nth-child(3n+3) { animation-delay: 80ms; }
    .skill-icon-btn:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lift);
    }
    .skill-icon-btn:active { transform: translateY(0) scale(0.97); }
    .skill-icon-btn:focus-visible {
      outline: none;
      box-shadow: var(--glow), var(--shadow-lift);
    }
    .skill-icon-btn.on {
      background: var(--accent-soft);
      box-shadow: var(--glow-strong);
    }
    .skill-icon-mark {
      width: 28px; height: 28px; border-radius: 8px;
      display: grid; place-items: center;
      overflow: hidden;
      background: transparent;
      filter: drop-shadow(0 2px 4px oklch(0.35 0.03 250 / 0.12));
    }
    .skill-icon-mark svg { width: 28px; height: 28px; display: block; }
    .skill-icon-name {
      font: 600 10.5px var(--body);
      text-align: center;
      line-height: 1.2;
      max-width: 100%;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    @media (max-width: 720px) {
      .skill-icon-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 420px) {
      .skill-icon-grid { grid-template-columns: minmax(0, 1fr); }
    }
    .platform-heading {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      width: fit-content;
      padding: 5px 10px 5px 8px;
      border-radius: 999px;
      letter-spacing: 0.05em;
      border: 0;
    }
    .platform-heading .ico { display: block; }
    .platform-heading.contact {
      color: #0b4f8a;
      background: linear-gradient(135deg, #d9efff, #eef7ff);
      box-shadow: 0 3px 9px color-mix(in oklab, #0ea5e9 12%, transparent);
    }
    .platform-heading.donate {
      color: #9b1d5a;
      background: linear-gradient(135deg, #ffe0f0, #fff0f7);
      box-shadow: 0 3px 9px color-mix(in oklab, #ea4aaa 12%, transparent);
    }
    .platform-list { display: grid; gap: 10px; }
    .platform-row {
      --p: #0ea5e9;
      --p-ink: #fff;
      --p-soft: color-mix(in oklab, var(--p) 10%, white);
      --p-mid: color-mix(in oklab, var(--p) 20%, white);
      --p-glow: color-mix(in oklab, var(--p) 14%, transparent);
      display: grid;
      grid-template-columns: 46px 1fr;
      gap: 10px;
      align-items: center;
      padding: 8px;
      border-radius: 16px;
      background:
        linear-gradient(135deg, color-mix(in oklab, var(--p) 4%, white), white 62%),
        radial-gradient(circle at 0% 50%, color-mix(in oklab, var(--p) 5%, white), transparent 62%);
      border: 0;
      box-shadow: 0 1px 0 oklch(1 0 0 / 0.72) inset, 0 4px 11px oklch(0.35 0.03 250 / 0.075);
      transition: box-shadow var(--dur-med) var(--ease), transform var(--dur-med) var(--ease), background var(--dur-med) var(--ease);
    }
    .platform-row:hover {
      background:
        linear-gradient(135deg, color-mix(in oklab, var(--p) 6%, white), white 64%),
        radial-gradient(circle at 0% 50%, color-mix(in oklab, var(--p) 7%, white), transparent 62%);
      box-shadow: 0 1px 0 oklch(1 0 0 / 0.8) inset, 0 7px 16px oklch(0.35 0.03 250 / 0.09);
      transform: translateY(-1px);
    }
    .platform-row.on {
      background:
        linear-gradient(135deg, color-mix(in oklab, var(--p) 9%, white), white 66%),
        radial-gradient(circle at 8% 40%, color-mix(in oklab, var(--p) 11%, white), transparent 58%);
      box-shadow: 0 1px 0 oklch(1 0 0 / 0.84) inset, 0 7px 17px var(--p-glow);
    }
    .platform-chip {
      border: 0;
      outline: none;
      background: linear-gradient(160deg, var(--p-mid), var(--p-soft));
      color: var(--p);
      cursor: pointer;
      border-radius: 14px;
      width: 46px;
      height: 46px;
      min-height: 46px;
      padding: 0;
      display: inline-grid;
      place-items: center;
      box-shadow:
        0 1px 0 oklch(1 0 0 / 0.55) inset,
        0 4px 10px color-mix(in oklab, var(--p) 14%, transparent);
      transition: background var(--dur-med) var(--ease), color var(--dur-med) var(--ease), transform var(--dur-med) var(--ease), box-shadow var(--dur-med) var(--ease);
    }
    .platform-chip:hover {
      transform: translateY(-1px) scale(1.03);
      box-shadow:
        0 1px 0 oklch(1 0 0 / 0.65) inset,
        0 7px 14px color-mix(in oklab, var(--p) 19%, transparent);
    }
    .platform-chip:focus-visible {
      outline: none;
      box-shadow:
        0 1px 0 oklch(1 0 0 / 0.55) inset,
        0 0 0 3px color-mix(in oklab, var(--p) 18%, transparent),
        0 6px 14px color-mix(in oklab, var(--p) 18%, transparent);
    }
    .platform-chip.on {
      background: linear-gradient(145deg, color-mix(in oklab, var(--p) 82%, white), var(--p));
      color: var(--p-ink);
      box-shadow:
        0 1px 0 oklch(1 0 0 / 0.28) inset,
        0 7px 15px color-mix(in oklab, var(--p) 22%, transparent);
    }
    .platform-chip .ico {
      width: 20px;
      height: 20px;
      display: block;
    }
    .platform-row input {
      min-height: 46px;
      border-radius: 12px;
      padding: 8px 12px;
      font: 500 13px var(--body);
      border: 0;
      color: var(--ink);
      background: color-mix(in oklab, white 96%, var(--p-soft));
      box-shadow: 0 2px 7px oklch(0.35 0.03 250 / 0.06);
      transition: box-shadow var(--dur-med) var(--ease), background var(--dur-med) var(--ease), transform var(--dur-med) var(--ease);
    }
    .platform-row input:focus {
      outline: none;
      background: white;
      box-shadow:
        0 0 0 3px color-mix(in oklab, var(--p) 15%, transparent),
        0 5px 13px color-mix(in oklab, var(--p) 12%, transparent);
    }
    .platform-row.on input {
      background: white;
      box-shadow: 0 3px 9px color-mix(in oklab, var(--p) 9%, transparent);
    }
    .hint {
      margin: 0;
      font-size: 12px;
      color: var(--warn);
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 10px;
      border-radius: 10px;
      background: oklch(0.97 0.03 55);
      border: 0;
      box-shadow: 0 4px 14px oklch(0.55 0.14 40 / 0.14);
      opacity: 1;
      transform: translateY(0);
      max-height: 120px;
      overflow: hidden;
      transition:
        opacity var(--dur-med) var(--ease-out),
        transform var(--dur-med) var(--ease-out),
        max-height var(--dur-med) var(--ease),
        padding var(--dur-med) var(--ease),
        margin var(--dur-med) var(--ease),
        visibility 0s linear 0s;
    }
    .hint.hidden {
      opacity: 0;
      transform: translateY(-6px);
      max-height: 0;
      padding-top: 0;
      padding-bottom: 0;
      margin: 0;
      pointer-events: none;
      visibility: hidden;
      transition:
        opacity var(--dur-fast) var(--ease-in),
        transform var(--dur-fast) var(--ease-in),
        max-height var(--dur-med) var(--ease-in),
        padding var(--dur-fast) var(--ease-in),
        margin var(--dur-fast) var(--ease-in),
        visibility 0s linear var(--dur-med);
    }
    .helper {
      margin: 0;
      font-size: 12px;
      color: var(--muted);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .helper .ico { color: var(--accent); }
    .fx-block {
      display: grid;
      gap: 8px;
      padding: 12px;
      border-radius: 14px;
      background: oklch(0.985 0.008 230);
      border: 0;
      box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.8), 0 6px 16px oklch(0.4 0.03 250 / 0.06);
      transition:
        box-shadow var(--dur-med) var(--ease),
        transform var(--dur-med) var(--ease),
        padding var(--dur-med) var(--ease);
    }
    .fx-block.field.hidden { padding-block: 0; }
    .fx-block:hover {
      box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.85), 0 8px 20px oklch(0.48 0.12 230 / 0.1);
    }
    .fx-block .label { display: inline-flex; align-items: center; gap: 6px; }
    .workspace {
      display: grid;
      gap: 16px;
      animation: rise-in var(--dur-slow) var(--ease-out) 120ms both;
    }
    .preview {
      background:
        linear-gradient(180deg, oklch(0.995 0.005 230), oklch(0.98 0.01 240)),
        radial-gradient(circle at 50% 0%, oklch(0.94 0.03 230 / 0.5), transparent 55%);
      border: 0;
      border-radius: 20px;
      padding: clamp(16px, 3vw, 32px);
      min-height: 280px;
      display: grid;
      place-items: center;
      box-shadow: var(--shadow);
      position: relative;
      transition: box-shadow var(--dur-med) var(--ease);
    }
    .preview::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(
        105deg,
        transparent 35%,
        oklch(1 0 0 / 0.45) 50%,
        transparent 65%
      );
      background-size: 220% 100%;
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--dur-med) var(--ease);
    }
    .preview.loading::after {
      opacity: 1;
      animation: shimmer 1.2s linear infinite;
    }
    .preview img {
      display: block;
      width: 100%;
      max-width: 842px;
      height: auto;
      filter: drop-shadow(0 16px 30px rgba(20, 20, 30, 0.14));
      transition:
        opacity var(--dur-slow) var(--ease-out),
        filter var(--dur-slow) var(--ease-out),
        transform var(--dur-slow) var(--ease-out);
    }
    .preview.loading img {
      opacity: .42;
      filter: drop-shadow(0 10px 18px rgba(20, 20, 30, 0.1)) saturate(0.85) blur(0.4px);
      transform: scale(0.992);
    }
    .embed {
      background: white;
      border: 0;
      border-radius: 16px;
      padding: 14px 16px;
      display: grid;
      gap: 8px;
      box-shadow: var(--shadow-soft);
      transition: box-shadow var(--dur-med) var(--ease);
    }
    .embed-head { display: flex; align-items: center; justify-content: space-between; }
    button.copy {
      border: 0;
      border-radius: 999px;
      padding: 8px 14px;
      background: linear-gradient(145deg, var(--ink), oklch(0.3 0.03 250));
      color: white;
      cursor: pointer;
      font: 600 12px var(--body);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 6px 16px oklch(0.22 0.02 250 / 0.28);
      transition: box-shadow var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease), background var(--dur-med) var(--ease);
    }
    button.copy:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 22px oklch(0.22 0.02 250 / 0.34), 0 0 18px oklch(0.48 0.12 230 / 0.2);
    }
    button.copy:active { transform: translateY(0) scale(0.97); }
    button.copy:focus-visible {
      outline: none;
      box-shadow: var(--glow-strong), 0 8px 18px oklch(0.22 0.02 250 / 0.3);
    }
    button.copy.copied {
      background: linear-gradient(145deg, oklch(0.48 0.12 155), oklch(0.4 0.1 155));
      animation: pulse-glow 0.9s var(--ease-out);
    }
    pre {
      margin: 0;
      padding: 12px 14px;
      border-radius: 10px;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-all;
      background: oklch(0.16 0.02 250);
      color: oklch(0.9 0.03 160);
      font: 12px/1.55 ui-monospace, monospace;
      box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.06), 0 8px 20px oklch(0.16 0.02 250 / 0.28);
      transition: box-shadow var(--dur-med) var(--ease);
    }
    .note { color: var(--muted); font-size: .82rem; margin: 0; }
    @media (max-width: 860px) {
      .layout { grid-template-columns: 1fr; }
      .stack { position: static; max-height: none; overflow: visible; }
    }
  </style>
</head>
<body>
  <main>
    <section id="playground" class="layout" aria-label="Composable card playground">
      <div class="stack">
        <div class="panel">
          <div class="panel-title">
            <div class="panel-title-left">
              <span class="panel-badge">${icon(contentIcon, 15)}</span>
              <span>Content</span>
            </div>
            <span class="panel-count" id="section-count">${CARD_SECTION_NAMES.length - 1} on</span>
          </div>
          <div class="field">
            <span class="label">Sections</span>
            <p class="helper">${icon(sparkIcon, 14)} Search, add, and drag chips to reorder sections</p>
            ${searchSelectMount('sections-select', 'Search sections…', 'multi')}
          </div>
          <div class="field" id="username-field">
            <label for="username">GitHub username</label>
            <div class="input-shell">
              <span class="lead">${icon(userIcon, 16)}</span>
              <input id="username" value="octocat" autocomplete="off" spellcheck="false" placeholder="octocat" />
            </div>
          </div>
          <div class="field" id="skills-field">
            <div class="field-head">
              <span class="label">Skills (<span id="skill-count">5</span>/${MAX_SKILLS})</span>
              <div class="field-actions">
                <button type="button" class="linkish" id="clear-skills">Clear</button>
                <button type="button" class="linkish" id="toggle-labels">Hide labels</button>
              </div>
            </div>
            <div class="skill-picker">
              <div class="search-select" id="skills-search">
                <div class="search-select-control">
                  <span class="search-select-lead">${icon('<path d="M10.5 3a7.5 7.5 0 1 0 4.7 13.3l3.8 3.8 1.4-1.4-3.8-3.8A7.5 7.5 0 0 0 10.5 3Zm0 2a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z"/>', 15)}</span>
                  <input id="skills-filter" class="search-select-input" type="search" placeholder="Search ${SKILL_IDS.length}+ skills…" autocomplete="off" spellcheck="false" />
                </div>
              </div>
              <div class="skill-icon-grid" id="skills-grid" aria-label="Skill icons"></div>
            </div>
          </div>
          <div class="field" id="contact-field">
            <span class="label platform-heading contact">${icon(SECTION_META.contact.icon, 13)} Contact options</span>
            <div class="platform-list">${platformRows('contact', CONTACT_PLATFORM_IDS, CONTACT_CATALOG, DEFAULT_CONTACT)}</div>
            <p class="hint hidden" id="contact-empty">${icon('<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 15h-2v-2h2Zm0-4h-2V7h2Z"/>', 14)} Fill in at least one platform to include this section.</p>
          </div>
          <div class="field" id="donate-field">
            <span class="label platform-heading donate">${icon(SECTION_META.donate.icon, 13)} Donate options</span>
            <div class="platform-list">${platformRows('donate', DONATE_PLATFORM_IDS, DONATE_CATALOG, DEFAULT_DONATE)}</div>
            <p class="hint hidden" id="donate-empty">${icon('<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 15h-2v-2h2Zm0-4h-2V7h2Z"/>', 14)} Fill in at least one platform to include this section.</p>
          </div>
          <div class="field hidden" id="giphy-field">
            <label for="giphy">Giphy GIF</label>
            <p class="helper">${icon(sparkIcon, 14)} Search by keyword, then pick a GIF</p>
            <div class="giphy-picker" id="giphy-picker">
              <div class="input-shell">
                <span class="lead">${icon(gifIcon, 16)}</span>
                <div class="giphy-selected" id="giphy-selected" hidden>
                  <img class="giphy-selected-thumb" id="giphy-selected-thumb" alt="" width="36" height="26" />
                  <span class="giphy-selected-label" id="giphy-selected-label"></span>
                </div>
                <input id="giphy" value="" autocomplete="off" spellcheck="false" placeholder="Search keywords…" />
              </div>
              <ul class="giphy-menu" id="giphy-menu" data-menu role="listbox" hidden></ul>
            </div>
          </div>
          <div class="fx-block field hidden" id="giphy-effects-field">
            <span class="label">${icon(SECTION_META.giphy.icon, 13)} Giphy effect</span>
            ${searchSelectMount('effect-giphy', 'Search giphy effects…', 'single')}
          </div>
        </div>
        <div class="panel">
          <div class="panel-title">
            <div class="panel-title-left">
              <span class="panel-badge">${icon(appearanceIcon, 15)}</span>
              <span>Appearance</span>
            </div>
          </div>
          <div class="field">
            <span class="label">Theme</span>
            ${searchSelectMount('theme-select', 'Search themes…', 'single')}
          </div>
          <div class="field hidden" id="banner-giphy-field">
            <label for="banner-giphy">Banner GIF</label>
            <p class="helper">${icon(sparkIcon, 14)} Search Giphy and pick an animated Nebula banner</p>
            <div class="giphy-picker" id="banner-giphy-picker">
              <div class="input-shell">
                <span class="lead">${icon(gifIcon, 16)}</span>
                <div class="giphy-selected" id="banner-giphy-selected" hidden>
                  <img class="giphy-selected-thumb" id="banner-giphy-selected-thumb" alt="" width="36" height="26" />
                  <span class="giphy-selected-label" id="banner-giphy-selected-label"></span>
                </div>
                <input id="banner-giphy" value="" autocomplete="off" spellcheck="false" placeholder="Search banner GIFs…" />
              </div>
              <ul class="giphy-menu" id="banner-giphy-menu" data-menu role="listbox" hidden></ul>
            </div>
          </div>
          <div class="field">
            <span class="label">Item outline</span>
            <p class="helper">${icon(sparkIcon, 14)} Applies to stats, skills, projects, and link tiles</p>
            ${searchSelectMount('outline-select', 'Search outline styles…', 'single')}
          </div>
        </div>
        <div class="panel">
          <div class="panel-title">
            <div class="panel-title-left">
              <span class="panel-badge">${icon(motionIcon, 15)}</span>
              <span>Motion</span>
            </div>
          </div>
          <div class="fx-block">
            <span class="label">${icon('<path d="M4 12h16M12 4v16"/>', 13)} Background</span>
            ${searchSelectMount('effect-background', 'Search background effects…', 'single')}
          </div>
          <div class="fx-block">
            <span class="label">${icon('<path d="M5 5h14v14H5V5Zm3 3h8v8H8V8Z"/>', 13)} Card</span>
            ${searchSelectMount('effect-card', 'Search card effects…', 'single')}
          </div>
          <div class="fx-block field" id="avatar-effects-field">
            <span class="label">${icon(userIcon, 13)} Avatar</span>
            ${searchSelectMount('effect-avatar', 'Search avatar effects…', 'single')}
          </div>
          <div class="fx-block field" id="stats-effects-field">
            <span class="label">${icon(SECTION_META.stats.icon, 13)} Stats</span>
            ${searchSelectMount('effect-stats', 'Search stats effects…', 'single')}
          </div>
          <div class="fx-block field" id="skills-effects-field">
            <span class="label">${icon(SECTION_META.skills.icon, 13)} Skills</span>
            ${searchSelectMount('effect-skills', 'Search skills effects…', 'single')}
          </div>
          <div class="fx-block field" id="projects-effects-field">
            <span class="label">${icon(SECTION_META.projects.icon, 13)} Projects</span>
            ${searchSelectMount('effect-projects', 'Search projects effects…', 'single')}
          </div>
          <div class="fx-block field" id="contributions-effects-field">
            <span class="label">${icon(SECTION_META.contributions.icon, 13)} Contributions</span>
            ${searchSelectMount('effect-contributions', 'Search contributions effects…', 'single')}
          </div>
          <div class="fx-block field" id="contact-effects-field">
            <span class="label">${icon(SECTION_META.contact.icon, 13)} Contact</span>
            ${searchSelectMount('effect-contact', 'Search contact effects…', 'single')}
          </div>
          <div class="fx-block field" id="donate-effects-field">
            <span class="label">${icon(SECTION_META.donate.icon, 13)} Donate</span>
            ${searchSelectMount('effect-donate', 'Search donate effects…', 'single')}
          </div>
          <p class="note">Legacy <code>/api/profile</code> and <code>/api/skills</code> URLs remain available as wrappers.</p>
        </div>
      </div>
      <div class="workspace">
        <div class="preview" id="preview" aria-live="polite"><img id="card-img" alt="Composable GitHub card preview" width="842" /></div>
        <div class="embed">
          <div class="embed-head"><span class="label">${icon('<path d="M8 4h9a1 1 0 0 1 1 1v14l-5.5-3L7 19V5a1 1 0 0 1 1-1Z"/>', 13)} Markdown embed</span><button type="button" class="copy" id="copy">${icon('<path d="M8 7h9a1 1 0 0 1 1 1v11H8V7Zm-3 3h2v10a1 1 0 0 0 1 1h8v2H6a1 1 0 0 1-1-1V10Z"/>', 13)}<span data-copy-label>Copy</span></button></div>
          <pre id="markdown"></pre>
        </div>
      </div>
    </section>
  </main>
<script>
(() => {
  const origin = ${JSON.stringify(pageOrigin)};
  const catalogs = {
    sections: ${JSON.stringify(sectionOptions)},
    skills: ${JSON.stringify(skillOptions)},
    themes: ${JSON.stringify(themeOptions)},
    outlines: ${JSON.stringify(outlineOptions)},
    effects: ${JSON.stringify(effectCatalog)}
  };
  const maxSkills = ${MAX_SKILLS};
  const state = {
    username: "octocat",
    sections: ${JSON.stringify(CARD_SECTION_NAMES.filter((name) => name !== 'giphy'))},
    skills: new Set(${JSON.stringify([...DEFAULT_SKILLS])}),
    contact: ${JSON.stringify(DEFAULT_CONTACT)},
    donate: ${JSON.stringify(DEFAULT_DONATE)},
    giphy: "coding",
    giphyLabel: "coding",
    giphyPreview: "",
    bannerGiphy: "",
    bannerGiphyLabel: "",
    bannerGiphyPreview: "",
    theme: "default",
    labels: true,
    outline: ${JSON.stringify(DEFAULT_OUTLINE_STYLE)},
    effects: { background: "none", card: "none", avatar: "pulse", stats: "none", skills: "none", projects: "none", contributions: "none", contact: "none", donate: "none", giphy: "none" }
  };
  const image = document.getElementById("card-img");
  const preview = document.getElementById("preview");
  const output = document.getElementById("markdown");
  const skillCount = document.getElementById("skill-count");
  const sectionCount = document.getElementById("section-count");
  const labelsToggle = document.getElementById("toggle-labels");
  let timer = 0;
  let openSelect = null;

  function serializePlatforms(map) {
    return Object.entries(map)
      .filter(([, row]) => row.on && row.value.trim())
      .map(([id, row]) => id + ":" + row.value.trim())
      .join(",");
  }

  function cardUrl() {
    const sections = state.sections;
    const params = new URLSearchParams({ sections: sections.join(","), theme: state.theme });
    if (sections.includes("profile") || sections.includes("stats") || sections.includes("projects") || sections.includes("contributions")) {
      params.set("username", state.username || "octocat");
    }
    if (sections.includes("skills")) {
      const skills = [...state.skills];
      params.set("skills", (skills.length ? skills : ["typescript"]).join(","));
      if (!state.labels) params.set("labels", "false");
    }
    if (sections.includes("contact")) {
      params.set("contact", serializePlatforms(state.contact) || "email:hello@example.com");
    }
    if (sections.includes("donate")) {
      params.set("donate", serializePlatforms(state.donate) || ("github-sponsors:" + (state.username || "octocat")));
    }
    if (sections.includes("giphy")) {
      params.set("giphy", state.giphy.trim() || "coding");
    }
    if (state.theme === "nebula" && sections.includes("profile") && state.bannerGiphy) {
      params.set("bannerGiphy", state.bannerGiphy);
    }
    const effects = [];
    if (state.effects.background !== "none") effects.push("background:" + state.effects.background);
    if (state.effects.card !== "none") effects.push("card:" + state.effects.card);
    if (sections.includes("profile") && state.effects.avatar !== "none") {
      effects.push("avatar:" + state.effects.avatar);
    }
    for (const section of ["stats", "skills", "projects", "contributions", "contact", "donate", "giphy"]) {
      if (sections.includes(section) && state.effects[section] !== "none") {
        effects.push(section + ":" + state.effects[section]);
      }
    }
    if (effects.length) params.set("effects", effects.join(","));
    if (state.outline !== ${JSON.stringify(DEFAULT_OUTLINE_STYLE)}) params.set("outline", state.outline);
    return origin + "/api/card?" + params.toString();
  }

  function setHidden(id, hidden) {
    document.getElementById(id)?.classList.toggle("hidden", hidden);
  }

  function syncVisibility() {
    const has = (name) => state.sections.includes(name);
    setHidden("username-field", !(has("profile") || has("stats") || has("projects") || has("contributions")));
    setHidden("skills-field", !has("skills"));
    setHidden("contact-field", !has("contact"));
    setHidden("donate-field", !has("donate"));
    setHidden("giphy-field", !has("giphy"));
    setHidden("banner-giphy-field", state.theme !== "nebula" || !has("profile"));
    setHidden("avatar-effects-field", !has("profile"));
    setHidden("stats-effects-field", !has("stats"));
    setHidden("skills-effects-field", !has("skills"));
    setHidden("projects-effects-field", !has("projects"));
    setHidden("contributions-effects-field", !has("contributions"));
    setHidden("contact-effects-field", !has("contact"));
    setHidden("donate-effects-field", !has("donate"));
    setHidden("giphy-effects-field", !has("giphy"));
    const contactFilled = !!serializePlatforms(state.contact);
    const donateFilled = !!serializePlatforms(state.donate);
    setHidden("contact-empty", !has("contact") || contactFilled);
    setHidden("donate-empty", !has("donate") || donateFilled);
    skillCount.textContent = String(state.skills.size);
    const nextSectionCount = state.sections.length + " on";
    if (sectionCount.textContent !== nextSectionCount) {
      sectionCount.textContent = nextSectionCount;
      sectionCount.classList.remove("bump");
      void sectionCount.offsetWidth;
      sectionCount.classList.add("bump");
    }
    labelsToggle.textContent = state.labels ? "Hide labels" : "Show labels";
  }

  function refresh() {
    syncVisibility();
    const url = cardUrl();
    preview.classList.add("loading");
    image.onload = image.onerror = () => preview.classList.remove("loading");
    image.src = url;
    output.textContent = "![GitHub card](" + url + ")";
  }

  function getMenu(root) {
    return root._searchMenu || root.querySelector("[data-menu]");
  }

    function positionMenu(root) {
    const menu = getMenu(root);
    const control =
      root.querySelector(".search-select-control") ||
      root.querySelector(".input-shell");
    if (!menu || !control || menu.hidden) return;
    // Portal to body so later panels (e.g. Appearance) cannot cover the menu.
    root._searchMenu = menu;
    if (menu.parentElement !== document.body) {
      document.body.appendChild(menu);
    }
    const rect = control.getBoundingClientRect();
    const gap = 4;
    const maxHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom - gap - 8;
    const spaceAbove = rect.top - gap - 8;
    const openUp = spaceBelow < 140 && spaceAbove > spaceBelow;
    const height = Math.max(120, Math.min(maxHeight, openUp ? spaceAbove : spaceBelow));
    menu.classList.add("is-fixed");
    menu.style.width = rect.width + "px";
    menu.style.maxHeight = height + "px";
    menu.style.left = rect.left + "px";
    if (openUp) {
      menu.style.top = "auto";
      menu.style.bottom = (window.innerHeight - rect.top + gap) + "px";
    } else {
      menu.style.bottom = "auto";
      menu.style.top = (rect.bottom + gap) + "px";
    }
  }

  function finishCloseMenu(root, menu) {
    if (!menu || menu._closeToken !== root._closeToken) return;
    menu.hidden = true;
    menu.classList.remove("is-fixed", "is-leaving", "is-entering");
    menu.style.cssText = "";
    if (menu.parentElement !== root) root.appendChild(menu);
  }

  function closeSelect(root, immediate = false) {
    if (!root) return;
    root.classList.remove("open");
    const menu = getMenu(root);
    if (openSelect === root) openSelect = null;
    if (!menu) return;
    const token = (root._closeToken || 0) + 1;
    root._closeToken = token;
    menu._closeToken = token;
    if (immediate || menu.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishCloseMenu(root, menu);
      return;
    }
    menu.classList.remove("is-entering");
    menu.classList.add("is-leaving");
    const done = () => finishCloseMenu(root, menu);
    menu.addEventListener("transitionend", done, { once: true });
    clearTimeout(menu._closeTimer);
    menu._closeTimer = setTimeout(done, 240);
  }

  function openMenu(root) {
    if (openSelect && openSelect !== root) closeSelect(openSelect, true);
    root.classList.add("open");
    const menu = getMenu(root);
    openSelect = root;
    if (!menu) return;
    root._closeToken = (root._closeToken || 0) + 1;
    menu._closeToken = root._closeToken;
    clearTimeout(menu._closeTimer);
    menu.classList.remove("is-leaving");
    menu.hidden = false;
    menu.classList.add("is-entering");
    positionMenu(root);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (menu._closeToken !== root._closeToken) return;
        menu.classList.remove("is-entering");
      });
    });
  }

  function matchesQuery(option, query) {
    if (!query) return true;
    const haystack = [option.id, option.label, option.hint || ""].join(" ").toLowerCase();
    return haystack.includes(query);
  }

  function optionButton(option, selected) {
    const swatch = option.swatch
      ? '<span class="swatch" style="background:' + option.swatch + '"></span>'
      : "";
    const hint = option.hint
      ? '<span class="search-option-hint">' + option.hint + '</span>'
      : "";
    return '<li><button type="button" class="search-option' + (selected ? " on" : "") + '" data-option="' + option.id + '" role="option" aria-selected="' + selected + '">' +
      swatch +
      '<span class="search-option-copy"><span class="search-option-label">' + option.label + '</span>' + hint + '</span>' +
      '</button></li>';
  }

  function mountSearchSelect(root, config) {
    const input = root.querySelector(".search-select-input");
    const menu = root.querySelector("[data-menu]");
    const tags = root.querySelector("[data-tags]");
    const valueEl = root.querySelector("[data-value]");
    const mode = root.dataset.mode;
    const reorderable = mode === "multi" && typeof config.onReorder === "function";
    let dragId = null;
    root._searchMenu = menu;

    function selectedIds() {
      return config.getSelected();
    }

    function clearDragMarks() {
      tags.querySelectorAll(".dragging, .drag-over").forEach((el) => {
        el.classList.remove("dragging", "drag-over");
      });
    }

    function renderTags() {
      if (mode !== "multi") {
        tags.innerHTML = "";
        return;
      }
      const byId = new Map(config.options.map((option) => [option.id, option]));
      tags.innerHTML = selectedIds()
        .map((id) => {
          const option = byId.get(id);
          if (!option) return "";
          const dragAttrs = reorderable
            ? ' draggable="true" data-tag="' + option.id + '" title="Drag to reorder"'
            : "";
          return '<span class="search-tag"' + dragAttrs + '>' + option.label +
            '<button type="button" data-remove="' + option.id + '" aria-label="Remove ' + option.label + '">×</button></span>';
        })
        .join("");
    }

    function renderValue() {
      if (mode !== "single") {
        valueEl.hidden = true;
        return;
      }
      const selected = selectedIds()[0];
      const option = config.options.find((item) => item.id === selected);
      // Keep the selected chip beside the search icon (not right-aligned).
      // Hide it while typing so the input can use the full width.
      const searching = input.value.trim().length > 0;
      valueEl.hidden = !option || searching;
      valueEl.textContent = option ? option.label : "";
      valueEl.title = option ? option.label : "";
    }

    function renderMenu() {
      const query = input.value.trim().toLowerCase();
      const selected = new Set(selectedIds());
      let options = config.options.filter((option) => matchesQuery(option, query));
      if (mode === "multi" && config.hideSelected) {
        options = options.filter((option) => !selected.has(option.id));
      }
      options = options.slice(0, config.limit || 12);
      if (!options.length) {
        menu.innerHTML = '<li class="search-empty">No matches</li>';
      } else {
        menu.innerHTML = options
          .map((option) => optionButton(option, selected.has(option.id)))
          .join("");
      }
      if (!menu.hidden) positionMenu(root);
    }

    function sync() {
      renderTags();
      renderValue();
      if (!menu.hidden) renderMenu();
    }

    input.addEventListener("focus", () => {
      openMenu(root);
      renderMenu();
    });
    input.addEventListener("input", () => {
      openMenu(root);
      renderValue();
      renderMenu();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeSelect(root);
        input.blur();
      }
      if (event.key === "Enter") {
        const first = menu.querySelector("[data-option]");
        if (first) {
          event.preventDefault();
          first.click();
        }
      }
    });

    menu.addEventListener("mousedown", (event) => event.preventDefault());
    menu.addEventListener("click", (event) => {
      const button = event.target.closest("[data-option]");
      if (!button) return;
      config.onSelect(button.dataset.option);
      input.value = "";
      if (mode === "single") closeSelect(root);
      else {
        renderMenu();
        input.focus();
      }
      sync();
      refresh();
    });

    tags.addEventListener("click", (event) => {
      const button = event.target.closest("[data-remove]");
      if (!button) return;
      config.onRemove(button.dataset.remove);
      sync();
      refresh();
    });

    if (reorderable) {
      tags.addEventListener("dragstart", (event) => {
        const tag = event.target.closest("[data-tag]");
        if (!tag || event.target.closest("[data-remove]")) {
          event.preventDefault();
          return;
        }
        dragId = tag.dataset.tag;
        tag.classList.add("dragging");
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", dragId);
      });
      tags.addEventListener("dragend", () => {
        clearDragMarks();
        dragId = null;
      });
      tags.addEventListener("dragover", (event) => {
        if (!dragId) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        const over = event.target.closest("[data-tag]");
        tags.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
        if (over && over.dataset.tag !== dragId) over.classList.add("drag-over");
      });
      tags.addEventListener("dragleave", (event) => {
        const over = event.target.closest("[data-tag]");
        if (over && !tags.contains(event.relatedTarget)) {
          over.classList.remove("drag-over");
        }
      });
      tags.addEventListener("drop", (event) => {
        event.preventDefault();
        const over = event.target.closest("[data-tag]");
        const fromId = dragId || event.dataTransfer.getData("text/plain");
        clearDragMarks();
        dragId = null;
        if (!over || !fromId || over.dataset.tag === fromId) return;
        config.onReorder(fromId, over.dataset.tag);
        sync();
        refresh();
      });
    }

    root._syncSearchSelect = sync;
    sync();
  }

  mountSearchSelect(document.getElementById("sections-select"), {
    options: catalogs.sections,
    hideSelected: true,
    limit: 12,
    getSelected: () => state.sections.slice(),
    onSelect: (id) => {
      if (!state.sections.includes(id)) state.sections.push(id);
    },
    onRemove: (id) => {
      if (state.sections.length <= 1) return;
      state.sections = state.sections.filter((section) => section !== id);
    },
    onReorder: (fromId, toId) => {
      const from = state.sections.indexOf(fromId);
      const to = state.sections.indexOf(toId);
      if (from < 0 || to < 0 || from === to) return;
      const next = state.sections.slice();
      next.splice(from, 1);
      next.splice(to, 0, fromId);
      state.sections = next;
    }
  });

  const skillsFilter = document.getElementById("skills-filter");
  const skillsGrid = document.getElementById("skills-grid");
  const clearSkills = document.getElementById("clear-skills");

  function syncClearSkills() {
    clearSkills.disabled = state.skills.size === 0;
  }

  function renderSkillsPicker() {
    const query = (skillsFilter.value || "").trim().toLowerCase();
    const selected = state.skills;
    const matches = catalogs.skills.filter((skill) => {
      if (!query) return true;
      return [skill.id, skill.label, skill.category].join(" ").toLowerCase().includes(query);
    });
    syncClearSkills();
    if (!matches.length) {
      skillsGrid.innerHTML = '<div class="search-empty">No matching skills</div>';
      return;
    }
    skillsGrid.innerHTML = matches.map((skill) => {
      const on = selected.has(skill.id) ? " on" : "";
      return '<button type="button" class="skill-icon-btn' + on + '" data-skill="' + skill.id + '" title="' + skill.label + '" aria-pressed="' + selected.has(skill.id) + '">' +
        '<span class="skill-icon-mark"><svg viewBox="0 0 256 256" aria-hidden="true">' + skill.body + '</svg></span>' +
        '<span class="skill-icon-name">' + skill.label + '</span></button>';
    }).join("");
  }

  skillsFilter.addEventListener("input", renderSkillsPicker);
  skillsGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-skill]");
    if (!button) return;
    const id = button.dataset.skill;
    if (state.skills.has(id)) state.skills.delete(id);
    else if (state.skills.size < maxSkills) state.skills.add(id);
    renderSkillsPicker();
    refresh();
  });
  clearSkills.addEventListener("click", () => {
    if (!state.skills.size) return;
    state.skills.clear();
    renderSkillsPicker();
    refresh();
  });
  renderSkillsPicker();

  mountSearchSelect(document.getElementById("theme-select"), {
    options: catalogs.themes,
    limit: 12,
    getSelected: () => [state.theme],
    onSelect: (id) => { state.theme = id; },
    onRemove: () => {}
  });

  mountSearchSelect(document.getElementById("outline-select"), {
    options: catalogs.outlines,
    limit: 12,
    getSelected: () => [state.outline],
    onSelect: (id) => { state.outline = id; },
    onRemove: () => {}
  });

  for (const scope of Object.keys(catalogs.effects)) {
    mountSearchSelect(document.getElementById("effect-" + scope), {
      options: catalogs.effects[scope],
      limit: 12,
      getSelected: () => [state.effects[scope]],
      onSelect: (id) => { state.effects[scope] = id; },
      onRemove: () => {}
    });
  }

  document.addEventListener("click", (event) => {
    if (!openSelect) return;
    const menu = getMenu(openSelect);
    const insideControl = openSelect.contains(event.target);
    const insideMenu = menu && menu.contains(event.target);
    if (!insideControl && !insideMenu) closeSelect(openSelect);
  });

  function repositionOpenMenu() {
    if (openSelect) positionMenu(openSelect);
  }
  window.addEventListener("resize", repositionOpenMenu);
  document.querySelector(".stack")?.addEventListener("scroll", repositionOpenMenu, { passive: true });

  document.getElementById("username").addEventListener("input", (event) => {
    state.username = event.target.value.trim().toLowerCase();
    const linkedUsername = state.username || "octocat";
    state.contact.github.value = linkedUsername;
    state.donate["github-sponsors"].value = linkedUsername;
    const githubContact = document.querySelector('[data-platform-kind="contact"][data-platform="github"] [data-platform-value]');
    const githubSponsors = document.querySelector('[data-platform-kind="donate"][data-platform="github-sponsors"] [data-platform-value]');
    if (githubContact) githubContact.value = linkedUsername;
    if (githubSponsors) githubSponsors.value = linkedUsername;
    clearTimeout(timer);
    timer = setTimeout(refresh, 300);
  });

  function escapeAttr(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function mountGiphyPicker({ id, stateKey, labelKey, previewKey }) {
    const picker = document.getElementById(id + "-picker");
    const input = document.getElementById(id);
    const menu = document.getElementById(id + "-menu");
    const selectedDisplay = document.getElementById(id + "-selected");
    const selectedThumb = document.getElementById(id + "-selected-thumb");
    const selectedLabel = document.getElementById(id + "-selected-label");
    let searchTimer = 0;
    let searchToken = 0;
    picker._searchMenu = menu;

    function syncSelected() {
      const searching = input.value.trim().length > 0;
      const hasPick = !!state[previewKey];
      selectedDisplay.hidden = !hasPick || searching;
      selectedLabel.textContent = state[labelKey] || "";
      selectedLabel.title = state[labelKey] || "";
      if (state[previewKey]) {
        selectedThumb.hidden = false;
        selectedThumb.src = state[previewKey];
      } else {
        selectedThumb.removeAttribute("src");
        selectedThumb.hidden = true;
      }
    }

    function renderMenu(results, status) {
      if (status === "loading") {
        menu.innerHTML = '<li class="search-empty">Searching Giphy…</li>';
        return;
      }
      if (status === "error") {
        menu.innerHTML = '<li class="search-empty">Could not load GIFs</li>';
        return;
      }
      if (status === "empty-query") {
        menu.innerHTML = '<li class="search-empty">Type a keyword to search</li>';
        return;
      }
      if (!results.length) {
        menu.innerHTML = '<li class="search-empty">No GIFs matched</li>';
        return;
      }
      menu.innerHTML = results.map((hit) => {
        const selected = hit.id === state[stateKey] ? " on" : "";
        const title = hit.title || "Giphy GIF";
        return '<li><button type="button" class="giphy-option' + selected + '" data-giphy-id="' + escapeAttr(hit.id) + '" data-giphy-title="' + escapeAttr(title) + '" data-giphy-preview="' + escapeAttr(hit.previewUrl) + '" role="option" aria-label="' + escapeAttr(title) + '" aria-selected="' + (hit.id === state[stateKey]) + '" title="' + escapeAttr(title) + '">' +
          '<img class="giphy-thumb" src="' + escapeAttr(hit.previewUrl) + '" alt="" width="96" height="72" loading="lazy" /></button></li>';
      }).join("");
    }

    function openPickerMenu() {
      openMenu(picker);
    }

    function closePickerMenu() {
      closeSelect(picker);
    }

    async function searchCandidates(query) {
      const token = ++searchToken;
      const trimmed = (query || "").trim();
      if (!trimmed) {
        renderMenu([], "empty-query");
        openPickerMenu();
        return;
      }
      renderMenu([], "loading");
      openPickerMenu();
      try {
        const response = await fetch(origin + "/api/giphy/search?q=" + encodeURIComponent(trimmed) + "&limit=8");
        const body = await response.json();
        if (token !== searchToken) return;
        if (!response.ok) {
          renderMenu([], "error");
          return;
        }
        renderMenu(body.results || [], "ok");
        positionMenu(picker);
      } catch {
        if (token !== searchToken) return;
        renderMenu([], "error");
      }
    }

    function scheduleSearch() {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchCandidates(input.value);
      }, 280);
    }

    function pick(idValue, title, previewUrl) {
      state[stateKey] = idValue;
      state[labelKey] = title || idValue;
      state[previewKey] = previewUrl || "";
      input.value = "";
      syncSelected();
      closePickerMenu();
      refresh();
    }

    input.addEventListener("focus", () => {
      syncSelected();
      const typed = input.value.trim();
      if (typed) {
        searchCandidates(typed);
        return;
      }
      if (!state[previewKey] && state[stateKey]) {
        input.value = state[stateKey];
        syncSelected();
        searchCandidates(state[stateKey]);
        return;
      }
      renderMenu([], "empty-query");
      openPickerMenu();
    });

    input.addEventListener("input", () => {
      syncSelected();
      scheduleSearch();
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closePickerMenu();
        input.blur();
      }
      if (event.key === "Enter") {
        const first = menu.querySelector("[data-giphy-id]");
        if (first) {
          event.preventDefault();
          pick(first.dataset.giphyId, first.dataset.giphyTitle, first.dataset.giphyPreview);
        }
      }
    });

    menu.addEventListener("mousedown", (event) => event.preventDefault());
    menu.addEventListener("click", (event) => {
      const button = event.target.closest("[data-giphy-id]");
      if (!button) return;
      pick(button.dataset.giphyId, button.dataset.giphyTitle, button.dataset.giphyPreview);
    });

    syncSelected();
  }

  mountGiphyPicker({
    id: "giphy",
    stateKey: "giphy",
    labelKey: "giphyLabel",
    previewKey: "giphyPreview"
  });
  mountGiphyPicker({
    id: "banner-giphy",
    stateKey: "bannerGiphy",
    labelKey: "bannerGiphyLabel",
    previewKey: "bannerGiphyPreview"
  });

  labelsToggle.addEventListener("click", () => {
    state.labels = !state.labels;
    refresh();
  });

  document.querySelectorAll("[data-platform-kind]").forEach((row) => {
    const kind = row.dataset.platformKind;
    const id = row.dataset.platform;
    const toggle = row.querySelector("[data-platform-toggle]");
    const input = row.querySelector("[data-platform-value]");
    toggle.addEventListener("click", () => {
      state[kind][id].on = !state[kind][id].on;
      toggle.classList.toggle("on", state[kind][id].on);
      row.classList.toggle("on", state[kind][id].on);
      toggle.setAttribute("aria-pressed", String(state[kind][id].on));
      refresh();
    });
    input.addEventListener("input", (event) => {
      state[kind][id].value = event.target.value;
      clearTimeout(timer);
      timer = setTimeout(refresh, 300);
    });
  });

  document.getElementById("copy").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    await navigator.clipboard.writeText(output.textContent || "");
    const label = button.querySelector("[data-copy-label]");
    button.classList.add("copied");
    if (label) label.textContent = "Copied";
    clearTimeout(button._copiedTimer);
    button._copiedTimer = setTimeout(() => {
      button.classList.remove("copied");
      if (label) label.textContent = "Copy";
    }, 1200);
  });

  refresh();
})();
</script>
</body>
</html>`
}
