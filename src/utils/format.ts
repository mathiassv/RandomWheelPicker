/** Returns 's' when n !== 1, '' otherwise. Useful for simple pluralization. */
export function plural(n: number): '' | 's' {
  return n !== 1 ? 's' : ''
}
