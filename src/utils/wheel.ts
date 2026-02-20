import type { WheelItem, WheelSlice } from '../types'
import { nameToColor } from './color'

const TWO_PI = 2 * Math.PI

/**
 * Build the ordered slice array from a sliceOrder (array of item IDs).
 * sliceOrder drives the visual layout — items can be interleaved after randomization.
 */
export function computeSlices(items: WheelItem[], sliceOrder: string[]): WheelSlice[] {
  if (sliceOrder.length === 0) return []

  const itemMap = new Map(items.map((item) => [item.id, item]))
  const sweepAngle = TWO_PI / sliceOrder.length
  const slices: WheelSlice[] = []

  sliceOrder.forEach((itemId, index) => {
    const item = itemMap.get(itemId)
    if (!item) return // stale ID — skip (reconcile handles cleanup)
    const startAngle = index * sweepAngle
    slices.push({
      itemId,
      name: item.name,
      color: item.color ?? nameToColor(item.name),
      startAngle,
      endAngle: startAngle + sweepAngle,
      sweepAngle,
    })
  })

  return slices
}

/**
 * Determine which slice the pointer (at 12 o'clock = -π/2) points to.
 * currentAngle is the accumulated wheel rotation.
 */
export function determineWinner(
  slices: WheelSlice[],
  currentAngle: number
): WheelSlice | null {
  if (slices.length === 0) return null

  // Convert world-space pointer into wheel-local angle, normalized to [0, 2π)
  const pointerAngle = ((-Math.PI / 2 - currentAngle) % TWO_PI + TWO_PI) % TWO_PI

  return (
    slices.find(
      (s) => pointerAngle >= s.startAngle && pointerAngle < s.endAngle
    ) ?? slices[0]
  )
}

export function drawWheel(
  ctx: CanvasRenderingContext2D,
  slices: WheelSlice[],
  currentAngle: number,
  size: number
): void {
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 20 // 20px inset leaves room for the pointer above the wheel

  ctx.clearRect(0, 0, size, size)

  if (slices.length === 0) {
    ctx.fillStyle = '#e5e7eb'
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, TWO_PI)
    ctx.fill()
    ctx.fillStyle = '#6b7280'
    ctx.font = `${size * 0.06}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Add items to spin!', cx, cy)
    return
  }

  // 1. Draw slices
  for (const slice of slices) {
    const start = slice.startAngle + currentAngle
    const end = slice.endAngle + currentAngle

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, radius, start, end)
    ctx.closePath()
    ctx.fillStyle = slice.color
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  // 2. Draw text labels — radial orientation (along the radius, not tangential)
  const fontSize = Math.max(10, Math.min(18, size * 0.04))
  ctx.font = `bold ${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // Sit text at 58% radius so it has room to extend toward the outer edge
  const textRadius = radius * 0.58

  for (const slice of slices) {
    const midAngle = slice.startAngle + slice.sweepAngle / 2 + currentAngle
    const tx = cx + textRadius * Math.cos(midAngle)
    const ty = cy + textRadius * Math.sin(midAngle)

    ctx.save()
    ctx.translate(tx, ty)

    // Rotate along the radius direction.
    // For left-half slices (π/2 < normAngle < 3π/2) add π so the text flips —
    // this keeps every label within 90° of horizontal and always readable.
    const normAngle = (midAngle % TWO_PI + TWO_PI) % TWO_PI
    const rotation =
      normAngle > Math.PI / 2 && normAngle < (3 * Math.PI) / 2
        ? midAngle + Math.PI
        : midAngle
    ctx.rotate(rotation)

    const label =
      slice.name.length > 12 ? slice.name.slice(0, 11) + '…' : slice.name

    // Text shadow for legibility against lighter slice colors
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillText(label, 1.5, 1.5)
    ctx.fillStyle = '#fff'
    ctx.fillText(label, 0, 0)

    ctx.restore()
  }

  // 3. Center hub
  const hubRadius = radius * 0.08
  ctx.beginPath()
  ctx.arc(cx, cy, hubRadius, 0, TWO_PI)
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.strokeStyle = '#d1d5db'
  ctx.lineWidth = 2
  ctx.stroke()

  // 4. Pointer — ▼ sitting above the wheel, tip just pierces the edge at 12 o'clock
  //    base is fully outside the wheel; only the tip overlaps the first slice
  const pHalfW = Math.max(7, radius * 0.07)  // half-width of the base
  const pHeight = pHalfW * 1.8               // taller than wide for a clean arrow
  const pTipY  = cy - radius + 4             // tip: 4px inside the wheel edge
  const pBaseY = pTipY - pHeight             // base: above the wheel edge
  ctx.beginPath()
  ctx.moveTo(cx, pTipY)               // downward-pointing tip
  ctx.lineTo(cx - pHalfW, pBaseY)     // top-left of base
  ctx.lineTo(cx + pHalfW, pBaseY)     // top-right of base
  ctx.closePath()
  ctx.fillStyle = '#ef4444'
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.stroke()
}
