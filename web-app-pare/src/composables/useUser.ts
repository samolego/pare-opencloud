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

  // --- CURRENT USER methods ---

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

  // --- ANY USER methods (from useUserData) ---

  /**
   * Get user data by ID with caching
   */
  const getUserById = async (userId: string): Promise<BillUser | null> => {
    if (!userId) return null
    if (userCache.value[userId]) return userCache.value[userId]
    if (loadingStates.value[userId]) return null // Or wait for promise, for now return null

    loadingStates.value[userId] = true
    try {
      const user = await UserService.getUserById(userId, clientService)
      userCache.value[userId] = user
      return user
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error)
      userCache.value[userId] = null // Cache failure
      return null
    } finally {
      loadingStates.value[userId] = false
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

  // --- Cache Management ---

  /**
   * Clear all user-related caches
   */
  const clearAllUserCaches = (): void => {
    currentUser.value = null
    userCache.value = {}
    loadingStates.value = {}
    UserService.clearAllCache() // Also clear service-level cache
  }

  /**
   * Clear a specific user from the cache
   */
  const clearUserCache = (userId: string): void => {
    delete userCache.value[userId]
    delete loadingStates.value[userId]
    UserService.clearUserCache(userId)
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
    getUserById,
    getCachedUser,
    isUserLoading,

    // --- Cache Methods ---
    clearAllUserCaches,
    clearUserCache
  }
}

// Export singleton instance for global usage
export const globalUser = useUser()
