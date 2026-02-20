# Random Wheel Picker — Spinning Wheel React App

## Context
Building a greenfield React app in `D:\Projects\RandomPicker` (currently empty). The app is a game-show-style spinning wheel where users configure items with counts, spin the wheel, and get a random winner. Config persists across sessions via localStorage.

**User choices:** Vite + React + TypeScript, winner shown in modal popup, item count = N separate equal-sized slices, no extra libraries needed.

---

## File Structure

```
RandomPicker/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── App.css
    ├── types/index.ts
    ├── utils/
    │   ├── color.ts        — deterministic name→color hash
    │   ├── wheel.ts        — computeSlices(), determineWinner(), drawWheel()
    │   └── storage.ts      — localStorage load/save with versioning
    ├── hooks/
    │   ├── useWheelConfig.ts  — item CRUD, sliceOrder, localStorage persistence
    │   └── useSpinWheel.ts   — RAF animation state machine
    └── components/
        ├── Wheel/Wheel.tsx          — canvas + ResizeObserver
        ├── SpinButton/SpinButton.tsx
        ├── ConfigPanel/ConfigPanel.tsx
        ├── ItemRow/ItemRow.tsx
        └── WinnerModal/WinnerModal.tsx
```

---

## Key Types (`src/types/index.ts`)

```typescript
interface WheelItem  { id: string; name: string; count: number }

// sliceOrder: array of item IDs, one entry per individual slice
// e.g. Pizza×3 + Sushi×1 → natural = ['pizza-id','pizza-id','pizza-id','sushi-id']
// after Randomize → ['pizza-id','sushi-id','pizza-id','pizza-id'] (scattered)

interface WheelSlice {
  itemId: string
  name: string
  color: string
  startAngle: number  // pre-computed from sliceOrder position
  endAngle: number
  sweepAngle: number
}

type SpinPhase = 'idle' | 'spinning' | 'decelerating' | 'stopped'

interface AnimationState {
  currentAngle: number
  angularVelocity: number
  deceleration: number
  animationFrameId: number
}

interface PersistedConfig {
  version: number
  items: WheelItem[]
  sliceOrder: string[]  // persisted so wheel layout survives reload
}
```

---

## Slice Order — Key Design Decision

`sliceOrder: string[]` is the canonical ordering of all slices on the wheel.
It is an array of item IDs, one entry per individual slice.

**Rules:**
- When an item is **added**: append `count` copies of its ID to the end of `sliceOrder`
- When an item is **removed**: remove all occurrences of its ID from `sliceOrder`
- When count is **increased** by N: append N more copies of its ID
- When count is **decreased** by N: remove N occurrences of its ID (from tail)
- When **Randomize** is pressed: shuffle `sliceOrder` with Fisher-Yates
- `computeSlices(items, sliceOrder)` maps each entry to a `WheelSlice` using item lookup

This means:
- Randomize scatters individual slices (Pizza at positions 1, 5, 9 rather than 1, 2, 3)
- Natural order is maintained when not randomized
- Order survives localStorage reload

---

## Spin State Machine (`useSpinWheel.ts`)

```
idle ──[press]──► spinning ──[press]──► decelerating ──[v=0]──► stopped
 ▲                                                                   │
 └───────────────────────[dismissWinner / Spin Again]───────────────┘
```

- `AnimationState` lives in a **`useRef`** (not state) — no re-render on velocity ticks
- Only `currentAngle` is mirrored into React state to trigger canvas redraws
- **First press (idle)**: velocity = `random(0.15, 0.25)` rad/frame — start spinning
- **Second press (spinning)**: deceleration = `random(0.001, 0.004)` rad/frame² — begin slowing
- **Press from stopped**: clears `winner` state AND transitions to `spinning` in one action
- Button label: `idle`→"Spin!" | `spinning`→"Stop!" | `decelerating`→"Stopping…" (disabled) | `stopped`→"Spin Again!"
- **Spin Again! closes the modal automatically** — no separate dismiss step needed

### RAF stale-closure fix (architectural)
`phase` must NOT be captured in the `animate` closure — it causes cancel/restart on every transition, dropping frames. Instead, mirror phase into a `phaseRef` and read it inside the loop:

