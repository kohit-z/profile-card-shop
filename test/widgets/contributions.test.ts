import { describe, expect, it } from 'vitest'

import type { ContributionCalendar } from '../../src/services/github'
import { renderCard } from '../../src/widgets/card'
import { createContributionsSection } from '../../src/widgets/sections/contributions'

const calendar: ContributionCalendar = {
  totalContributions: 12,
  weeks: [
    {
      contributionDays: [
        {
          date: '2025-01-05',
          contributionCount: 0,
          contributionLevel: 'NONE',
          color: '#ebedf0',
        },
        {
          date: '2025-01-06',
          contributionCount: 1,
          contributionLevel: 'FIRST_QUARTILE',
          color: '#9be9a8',
        },
        {
          date: '2025-01-07',
          contributionCount: 3,
          contributionLevel: 'SECOND_QUARTILE',
          color: '#40c463',
        },
        {
          date: '2025-01-08',
          contributionCount: 5,
          contributionLevel: 'THIRD_QUARTILE',
          color: '#30a14e',
        },
        {
          date: '2025-01-09',
          contributionCount: 8,
          contributionLevel: 'FOURTH_QUARTILE',
          color: '#216e39',
        },
        {
          date: '2025-01-10',
          contributionCount: 0,
          contributionLevel: 'NONE',
          color: '#ebedf0',
        },
        {
          date: '2025-01-11',
          contributionCount: 2,
          contributionLevel: 'FIRST_QUARTILE',
          color: '#9be9a8',
        },
      ],
    },
    {
      contributionDays: [
        {
          date: '2025-01-12',
          contributionCount: 4,
          contributionLevel: 'SECOND_QUARTILE',
          color: '#40c463',
        },
        {
          date: '2025-01-13',
          contributionCount: 0,
          contributionLevel: 'NONE',
          color: '#ebedf0',
        },
        {
          date: '2025-01-14',
          contributionCount: 0,
          contributionLevel: 'NONE',
          color: '#ebedf0',
        },
        {
          date: '2025-01-15',
          contributionCount: 0,
          contributionLevel: 'NONE',
          color: '#ebedf0',
        },
        {
          date: '2025-01-16',
          contributionCount: 0,
          contributionLevel: 'NONE',
          color: '#ebedf0',
        },
        {
          date: '2025-01-17',
          contributionCount: 0,
          contributionLevel: 'NONE',
          color: '#ebedf0',
        },
        {
          date: '2025-01-18',
          contributionCount: 0,
          contributionLevel: 'NONE',
          color: '#ebedf0',
        },
      ],
    },
  ],
}

describe('createContributionsSection', () => {
  it('renders a themed contribution heatmap', () => {
    const section = createContributionsSection(calendar)
    const svg = renderCard({ sections: [section] })

    expect(section.id).toBe('contributions')
    expect(svg).toContain('data-section="contributions"')
    expect(svg).toContain('data-contributions="true"')
    expect(svg).toContain('data-contribution-weeks="2"')
    expect(svg).toContain('data-contribution-total="12"')
    expect(svg).toContain('Contributions')
    expect(svg).not.toContain('in the last year')
    expect(svg).toContain('data-contribution-day="2025-01-09"')
    expect(svg).toContain('data-contribution-level="FOURTH_QUARTILE"')
    expect(svg).toContain('attributeName="fill-opacity"')
    expect(svg).not.toContain('data-contribution-legend="true"')
    expect(svg).not.toContain('>Mon<')
    expect(svg).not.toContain('>Jan<')
    expect(svg).not.toContain('>Less<')
    expect(svg).not.toContain('>More<')
  })

  it('centers the nebula contribution graph without a Less/More legend', () => {
    const section = createContributionsSection(calendar)
    const svg = renderCard({ theme: 'nebula', sections: [section] })
    const firstDay = svg.match(
      /data-contribution-day="2025-01-05"[^>]*\sx="([\d.]+)"\s[^>]*y="([\d.]+)"/,
    )

    expect(svg).toContain('data-nebula-contributions="true"')
    expect(svg).not.toContain('>Less</text>')
    expect(svg).not.toContain('>More</text>')
    expect(firstDay).not.toBeNull()
    expect(Number(firstDay![1])).toBeCloseTo(409.5, 1)
    expect(Number(firstDay![2])).toBeCloseTo(71, 0)
  })

  it('renders an empty graph when there are no weeks', () => {
    const section = createContributionsSection({
      totalContributions: 0,
      weeks: [],
    })
    const svg = renderCard({ sections: [section] })

    expect(section.id).toBe('contributions')
    expect(svg).toContain('data-contribution-weeks="0"')
    expect(svg).not.toContain('in the last year')
    expect(svg).not.toContain('data-contribution-day=')
  })
})
