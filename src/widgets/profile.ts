import {
  type EffectName,
  resolveEffectName,
} from '../effects/index.js'
import { escapeXml, truncateText } from '../lib/svg.js'
import { getTheme, type ThemeName } from '../themes/index.js'

export const PROFILE_CARD_WIDTH = 842
export const PROFILE_CARD_HEIGHT = 236

export interface ProfileCardData {
  readonly login: string
  readonly name: string | null
  readonly bio: string | null
  readonly avatarDataUrl: string
  readonly followers: number
  readonly repositories: number
  readonly stars: number
  readonly contributions: number
}

/** Compact 16×16 filled icons. */
const ICONS = {
  github:
    'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.65 7.65 0 0 1 8 3.87c.68.003 1.36.092 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z',
  users:
    'M10.39 8.61a3.04 3.04 0 1 0-4.78 0A4.76 4.76 0 0 0 2.5 13v.75h11V13a4.76 4.76 0 0 0-3.11-4.39zm4.36-1.36a2.2 2.2 0 1 0-2.2-2.2 2.2 2.2 0 0 0 2.2 2.2zm.75 1.5a3.9 3.9 0 0 1 2 3.4v.75h-2.1a5.7 5.7 0 0 0-.65-3.7 3.8 3.8 0 0 0-1.25-.45z',
  repo: 'M4 1.5A1.5 1.5 0 0 0 2.5 3v10.5A1.5 1.5 0 0 0 4 15h.75V1.5zm2.25 0V15h6.25A1.5 1.5 0 0 0 14 13.5V3A1.5 1.5 0 0 0 12.5 1.5zm1.5 2.25h4v1.25h-4zm0 2.5h4V7.5h-4zm0 2.5h3V10h-3z',
  star: 'M8 1.25l1.94 3.93 4.34.63-3.14 3.06.74 4.32L8 11.15l-3.88 2.04.74-4.32L1.72 5.81l4.34-.63z',
  activity:
    'M9.6 1.5 6.85 8H2.5v1.5h5.15L10.4 3.2 13.15 14.5H16V13h-1.9z',
} as const

type StatKey = 'followers' | 'repositories' | 'stars' | 'contributions'

interface StatDefinition {
  readonly key: StatKey
  readonly label: string
  readonly icon: keyof typeof ICONS
}

const STATS: readonly StatDefinition[] = [
  { key: 'followers', label: 'Followers', icon: 'users' },
  { key: 'repositories', label: 'Repositories', icon: 'repo' },
  { key: 'stars', label: 'Stars', icon: 'star' },
  { key: 'contributions', label: 'Contributions', icon: 'activity' },
]

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(
    value,
  )
}

function iconMarkup(
  name: keyof typeof ICONS,
  x: number,
  y: number,
  size: number,
  color: string,
): string {
  const scale = size / 16
  return `<g transform="translate(${x} ${y}) scale(${scale})" aria-hidden="true">
      <path d="${ICONS[name]}" fill="${color}" />
    </g>`
}

interface EffectIds {
  readonly aurora: string
  readonly shimmer: string
  readonly glow: string
  readonly comet: string
  readonly scan: string
  readonly cardClip: string
}

