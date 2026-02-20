import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { WheelItem } from '../../types'
import { nameToColor, PALETTE } from '../../utils/color'
import { plural } from '../../utils/format'
import styles from './ItemRow.module.css'

const MIN_COUNT = 1

// Approximate popup dimensions for viewport-edge clamping
const POPUP_W = 216
const POPUP_H = 220

interface Props {
  item: WheelItem
  winCount: number
  disabled: boolean
  onUpdate: (id: string, patch: Partial<Omit<WheelItem, 'id'>>) => void
  onRemove: (id: string) => void
}

export function ItemRow({ item, winCount, disabled, onUpdate, onRemove }: Props) {
  const autoColor = nameToColor(item.name)
  const color = item.color ?? autoColor

  const [pickerOpen, setPickerOpen] = useState(false)
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 })
  const dotBtnRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const openPicker = () => {
    if (disabled) return
    const rect = dotBtnRef.current?.getBoundingClientRect()
    if (rect) {
      let left = rect.left
      let top = rect.bottom + 6
      if (left + POPUP_W > window.innerWidth - 8) left = window.innerWidth - POPUP_W - 8
      if (top + POPUP_H > window.innerHeight - 8) top = rect.top - POPUP_H - 6
      setPopupPos({ top, left })
    }
    setPickerOpen(true)
  }

  // Close on outside click or Escape
  useEffect(() => {
    if (!pickerOpen) return
    const onMouse = (e: MouseEvent) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        dotBtnRef.current && !dotBtnRef.current.contains(e.target as Node)
      ) setPickerOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPickerOpen(false) }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
    }
  }, [pickerOpen])

  const selectColor = (c: string | undefined) => {
    onUpdate(item.id, { color: c })
    setPickerOpen(false)
  }

  const decrement = () => { if (item.count > MIN_COUNT) onUpdate(item.id, { count: item.count - 1 }) }
  const increment = () => { onUpdate(item.id, { count: item.count + 1 }) }

  return (
    <div className={styles.row}>
      <button
        ref={dotBtnRef}
        className={styles.colorDotBtn}
        style={{ background: color }}
        onClick={openPicker}
        disabled={disabled}
        aria-label={`Change color for ${item.name}`}
        title="Click to change color"
      />

      {pickerOpen && createPortal(
        <div
          ref={popupRef}
          className={styles.colorPickerPopup}
          style={{ top: popupPos.top, left: popupPos.left }}
          role="dialog"
          aria-label="Pick a color"
        >
          <div className={styles.pickerHeader}>
            <span className={styles.pickerTitle}>Color</span>
            <button
              className={styles.pickerClose}
              onClick={() => setPickerOpen(false)}
              aria-label="Close color picker"
            >×</button>
          </div>

          <div className={styles.swatchGrid}>
            {PALETTE.map((c) => (
              <button
                key={c}
                className={`${styles.swatch} ${item.color === c ? styles.swatchActive : ''}`}
                style={{ background: c }}
                onClick={() => selectColor(c)}
                aria-label={`Select color ${c}`}
                title={c}
              />
            ))}
          </div>

          <div className={styles.pickerFooter}>
            <button
              className={`${styles.autoBtn} ${!item.color ? styles.autoBtnActive : ''}`}
              onClick={() => selectColor(undefined)}
              title="Reset to the color automatically assigned by name"
            >
              Auto
            </button>
            <label className={styles.customLabel} title="Choose any custom color">
              <span
                className={styles.customSwatch}
                style={{ background: item.color ?? autoColor }}
              />
              <input
                type="color"
                className={styles.customInput}
                value={item.color ?? autoColor}
                onChange={(e) => onUpdate(item.id, { color: e.target.value })}
              />
              Custom
            </label>
          </div>
        </div>,
        document.body
      )}

      <input
        className={styles.nameInput}
        type="text"
        value={item.name}
        disabled={disabled}
        aria-label="Item name"
        onChange={(e) => onUpdate(item.id, { name: e.target.value })}
        onBlur={(e) => {
          if (e.target.value.trim() === '') onUpdate(item.id, { name: 'Unnamed' })
        }}
        maxLength={40}
      />

      <div className={styles.stepper} role="group" aria-label={`Count for ${item.name}`}>
        <button
          className={styles.stepBtn}
          onClick={decrement}
          disabled={disabled || item.count <= MIN_COUNT}
          aria-label="Decrease count"
        >
          −
        </button>
        <output className={styles.countDisplay} aria-live="polite">
          {item.count}
        </output>
        <button
          className={styles.stepBtn}
          onClick={increment}
          disabled={disabled}
          aria-label="Increase count"
        >
          +
        </button>
      </div>

      {winCount > 0 && (
        <span
          className={styles.trophy}
          title={`Won ${winCount} time${plural(winCount)}`}
          aria-label={`${winCount} win${plural(winCount)}`}
        >
          🏆{winCount > 1 && <span className={styles.winCount}>{winCount}</span>}
        </span>
      )}

      <button
        className={styles.removeBtn}
        disabled={disabled}
        aria-label={`Remove ${item.name}`}
        onClick={() => onRemove(item.id)}
        title="Remove"
      >
        ×
      </button>
    </div>
  )
}
