import { useMemo, useCallback, useState, useRef, useEffect } from 'react'
import { useWheelConfig } from './hooks/useWheelConfig'
import { useSpinWheel } from './hooks/useSpinWheel'
import { computeSlices } from './utils/wheel'
import { loadTitle, saveTitle, DEFAULT_TITLE, loadPanelVisible, savePanelVisible, loadRemoveWinningSlice, saveRemoveWinningSlice } from './utils/storage'
import { Wheel } from './components/Wheel/Wheel'
import { SpinButton } from './components/SpinButton/SpinButton'
import { ConfigPanel } from './components/ConfigPanel/ConfigPanel'
import { WinnerModal } from './components/WinnerModal/WinnerModal'
import './App.css'

export default function App() {
  const { items, sliceOrder, addItem, addManyItems, updateItem, removeItem, removeOneSlice, clearItems, randomizeOrder } =
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

  const [removeWinningSlice, setRemoveWinningSlice] = useState(loadRemoveWinningSlice)
  useEffect(() => { saveRemoveWinningSlice(removeWinningSlice) }, [removeWinningSlice])

  const [wins, setWins] = useState<Record<string, number>>({})
  const recordWin = useCallback((itemId: string) => {
    setWins((prev) => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + 1 }))
    if (removeWinningSlice) removeOneSlice(itemId)
  }, [removeWinningSlice, removeOneSlice])

  const [panelVisible, setPanelVisible] = useState(loadPanelVisible)
  useEffect(() => { savePanelVisible(panelVisible) }, [panelVisible])

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
        <button
          className="panel-toggle-btn"
          onClick={() => setPanelVisible((v) => !v)}
          aria-label={panelVisible ? 'Hide items panel' : 'Show items panel'}
          title={panelVisible ? 'Hide panel' : 'Show panel'}
        >
          {panelVisible ? (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="0.75" y="0.75" width="13.5" height="13.5" rx="2"/>
              <line x1="9.75" y1="0.75" x2="9.75" y2="14.25"/>
              <path d="M11.25 5.25L13 7.5l-1.75 2.25"/>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="0.75" y="0.75" width="13.5" height="13.5" rx="2"/>
              <line x1="9.75" y1="0.75" x2="9.75" y2="14.25" strokeDasharray="2.5 1.5"/>
              <path d="M13 5.25L11.25 7.5 13 9.75"/>
            </svg>
          )}
        </button>
      </header>

      <main className={`app-layout${panelVisible ? '' : ' app-layout--panel-hidden'}`}>
        <section className="wheel-section" aria-label="Wheel">
          <Wheel slices={slices} currentAngle={currentAngle} />
          <SpinButton
            ref={spinButtonRef}
            phase={phase}
            onPress={handlePress}
            noItems={slices.length === 0}
          />
        </section>

        {panelVisible && (
          <ConfigPanel
            items={items}
            sliceOrder={sliceOrder}
            wins={wins}
            phase={phase}
            speedMultiplier={speedMultiplier}
            stopSpeedMultiplier={stopSpeedMultiplier}
            removeWinningSlice={removeWinningSlice}
            onAdd={addItem}
            onAddMany={addManyItems}
            onUpdate={updateItem}
            onRemove={removeItem}
            onClear={clearItems}
            onRandomize={randomizeOrder}
            onSpeedChange={setSpeedMultiplier}
            onStopSpeedChange={setStopSpeedMultiplier}
            onRemoveWinningSliceChange={setRemoveWinningSlice}
          />
        )}
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