function renderEffectDefs(
  effect: EffectName,
  theme: ReturnType<typeof getTheme>,
  ids: EffectIds,
): string {
  const parts: string[] = []

  if (effect === 'aurora') {
    parts.push(`    <linearGradient id="${ids.aurora}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.gradient.from}">
        <animate attributeName="stop-color" values="${theme.gradient.from};${theme.colors.accent};${theme.gradient.to};${theme.gradient.from}" dur="8s" repeatCount="indefinite" />
      </stop>
      <stop offset="50%" stop-color="${theme.colors.accent}">
        <animate attributeName="stop-color" values="${theme.colors.accent};${theme.gradient.to};${theme.gradient.from};${theme.colors.accent}" dur="8s" repeatCount="indefinite" />
      </stop>
      <stop offset="100%" stop-color="${theme.gradient.to}">
        <animate attributeName="stop-color" values="${theme.gradient.to};${theme.gradient.from};${theme.colors.accent};${theme.gradient.to}" dur="8s" repeatCount="indefinite" />
      </stop>
    </linearGradient>`)
  }

  if (effect === 'shimmer') {
    parts.push(`    <linearGradient id="${ids.shimmer}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${theme.colors.foreground}" stop-opacity="0" />
      <stop offset="45%" stop-color="${theme.colors.foreground}" stop-opacity="0" />
      <stop offset="50%" stop-color="${theme.colors.foreground}" stop-opacity="0.18" />
      <stop offset="55%" stop-color="${theme.colors.foreground}" stop-opacity="0" />
      <stop offset="100%" stop-color="${theme.colors.foreground}" stop-opacity="0" />
      <animateTransform attributeName="gradientTransform" type="translate" from="-1 0" to="1 0" dur="3.2s" repeatCount="indefinite" />
    </linearGradient>`)
  }

  if (effect === 'glow') {
    parts.push(`    <radialGradient id="${ids.glow}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${theme.colors.accent}" stop-opacity="0.55">
        <animate attributeName="stop-opacity" values="0.35;0.65;0.35" dur="2.8s" repeatCount="indefinite" />
      </stop>
      <stop offset="70%" stop-color="${theme.colors.accent}" stop-opacity="0.12">
        <animate attributeName="stop-opacity" values="0.08;0.22;0.08" dur="2.8s" repeatCount="indefinite" />
      </stop>
      <stop offset="100%" stop-color="${theme.colors.accent}" stop-opacity="0" />
    </radialGradient>`)
  }

  if (effect === 'comet') {
    parts.push(`    <linearGradient id="${ids.comet}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${theme.colors.accent}" stop-opacity="0" />
      <stop offset="100%" stop-color="${theme.colors.accent}" stop-opacity="0.9" />
    </linearGradient>`)
  }

  if (effect === 'scan') {
    parts.push(`    <linearGradient id="${ids.scan}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${theme.colors.foreground}" stop-opacity="0" />
      <stop offset="50%" stop-color="${theme.colors.foreground}" stop-opacity="0.16" />
      <stop offset="100%" stop-color="${theme.colors.foreground}" stop-opacity="0" />
    </linearGradient>`)
  }

  return parts.join('\n')
}

