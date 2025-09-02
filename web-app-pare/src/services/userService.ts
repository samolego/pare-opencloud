import { Resource } from '@opencloud-eu/web-client'
import { BillUser, UserTypeConverter, UserUtils } from '../types/user'
import { User } from '@opencloud-eu/web-client/graph/generated'

export class UserService {
  private static cachedUser: BillUser | null = null
  private static userPromise: Promise<BillUser> | null = null
  private static userCache: Map<string, BillUser> = new Map()
  private static userPromises: Map<string, Promise<BillUser>> = new Map()

  /**
   * Get current user information from OpenCloud GraphUsers API
   */
  static async getCurrentUser(clientService?: any, resource?: Resource): Promise<BillUser> {
    // Return cached user if available
    if (this.cachedUser) {
      return this.cachedUser
    }

    // Return existing promise if one is already in progress
    if (this.userPromise) {
      return this.userPromise
    }

    this.userPromise = this.fetchUser(clientService, resource)
    const user = await this.userPromise
    this.cachedUser = user
    this.userPromise = null

    return user
  }

  private static async fetchUser(clientService?: any, resource?: Resource): Promise<BillUser> {
    // Try to get user from OpenCloud GraphUsers API
    if (clientService?.graphAuthenticated?.users) {
      try {
        const me: User = await clientService.graphAuthenticated.users.getMe({
          expand: []
        })
        if (me) {
          return UserTypeConverter.fromOpenCloudUser(me)
        }
      } catch (error) {
        console.warn('Failed to fetch current user from OpenCloud API:', error)
      }
    }

    // Try to get user from resource owner
    if (resource?.owner) {
      return {
        id: 0,
        name: resource.owner.displayName || resource.owner.id || 'Resource Owner',
        opencloud_id: resource.owner.id || null
      }
    }

    // Fallback to environment variables for development
    const envUserName = process.env.VUE_APP_DEFAULT_USER_NAME
    const envUserId = process.env.VUE_APP_DEFAULT_USER_ID

    if (envUserName || envUserId) {
      return {
        id: 0,
        name: envUserName || 'Environment User',
        opencloud_id: envUserId || null
      }
    }

    // Final fallback
    return UserUtils.createFallbackUser('Current User', 0)
  }

  /**
   * Clear cached user data (useful for logout or user switching)
   */
  static clearCache(): void {
    this.cachedUser = null
    this.userPromise = null
  }

  /**
   * Check if we have a valid user with OpenCloud ID
   */
  static hasValidUser(user: BillUser): boolean {
    return UserUtils.hasValidOpenCloudId(user)
  }

  /**
   * Format user display name for UI
   */
  static formatDisplayName(user: BillUser): string {
    return UserUtils.getFormattedName(user)
  }

  /**
   * Get user by ID from OpenCloud GraphUsers API
   */
  static async getUserById(userId: string, clientService?: any): Promise<BillUser | null> {
    if (!userId) return null

    // Return cached user if available
    if (this.userCache.has(userId)) {
      return this.userCache.get(userId)!
    }

    // Return existing promise if one is already in progress
    if (this.userPromises.has(userId)) {
      return this.userPromises.get(userId)!
    }

    const userPromise = this.fetchUserById(userId, clientService)
    this.userPromises.set(userId, userPromise)

    try {
      const user = await userPromise
      if (user) {
        this.userCache.set(userId, user)
      }
      return user
    } finally {
      this.userPromises.delete(userId)
    }
  }

  private static async fetchUserById(
    userId: string,
    clientService?: any
  ): Promise<BillUser | null> {
    // Try to get user from OpenCloud GraphUsers API
    if (clientService?.graphAuthenticated?.users) {
      try {
        const openCloudUser: User = await clientService.graphAuthenticated.users.getUser(userId, {
          expand: []
        })
        if (openCloudUser) {
          return UserTypeConverter.fromOpenCloudUser(openCloudUser)
        }
      } catch (error) {
        console.warn(`Failed to fetch user ${userId} from OpenCloud API:`, error)
      }
    }

    // Return null instead of fallback user if API fails
    return null
  }

  /**
   * Clear all cached user data
   */
  static clearAllCache(): void {
    this.cachedUser = null
    this.userPromise = null
    this.userCache.clear()
    this.userPromises.clear()
  }

  /**
   * Clear specific user from cache
   */
  static clearUserCache(userId: string): void {
    this.userCache.delete(userId)
    this.userPromises.delete(userId)
  }
}