```typescript
const phaseRef = useRef<SpinPhase>('idle')

// Always update both: React state (for renders) + ref (for RAF reads)
function setPhaseSync(p: SpinPhase) {
  phaseRef.current = p
  setPhase(p)
}

// Single stable animate function — no dependency on phase state
const animate = useCallback(() => {
  const anim = animRef.current
  anim.currentAngle += anim.angularVelocity

  if (phaseRef.current === 'decelerating') {
    anim.angularVelocity -= anim.deceleration
    if (anim.angularVelocity <= 0) {
      anim.angularVelocity = 0
      setPhaseSync('stopped')
      setWinner(determineWinner(anim.currentAngle, slices))
      setCurrentAngle(anim.currentAngle)
      return // stop loop
    }
  }

  setCurrentAngle(anim.currentAngle)
  anim.animationFrameId = requestAnimationFrame(animate)
}, [slices]) // slices is the only real dependency

function handleSpinButtonPress() {
  if (phase === 'idle') {
    animRef.current.angularVelocity = randomBetween(0.15, 0.25)
    setPhaseSync('spinning')
    animRef.current.animationFrameId = requestAnimationFrame(animate)
  } else if (phase === 'spinning') {
    animRef.current.deceleration = randomBetween(0.001, 0.004)
    setPhaseSync('decelerating')
    // RAF loop continues uninterrupted
  } else if (phase === 'stopped') {
    setWinner(null)
    animRef.current.angularVelocity = randomBetween(0.15, 0.25)
    setPhaseSync('spinning')
    animRef.current.animationFrameId = requestAnimationFrame(animate)
  }
}
```

RAF is started explicitly on idle→spinning and stopped→spinning. It stops itself when velocity reaches 0. No useEffect restart cycle needed.

---

## Canvas Drawing (`src/utils/wheel.ts` + `Wheel.tsx`)

### Slice computation
```typescript
function computeSlices(items: WheelItem[], sliceOrder: string[]): WheelSlice[] {
  const itemMap = new Map(items.map(i => [i.id, i]))
  const sweep = (Math.PI * 2) / sliceOrder.length
  return sliceOrder.map((itemId, index) => {
    const item = itemMap.get(itemId)!
    return {
      itemId,
      name: item.name || 'Unnamed',
      color: getColorForName(item.name || 'Unnamed'),
      startAngle: sweep * index,
      endAngle: sweep * (index + 1),
      sweepAngle: sweep,
    }
  })
}
```

### Draw order (per frame)
1. Clear canvas
2. Draw all slices (filled arc + thin border stroke)
3. Draw text labels at 65% radius, rotated perpendicular to radius (truncated to 12 chars, hidden if sweep < 0.12 rad)
4. Draw center hub circle (white, 8% of radius)
5. Draw **pointer triangle last** — not rotated, always on top at 12 o'clock position

### Responsive canvas
- `ResizeObserver` on container div → sets `canvas.width/height = size × devicePixelRatio`
- Use `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` — NOT `ctx.scale()` — to reset the transform cleanly each resize (scale is multiplicative and accumulates across multiple ResizeObserver calls)
- Canvas is always square; wheel fills the square with small padding

---

## Winner Calculation

```
pointerAngle = ((-π/2 - currentAngle) % 2π + 2π) % 2π
winningSlice = slices.find(s => pointerAngle >= s.startAngle && pointerAngle < s.endAngle)
```

Canvas arc 0 = 3 o'clock; pointer sits at 12 o'clock = −π/2. Subtract `currentAngle` to convert world-space pointer angle into wheel-local space, then normalize to `[0, 2π)`.

---

## Winner Modal — Remove from Wheel

Modal shows:
- Winner's color swatch
- Winner's name (large)
- **"Spin Again!"** button → closes modal + starts new spin immediately
- **"Remove from wheel"** button → decrements winner's count by 1 (removes item if count reaches 0), then closes modal + resets to idle

```typescript
function removeWinner() {
  if (!winner) return
  const item = items.find(i => i.id === winner.itemId)
  if (!item) return
  if (item.count <= 1) {
    removeItem(item.id)       // removes item + all its sliceOrder entries
  } else {
    updateItem(item.id, 'count', item.count - 1)
    // also remove one occurrence of item.id from sliceOrder
    removeOneFromSliceOrder(item.id)
  }
  setWinner(null)
  setPhase('idle')
}
```

---

## Empty State