function renderEffectLayers(
  effect: EffectName,
  theme: ReturnType<typeof getTheme>,
  ids: EffectIds,
): string {
  switch (effect) {
    case 'none':
      return ''
    case 'pulse':
      return `  <circle cx="92" cy="118" r="78" fill="none" stroke="${theme.colors.accent}" stroke-opacity="0.55" stroke-width="2">
    <animate attributeName="r" values="74;82;74" dur="2.4s" repeatCount="indefinite" />
    <animate attributeName="stroke-opacity" values="0.55;0.12;0.55" dur="2.4s" repeatCount="indefinite" />
  </circle>
  <circle cx="92" cy="118" r="84" fill="none" stroke="${theme.colors.accent}" stroke-opacity="0.28" stroke-width="1.5">
    <animate attributeName="r" values="80;90;80" dur="2.4s" begin="0.35s" repeatCount="indefinite" />
    <animate attributeName="stroke-opacity" values="0.28;0.05;0.28" dur="2.4s" begin="0.35s" repeatCount="indefinite" />
  </circle>`
    case 'shimmer':
      return `  <rect x="0" y="0" width="${PROFILE_CARD_WIDTH}" height="${PROFILE_CARD_HEIGHT}" fill="url(#${ids.shimmer})" clip-path="url(#${ids.cardClip})" pointer-events="none" />`
    case 'orbit':
      return `  <g transform="translate(92 118)">
    <g>
      <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="7s" repeatCount="indefinite" />
      <circle cx="0" cy="-86" r="4.5" fill="${theme.colors.accent}" />
      <circle cx="74" cy="43" r="3.2" fill="${theme.colors.accent}" fill-opacity="0.75" />
      <circle cx="-74" cy="43" r="3.2" fill="${theme.colors.accent}" fill-opacity="0.75" />
    </g>
    <g>
      <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="11s" repeatCount="indefinite" />
      <circle cx="62" cy="-58" r="2.4" fill="${theme.colors.foreground}" fill-opacity="0.45" />
      <circle cx="-62" cy="-58" r="2.4" fill="${theme.colors.foreground}" fill-opacity="0.45" />
    </g>
  </g>`
    case 'aurora':
      return ''
    case 'spark': {
      const sparks = [
        [210, 28, 2.2, '0s'],
        [320, 42, 1.8, '0.4s'],
        [460, 24, 2.4, '0.9s'],
        [580, 38, 1.6, '1.2s'],
        [700, 30, 2.1, '0.6s'],
        [780, 52, 1.7, '1.5s'],
        [250, 200, 1.9, '0.3s'],
        [520, 208, 2.3, '1.1s'],
        [680, 196, 1.5, '0.8s'],
        [400, 188, 2.0, '1.7s'],
      ] as const
      return sparks
        .map(
          ([x, y, r, begin], index) =>
            `  <circle cx="${x}" cy="${y}" r="${r}" fill="${index % 2 === 0 ? theme.colors.accent : theme.colors.foreground}" fill-opacity="0.15">
    <animate attributeName="opacity" values="0.15;0.95;0.15" dur="2.6s" begin="${begin}" repeatCount="indefinite" />
    <animate attributeName="r" values="${r};${r * 1.55};${r}" dur="2.6s" begin="${begin}" repeatCount="indefinite" />
  </circle>`,
        )
        .join('\n')
    }
    case 'wave':
      return `  <g clip-path="url(#${ids.cardClip})" opacity="0.55">
    <path fill="${theme.colors.accent}" fill-opacity="0.22" d="M0 200 C 70 186, 140 214, 210 200 S 350 186, 420 200 S 560 214, 630 200 S 770 186, 842 200 L842 236 L0 236 Z">
      <animate attributeName="d" dur="4.5s" repeatCount="indefinite"
        values="M0 200 C 70 186, 140 214, 210 200 S 350 186, 420 200 S 560 214, 630 200 S 770 186, 842 200 L842 236 L0 236 Z;M0 200 C 70 214, 140 186, 210 200 S 350 214, 420 200 S 560 186, 630 200 S 770 214, 842 200 L842 236 L0 236 Z;M0 200 C 70 186, 140 214, 210 200 S 350 186, 420 200 S 560 214, 630 200 S 770 186, 842 200 L842 236 L0 236 Z" />
    </path>
    <path fill="${theme.colors.accent}" fill-opacity="0.14" d="M0 210 C 80 198, 160 222, 240 210 S 400 198, 480 210 S 640 222, 720 210 S 800 198, 842 210 L842 236 L0 236 Z">
      <animate attributeName="d" dur="5.5s" begin="0.4s" repeatCount="indefinite"
        values="M0 210 C 80 198, 160 222, 240 210 S 400 198, 480 210 S 640 222, 720 210 S 800 198, 842 210 L842 236 L0 236 Z;M0 210 C 80 222, 160 198, 240 210 S 400 222, 480 210 S 640 198, 720 210 S 800 222, 842 210 L842 236 L0 236 Z;M0 210 C 80 198, 160 222, 240 210 S 400 198, 480 210 S 640 222, 720 210 S 800 198, 842 210 L842 236 L0 236 Z" />
    </path>
  </g>`
    case 'glow':
      return `  <circle cx="92" cy="118" r="96" fill="url(#${ids.glow})" />`
    case 'beam': {
      const radius = theme.card.radius
      const beamLength = 90
      const perimeter =
        2 * (PROFILE_CARD_WIDTH - 1 + PROFILE_CARD_HEIGHT - 1) -
        8 * radius +
        2 * Math.PI * radius
      const gap = Number(((perimeter - beamLength * 2) / 2).toFixed(1))
      const cycle = beamLength * 2 + gap * 2
      const border = `x="0.5" y="0.5" width="${PROFILE_CARD_WIDTH - 1}" height="${PROFILE_CARD_HEIGHT - 1}" rx="${radius}" fill="none" stroke="${theme.colors.accent}" stroke-linecap="round" stroke-dasharray="${beamLength} ${gap} ${beamLength} ${gap}"`
      return `  <rect ${border} stroke-width="6" stroke-opacity="0.22">
    <animate attributeName="stroke-dashoffset" values="0;-${cycle}" dur="7s" repeatCount="indefinite" />
  </rect>
  <rect ${border} stroke-width="2.5" stroke-opacity="0.9">
    <animate attributeName="stroke-dashoffset" values="0;-${cycle}" dur="7s" repeatCount="indefinite" />
  </rect>`
    }
    case 'comet': {
      const comets = [
        { path: 'M -70 26 L 930 150', tail: 54, radius: 3, dur: 4.2, begin: 0, peak: 1 },
        { path: 'M -60 96 L 920 214', tail: 40, radius: 2.2, dur: 5.6, begin: 2.1, peak: 0.85 },
        { path: 'M -50 -6 L 900 84', tail: 30, radius: 1.8, dur: 3.4, begin: 1.2, peak: 0.7 },
      ] as const
      const bodies = comets
        .map(
          (comet) => `    <g opacity="0">
      <rect x="-${comet.tail}" y="-1.25" width="${comet.tail}" height="2.5" rx="1.25" fill="url(#${ids.comet})" />
      <circle r="${comet.radius}" fill="${theme.colors.accent}" />
      <animateMotion path="${comet.path}" rotate="auto" dur="${comet.dur}s" begin="${comet.begin}s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0;${comet.peak};${comet.peak};0" keyTimes="0;0.08;0.85;1" dur="${comet.dur}s" begin="${comet.begin}s" repeatCount="indefinite" />
    </g>`,
        )
        .join('\n')
      return `  <g clip-path="url(#${ids.cardClip})">
${bodies}
  </g>`
    }
    case 'rain': {
      const drops = [
        { x: 214, length: 14, dur: 2.3, begin: 0 },
        { x: 296, length: 18, dur: 2.9, begin: 0.7 },
        { x: 372, length: 12, dur: 2.1, begin: 1.3 },
        { x: 452, length: 16, dur: 2.6, begin: 0.3 },
        { x: 536, length: 13, dur: 2.2, begin: 1.7 },
        { x: 618, length: 17, dur: 3.1, begin: 0.9 },
        { x: 702, length: 12, dur: 2.4, begin: 1.5 },
        { x: 786, length: 15, dur: 2.7, begin: 0.4 },
      ] as const
      const streaks = drops
        .map(
          (drop) => `    <g opacity="0">
      <line x1="${drop.x}" y1="0" x2="${drop.x}" y2="${drop.length}" />
      <animateTransform attributeName="transform" type="translate" values="0 -24;0 250" dur="${drop.dur}s" begin="${drop.begin}s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0;0.55;0.55;0" keyTimes="0;0.12;0.75;1" dur="${drop.dur}s" begin="${drop.begin}s" repeatCount="indefinite" />
    </g>`,
        )
        .join('\n')
      return `  <g clip-path="url(#${ids.cardClip})" stroke="${theme.colors.accent}" stroke-width="2" stroke-linecap="round">
${streaks}
  </g>`
    }
    case 'halo':
      return `  <g fill="none">
    <circle cx="92" cy="118" r="81" stroke="${theme.colors.accent}" stroke-opacity="0.6" stroke-width="2" stroke-dasharray="4 12" stroke-linecap="round">
      <animateTransform attributeName="transform" type="rotate" from="0 92 118" to="360 92 118" dur="10s" repeatCount="indefinite" />
    </circle>
    <circle cx="92" cy="118" r="88" stroke="${theme.colors.accent}" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="2 10" stroke-linecap="round">
      <animateTransform attributeName="transform" type="rotate" from="360 92 118" to="0 92 118" dur="16s" repeatCount="indefinite" />
    </circle>
  </g>`
    case 'equalizer': {
      const bars = [
        { heights: [6, 16, 8, 20, 6], dur: 1.4, begin: 0 },
        { heights: [10, 22, 12, 18, 10], dur: 1.15, begin: 0.12 },
        { heights: [14, 8, 22, 10, 14], dur: 1.5, begin: 0.3 },
        { heights: [8, 18, 6, 16, 8], dur: 1.05, begin: 0.05 },
        { heights: [16, 10, 20, 8, 16], dur: 1.35, begin: 0.22 },
        { heights: [10, 20, 8, 22, 10], dur: 1.2, begin: 0.4 },
        { heights: [13, 7, 18, 11, 13], dur: 1.45, begin: 0.15 },
        { heights: [7, 15, 9, 19, 7], dur: 1.1, begin: 0.33 },
        { heights: [12, 22, 10, 16, 12], dur: 1.55, begin: 0.26 },
      ] as const
      return bars
        .map((bar, index) => {
          const x = 49 + index * 10
          const first = bar.heights[0]
          const heightValues = bar.heights.join(';')
          const yValues = bar.heights.map((h) => 224 - h).join(';')
          return `  <rect x="${x}" y="${224 - first}" width="6" height="${first}" rx="2" fill="${theme.colors.accent}" fill-opacity="0.85">
    <animate attributeName="height" values="${heightValues}" dur="${bar.dur}s" begin="${bar.begin}s" repeatCount="indefinite" />
    <animate attributeName="y" values="${yValues}" dur="${bar.dur}s" begin="${bar.begin}s" repeatCount="indefinite" />
  </rect>`
        })
        .join('\n')
    }
    case 'float':
      return `  <ellipse cx="92" cy="207" rx="38" ry="5" fill="${theme.colors.foreground}" opacity="0.14">
    <animate attributeName="rx" values="38;33;38;42;38" keyTimes="0;0.25;0.5;0.75;1" dur="5s" repeatCount="indefinite" />
    <animate attributeName="opacity" values="0.14;0.09;0.14;0.18;0.14" keyTimes="0;0.25;0.5;0.75;1" dur="5s" repeatCount="indefinite" />
  </ellipse>`
    case 'neon': {
      const border = `x="0.5" y="0.5" width="${PROFILE_CARD_WIDTH - 1}" height="${PROFILE_CARD_HEIGHT - 1}" rx="${theme.card.radius}" fill="none" stroke="${theme.colors.accent}"`
      return `  <rect ${border} stroke-width="7" stroke-opacity="0.15">
    <animate attributeName="stroke-opacity" values="0.1;0.3;0.12;0.26;0.1" dur="3s" repeatCount="indefinite" />
  </rect>
  <rect ${border} stroke-width="2" stroke-opacity="1">
    <animate attributeName="stroke-opacity" values="1;0.35;1;1;0.3;1;0.7;1" keyTimes="0;0.05;0.1;0.5;0.55;0.6;0.8;1" calcMode="discrete" dur="3s" repeatCount="indefinite" />
  </rect>`
    }
    case 'scan':
      return `  <g clip-path="url(#${ids.cardClip})">
    <g>
      <rect x="0" y="0" width="${PROFILE_CARD_WIDTH}" height="34" fill="url(#${ids.scan})" />
      <rect x="0" y="16" width="${PROFILE_CARD_WIDTH}" height="1.6" fill="${theme.colors.foreground}" fill-opacity="0.3" />
      <animateTransform attributeName="transform" type="translate" values="0 -36;0 ${PROFILE_CARD_HEIGHT + 4}" dur="3.8s" repeatCount="indefinite" />
    </g>
  </g>`
    case 'confetti': {
      const palette = [
        theme.colors.accent,
        theme.colors.muted,
        theme.colors.foreground,
      ]
      const pieces = [
        { x: 220, sway: 26, spin: 420, dur: 4.6, begin: 0 },
        { x: 300, sway: -20, spin: -360, dur: 5.4, begin: 1.1 },
        { x: 380, sway: 18, spin: 300, dur: 4.1, begin: 2.3 },
        { x: 470, sway: -24, spin: 480, dur: 5.8, begin: 0.6 },
        { x: 560, sway: 22, spin: -420, dur: 4.4, begin: 1.8 },
        { x: 640, sway: -16, spin: 360, dur: 5.1, begin: 0.2 },
        { x: 720, sway: 20, spin: -300, dur: 4.8, begin: 2.7 },
        { x: 795, sway: -22, spin: 440, dur: 5.6, begin: 1.4 },
      ] as const
      const fall = pieces
        .map((piece, index) => {
          const color = palette[index % palette.length]
          return `    <g transform="translate(${piece.x} -16)" opacity="0.8">
      <animateTransform attributeName="transform" type="translate" values="${piece.x} -16;${piece.x + piece.sway} 118;${piece.x} 252" keyTimes="0;0.5;1" dur="${piece.dur}s" begin="${piece.begin}s" repeatCount="indefinite" />
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0" to="${piece.spin}" dur="${piece.dur}s" begin="${piece.begin}s" repeatCount="indefinite" />
        <rect x="-2.5" y="-4.5" width="5" height="9" rx="1" fill="${color}" />
      </g>
    </g>`
        })
        .join('\n')
      return `  <g clip-path="url(#${ids.cardClip})">
${fall}
  </g>`
    }
    case 'matrix': {
      const columns = [
        { x: 206, text: '01 10 11 00 01', dur: 4.2, begin: 0 },
        { x: 270, text: '10 01 00 11 10', dur: 5.1, begin: 1.4 },
        { x: 338, text: '11 00 10 01 11', dur: 3.8, begin: 0.7 },
        { x: 410, text: '00 11 01 10 00', dur: 4.7, begin: 2.1 },
        { x: 484, text: '01 01 10 11 00', dur: 5.4, begin: 0.3 },
        { x: 562, text: '10 11 00 01 10', dur: 4.1, begin: 1.8 },
        { x: 640, text: '11 10 01 00 11', dur: 5.7, begin: 0.9 },
        { x: 720, text: '00 01 11 10 01', dur: 4.5, begin: 2.6 },
        { x: 794, text: '01 10 00 11 10', dur: 5, begin: 1.1 },
      ] as const
      const streams = columns
        .map(
          (column, index) => `    <text x="${column.x}" y="-90" font-family="monospace" font-size="10" letter-spacing="2" fill="${theme.colors.accent}" fill-opacity="${index % 3 === 0 ? 0.48 : 0.3}" writing-mode="tb">${column.text}
      <animateTransform attributeName="transform" type="translate" values="0 -80;0 360" dur="${column.dur}s" begin="${column.begin}s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0;1;0.65;0" keyTimes="0;0.15;0.8;1" dur="${column.dur}s" begin="${column.begin}s" repeatCount="indefinite" />
    </text>`,
        )
        .join('\n')
      return `  <g clip-path="url(#${ids.cardClip})">
${streams}
  </g>`
    }
    case 'glitch': {
      const slices = [
        { y: 20, height: 7, shift: 20, begin: 0.1 },
        { y: 48, height: 4, shift: -14, begin: 0.16 },
        { y: 75, height: 9, shift: 28, begin: 0.22 },
        { y: 112, height: 5, shift: -24, begin: 0.28 },
        { y: 148, height: 8, shift: 18, begin: 0.34 },
        { y: 182, height: 4, shift: -30, begin: 0.4 },
        { y: 214, height: 6, shift: 22, begin: 0.46 },
      ] as const
      const strips = slices
        .map(
          (slice, index) => `    <rect x="176" y="${slice.y}" width="666" height="${slice.height}" fill="${index % 2 === 0 ? theme.colors.accent : theme.colors.foreground}" opacity="0">
      <animate attributeName="x" values="176;${176 + slice.shift};176;${176 - slice.shift / 2};176" keyTimes="0;0.18;0.36;0.54;1" dur="3.6s" begin="${slice.begin}s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0;0;0.32;0.08;0;0" keyTimes="0;0.74;0.78;0.83;0.88;1" dur="3.6s" begin="${slice.begin}s" repeatCount="indefinite" />
    </rect>`,
        )
        .join('\n')
      return `  <g clip-path="url(#${ids.cardClip})">
${strips}
    <rect x="0" y="0" width="${PROFILE_CARD_WIDTH}" height="${PROFILE_CARD_HEIGHT}" fill="none" stroke="${theme.colors.accent}" stroke-width="3" opacity="0">
      <animate attributeName="opacity" values="0;0;0.65;0;0.3;0" keyTimes="0;0.76;0.78;0.82;0.85;1" dur="3.6s" repeatCount="indefinite" />
    </rect>
  </g>`
    }
    case 'radar':
      return `  <g clip-path="url(#${ids.cardClip})">
    <g fill="none" stroke="${theme.colors.accent}" transform="translate(700 112)">
      <circle r="86" stroke-opacity="0.16" />
      <circle r="58" stroke-opacity="0.2" />
      <circle r="30" stroke-opacity="0.24" />
      <path d="M0 0 L84 -18 A86 86 0 0 1 82 28 Z" fill="${theme.colors.accent}" fill-opacity="0.16" stroke="none">
        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="5s" repeatCount="indefinite" />
      </path>
      <line x1="0" y1="0" x2="84" y2="-18" stroke-opacity="0.72" stroke-width="2">
        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="5s" repeatCount="indefinite" />
      </line>
      <circle cx="-32" cy="-24" r="3" fill="${theme.colors.accent}" stroke="none">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="2.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="44" cy="30" r="2.5" fill="${theme.colors.accent}" stroke="none">
        <animate attributeName="opacity" values="1;0.2;1" dur="2.8s" repeatCount="indefinite" />
      </circle>
    </g>
  </g>`
    case 'constellation': {
      const nodes = [
        [220, 28],
        [305, 74],
        [386, 30],
        [462, 88],
        [548, 38],
        [626, 94],
        [710, 42],
        [790, 92],
        [266, 206],
        [420, 190],
        [584, 210],
        [744, 194],
      ] as const
      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
        [6, 7], [1, 8], [3, 9], [5, 10], [7, 11], [8, 9],
        [9, 10], [10, 11],
      ] as const
      const lines = edges
        .map(([from, to]) => {
          const a = nodes[from]
          const b = nodes[to]
          return `    <line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" />`
        })
        .join('\n')
      const stars = nodes
        .map(
          ([x, y], index) => `    <circle cx="${x}" cy="${y}" r="${index % 4 === 0 ? 3 : 2}" fill="${theme.colors.accent}" stroke="none">
      <animate attributeName="opacity" values="0.25;0.95;0.25" dur="${2.2 + (index % 5) * 0.45}s" begin="${(index % 4) * 0.3}s" repeatCount="indefinite" />
      <animate attributeName="r" values="${index % 4 === 0 ? 2.2 : 1.5};${index % 4 === 0 ? 3.8 : 2.8};${index % 4 === 0 ? 2.2 : 1.5}" dur="${2.2 + (index % 5) * 0.45}s" begin="${(index % 4) * 0.3}s" repeatCount="indefinite" />
    </circle>`,
        )
        .join('\n')
      return `  <g clip-path="url(#${ids.cardClip})" stroke="${theme.colors.accent}" stroke-opacity="0.16" stroke-width="1">
${lines}
${stars}
    <animateTransform attributeName="transform" type="translate" values="0 0;5 -3;0 0;-4 3;0 0" dur="12s" repeatCount="indefinite" />
  </g>`
    }
    case 'ripple': {
      const ripples = [
        { x: 250, y: 92, begin: 0, max: 190 },
        { x: 520, y: 160, begin: 1.4, max: 230 },
        { x: 770, y: 54, begin: 2.8, max: 180 },
      ] as const
      return ripples
        .map(
          (ripple) => `  <circle cx="${ripple.x}" cy="${ripple.y}" r="4" fill="none" stroke="${theme.colors.accent}" stroke-width="2" opacity="0">
    <animate attributeName="r" values="4;${ripple.max}" dur="4.2s" begin="${ripple.begin}s" repeatCount="indefinite" />
    <animate attributeName="stroke-width" values="3;0.5" dur="4.2s" begin="${ripple.begin}s" repeatCount="indefinite" />
    <animate attributeName="opacity" values="0;0.55;0" keyTimes="0;0.12;1" dur="4.2s" begin="${ripple.begin}s" repeatCount="indefinite" />
  </circle>`,
        )
        .join('\n')
    }
    case 'spotlight':
      return `  <g clip-path="url(#${ids.cardClip})">
    <polygon points="-310,-20 -170,-20 90,256 -160,256" fill="${theme.colors.foreground}" opacity="0.11">
      <animateTransform attributeName="transform" type="translate" values="0 0;1150 0;1150 0;0 0" keyTimes="0;0.45;0.55;1" dur="7s" repeatCount="indefinite" />
    </polygon>
    <polygon points="-250,-20 -205,-20 -10,256 -100,256" fill="${theme.colors.accent}" opacity="0.16">
      <animateTransform attributeName="transform" type="translate" values="0 0;1150 0;1150 0;0 0" keyTimes="0;0.45;0.55;1" dur="7s" repeatCount="indefinite" />
    </polygon>
  </g>`
    case 'vortex':
      return `  <g transform="translate(92 118)" fill="none" stroke="${theme.colors.accent}" stroke-linecap="round">
    <ellipse rx="88" ry="28" stroke-width="2" stroke-opacity="0.7" stroke-dasharray="34 18">
      <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="5s" repeatCount="indefinite" />
    </ellipse>
    <ellipse rx="88" ry="42" stroke-width="1.5" stroke-opacity="0.45" stroke-dasharray="18 14">
      <animateTransform attributeName="transform" type="rotate" from="120" to="-240" dur="8s" repeatCount="indefinite" />
    </ellipse>
    <ellipse rx="84" ry="58" stroke-width="1" stroke-opacity="0.28" stroke-dasharray="10 12">
      <animateTransform attributeName="transform" type="rotate" from="240" to="600" dur="11s" repeatCount="indefinite" />
    </ellipse>
  </g>`
    case 'grid': {
      const verticals = [220, 300, 380, 460, 540, 620, 700, 780]
        .map(
          (x) => `    <line x1="${x}" y1="236" x2="${421 + (x - 421) * 0.18}" y2="112" />`,
        )
        .join('\n')
      const horizontals = [128, 150, 176, 206, 234]
        .map(
          (y, index) => `    <line x1="${180 - index * 20}" y1="${y}" x2="${842 + index * 20}" y2="${y}">
      <animate attributeName="y1" values="${y};${Math.min(y + 28, 236)}" dur="2.8s" begin="${index * 0.18}s" repeatCount="indefinite" />
      <animate attributeName="y2" values="${y};${Math.min(y + 28, 236)}" dur="2.8s" begin="${index * 0.18}s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.12;0.55;0.12" dur="2.8s" begin="${index * 0.18}s" repeatCount="indefinite" />
    </line>`,
        )
        .join('\n')
      return `  <g clip-path="url(#${ids.cardClip})" stroke="${theme.colors.accent}" stroke-opacity="0.2" stroke-width="1">
${verticals}
${horizontals}
    <circle cx="421" cy="112" r="3" fill="${theme.colors.accent}" stroke="none">
      <animate attributeName="r" values="2;8;2" dur="2.8s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.9;0.12;0.9" dur="2.8s" repeatCount="indefinite" />
    </circle>
  </g>`
    }
    default:
      return ''
  }
}

