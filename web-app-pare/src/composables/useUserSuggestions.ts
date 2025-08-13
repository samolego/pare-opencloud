import { ref, computed, watch, type Ref } from 'vue'
import { useClientService } from '@opencloud-eu/web-pkg'
import { UserSearchService, type UserSearchResult } from '../services/userSearchService'

export interface UserSuggestionOptions {
  minQueryLength?: number
  maxResults?: number
  debounceMs?: number
  includeCurrentUser?: boolean
}

/**
 * Vue composable for managing user suggestions and autocomplete functionality
 */
export function useUserSuggestions(options: UserSuggestionOptions = {}) {
  const {
    minQueryLength = 2,
    maxResults = 10,
    debounceMs = 300,
    includeCurrentUser = false // eslint-disable-line @typescript-eslint/no-unused-vars
  } = options

  const clientService = useClientService()

  // State
  const query = ref('')
  const suggestions = ref<UserSearchResult[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const selectedIndex = ref(-1)
  const showSuggestions = ref(false)

  // Debounce timer
  let debounceTimer: NodeJS.Timeout | null = null

  /**
   * Perform user search
   */
  const searchUsers = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < minQueryLength) {
      suggestions.value = []
      isLoading.value = false
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const results = await UserSearchService.searchUsers(searchQuery, clientService, maxResults)

      suggestions.value = results
      selectedIndex.value = -1
      showSuggestions.value = results.length > 0
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to search users'
      suggestions.value = []
      console.error('Error searching users:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Handle query changes with debouncing
   */
  const updateQuery = (newQuery: string) => {
    query.value = newQuery

    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // Set new timer
    debounceTimer = setTimeout(() => {
      searchUsers(newQuery)
    }, debounceMs)
  }

  /**
   * Select a user from suggestions
   */
  const selectUser = (user: UserSearchResult) => {
    return UserSearchService.searchResultToUser(user)
  }

  /**
   * Navigate suggestions with keyboard
   */
  const navigateUp = () => {
    if (selectedIndex.value > 0) {
      selectedIndex.value--
    } else if (suggestions.value.length > 0) {
      selectedIndex.value = suggestions.value.length - 1
    }
  }

  const navigateDown = () => {
    if (selectedIndex.value < suggestions.value.length - 1) {
      selectedIndex.value++
    } else {
      selectedIndex.value = 0
    }
  }

  /**
   * Get currently selected suggestion
   */
  const getSelectedSuggestion = (): UserSearchResult | null => {
    if (selectedIndex.value >= 0 && selectedIndex.value < suggestions.value.length) {
      return suggestions.value[selectedIndex.value]
    }
    return null
  }

  /**
   * Clear suggestions and hide dropdown
   */
  const clearSuggestions = () => {
    suggestions.value = []
    selectedIndex.value = -1
    showSuggestions.value = false
    error.value = null
  }

  /**
   * Reset all state
   */
  const reset = () => {
    query.value = ''
    clearSuggestions()
    isLoading.value = false

    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  /**
   * Hide suggestions (but keep them in memory)
   */
  const hideSuggestions = () => {
    showSuggestions.value = false
    selectedIndex.value = -1
  }

  /**
   * Show suggestions if we have them
   */
  const showSuggestionsDropdown = () => {
    if (suggestions.value.length > 0) {
      showSuggestions.value = true
    }
  }

  // Computed
  const hasSuggestions = computed(() => suggestions.value.length > 0)
  const isQueryValid = computed(() => query.value.length >= minQueryLength)
  const hasSelection = computed(() => selectedIndex.value >= 0)

  // Watch for external query changes
  watch(
    () => query.value,
    (newQuery) => {
      if (newQuery.length < minQueryLength) {
        clearSuggestions()
      }
    }
  )

  // Cleanup on unmount
  const cleanup = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
  }

  return {
    // State
    query,
    suggestions: computed(() => suggestions.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    selectedIndex: computed(() => selectedIndex.value),
    showSuggestions: computed(() => showSuggestions.value),

    // Computed
    hasSuggestions,
    isQueryValid,
    hasSelection,

    // Methods
    updateQuery,
    selectUser,
    navigateUp,
    navigateDown,
    getSelectedSuggestion,
    clearSuggestions,
    reset,
    hideSuggestions,
    showSuggestionsDropdown,
    cleanup
  }
}

/**
 * Utility function to handle common keyboard events for user suggestions
 */
export function useUserSuggestionKeyboard(
  suggestions: Ref<any>,
  onSelect: (user: any) => void,
  onEscape?: () => void
) {
  const handleKeydown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        suggestions.value.navigateUp()
        break

      case 'ArrowDown':
        event.preventDefault()
        suggestions.value.navigateDown()
        break

      case 'Enter':
        event.preventDefault()
        const selected = suggestions.value.getSelectedSuggestion()
        if (selected) {
          const user = suggestions.value.selectUser(selected)
          onSelect(user)
        }
        break

      case 'Escape':
        event.preventDefault()
        suggestions.value.hideSuggestions()
        onEscape?.()
        break
    }
  }

  return {
    handleKeydown
  }
}
