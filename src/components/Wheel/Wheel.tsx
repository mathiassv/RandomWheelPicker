import { useRef, useEffect, useCallback } from 'react'
import type { WheelSlice } from '../../types'
import { drawWheel } from '../../utils/wheel'
import styles from './Wheel.module.css'

interface Props {
  slices: WheelSlice[]
  currentAngle: number
}

export function Wheel({ slices, currentAngle }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const sizeRef = useRef(0)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const size = sizeRef.current
    if (size === 0) return
    ctx.save()
    ctx.scale(dpr, dpr)
    drawWheel(ctx, slices, currentAngle, size)
    ctx.restore()
  }, [slices, currentAngle])

  // ResizeObserver — update canvas physical size on container resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const size = Math.floor(Math.min(entry.contentRect.width, entry.contentRect.height))
      sizeRef.current = size

      const canvas = canvasRef.current
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = size * dpr
      canvas.height = size * dpr
      canvas.style.width = `${size}px`
      canvas.style.height = `${size}px`

      redraw()
    })

    ro.observe(container)
    return () => ro.disconnect()
  }, [slices, currentAngle])

  // Redraw on every angle / slices change
  useEffect(() => {
    redraw()
  }, [redraw])

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas ref={canvasRef} aria-label="Spinning wheel" role="img" />
    </div>
  )
}
