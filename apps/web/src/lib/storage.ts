// Safe localStorage wrapper with quota detection and warnings

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (e) {
    if (e instanceof DOMException && (
      e.code === 22 || e.code === 1014 ||
      e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )) {
      console.warn('[Storage] localStorage quota exceeded for key:', key)
      // Try to free up space by removing old timeline entries
      try {
        localStorage.removeItem('bb-timeline')
        localStorage.setItem(key, value)
        return true
      } catch {
        // Try removing version history
        try {
          localStorage.removeItem('bb-versions')
          localStorage.setItem(key, value)
          return true
        } catch {
          console.error('[Storage] Cannot save - storage full')
          return false
        }
      }
    }
    return false
  }
}

export function getStorageUsage(): { used: number; total: number; percent: number } {
  let used = 0
  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      used += (localStorage.getItem(key) ?? '').length + key.length
    }
  }
  // localStorage limit is approximately 5MB (5 * 1024 * 1024 chars)
  const total = 5 * 1024 * 1024
  return { used, total, percent: Math.round((used / total) * 100) }
}

export function getStorageWarning(): string | null {
  const { percent } = getStorageUsage()
  if (percent >= 90) return `儲存空間已用 ${percent}%，建議清除版本歷史或時間軸記錄`
  if (percent >= 75) return `儲存空間已用 ${percent}%`
  return null
}

// Minimal serializer — strips large generated code from canvas store before saving
export function compressCanvasState(state: any): any {
  const compressed = { ...state }
  // Don't persist generated code in canvas store — it can be regenerated
  delete compressed.generatedCode
  // Trim timeline to last 10 entries
  if (compressed.timeline) compressed.timeline = compressed.timeline.slice(0, 10)
  return compressed
}