When `sliceOrder.length === 0`:
- Wheel canvas shows centered text: "Add items to get started"
- Spin button is disabled
- Config panel is always enabled (so user can add items)

---

## Input Validation

- **Item name**: if left blank on blur → auto-fill with "Unnamed"
- **Count**: minimum 1, integer only; prevent decrement below 1 with button disabled state
- **Randomize button**: disabled when `sliceOrder.length < 2`

## State Update Strategy for `ItemRow`

Two concerns are intentionally separated:
- **React state update**: immediate on every keystroke → wheel re-renders live as you type (good UX)
- **localStorage write**: debounced 300ms → avoids writing on every keypress

```typescript
// In ItemRow: update state immediately, debounce only the persist
onChange={e => {
  onUpdate(item.id, 'name', e.target.value)  // immediate → live wheel preview
}}
// useWheelConfig persists via useEffect with debounce on the localStorage write
```

## Computed Slices (`App.tsx`)

```typescript
// Slices are derived, never stored — recompute only when inputs change
const slices = useMemo(
  () => computeSlices(items, sliceOrder),
  [items, sliceOrder]
)
```

Without `useMemo`, `computeSlices` would run on every render including every animation frame tick from `currentAngle` state updates.

---

## Color System (`src/utils/color.ts`)

String hash → hue (0–359), fixed saturation 70%, lightness 45%:
- Same item name → always same color, regardless of array position or reload
- Color shown as a swatch in `ItemRow` and in `WinnerModal`

---

## localStorage Schema

Key: `"randomPicker_config"`
```json
{
  "version": 1,
  "items": [{ "id": "...", "name": "Pizza", "count": 3 }],
  "sliceOrder": ["pizza-id", "sushi-id", "pizza-id", "pizza-id"]
}
```
- Defaults to 3 sample items in natural order if empty/corrupt
- Version field reserved for future migrations
- On load, run `reconcileSliceOrder(items, sliceOrder)` to fix inconsistencies:
  - Remove entries whose itemId no longer exists in `items`
  - For each item, ensure exactly `item.count` occurrences of its ID exist (add/trim from tail)
  - This handles partial saves, manual edits, and future migrations gracefully

```typescript
// src/utils/storage.ts
function reconcileSliceOrder(items: WheelItem[], rawOrder: string[]): string[] {
  const countMap = new Map(items.map(i => [i.id, i.count]))
  // Remove unknown IDs
  const filtered = rawOrder.filter(id => countMap.has(id))
  // Ensure correct count per item
  const result: string[] = []
  for (const [id, count] of countMap) {
    const existing = filtered.filter(x => x === id).slice(0, count)
    const missing = count - existing.length
    result.push(...existing, ...Array(missing).fill(id))
  }
  return result
}
```

---

## Layout

```css
/* Desktop: wheel left, config panel right (380px fixed) */
.app-layout { display: grid; grid-template-columns: 1fr 380px; gap: 24px; padding: 24px }

/* Mobile ≤768px: single column, wheel on top, config below */
@media (max-width: 768px) { .app-layout { grid-template-columns: 1fr } }
```

- Config panel scrollable on mobile (`overflow-y: auto`)
- Spin button sits below the wheel canvas in `.wheel-column`
- Config panel inputs + buttons disabled while `phase !== 'idle'`

---

## Implementation Order

1. Scaffold: `npm create vite@latest . -- --template react-ts`
2. Write `src/types/index.ts`
3. Implement pure utils: `color.ts`, `storage.ts`, `wheel.ts` (computeSlices, determineWinner, drawWheel)
4. Implement `useWheelConfig` — items CRUD + sliceOrder management + localStorage
5. Build `Wheel.tsx` with static angle — verify canvas renders slices + pointer
6. Implement `useSpinWheel` RAF state machine — verify all phase transitions
7. Wire `SpinButton` with phase-based labels + disabled state
8. Add `WinnerModal` with Spin Again + Remove from wheel buttons
9. Build `ConfigPanel` + `ItemRow` — verify slice recomputation on CRUD
10. Add empty state (0 items) — disable spin button + show canvas message
11. Apply responsive grid layout — test mobile breakpoint
12. Polish: modal fade-in animation (`@keyframes`), ARIA labels, hub styling

---

## No External Dependencies

Everything built with React + TypeScript + Canvas API + CSS.
No animation libraries, wheel libraries, or UI component libraries needed.
