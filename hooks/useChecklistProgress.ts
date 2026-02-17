'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import {
  type UserType,
  type ChecklistProgress,
  getChecklistItemsForUser,
  checkItemCompletion,
  updateChecklistProgress,
  dismissChecklist as dismissChecklistAction,
  reopenChecklist as reopenChecklistAction,
} from '@/lib/checklist'

interface ChecklistState {
  completedItems: Set<string>
  progress: ChecklistProgress
  isLoading: boolean
  isDismissed: boolean
  totalItems: number
  completedCount: number
}

export function useChecklistProgress(
  userId: string | undefined,
  companyId: string | undefined,
  userType: UserType | undefined
) {
  const [state, setState] = useState<ChecklistState>({
    completedItems: new Set(),
    progress: {},
    isLoading: true,
    isDismissed: false,
    totalItems: 0,
    completedCount: 0,
  })

  const items = userType ? getChecklistItemsForUser(userType) : []

  const checkProgress = useCallback(async () => {
    if (!userId || !companyId || !userType || !isSupabaseConfigured()) {
      setState((prev) => ({ ...prev, isLoading: false }))
      return
    }

    try {
      const supabase = createClient()

      // Fetch current checklist_progress from user_profiles
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('checklist_progress')
        .eq('id', userId)
        .single()

      const checklistProgress: ChecklistProgress = (profile?.checklist_progress as ChecklistProgress) || {}

      if (checklistProgress.dismissed) {
        setState({
          completedItems: new Set(),
          progress: checklistProgress,
          isLoading: false,
          isDismissed: true,
          totalItems: items.length,
          completedCount: 0,
        })
        return
      }

      // Check completion for each item
      const checklistItems = getChecklistItemsForUser(userType)
      const completedSet = new Set<string>()

      const completionChecks = checklistItems.map(async (item) => {
        const isComplete = await checkItemCompletion(
          item.id,
          companyId,
          userId,
          userType,
          checklistProgress
        )
        if (isComplete) {
          completedSet.add(item.id)
        }
      })

      await Promise.all(completionChecks)

      setState({
        completedItems: completedSet,
        progress: checklistProgress,
        isLoading: false,
        isDismissed: false,
        totalItems: checklistItems.length,
        completedCount: completedSet.size,
      })
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Checklist] Error checking progress:', err)
      }
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [userId, companyId, userType, items.length])

  useEffect(() => {
    checkProgress()
  }, [checkProgress])

  const markItemViewed = useCallback(
    async (key: string) => {
      if (!userId) return
      const newProgress = { ...state.progress, [key]: true }
      setState((prev) => ({
        ...prev,
        progress: newProgress,
        completedItems: new Set([...Array.from(prev.completedItems), key === 'viewed_lead' ? 'review_hot_lead' : key]),
        completedCount: prev.completedItems.has(key === 'viewed_lead' ? 'review_hot_lead' : key)
          ? prev.completedCount
          : prev.completedCount + 1,
      }))
      await updateChecklistProgress(userId, newProgress)
    },
    [userId, state.progress]
  )

  const dismissChecklist = useCallback(async () => {
    if (!userId) return
    const success = await dismissChecklistAction(userId, state.progress)
    if (success) {
      setState((prev) => ({ ...prev, isDismissed: true }))
    }
  }, [userId, state.progress])

  const reopenChecklist = useCallback(async () => {
    if (!userId) return
    const success = await reopenChecklistAction(userId, state.progress)
    if (success) {
      setState((prev) => ({ ...prev, isDismissed: false }))
      // Re-check progress after reopening
      checkProgress()
    }
  }, [userId, state.progress, checkProgress])

  return {
    items,
    completedItems: state.completedItems,
    isLoading: state.isLoading,
    isDismissed: state.isDismissed,
    totalItems: state.totalItems,
    completedCount: state.completedCount,
    allComplete: state.completedCount === state.totalItems && state.totalItems > 0,
    markItemViewed,
    dismissChecklist,
    reopenChecklist,
    refresh: checkProgress,
  }
}
