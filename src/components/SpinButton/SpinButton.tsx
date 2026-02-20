import { forwardRef } from 'react'
import type { SpinPhase } from '../../types'
import styles from './SpinButton.module.css'

interface Props {
  phase: SpinPhase
  onPress: () => void
  noItems?: boolean
}

const LABELS: Record<SpinPhase, string> = {
  idle: 'Spin!',
  spinning: 'Stop!',
  decelerating: 'Stopping…',
  stopped: 'Spin Again!',
}

export const SpinButton = forwardRef<HTMLButtonElement, Props>(
  function SpinButton({ phase, onPress, noItems = false }, ref) {
    const disabled = phase === 'decelerating' || (phase === 'idle' && noItems)
    return (
      <button
        ref={ref}
        className={styles.btn}
        onClick={onPress}
        disabled={disabled}
        aria-label={noItems && phase === 'idle' ? 'Add items to spin' : LABELS[phase]}
        data-phase={phase}
      >
        {noItems && phase === 'idle' ? 'Add items first' : LABELS[phase]}
      </button>
    )
  }
)
