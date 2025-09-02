import { Resource } from '@opencloud-eu/web-client'
import { BillUser, UserTypeConverter, UserUtils, UserFormData } from '../types/user'
import { User } from '@opencloud-eu/web-client/graph/generated'

export class UserService {
  private static cachedUser: BillUser | null = null
  private static userPromise: Promise<BillUser> | null = null
  private static userCache: Map<string, BillUser> = new Map()
  private static userPromises: Map<string, Promise<BillUser>> = new Map()
  private static searchCache: Map<string, UserFormData[]> = new Map()
  private static searchPromises: Map<string, Promise<UserFormData[]>> = new Map()

  /**
   * Get current user information from OpenCloud GraphUsers API
   */
  static async getCurrentUser(clientService?: any, resource?: Resource): Promise<BillUser> {
    if (this.cachedUser) return this.cachedUser
    if (this.userPromise) return this.userPromise

    this.userPromise = this.fetchUser(clientService, resource)
    const user = await this.userPromise
    this.cachedUser = user
    this.userPromise = null
    return user
  }

  private static async fetchUser(clientService?: any, resource?: Resource): Promise<BillUser> {
    if (clientService?.graphAuthenticated?.users) {
      try {
        const me: User = await clientService.graphAuthenticated.users.getMe({ expand: [] })
        if (me) return UserTypeConverter.fromOpenCloudUser(me)
      } catch (error) {
        console.warn('Failed to fetch current user from OpenCloud API:', error)
      }
    }
    if (resource?.owner) {
      return {
        id: 0,
        name: resource.owner.displayName || resource.owner.id || 'Resource Owner',
        opencloud_id: resource.owner.id || null,
        balance: 0
      }
    }
    const envUserName = process.env.VUE_APP_DEFAULT_USER_NAME
    const envUserId = process.env.VUE_APP_DEFAULT_USER_ID
    if (envUserName || envUserId) {
      return {
        id: 0,
        name: envUserName || 'Environment User',
        opencloud_id: envUserId || null,
        balance: 0
      }
    }
    return UserUtils.createFallbackUser('Current User', 0)
  }

  /**
   * Get user by ID from OpenCloud GraphUsers API
   */
  static async getUserById(userId: string, clientService?: any): Promise<BillUser | null> {
    if (!userId) return null
    if (this.userCache.has(userId)) return this.userCache.get(userId)!
    if (this.userPromises.has(userId)) return this.userPromises.get(userId)!

    const userPromise = this.fetchUserById(userId, clientService)
    this.userPromises.set(userId, userPromise)

    try {
      const user = await userPromise
      if (user) this.userCache.set(userId, user)
      return user
    } finally {
      this.userPromises.delete(userId)
    }
  }

  private static async fetchUserById(
    userId: string,
    clientService?: any
  ): Promise<BillUser | null> {
    if (clientService?.graphAuthenticated?.users) {
      try {
        const openCloudUser: User = await clientService.graphAuthenticated.users.getUser(userId, {
          expand: []
        })
        if (openCloudUser) return UserTypeConverter.fromOpenCloudUser(openCloudUser)
      } catch (error) {
        console.warn(`Failed to fetch user ${userId} from OpenCloud API:`, error)
      }
    }
    return null
  }

  /**
   * Search for users in OpenCloud by display name, email, or username
   */
  static async searchUsers(
    query: string,
    clientService?: any,
    limit: number = 10
  ): Promise<UserFormData[]> {
    if (!query || query.trim().length < 2) return []

    const trimmedQuery = query.trim().toLowerCase()
    const cacheKey = `${trimmedQuery}_${limit}`

    if (this.searchCache.has(cacheKey)) return this.searchCache.get(cacheKey)!
    if (this.searchPromises.has(cacheKey)) return this.searchPromises.get(cacheKey)!

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
  ): Promise<UserFormData[]> {
    if (!clientService?.graphAuthenticated?.users) {
      console.warn('UserService: No authenticated graph client available for search')
      return []
    }

    try {
      const searchParams = { search: `"${query}"`, orderBy: ['displayName'], top: limit }
      const response = await clientService.graphAuthenticated.users.listUsers(searchParams)

      let users: User[] = []
      if (Array.isArray(response)) {
        users = response
      } else if (response?.value && Array.isArray(response.value)) {
        users = response.value
      } else if (response?.data && Array.isArray(response.data)) {
        users = response.data
      } else if (response?.value) {
        users = [response.value]
      } else if (response && typeof response === 'object') {
        users = [response]
      }

      return users.map(UserTypeConverter.fromOpenCloudUser)
    } catch (error) {
      console.error('UserService: Failed to search users:', error)
      return []
    }
  }

  static hasValidUser(user: BillUser): boolean {
    return UserUtils.hasValidOpenCloudId(user)
  }

  static formatDisplayName(user: BillUser): string {
    return UserUtils.getFormattedName(user)
  }

  static clearAllCache(): void {
    this.cachedUser = null
    this.userPromise = null
    this.userCache.clear()
    this.userPromises.clear()
    this.searchCache.clear()
    this.searchPromises.clear()
  }

  static clearCurrentUserCache(): void {
    this.cachedUser = null
    this.userPromise = null
  }

  static clearUserCache(userId: string): void {
    this.userCache.delete(userId)
    this.userPromises.delete(userId)
  }

  static clearSearchCache(): void {
    this.searchCache.clear()
    this.searchPromises.clear()
  }

  static clearSearchCachePattern(pattern: string): void {
    const keysToDelete = Array.from(this.searchCache.keys()).filter((key) =>
      key.includes(pattern.toLowerCase())
    )
    keysToDelete.forEach((key) => {
      this.searchCache.delete(key)
      this.searchPromises.delete(key)
    })
  }
}
