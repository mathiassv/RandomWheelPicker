import { useState, useEffect, useCallback } from 'react'
import type { WheelItem } from '../types'
import { loadConfig, saveConfig, reconcileSliceOrder } from '../utils/storage'

interface ConfigState {
  items: WheelItem[]
  sliceOrder: string[]
}

function generateId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function useWheelConfig() {
  const [config, setConfig] = useState<ConfigState>(() => loadConfig())

  // Persist on every change
  useEffect(() => {
    saveConfig(config.items, config.sliceOrder)
  }, [config])

  const addItem = useCallback(() => {
    const newItem: WheelItem = { id: generateId(), name: 'New Item', count: 1 }
    setConfig((prev) => ({
      items: [...prev.items, newItem],
      sliceOrder: [...prev.sliceOrder, newItem.id],
    }))
  }, [])

  const updateItem = useCallback(
    (id: string, patch: Partial<Omit<WheelItem, 'id'>>) => {
      setConfig((prev) => {
        const newItems = prev.items.map((item) =>
          item.id === id ? { ...item, ...patch } : item
        )
        // Only reconcile sliceOrder when count changes
        const newSliceOrder =
          'count' in patch
            ? reconcileSliceOrder(newItems, prev.sliceOrder)
            : prev.sliceOrder
        return { items: newItems, sliceOrder: newSliceOrder }
      })
    },
    []
  )

  const removeItem = useCallback((id: string) => {
    setConfig((prev) => ({
      items: prev.items.filter((item) => item.id !== id),
      sliceOrder: prev.sliceOrder.filter((oid) => oid !== id),
    }))
  }, [])

  const clearItems = useCallback(() => {
    setConfig({ items: [], sliceOrder: [] })
  }, [])

  const addManyItems = useCallback((names: string[]) => {
    setConfig((prev) => {
      const newItems = names.map((name) => ({
        id: generateId(),
        name,
        count: 1,
      }))
      return {
        items: [...prev.items, ...newItems],
        sliceOrder: [...prev.sliceOrder, ...newItems.map((i) => i.id)],
      }
    })
  }, [])

  const randomizeOrder = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      sliceOrder: fisherYatesShuffle(prev.sliceOrder),
    }))
  }, [])

  /** Remove one occurrence of an item from sliceOrder, decrementing its count.
   *  Removes the item entirely if count reaches 0. */
  const removeOneSlice = useCallback((id: string) => {
    setConfig((prev) => {
      const lastIndex = prev.sliceOrder.lastIndexOf(id)
      if (lastIndex === -1) return prev
      const newOrder = [...prev.sliceOrder]
      newOrder.splice(lastIndex, 1)
      const newItems = prev.items
        .map((item) => item.id === id ? { ...item, count: item.count - 1 } : item)
        .filter((item) => item.count > 0)
      return { items: newItems, sliceOrder: newOrder }
    })
  }, [])

  return {
    items: config.items,
    sliceOrder: config.sliceOrder,
    addItem,
    addManyItems,
    updateItem,
    removeItem,
    removeOneSlice,
    clearItems,
    randomizeOrder,
  }
}
