import { ref, computed, type Ref } from 'vue'
import { useClientService } from '@opencloud-eu/web-pkg'
import { UserService, type User } from '../services/userService'
import type { Resource } from '@opencloud-eu/web-client'

const currentUser: Ref<User | null> = ref(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

/**
 * Vue composable for managing OpenCloud user context
 */
export function useUser() {
  const clientService = useClientService()

  /**
   * Initialize and fetch current user data
   */
  const initUser = async (resource?: Resource) => {
    if (currentUser.value || isLoading.value) {
      return currentUser.value
    }

    isLoading.value = true
    error.value = null

    try {
      const user = await UserService.getCurrentUser(clientService, resource)
      currentUser.value = user
      return user
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user'
      error.value = errorMessage
      console.error('Error fetching user:', err)

      // Return fallback user on error
      currentUser.value = {
        name: 'Current User',
        opencloud_id: null
      }
      return currentUser.value
    } finally {
      isLoading.value = false
    }
  }

  // Computed properties
  const user = computed(() => currentUser.value)
  const displayName = computed(() => {
    if (!currentUser.value) return 'Loading...'
    return UserService.formatDisplayName(currentUser.value)
  })

  return {
    // State
    user,
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    // Computed
    displayName,
    // Methods
    initUser
  }
}

// Export singleton instance for global usage
export const globalUser = useUser()
