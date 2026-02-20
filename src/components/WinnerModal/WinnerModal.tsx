import { useEffect, useRef } from 'react'
import type { WheelSlice } from '../../types'
import styles from './WinnerModal.module.css'

interface Props {
  winner: WheelSlice | null
  onSpinAgain: () => void
  onRemove: () => void
  onClose: () => void
}

export function WinnerModal({ winner, onSpinAgain, onRemove, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (winner) {
      if (!dialog.open) dialog.showModal()
    } else {
      if (dialog.open) dialog.close()
    }
  }, [winner])

  // Handle native Escape key via the <dialog> cancel event
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleCancel = (e: Event) => {
      e.preventDefault() // prevent dialog from closing itself; we control state
      onClose()
    }
    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [onClose])

  // Close on backdrop click (click lands on the <dialog> element itself, not its children)
  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose()
  }

  if (!winner) return null

  const color = winner.color

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClick={handleDialogClick}
      aria-labelledby="winner-title"
      aria-modal="true"
    >
      <div className={styles.content}>
        <div className={styles.confetti} aria-hidden="true">🎉</div>
        <h2 id="winner-title" className={styles.heading}>We have a winner!</h2>
        <div className={styles.winnerBadge} style={{ background: color }}>
          {winner.name}
        </div>
        <div className={styles.actions}>
          <button
            className={styles.spinAgainBtn}
            onClick={onSpinAgain}
            autoFocus
            aria-label="Spin again"
          >
            Spin Again!
          </button>
          <button
            className={styles.removeBtn}
            onClick={onRemove}
            aria-label={`Remove ${winner.name} from wheel`}
          >
            Remove from wheel
          </button>
        </div>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close"
        >
          Close
        </button>
      </div>
    </dialog>
  )
}
