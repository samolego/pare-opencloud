import { User } from './userService'

interface OpenCloudSearchUser {
  id: string
  displayName?: string
  mail?: string
  onPremisesSamAccountName?: string
  surname?: string
  givenName?: string
  userPrincipalName?: string
  photo?: string
  avatar?: string
  profileImage?: string
  profilePicture?: string
  thumbnailPhoto?: string
}

export interface UserSearchResult {
  id: string
  displayName: string
  mail?: string
  username?: string
  avatar?: string
  profileImage?: string
}

export class UserSearchService {
  private static searchCache: Map<string, UserSearchResult[]> = new Map()
  private static searchPromises: Map<string, Promise<UserSearchResult[]>> = new Map()

  /**
   * Search for users in OpenCloud by display name, email, or username
   */
  static async searchUsers(
    query: string,
    clientService?: any,
    limit: number = 10
  ): Promise<UserSearchResult[]> {
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
  ): Promise<UserSearchResult[]> {
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
      let users: OpenCloudSearchUser[] = []
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

      const mappedResults = users.map((user: OpenCloudSearchUser) => this.mapToSearchResult(user))

      // Fetch avatars for all users
      const resultsWithAvatars = await Promise.all(
        mappedResults.map(async (result) => {
          const avatarUrl = await this.fetchUserAvatar(result.id, clientService)
          return {
            ...result,
            avatar: avatarUrl
          }
        })
      )

      return resultsWithAvatars
    } catch (error) {
      console.error('UserSearchService: Failed to search users:', error)
      return []
    }
  }

  private static mapToSearchResult(user: OpenCloudSearchUser): UserSearchResult {
    const displayName =
      user.displayName ||
      user.mail ||
      user.onPremisesSamAccountName ||
      user.userPrincipalName ||
      'Unknown User'

    return {
      id: user.id,
      displayName,
      mail: user.mail,
      username: user.onPremisesSamAccountName || user.userPrincipalName,
      avatar: undefined, // Will be set by fetchUserAvatar
      profileImage: user.profilePicture || user.photo || user.thumbnailPhoto
    }
  }

  /**
   * Fetch user avatar from OpenCloud Graph API
   */
  private static async fetchUserAvatar(
    userId: string,
    clientService: any
  ): Promise<string | undefined> {
    if (!userId || !clientService?.graphAuthenticated?.users) {
      return undefined
    }

    try {
      // Construct the avatar URL like the official implementation
      const baseUrl =
        clientService.httpAuthenticatedClient?.defaults?.baseURL || window.location.origin
      const avatarUrl = `${baseUrl}/graph/v1.0/users/${userId}/photo/$value`

      // Return the avatar URL - oc-avatar component will handle fallbacks if image doesn't exist
      return avatarUrl
    } catch (error) {
      console.debug(`Failed to construct avatar URL for user ${userId}:`, error)
    }

    return undefined
  }

  /**
   * Get a user by exact ID (different from search)
   */
  static async getUserById(userId: string, clientService?: any): Promise<UserSearchResult | null> {
    if (!userId || !clientService?.graphAuthenticated?.users) {
      return null
    }

    try {
      const user: OpenCloudSearchUser = await clientService.graphAuthenticated.users.getUser(
        userId,
        {
          expand: []
        }
      )

      if (user) {
        return this.mapToSearchResult(user)
      }
    } catch (error) {
      console.warn(`UserSearchService: Failed to get user ${userId}:`, error)
    }

    return null
  }

  /**
   * Convert a UserSearchResult to the app's User format
   */
  static searchResultToUser(searchResult: UserSearchResult): User {
    return {
      name: searchResult.displayName,
      opencloud_id: searchResult.id,
      displayName: searchResult.displayName,
      mail: searchResult.mail,
      avatar: searchResult.avatar,
      profileImage: searchResult.profileImage
    }
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
