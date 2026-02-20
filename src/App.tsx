import { useMemo, useCallback, useState, useRef, useEffect } from 'react'
import { useWheelConfig } from './hooks/useWheelConfig'
import { useSpinWheel } from './hooks/useSpinWheel'
import { computeSlices } from './utils/wheel'
import { loadTitle, saveTitle, DEFAULT_TITLE } from './utils/storage'
import { Wheel } from './components/Wheel/Wheel'
import { SpinButton } from './components/SpinButton/SpinButton'
import { ConfigPanel } from './components/ConfigPanel/ConfigPanel'
import { WinnerModal } from './components/WinnerModal/WinnerModal'
import './App.css'

export default function App() {
  const { items, sliceOrder, addItem, addManyItems, updateItem, removeItem, clearItems, randomizeOrder } =
    useWheelConfig()

  // ── Editable title ──────────────────────────────────────────────────────────
  const [title, setTitle] = useState(loadTitle)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    saveTitle(title)
  }, [title])

  const startEdit = () => {
    setDraft(title)
    setEditing(true)
    requestAnimationFrame(() => {
      titleInputRef.current?.select()
    })
  }

  const commitEdit = () => {
    const trimmed = draft.trim()
    setTitle(trimmed.length > 0 ? trimmed : DEFAULT_TITLE)
    setEditing(false)
  }

  const cancelEdit = () => {
    setEditing(false)
  }
  const slices = useMemo(() => computeSlices(items, sliceOrder), [items, sliceOrder])

  const [wins, setWins] = useState<Record<string, number>>({})
  const recordWin = useCallback((itemId: string) => {
    setWins((prev) => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + 1 }))
  }, [])

  const [speedMultiplier, setSpeedMultiplier] = useState(1)
  const [stopSpeedMultiplier, setStopSpeedMultiplier] = useState(1)

  const { phase, currentAngle, winner, handlePress, dismissWinner } = useSpinWheel(slices, recordWin, speedMultiplier, stopSpeedMultiplier)

  // Ref so modal close/remove actions can return focus to the spin button
  const spinButtonRef = useRef<HTMLButtonElement>(null)
  const focusSpinButton = useCallback(() => {
    requestAnimationFrame(() => spinButtonRef.current?.focus())
  }, [])

  const handleSpinAgain = useCallback(() => {
    handlePress()       // phase='stopped' → starts spin, clears winner atomically
    focusSpinButton()
  }, [handlePress, focusSpinButton])

  const handleClose = useCallback(() => {
    dismissWinner()
    focusSpinButton()
  }, [dismissWinner, focusSpinButton])

  const removeWinner = useCallback(() => {
    if (!winner) return
    removeItem(winner.itemId)
    dismissWinner()
    focusSpinButton()
  }, [winner, removeItem, dismissWinner, focusSpinButton])

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-title-wrapper">
          <span className="app-title-emoji" aria-hidden="true">🎡</span>
          {editing ? (
            <>
              <input
                ref={titleInputRef}
                className="app-title-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit()
                  if (e.key === 'Escape') cancelEdit()
                }}
                maxLength={48}
                aria-label="App title"
                size={Math.max(8, draft.length + 1)}
              />
            </>
          ) : (
            <>
              <h1 className="app-title">{title}</h1>
              <button
                className="app-title-edit-btn"
                onClick={startEdit}
                aria-label="Rename app title"
                title="Rename"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </header>

      <main className="app-layout">
        <section className="wheel-section" aria-label="Wheel">
          <Wheel slices={slices} currentAngle={currentAngle} />
          <SpinButton
            ref={spinButtonRef}
            phase={phase}
            onPress={handlePress}
            noItems={slices.length === 0}
          />
        </section>

        <ConfigPanel
          items={items}
          sliceOrder={sliceOrder}
          wins={wins}
          phase={phase}
          speedMultiplier={speedMultiplier}
          stopSpeedMultiplier={stopSpeedMultiplier}
          onAdd={addItem}
          onAddMany={addManyItems}
          onUpdate={updateItem}
          onRemove={removeItem}
          onClear={clearItems}
          onRandomize={randomizeOrder}
          onSpeedChange={setSpeedMultiplier}
          onStopSpeedChange={setStopSpeedMultiplier}
        />
      </main>

      {/* Visually hidden live region — announces the winner to screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {winner ? `The winner is ${winner.name}` : ''}
      </div>

      <WinnerModal
        winner={winner}
        onSpinAgain={handleSpinAgain}
        onRemove={removeWinner}
        onClose={handleClose}
      />
    </div>
  )
}
