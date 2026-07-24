import { describe, expect, it } from 'vitest'

import { renderCard } from '../../src/widgets/card'
import { createGiphySection } from '../../src/widgets/sections/giphy'

const gif = {
  id: 'abc123',
  title: 'Coding cat typing furiously',
  width: 320,
  height: 200,
  dataUrl: 'data:image/gif;base64,AAEC',
} as const

describe('createGiphySection', () => {
  it('renders a centered GIF with a top divider and no caption', () => {
    const section = createGiphySection(gif)
    const svg = renderCard({ sections: [section] })

    expect(section.id).toBe('giphy')
    expect(svg).toContain('data-section="giphy"')
    expect(svg).toContain('data-giphy="abc123"')
    expect(svg).not.toContain('Custom GIF')
    expect(svg).not.toContain('Powered by GIPHY')
    expect(svg).toContain('<line ')
    expect(svg).toContain('data:image/gif;base64,AAEC')
    expect(svg).toContain('Coding cat typing furiously')
  })

  it('scales oversized GIFs to fit the card width', () => {
    const section = createGiphySection({
      ...gif,
      width: 1600,
      height: 900,
    })

    expect(section.height).toBeLessThan(900)
    expect(section.height).toBeGreaterThan(200)
  })
})
