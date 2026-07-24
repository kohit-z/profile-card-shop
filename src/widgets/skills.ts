import type { OutlineStyle } from '../data/outline-style.js'
import type { SkillIconTheme } from '../data/skill-style.js'
import type { SkillDefinition } from '../data/skills.js'
import type { ThemeName } from '../themes/index.js'
import { CARD_WIDTH, renderCard } from './card.js'
import {
  createSkillsSection,
  resolveSkillsLayout,
} from './sections/skills.js'

export interface RenderSkillsCardOptions {
  readonly labels?: boolean
  readonly iconTheme?: SkillIconTheme
  readonly outline?: OutlineStyle
}

/** Compatibility wrapper around the composable card renderer. */
export function renderSkillsCard(
  skills: readonly SkillDefinition[],
  themeName: ThemeName,
  labelsOrOptions: boolean | RenderSkillsCardOptions = true,
): string {
  const options =
    typeof labelsOrOptions === 'boolean'
      ? { labels: labelsOrOptions }
      : labelsOrOptions
  const labels = options.labels ?? true
  const layout = resolveSkillsLayout(skills.length, {
    labels,
    width: CARD_WIDTH,
  })

  return renderCard({
    theme: themeName,
    width: layout.width,
    outline: options.outline,
    sections: [
      createSkillsSection(skills, {
        labels,
        columns: layout.columns,
        width: layout.width,
        iconTheme: options.iconTheme,
      }),
    ],
    accessibilityIds: {
      title: 'skills-title',
      description: 'skills-description',
    },
  })
}
