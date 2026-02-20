# Random Wheel Picker — User Stories & Implementation Tasks

---

## User Stories

### US-1: View the Wheel — ✅ DONE
> *As a user, I want to see a large colorful spinning wheel with my configured items displayed as slices, so I can visually understand what's on the wheel.*

**Acceptance criteria:**
- ✅ Each item appears as one or more colored slices proportional to its count
- ✅ Each slice shows the item name (truncated if too long)
- ✅ Same item always has the same color across sessions
- ✅ The wheel fills the available space and is always circular
- ✅ A pointer/triangle is clearly visible at the 12 o'clock position pointing into the wheel
- ✅ A center hub circle covers the converging slice points

---

### US-2: Spin the Wheel — ✅ DONE
> *As a user, I want to press a button to start the wheel spinning at high speed, so I can begin a random selection.*

**Acceptance criteria:**
- ✅ A clearly labeled "Spin!" button is visible below the wheel
- ✅ Pressing it starts the wheel rotating visibly and smoothly
- ✅ The spin speed is randomized (feels alive, not mechanical)
- ✅ The button label changes to "Stop!" while spinning

---

### US-3: Stop the Wheel — ✅ DONE
> *As a user, I want to press the button again to begin slowing the wheel down, so the stopping point feels natural and suspenseful.*

**Acceptance criteria:**
- ✅ Pressing "Stop!" causes the wheel to decelerate gradually (not snap-stop)
- ✅ The deceleration rate is randomized each time (unpredictable)
- ✅ While decelerating, the button shows "Stopping…" and is disabled (prevents double-press)
- ✅ The wheel comes to a natural full stop

---

### US-4: See the Winner — ✅ DONE
> *As a user, I want to see which item the pointer is pointing at when the wheel stops, displayed prominently, so I know the result clearly.*

**Acceptance criteria:**
- ✅ When the wheel stops, a modal popup appears automatically
- ✅ The modal shows the winner's name in large text
- ✅ The modal shows the winner's color swatch
- ✅ The modal can be closed by clicking "Close", pressing Escape, or clicking the backdrop
- ✅ The pointer always correctly identifies the winning slice

---

### US-5: Spin Again — ✅ DONE
> *As a user, I want to spin again immediately after seeing the winner, so I can run multiple rounds quickly.*

**Acceptance criteria:**
- ✅ The winner modal has a "Spin Again!" button
- ✅ Pressing it dismisses the modal and starts a new spin immediately (calls `handlePress` while phase='stopped' — starts spin and clears winner atomically)
- ✅ The wheel resumes from its current stopped position (no snap-to-zero)
- ✅ The spin button below the wheel shows "Spin Again!" and spins when pressed

---

### US-6: Configure Items — ✅ DONE
> *As a user, I want to add, rename, and remove items from the wheel, so I can customize what's being selected.*

**Acceptance criteria:**
- ✅ A configuration panel lists all current items
- ✅ Each item row shows a color swatch, a name input, and a remove button
- ✅ An "Add Item" button appends a new item with default name "New Item"
- ✅ Renaming an item is reflected live on the wheel as I type
- ✅ Removing an item removes it from the wheel immediately
- ✅ The configuration panel is disabled (non-interactive) while the wheel is spinning or decelerating
- ✅ If an item name is left blank and the field loses focus, it reverts to "Unnamed"

---

### US-7: Set Item Weights (Count) — ✅ DONE
> *As a user, I want to set how many slices each item occupies on the wheel, so I can give some options a higher probability of winning.*

**Acceptance criteria:**
- ✅ Each item row has a count stepper (− count +)
- ✅ Increasing the count adds more slices of that item to the wheel immediately
- ✅ Decreasing the count removes slices immediately
- ✅ Count cannot go below 1 — the − button is visually disabled at count=1
- ✅ The wheel updates in real time as counts change

---

### US-8: Randomize Wheel Layout — ✅ DONE
> *As a user, I want to scatter items randomly across the wheel, so items with multiple slices are not always grouped together in one section.*

**Acceptance criteria:**
- ✅ A "Randomize" button is visible in the configuration panel
- ✅ Pressing it reorders all individual slices randomly (Fisher-Yates shuffle of sliceOrder)
- ✅ Items with multiple slices are scattered rather than grouped
- ✅ The randomized layout is preserved on page reload
- ✅ The "Randomize" button is disabled when there are fewer than 2 slices total
- ✅ The button is disabled while the wheel is spinning or decelerating

---

### US-9: Remove Winner from Wheel — ✅ DONE
> *As a user, I want to remove the winner from the wheel after it's picked, so I can run an elimination tournament.*

**Acceptance criteria:**
- ✅ The winner modal has a "Remove from wheel" button
- ✅ Pressing it decrements the winner's count by 1
- ✅ If the winner's count was 1, the item is removed entirely
- ✅ After removal, the modal closes and the wheel resets to idle with the updated layout
- ✅ If removing the item leaves 0 items, the wheel shows the empty state

---

### US-10: Persist Configuration — ✅ DONE
> *As a user, I want my items and wheel layout to be automatically saved, so I don't have to re-configure every time I open the app.*