export function renderProfileCard(
  profile: ProfileCardData,
  themeName: ThemeName,
  effectName?: EffectName | string | null,
): string {
  const theme = getTheme(themeName)
  const effect = resolveEffectName(effectName)
  const displayName = truncateText(profile.name?.trim() || profile.login, 40)
  const login = truncateText(profile.login, 39)
  const bio = truncateText(profile.bio?.trim() || 'GitHub profile', 78)
  const title = escapeXml(`${displayName} (@${login})`)
  const description = escapeXml(
    `${bio}. ${formatCount(profile.followers)} followers, ${formatCount(profile.repositories)} repositories, ${formatCount(profile.stars)} stars, and ${formatCount(profile.contributions)} contributions.`,
  )
  const fontFamily = escapeXml(theme.typography.fontFamily)
  const avatarDataUrl = escapeXml(profile.avatarDataUrl)
  const gradientId = `profile-gradient-${theme.name}-${effect}`
  const clipId = `profile-avatar-${theme.name}-${effect}`
  const effectIds: EffectIds = {
    aurora: `profile-aurora-${theme.name}-${effect}`,
    shimmer: `profile-shimmer-${theme.name}-${effect}`,
    glow: `profile-glow-${theme.name}-${effect}`,
    comet: `profile-comet-${theme.name}-${effect}`,
    scan: `profile-scan-${theme.name}-${effect}`,
    cardClip: `profile-card-clip-${theme.name}-${effect}`,
  }
  const fillUrl =
    effect === 'aurora' ? `url(#${effectIds.aurora})` : `url(#${gradientId})`

  const values: Record<StatKey, number> = {
    followers: profile.followers,
    repositories: profile.repositories,
    stars: profile.stars,
    contributions: profile.contributions,
  }

  const statBlocks = STATS.map((stat, index) => {
    const x = 184 + index * 156
    const value = formatCount(values[stat.key])
    return `  <g data-stat="${stat.key}" aria-label="${escapeXml(`${stat.label}: ${value}`)}">
    <rect x="${x}" y="142" width="144" height="72" rx="12" fill="${theme.colors.background}" fill-opacity="0.78" stroke="${theme.colors.border}" />
    <circle cx="${x + 28}" cy="178" r="16" fill="${theme.colors.accent}" fill-opacity="0.14" />
    ${iconMarkup(stat.icon, x + 20, 170, 16, theme.colors.accent)}
    <text x="${x + 52}" y="172" font-family="${fontFamily}" font-size="18" font-weight="700" fill="${theme.colors.foreground}">${escapeXml(value)}</text>
    <text x="${x + 52}" y="192" font-family="${fontFamily}" font-size="11" fill="${theme.colors.muted}">${escapeXml(stat.label)}</text>
  </g>`
  }).join('\n')

  const effectDefs = renderEffectDefs(effect, theme, effectIds)
  const effectLayers = renderEffectLayers(effect, theme, effectIds)
  const avatarAnimation =
    effect === 'float'
      ? `
    <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0;0 5;0 0" keyTimes="0;0.25;0.5;0.75;1" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1" dur="5s" repeatCount="indefinite" />`
      : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PROFILE_CARD_WIDTH}" height="${PROFILE_CARD_HEIGHT}" viewBox="0 0 ${PROFILE_CARD_WIDTH} ${PROFILE_CARD_HEIGHT}" role="img" aria-labelledby="profile-title profile-description" data-theme="${theme.name}" data-effect="${effect}">
  <title id="profile-title">${title}</title>
  <desc id="profile-description">${description}</desc>
  <defs>
    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.gradient.from}" />
      <stop offset="100%" stop-color="${theme.gradient.to}" />
    </linearGradient>
    <clipPath id="${clipId}">
      <circle cx="92" cy="118" r="70" />
    </clipPath>
    <clipPath id="${effectIds.cardClip}">
      <rect x="0.5" y="0.5" width="${PROFILE_CARD_WIDTH - 1}" height="${PROFILE_CARD_HEIGHT - 1}" rx="${theme.card.radius}" />
    </clipPath>
