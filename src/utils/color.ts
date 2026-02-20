/**
 * Curated palette of 20 vibrant colors evenly spread across the hue wheel.
 * High saturation, medium lightness — vivid but not neon.
 */
export const PALETTE = [
  '#e63230', // red
  '#f05a18', // orange-red
  '#f08800', // orange
  '#e8b000', // golden yellow
  '#a0c000', // yellow-green
  '#30b030', // green
  '#08a868', // emerald
  '#009898', // teal
  '#0088c8', // ocean
  '#0858e8', // blue
  '#2838d0', // indigo
  '#5820d0', // violet
  '#8818c8', // purple
  '#b008b8', // magenta
  '#d00878', // pink
  '#e81848', // rose
  '#f07830', // coral
  '#68b800', // lime
  '#08a0c0', // sky cyan
  '#4838e0', // periwinkle
] as const

/**
 * Deterministic string → color from the palette.
 * Same name always produces the same color regardless of position or reload.
 */
export function nameToColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
    hash |= 0 // force 32-bit int
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}