**Acceptance criteria:**
- ✅ Configuration is saved to localStorage automatically after every change
- ✅ On page load, the previous configuration is restored (items, counts, and slice order)
- ✅ If no previous config exists, the wheel loads with 3 default sample items
- ✅ If localStorage data is corrupt or unreadable, the app falls back to defaults without crashing

---

### US-11: Use on Mobile — ✅ DONE
> *As a user, I want the app to work on my phone, so I can spin the wheel anywhere.*

**Acceptance criteria:**
- ✅ On screens ≤768px wide, the wheel stacks above the configuration panel
- ✅ The wheel scales to fill the screen width on mobile (ResizeObserver + aspect-ratio)
- ✅ All buttons ≥44×44px touch targets on coarse-pointer devices (`@media (pointer: coarse)`)
- ✅ The configuration panel scrolls independently when content overflows
- ✅ Wheel + single-column layout works in both portrait and landscape

---

### US-12: Empty State — ✅ DONE
> *As a user, if I remove all items, I want clear feedback that I need to add items before spinning.*

**Acceptance criteria:**
- ✅ When no items are configured, the wheel canvas shows an empty-state message
- ✅ The spin button shows "Add items first" and is visibly disabled
- ✅ The configuration panel remains fully interactive so I can add items

---

## Implementation Tasks

Tasks are ordered to match the implementation sequence. Each task builds on the previous ones.

---

### TASK-01: Project Scaffold — ✅ DONE
### TASK-02: Types — ✅ DONE
### TASK-03: Color Utility — ✅ DONE
### TASK-04: Storage Utility — ✅ DONE
### TASK-05: Wheel Utility — ✅ DONE
### TASK-06: `useWheelConfig` Hook — ✅ DONE
### TASK-07: `Wheel` Component — ✅ DONE
### TASK-08: `useSpinWheel` Hook — ✅ DONE
### TASK-09: `SpinButton` Component — ✅ DONE
- ✅ `noItems` prop disables button and shows "Add items first" when wheel is empty

### TASK-10: `WinnerModal` Component — ✅ DONE
- ✅ "Spin Again!" → calls `onSpinAgain` (starts new spin immediately)
- ✅ "Remove from wheel" → calls `onRemove` (decrements/removes + closes)
- ✅ "Close" button → calls `onClose`
- ✅ Escape key via `<dialog>` cancel event → calls `onClose`
- ✅ Backdrop click → calls `onClose`
- ✅ Fade-in animation

### TASK-11: `ItemRow` Component — ✅ DONE
- ✅ onBlur empty name → reverts to "Unnamed"
- ✅ +/− stepper buttons replace plain number input; − disabled at count=1, + disabled at count=20

### TASK-12: `ConfigPanel` Component — ✅ DONE

### TASK-13: App Layout & Wiring — ✅ DONE
- ✅ `removeWinner()` wired: calls `removeOneFromSliceOrder(winner.itemId)` + `dismissWinner()`
- ✅ `onSpinAgain` calls `handlePress` directly (phase='stopped' → starts spin, clears winner)
- ✅ Spin button receives `noItems={slices.length === 0}`
- ✅ All modal callbacks properly connected

### TASK-14: Responsive Mobile Layout — ✅ DONE
**Depends on:** TASK-13
- ✅ CSS breakpoint at 768px — single column, wheel on top
- ✅ Touch targets ≥44px via `@media (pointer: coarse)` on stepper, remove, add, randomize buttons
- ✅ ResizeObserver + aspect-ratio keeps wheel circular at any width

### TASK-15: Polish & Accessibility — ✅ DONE
**Depends on:** TASK-13, TASK-14
- ✅ `aria-label` on all interactive elements
- ✅ `role="dialog"` + `aria-modal="true"` on winner modal (via `<dialog>`)
- ✅ `aria-live="polite" aria-atomic="true"` visually-hidden region announces winner to screen readers
- ✅ Hover/active/disabled CSS on all buttons
- ✅ Wheel drop-shadow via `filter: drop-shadow()` (follows circular canvas shape)
- ✅ Escape key closes modal (via `<dialog>` cancel event)
- ✅ Focus returns to Spin button after all three modal actions (Spin Again, Remove, Close)
- ✅ `SpinButton` uses `forwardRef` for programmatic focus management

---

## Story → Task Mapping

| User Story | Tasks | Status |
|---|---|---|
| US-1: View the wheel | TASK-01–03, 05, 07 | ✅ Done |
| US-2: Spin the wheel | TASK-08, 09 | ✅ Done |
| US-3: Stop the wheel | TASK-08, 09 | ✅ Done |
| US-4: See the winner | TASK-08, 10 | ✅ Done |
| US-5: Spin again | TASK-08, 09, 10 | ✅ Done |
| US-6: Configure items | TASK-06, 11, 12 | ✅ Done |
| US-7: Set item weights | TASK-06, 11, 12 | ✅ Done |
| US-8: Randomize layout | TASK-06, 12 | ✅ Done |
| US-9: Remove winner | TASK-10, 13 | ✅ Done |
| US-10: Persist config | TASK-04, 06 | ✅ Done |
| US-11: Mobile | TASK-14 | ✅ Done |
| US-12: Empty state | TASK-07, 09, 12 | ✅ Done |
| All: Polish | TASK-15 | ✅ Done |
