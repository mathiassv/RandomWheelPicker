import { useState, useRef, useCallback } from 'react'
import type { SpinPhase, AnimationState, WheelSlice } from '../types'
import { determineWinner } from '../utils/wheel'

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function useSpinWheel(slices: WheelSlice[], onWin?: (itemId: string) => void, speedMultiplier = 1, stopSpeedMultiplier = 1) {
  // Store callbacks and multipliers in refs so handlePress always reads the
  // latest values without needing to recreate the memoized callback
  const onWinRef = useRef(onWin)
  onWinRef.current = onWin
  const speedRef = useRef(speedMultiplier)
  speedRef.current = speedMultiplier
  const stopSpeedRef = useRef(stopSpeedMultiplier)
  stopSpeedRef.current = stopSpeedMultiplier
  const [phase, setPhase] = useState<SpinPhase>('idle')
  const [currentAngle, setCurrentAngle] = useState(0)
  const [winner, setWinner] = useState<WheelSlice | null>(null)

  const animRef = useRef<AnimationState>({
    currentAngle: 0,
    angularVelocity: 0,
    deceleration: 0,
    animationFrameId: 0,
  })

  const stopAnimation = useCallback(() => {
    if (animRef.current.animationFrameId) {
      cancelAnimationFrame(animRef.current.animationFrameId)
      animRef.current.animationFrameId = 0
    }
  }, [])

  const runFrame = useCallback(() => {
    const anim = animRef.current

    anim.currentAngle += anim.angularVelocity
    if (anim.deceleration > 0) {
      anim.angularVelocity -= anim.deceleration
      if (anim.angularVelocity <= 0) {
        anim.angularVelocity = 0
        // Sync angle to React state and finalize
        setCurrentAngle(anim.currentAngle)
        const won = determineWinner(slices, anim.currentAngle)
        setWinner(won)
        setPhase('stopped')
        if (won) onWinRef.current?.(won.itemId)
        return // stop RAF loop
      }
    }

    // Mirror angle to React state to trigger canvas redraw
    setCurrentAngle(anim.currentAngle)
    anim.animationFrameId = requestAnimationFrame(runFrame)
  }, [slices])

  const handlePress = useCallback(() => {
    if (phase === 'idle' || phase === 'stopped') {
      // Start spinning
      stopAnimation()
      const anim = animRef.current
      anim.angularVelocity = randomBetween(0.15, 0.25) * speedRef.current
      anim.deceleration = 0
      setPhase('spinning')
      setWinner(null)
      anim.animationFrameId = requestAnimationFrame(runFrame)
    } else if (phase === 'spinning') {
      // Begin deceleration
      animRef.current.deceleration = randomBetween(0.001, 0.004) * stopSpeedRef.current
      setPhase('decelerating')
    }
    // 'decelerating' and 'stopped' presses do nothing (button disabled / handled above)
  }, [phase, stopAnimation, runFrame])

  const dismissWinner = useCallback(() => {
    setWinner(null)
    setPhase('idle')
  }, [])

  return { phase, currentAngle, winner, handlePress, dismissWinner }
}
