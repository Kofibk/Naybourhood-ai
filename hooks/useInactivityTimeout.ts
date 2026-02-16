'use client'

import { useEffect, useRef, useCallback } from 'react'

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const CHECK_INTERVAL_MS = 60 * 1000 // Check every minute
const ACTIVITY_KEY = 'naybourhood_last_activity'

/**
 * Auto-logout after 30 minutes of inactivity.
 * Tracks mouse, keyboard, scroll, and touch events.
 * Uses sessionStorage so the timestamp is cleared when the browser closes.
 */
export function useInactivityTimeout(onTimeout: () => void) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const updateActivity = useCallback(() => {
    sessionStorage.setItem(ACTIVITY_KEY, Date.now().toString())
  }, [])

  const checkInactivity = useCallback(() => {
    const lastActivity = sessionStorage.getItem(ACTIVITY_KEY)
    if (!lastActivity) {
      // No recorded activity — set it now
      updateActivity()
      return
    }

    const elapsed = Date.now() - parseInt(lastActivity, 10)
    if (elapsed >= INACTIVITY_TIMEOUT_MS) {
      sessionStorage.removeItem(ACTIVITY_KEY)
      onTimeout()
    }
  }, [onTimeout, updateActivity])

  useEffect(() => {
    // Set initial activity timestamp
    updateActivity()

    // Activity events to track
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'] as const

    const handleActivity = () => {
      updateActivity()
    }

    // Throttle activity updates to avoid excessive writes
    let throttleTimer: ReturnType<typeof setTimeout> | null = null
    const throttledHandler = () => {
      if (throttleTimer) return
      throttleTimer = setTimeout(() => {
        handleActivity()
        throttleTimer = null
      }, 5000) // Update at most every 5 seconds
    }

    for (const event of events) {
      window.addEventListener(event, throttledHandler, { passive: true })
    }

    // Periodically check for inactivity
    timerRef.current = setInterval(checkInactivity, CHECK_INTERVAL_MS)

    return () => {
      for (const event of events) {
        window.removeEventListener(event, throttledHandler)
      }
      if (throttleTimer) clearTimeout(throttleTimer)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [updateActivity, checkInactivity])
}
