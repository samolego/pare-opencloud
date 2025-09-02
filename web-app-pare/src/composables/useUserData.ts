import { ref, computed, type Ref } from 'vue'
import { useClientService } from '@opencloud-eu/web-pkg'
import { UserService } from '../services/userService'
import { BillUser, UserDataCache, UserLoadingState } from '../types/user'

const userCache: Ref<UserDataCache> = ref({})
const loadingStates: Ref<UserLoadingState> = ref({})

/**
 * Vue composable for fetching and caching user data
 */
export function useUserData() {
  const clientService = useClientService()

  /**
   * Get user data by ID with caching
   */
  const getUserById = async (userId: string): Promise<BillUser | null> => {
    if (!userId) return null

    // Return cached user if available
    if (userCache.value[userId]) {
      return userCache.value[userId]
    }

    // Don't fetch if already loading
    if (loadingStates.value[userId]) {
      return userCache.value[userId] || null
    }

    loadingStates.value[userId] = true

    try {
      const user = await UserService.getUserById(userId, clientService)
      userCache.value[userId] = user
      return user
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error)
      userCache.value[userId] = null
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
   * Check if user is currently being loaded
   */
  const isLoading = (userId: string): boolean => {
    return !!loadingStates.value[userId]
  }

  /**
   * Clear user cache
   */
  const clearCache = (): void => {
    userCache.value = {}
    loadingStates.value = {}
  }

  /**
   * Clear specific user from cache
   */
  const clearUserCache = (userId: string): void => {
    delete userCache.value[userId]
    delete loadingStates.value[userId]
  }

  return {
    // Methods
    getUserById,
    getCachedUser,
    isLoading,
    clearCache,
    clearUserCache,

    // Reactive state
    userCache: computed(() => userCache.value),
    loadingStates: computed(() => loadingStates.value)
  }
}
