export interface WheelItem {
  id: string
  name: string
  count: number
  color?: string  // overrides the auto-generated palette color when set
}

export interface WheelSlice {
  itemId: string
  name: string
  color: string
  startAngle: number
  endAngle: number
  sweepAngle: number
}

export type SpinPhase = 'idle' | 'spinning' | 'decelerating' | 'stopped'

export interface AnimationState {
  currentAngle: number
  angularVelocity: number
  deceleration: number
  animationFrameId: number
}

export interface PersistedConfig {
  version: number
  items: WheelItem[]
  sliceOrder: string[]
}
