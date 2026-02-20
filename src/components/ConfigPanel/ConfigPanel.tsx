import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { WheelItem, SpinPhase } from '../../types'
import { ItemRow } from '../ItemRow/ItemRow'
import { plural } from '../../utils/format'
import styles from './ConfigPanel.module.css'

// ── Add Many dialog ───────────────────────────────────────────────────────────
// Rendered only while open so showModal() fires on mount with no flash.

interface ParsedItem {
  name: string
  count: number
}

/** Parse one line. Supports "Name" (count=1) and "Name,Count" formats.
 *  Uses the last comma as the delimiter so names containing commas work. */
function parseLine(line: string): ParsedItem | null {
  const trimmed = line.trim()
  if (!trimmed) return null
  const lastComma = trimmed.lastIndexOf(',')
  if (lastComma !== -1) {
    const countStr = trimmed.slice(lastComma + 1).trim()
    const count = parseInt(countStr, 10)
    if (!isNaN(count) && count >= 1) {
      const name = trimmed.slice(0, lastComma).trim()
      if (name.length > 0) return { name, count }
    }
  }
  return { name: trimmed, count: 1 }
}

interface AddManyDialogProps {
  onAdd: (items: ParsedItem[]) => void
  onClose: () => void
}

function AddManyDialog({ onAdd, onClose }: AddManyDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [text, setText] = useState('')

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const onCancel = (e: Event) => { e.preventDefault(); onClose() }
    dialog.addEventListener('cancel', onCancel)
    return () => dialog.removeEventListener('cancel', onCancel)
  }, [onClose])

  const pendingItems = text
    .split('\n')
    .map(parseLine)
    .filter((item): item is ParsedItem => item !== null)

  const totalSlices = pendingItems.reduce((sum, item) => sum + item.count, 0)

  const handleAdd = () => {
    if (pendingItems.length > 0) onAdd(pendingItems)
    onClose()
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-label="Add many items">
      <h3 className={styles.dialogTitle}>Add Many Items</h3>
      <p className={styles.dialogHint}>One item per line — optionally append a count: Name,Count</p>
      <textarea
        className={styles.dialogTextarea}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'Apple\nBanana,3\nCherry,5'}
        rows={8}
        autoFocus
        aria-label="Items to add, one per line"
      />
      <p className={styles.dialogCount}>
        {pendingItems.length > 0
          ? totalSlices !== pendingItems.length
            ? `${pendingItems.length} item${plural(pendingItems.length)}, ${totalSlices} slice${plural(totalSlices)} will be added`
            : `${pendingItems.length} item${plural(pendingItems.length)} will be added`
          : 'Enter items above'}
      </p>
      <div className={styles.dialogActions}>
        <button className={styles.dialogCancelBtn} onClick={onClose}>
          Cancel
        </button>
        <button
          className={styles.dialogAddBtn}
          onClick={handleAdd}
          disabled={pendingItems.length === 0}
        >
          Add {pendingItems.length > 0 ? pendingItems.length : ''} Item{plural(pendingItems.length)}
        </button>
      </div>
    </dialog>
  )
}

const SPEED_LEVELS = [
  { label: 'Slow', value: 0.4 },
  { label: 'Normal', value: 1 },
  { label: 'Fast', value: 2.5 },
] as const

// ── SpeedRow ──────────────────────────────────────────────────────────────────

interface SpeedRowProps {
  label: string
  value: number
  disabled: boolean
  onChange: (value: number) => void
}

function SpeedRow({ label, value, disabled, onChange }: SpeedRowProps) {
  return (
    <div className={styles.speedRow}>
      <span className={styles.speedLabel}>{label}</span>
      <div className={styles.speedGroup} role="group" aria-label={`${label} speed`}>
        {SPEED_LEVELS.map(({ label: lvlLabel, value: lvlValue }) => (
          <button
            key={lvlLabel}
            className={`${styles.speedBtn} ${value === lvlValue ? styles.speedBtnActive : ''}`}
            disabled={disabled}
            onClick={() => onChange(lvlValue)}
            aria-pressed={value === lvlValue}
          >
            {lvlLabel}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── ConfigPanel ───────────────────────────────────────────────────────────────

interface Props {
  items: WheelItem[]
  sliceOrder: string[]
  wins: Record<string, number>
  phase: SpinPhase
  speedMultiplier: number
  stopSpeedMultiplier: number
  removeWinningSlice: boolean
  onAdd: () => void
  onAddMany: (items: ParsedItem[]) => void
  onUpdate: (id: string, patch: Partial<Omit<WheelItem, 'id'>>) => void
  onRemove: (id: string) => void
  onClear: () => void
  onRandomize: () => void
  onSpeedChange: (multiplier: number) => void
  onStopSpeedChange: (multiplier: number) => void
  onRemoveWinningSliceChange: (value: boolean) => void
}

export function ConfigPanel({
  items, sliceOrder, wins, phase, speedMultiplier, stopSpeedMultiplier, removeWinningSlice,
  onAdd, onAddMany, onUpdate, onRemove, onClear, onRandomize, onSpeedChange, onStopSpeedChange,
  onRemoveWinningSliceChange,
}: Props) {
  const disabled = phase !== 'idle'
  const totalSlices = sliceOrder.length

  const [dialogOpen, setDialogOpen] = useState(false)
  const closeDialog = useCallback(() => setDialogOpen(false), [])

  return (
    <aside className={styles.panel} aria-label="Wheel configuration">
      <div className={styles.header}>
        <h2 className={styles.title}>Items</h2>
        <span className={styles.badge}>{totalSlices} slice{plural(totalSlices)}</span>
      </div>

      <div className={styles.list}>
        {items.length === 0 ? (
          <p className={styles.empty}>No items yet. Add one below!</p>
        ) : (
          items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              winCount={wins[item.id] ?? 0}
              disabled={disabled}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.addBtn}
          disabled={disabled}
          onClick={onAdd}
          aria-label="Add item"
        >
          + Add Item
        </button>
        <button
          className={styles.addManyBtn}
          disabled={disabled}
          onClick={() => setDialogOpen(true)}
          aria-label="Add many items"
        >
          ≡ Add Many
        </button>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.randomizeBtn}
          disabled={disabled || sliceOrder.length < 2}
          onClick={onRandomize}
          aria-label="Randomize slice order"
          title="Scatter slices randomly so items with multiple slices aren't grouped"
        >
          ⇄ Randomize
        </button>
        <button
          className={styles.clearBtn}
          disabled={disabled || items.length === 0}
          onClick={onClear}
          aria-label="Clear all items"
        >
          🗑 Clear All
        </button>
      </div>

      <SpeedRow label="Spin" value={speedMultiplier} disabled={disabled} onChange={onSpeedChange} />
      <SpeedRow label="Stop" value={stopSpeedMultiplier} disabled={disabled} onChange={onStopSpeedChange} />

      <div className={styles.toggleRow}>
        <span className={styles.toggleLabel}>Remove winning slice</span>
        <button
          role="switch"
          aria-checked={removeWinningSlice}
          className={`${styles.toggle} ${removeWinningSlice ? styles.toggleOn : ''}`}
          onClick={() => onRemoveWinningSliceChange(!removeWinningSlice)}
          title={removeWinningSlice ? 'Each win removes one slice of the winner' : 'Winning slices are kept'}
        />
      </div>

      {dialogOpen && createPortal(
        <AddManyDialog onAdd={onAddMany} onClose={closeDialog} />,
        document.body
      )}
    </aside>
  )
}
