/**
 * Performance Logging Utility
 * 
 * Tracks timing for data fetches, page loads, and API calls
 * to help identify performance bottlenecks.
 */

interface TimingEntry {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

interface PerformanceReport {
  totalDuration: number
  entries: TimingEntry[]
  slowest: TimingEntry | null
  summary: string
}

class PerformanceLogger {
  private timings: Map<string, TimingEntry> = new Map()
  private context: string = 'unknown'

  /**
   * Set the context for logging (e.g., 'DataContext', 'AdminDashboard')
   */
  setContext(context: string) {
    this.context = context
    console.log(`\n[PERF] ========== ${context} ==========`)
  }

  /**
   * Start timing an operation
   */
  start(name: string, metadata?: Record<string, any>): void {
    const entry: TimingEntry = {
      name,
      startTime: performance.now(),
      metadata,
    }
    this.timings.set(name, entry)
    console.log(`[PERF] [${this.context}] ⏱️ START: ${name}`)
  }

  /**
   * End timing an operation
   */
  end(name: string, additionalMetadata?: Record<string, any>): number {
    const entry = this.timings.get(name)
    if (!entry) {
      console.warn(`[PERF] [${this.context}] ⚠️ No start time for: ${name}`)
      return 0
    }

    entry.endTime = performance.now()
    entry.duration = entry.endTime - entry.startTime
    if (additionalMetadata) {
      entry.metadata = { ...entry.metadata, ...additionalMetadata }
    }

    // Color code based on duration
    const durationStr = `${entry.duration.toFixed(0)}ms`
    const isSlowish = entry.duration > 500
    const isSlow = entry.duration > 1000
    const isVerySlow = entry.duration > 3000

    const emoji = isVerySlow ? '🔴' : isSlow ? '🟠' : isSlowish ? '🟡' : '🟢'
    const metadataStr = entry.metadata ? ` | ${JSON.stringify(entry.metadata)}` : ''
    
    console.log(`[PERF] [${this.context}] ${emoji} END: ${name} → ${durationStr}${metadataStr}`)

    return entry.duration
  }

  /**
   * Log a quick timing (start + end in one call)
   */
  async measure<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    this.start(name, metadata)
    try {
      const result = await fn()
      this.end(name)
      return result
    } catch (error) {
      this.end(name, { error: true })
      throw error
    }
  }

  /**
   * Generate a summary report
   */
  report(): PerformanceReport {
    const entries = Array.from(this.timings.values())
      .filter(e => e.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))

    const totalDuration = entries.reduce((sum, e) => sum + (e.duration || 0), 0)
    const slowest = entries[0] || null

    const summary = entries
      .map(e => `  ${e.name}: ${e.duration?.toFixed(0)}ms`)
      .join('\n')

    console.log(`\n[PERF] [${this.context}] 📊 SUMMARY (Total: ${totalDuration.toFixed(0)}ms)`)
    console.log(summary)
    if (slowest) {
      console.log(`[PERF] [${this.context}] 🐌 Slowest: ${slowest.name} (${slowest.duration?.toFixed(0)}ms)`)
    }
    console.log(`[PERF] ========================================\n`)

    return { totalDuration, entries, slowest, summary }
  }

  /**
   * Clear all timings (for new page load)
   */
  clear() {
    this.timings.clear()
  }
}

// Singleton instance for global use
export const perf = new PerformanceLogger()

/**
 * Server-side performance logging (for API routes)
 */
export function logServerTiming(
  routeName: string,
  startTime: number,
  metadata?: Record<string, any>
) {
  const duration = Date.now() - startTime
  const emoji = duration > 3000 ? '🔴' : duration > 1000 ? '🟠' : duration > 500 ? '🟡' : '🟢'
  const metadataStr = metadata ? ` | ${JSON.stringify(metadata)}` : ''
  
  console.log(`[PERF] [API] ${emoji} ${routeName}: ${duration}ms${metadataStr}`)
  
  return duration
}

/**
 * Measure parallel fetches and log individual + total times
 */
export async function measureParallel<T extends Record<string, Promise<any>>>(
  context: string,
  fetches: T
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const startTime = performance.now()
  const names = Object.keys(fetches)
  
  console.log(`[PERF] [${context}] 🚀 Starting ${names.length} parallel fetches: ${names.join(', ')}`)
  
  // Track individual timings
  const individualStarts: Record<string, number> = {}
  const wrappedFetches: Record<string, Promise<any>> = {}
  
  for (const [name, promise] of Object.entries(fetches)) {
    individualStarts[name] = performance.now()
    wrappedFetches[name] = promise.then((result) => {
      const duration = performance.now() - individualStarts[name]
      const emoji = duration > 1000 ? '🔴' : duration > 500 ? '🟠' : '🟢'
      const size = Array.isArray(result?.data) 
        ? result.data.length 
        : (Array.isArray(result) ? result.length : '?')
      console.log(`[PERF] [${context}]   ${emoji} ${name}: ${duration.toFixed(0)}ms (${size} items)`)
      return result
    })
  }
  
  const results = await Promise.all(
    names.map(name => wrappedFetches[name])
  )
  
  const totalDuration = performance.now() - startTime
  console.log(`[PERF] [${context}] ✅ All parallel fetches completed: ${totalDuration.toFixed(0)}ms total`)
  
  return Object.fromEntries(
    names.map((name, i) => [name, results[i]])
  ) as { [K in keyof T]: Awaited<T[K]> }
}

/**
 * Decorator for React component render timing (use in useEffect)
 */
export function useRenderTiming(componentName: string) {
  if (typeof window === 'undefined') return { markInteractive: () => {} }
  
  const mountTime = performance.now()
  console.log(`[PERF] [${componentName}] 🏗️ Component mounting...`)
  
  return {
    markInteractive: () => {
      const duration = performance.now() - mountTime
      const emoji = duration > 2000 ? '🔴' : duration > 1000 ? '🟠' : duration > 500 ? '🟡' : '🟢'
      console.log(`[PERF] [${componentName}] ${emoji} Time to Interactive: ${duration.toFixed(0)}ms`)
    }
  }
}
