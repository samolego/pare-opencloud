import { ref, computed, type Ref } from 'vue'
import { useClientService } from '@opencloud-eu/web-pkg'
import { UserService } from '../services/userService'
import { BillUser, UserUtils } from '../types/user'
import type { Resource } from '@opencloud-eu/web-client'

// --- State for CURRENT user ---
const currentUser: Ref<BillUser | null> = ref(null)
const isCurrentUserLoading = ref(false)
const currentUserError = ref<string | null>(null)

// --- State for ANY user (from useUserData) ---
const userCache: Ref<Record<string, BillUser | null>> = ref({})
const loadingStates: Ref<Record<string, boolean>> = ref({})

/**
 * Vue composable for managing all user-related data
 */
export function useUser() {
  const clientService = useClientService()

  /**
   * Initialize and fetch current user data
   */
  const initUser = async (resource?: Resource) => {
    if (currentUser.value || isCurrentUserLoading.value) {
      return
    }

    isCurrentUserLoading.value = true
    currentUserError.value = null

    try {
      const user = await UserService.getCurrentUser(clientService, resource)
      currentUser.value = user
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user'
      currentUserError.value = errorMessage
      console.error('Error fetching user:', err)
      // Set a fallback user on error
      currentUser.value = UserUtils.createFallbackUser('Current User', 0)
    } finally {
      isCurrentUserLoading.value = false
    }
  }

  /**
   * Get cached user data (doesn't trigger fetch)
   */
  const getCachedUser = (userId: string): BillUser | null => {
    return userCache.value[userId] || null
  }

  /**
   * Check if a specific user is currently being loaded
   */
  const isUserLoading = (userId: string): boolean => {
    return !!loadingStates.value[userId]
  }

  return {
    // --- Current User State ---
    user: computed(() => currentUser.value),
    isCurrentUserLoading: computed(() => isCurrentUserLoading.value),
    currentUserError: computed(() => currentUserError.value),
    displayName: computed(() => {
      if (!currentUser.value) return 'Loading...'
      return UserUtils.getFormattedName(currentUser.value)
    }),

    // --- Current User Methods ---
    initUser,

    // --- Other User Methods ---
    getCachedUser,
    isUserLoading

    // --- Cache Methods ---
  }
}

// Export singleton instance for global usage
export const globalUser = useUser()
