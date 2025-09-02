import { User } from '@opencloud-eu/web-client/graph/generated'

export class UserSearchService {
  private static searchCache: Map<string, User[]> = new Map()
  private static searchPromises: Map<string, Promise<User[]>> = new Map()

  /**
   * Search for users in OpenCloud by display name, email, or username
   */
  static async searchUsers(
    query: string,
    clientService?: any,
    limit: number = 10
  ): Promise<User[]> {
    if (!query || query.trim().length < 2) {
      return []
    }

    const trimmedQuery = query.trim().toLowerCase()
    const cacheKey = `${trimmedQuery}_${limit}`

    // Return cached results if available
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!
    }

    // Return existing promise if one is already in progress
    if (this.searchPromises.has(cacheKey)) {
      return this.searchPromises.get(cacheKey)!
    }

    const searchPromise = this.performUserSearch(trimmedQuery, clientService, limit)
    this.searchPromises.set(cacheKey, searchPromise)

    try {
      const results = await searchPromise
      this.searchCache.set(cacheKey, results)
      return results
    } finally {
      this.searchPromises.delete(cacheKey)
    }
  }

  private static async performUserSearch(
    query: string,
    clientService: any,
    limit: number
  ): Promise<User[]> {
    if (!clientService?.graphAuthenticated?.users) {
      console.warn('UserSearchService: No authenticated graph client available')
      return []
    }

    try {
      // Use OpenCloud Graph API to search users (matching official implementation)
      const searchParams = {
        search: `"${query}"`,
        orderBy: ['displayName'],
        top: limit
      }
      const response = await clientService.graphAuthenticated.users.listUsers(searchParams)

      // Handle different response formats
      let users: User[] = []
      if (Array.isArray(response)) {
        // Response is directly an array
        users = response
      } else if (response && response.value && Array.isArray(response.value)) {
        // Response has .value property with array
        users = response.value
      } else if (response && Array.isArray(response.data)) {
        // Response has .data property with array
        users = response.data
      } else if (response && response.value) {
        // Single object wrapped in .value
        users = [response.value]
      } else if (response && typeof response === 'object') {
        // Single object response
        users = [response]
      } else {
        users = []
      }

      return users
    } catch (error) {
      console.error('UserSearchService: Failed to search users:', error)
      return []
    }
  }

  /**
   * Get a user by exact ID (different from search)
   */
  static async getUserById(userId: string, clientService?: any): Promise<User | null> {
    if (!userId || !clientService?.graphAuthenticated?.users) {
      return null
    }

    try {
      const user: User = await clientService.graphAuthenticated.users.getUser(userId, {
        expand: []
      })

      if (user) {
        return user
      }
    } catch (error) {
      console.warn(`UserSearchService: Failed to get user ${userId}:`, error)
    }

    return null
  }

  /**
   * Clear the search cache
   */
  static clearCache(): void {
    this.searchCache.clear()
    this.searchPromises.clear()
  }

  /**
   * Clear cache entries matching a pattern
   */
  static clearCachePattern(pattern: string): void {
    const keysToDelete = Array.from(this.searchCache.keys()).filter((key) =>
      key.includes(pattern.toLowerCase())
    )

    keysToDelete.forEach((key) => {
      this.searchCache.delete(key)
      this.searchPromises.delete(key)
    })
  }
}
