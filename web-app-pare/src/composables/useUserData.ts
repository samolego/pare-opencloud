import { ref, computed, type Ref } from 'vue'
import { useClientService } from '@opencloud-eu/web-pkg'
import { UserService, type User } from '../services/userService'

interface UserDataCache {
  [userId: string]: User | null
}

interface UserLoadingState {
  [userId: string]: boolean
}

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
  const getUserById = async (userId: string): Promise<User | null> => {
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
  const getCachedUser = (userId: string): User | null => {
    return userCache.value[userId] || null
  }

  /**
   * Check if user is currently being loaded
   */
  const isLoading = (userId: string): boolean => {
    return !!loadingStates.value[userId]
  }

  /**
   * Get user display name with fallback
   */
  const getUserDisplayName = (userId: string): string => {
    const user = getCachedUser(userId)
    if (user?.displayName) return user.displayName
    if (user?.name) return user.name
    return `User ${userId}`
  }

  /**
   * Get user avatar URL with fallback generation
   */
  const getUserAvatar = (userId: string): string | null => {
    const user = getCachedUser(userId)

    // Return actual avatar if available
    if (user?.avatar) return user.avatar
    if (user?.profileImage) return user.profileImage

    const URL = `https://cloud.opencloud.test/graph/v1.0/users/${userId}/photo/$value`

    return URL
  }

  /**
   * Preload user data for a list of user IDs
   */
  const preloadUsers = async (userIds: string[]): Promise<void> => {
    const promises = userIds
      .filter((id) => id && !userCache.value[id] && !loadingStates.value[id])
      .map((id) => getUserById(id))

    await Promise.all(promises)

    console.log(`Preloaded ${promises.length} users`)
    console.log(userCache.value)
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
    getUserDisplayName,
    getUserAvatar,
    preloadUsers,
    clearCache,
    clearUserCache,

    // Reactive state
    userCache: computed(() => userCache.value),
    loadingStates: computed(() => loadingStates.value)
  }
}
