import type { SkillDefinition } from '../data/skills.js'
import type { ThemeName } from '../themes/index.js'
import { renderCard } from './card.js'
import {
  createSkillsSection,
  resolveSkillsLayout,
} from './sections/skills.js'

/** Compatibility wrapper around the composable card renderer. */
export function renderSkillsCard(
  skills: readonly SkillDefinition[],
  themeName: ThemeName,
  labels: boolean,
): string {
  const layout = resolveSkillsLayout(skills.length, { labels })

  return renderCard({
    theme: themeName,
    width: layout.width,
    sections: [
      createSkillsSection(skills, { labels, columns: layout.columns }),
    ],
    accessibilityIds: {
      title: 'skills-title',
      description: 'skills-description',
    },
  })
}