${effectDefs}
  </defs>
  <rect x="0.5" y="0.5" width="${PROFILE_CARD_WIDTH - 1}" height="${PROFILE_CARD_HEIGHT - 1}" rx="${theme.card.radius}" fill="${fillUrl}" stroke="${theme.colors.border}" stroke-width="${theme.card.borderWidth}" />
${effectLayers}
  <g>${avatarAnimation}
    <circle cx="92" cy="118" r="73" fill="${theme.colors.background}" stroke="${theme.colors.accent}" stroke-width="2.5" stroke-opacity="0.85" />
    <image href="${avatarDataUrl}" x="22" y="48" width="140" height="140" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" />
  </g>
  <text x="184" y="52" font-family="${fontFamily}" font-size="24" font-weight="700" fill="${theme.colors.foreground}">${escapeXml(displayName)}</text>
  <g aria-label="GitHub username">
    ${iconMarkup('github', 184, 62, 14, theme.colors.accent)}
    <text x="204" y="74" font-family="${fontFamily}" font-size="14" fill="${theme.colors.accent}">@${escapeXml(login)}</text>
  </g>
  <text x="184" y="108" font-family="${fontFamily}" font-size="${theme.typography.bodySize}" fill="${theme.colors.muted}">${escapeXml(bio)}</text>
${statBlocks}
</svg>`
}
