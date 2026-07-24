import { describe, expect, it } from 'vitest'

import { renderCard } from '../../src/widgets/card'
import { createProjectsSection } from '../../src/widgets/sections/projects'

const projects = [
  {
    name: 'Hello-World',
    description: 'My first repository on GitHub!',
    url: 'https://github.com/octocat/Hello-World',
    stargazerCount: 2500,
    primaryLanguage: { name: 'C', color: '#555555' },
  },
  {
    name: 'Spoon-Knife',
    description: null,
    url: 'https://github.com/octocat/Spoon-Knife',
    stargazerCount: 100,
    primaryLanguage: null,
  },
] as const

describe('createProjectsSection', () => {
  it('renders pinned repositories in a two-column grid', () => {
    const section = createProjectsSection(projects)
    const svg = renderCard({ sections: [section] })

    expect(section.id).toBe('projects')
    expect(svg).toContain('data-section="projects"')
    expect(svg).toContain('Pinned Projects')
    expect(svg).toContain('data-project="Hello-World"')
    expect(svg).toContain('data-project="Spoon-Knife"')
    expect(svg).toContain('href="https://github.com/octocat/Hello-World"')
    expect(svg).toContain('href="https://github.com/octocat/Spoon-Knife"')
    expect(svg).toContain('No description')
    expect(svg).toContain('Unknown')
    expect(svg).toContain('2500')
    expect(svg).toContain('fill="#555555"')
  })

  it('renders an empty projects section when there are no pins', () => {
    const section = createProjectsSection([])
    const svg = renderCard({ sections: [section] })

    expect(section.id).toBe('projects')
    expect(svg).toContain('data-section="projects"')
    expect(svg).toContain('data-projects-empty="true"')
    expect(svg).toContain('Pinned Projects')
    expect(svg).not.toContain('data-project=')
  })
})
