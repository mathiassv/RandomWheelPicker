import type { PersistedConfig, WheelItem } from '../types'

const STORAGE_KEY = 'randomPicker_config'
const TITLE_KEY = 'randomPicker_title'
const CURRENT_VERSION = 1

export const DEFAULT_TITLE = 'Random Wheel Picker'

const DEFAULT_ITEMS: WheelItem[] = [
  { id: 'default-1', name: 'Pizza', count: 3 },
  { id: 'default-2', name: 'Sushi', count: 2 },
  { id: 'default-3', name: 'Tacos', count: 1 },
]

function defaultSliceOrder(items: WheelItem[]): string[] {
  return items.flatMap((item) => Array<string>(item.count).fill(item.id))
}

const DEFAULT_CONFIG = { items: DEFAULT_ITEMS, sliceOrder: defaultSliceOrder(DEFAULT_ITEMS) }

const MAX_ITEM_COUNT = 100
const MAX_NAME_LENGTH = 40
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

/**
 * Reconcile a stored/computed sliceOrder against the current items:
 * - Removes IDs for deleted items
 * - Drops excess entries when an item's count was reduced
 * - Appends missing entries when an item's count was increased or a new item was added
 * Existing relative order is preserved wherever possible.
 */
export function reconcileSliceOrder(items: WheelItem[], sliceOrder: string[]): string[] {
  const needed = new Map<string, number>()
  for (const item of items) needed.set(item.id, item.count)

  const seen = new Map<string, number>()
  const result: string[] = []

  for (const id of sliceOrder) {
    const max = needed.get(id)
    if (max === undefined) continue // item deleted
    const have = seen.get(id) ?? 0
    if (have < max) {
      result.push(id)
      seen.set(id, have + 1)
    }
    // else: count was reduced — drop the excess entry
  }

  // Append entries for items that need more (count increased or brand-new item)
  for (const [id, count] of needed) {
    const have = seen.get(id) ?? 0
    for (let i = have; i < count; i++) result.push(id)
  }

  return result
}

export function loadConfig(): { items: WheelItem[]; sliceOrder: string[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_CONFIG

    const parsed = JSON.parse(raw) as PersistedConfig
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      parsed.version !== CURRENT_VERSION ||
      !Array.isArray(parsed.items) ||
      parsed.items.length === 0
    ) {
      return DEFAULT_CONFIG
    }

    const validItems = parsed.items.filter(
      (item) =>
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        item.name.trim().length > 0 &&
        item.name.length <= MAX_NAME_LENGTH &&
        typeof item.count === 'number' &&
        item.count >= 1 &&
        item.count <= MAX_ITEM_COUNT &&
        (item.color === undefined || HEX_COLOR_RE.test(item.color))
    )

    if (validItems.length === 0) {
      return DEFAULT_CONFIG
    }

    // Accept stored sliceOrder if present, otherwise rebuild from items
    const rawOrder = Array.isArray(parsed.sliceOrder) ? parsed.sliceOrder : []
    const sliceOrder = reconcileSliceOrder(validItems, rawOrder)

    return { items: validItems, sliceOrder }
  } catch {
    return DEFAULT_CONFIG
  }
}

export function saveConfig(items: WheelItem[], sliceOrder: string[]): void {
  try {
    const config: PersistedConfig = { version: CURRENT_VERSION, items, sliceOrder }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // localStorage unavailable (private mode, quota exceeded) — silently ignore
  }
}

const PANEL_VISIBLE_KEY = 'randomPicker_panelVisible'
const REMOVE_WINNING_SLICE_KEY = 'randomPicker_removeWinningSlice'

export function loadPanelVisible(): boolean {
  try {
    return localStorage.getItem(PANEL_VISIBLE_KEY) !== 'false'
  } catch {
    return true
  }
}

export function savePanelVisible(visible: boolean): void {
  try {
    localStorage.setItem(PANEL_VISIBLE_KEY, String(visible))
  } catch {
    // localStorage unavailable — silently ignore
  }
}

export function loadRemoveWinningSlice(): boolean {
  try {
    return localStorage.getItem(REMOVE_WINNING_SLICE_KEY) === 'true'
  } catch {
    return false
  }
}

export function saveRemoveWinningSlice(value: boolean): void {
  try {
    localStorage.setItem(REMOVE_WINNING_SLICE_KEY, String(value))
  } catch {
    // localStorage unavailable — silently ignore
  }
}

export function loadTitle(): string {
  try {
    return localStorage.getItem(TITLE_KEY) ?? DEFAULT_TITLE
  } catch {
    return DEFAULT_TITLE
  }
}

export function saveTitle(title: string): void {
  try {
    localStorage.setItem(TITLE_KEY, title)
  } catch {
    // localStorage unavailable — silently ignore
  }
}
