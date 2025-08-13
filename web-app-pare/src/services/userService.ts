import { Resource } from '@opencloud-eu/web-client'

interface OpenCloudUser {
  id: string
  displayName?: string
  mail?: string
  onPremisesSamAccountName?: string
  surname?: string
  memberOf?: any[]
  photo?: string
  avatar?: string
  profileImage?: string
  profilePicture?: string
  thumbnailPhoto?: string
}

export interface User {
  name: string
  opencloud_id: string | null
  displayName?: string
  mail?: string
  avatar?: string
  profileImage?: string
}

export class UserService {
  private static cachedUser: User | null = null
  private static userPromise: Promise<User> | null = null
  private static userCache: Map<string, User> = new Map()
  private static userPromises: Map<string, Promise<User>> = new Map()

  /**
   * Get current user information from OpenCloud GraphUsers API
   */
  static async getCurrentUser(clientService?: any, resource?: Resource): Promise<User> {
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

  private static async fetchUser(clientService?: any, resource?: Resource): Promise<User> {
    // Try to get user from OpenCloud GraphUsers API
    if (clientService?.graphAuthenticated?.users) {
      try {
        const me: OpenCloudUser = await clientService.graphAuthenticated.users.getMe({
          expand: ['photo', 'profilePicture', 'thumbnailPhoto']
        })
        if (me) {
          return {
            name: me.displayName || me.mail || me.onPremisesSamAccountName || 'OpenCloud User',
            opencloud_id: me.id || null,
            displayName: me.displayName,
            mail: me.mail,
            avatar: me.photo || me.profilePicture || me.thumbnailPhoto || me.avatar,
            profileImage: me.profilePicture || me.photo || me.thumbnailPhoto
          }
        }
      } catch (error) {
        console.warn('Failed to fetch current user from OpenCloud API:', error)
      }
    }

    // Try to get user from resource owner
    if (resource?.owner) {
      return {
        name: resource.owner.displayName || resource.owner.id || 'Resource Owner',
        opencloud_id: resource.owner.id || null
      }
    }

    // Fallback to environment variables for development
    const envUserName = process.env.VUE_APP_DEFAULT_USER_NAME
    const envUserId = process.env.VUE_APP_DEFAULT_USER_ID

    if (envUserName || envUserId) {
      return {
        name: envUserName || 'Environment User',
        opencloud_id: envUserId || null
      }
    }

    // Final fallback
    return {
      name: 'Current User',
      opencloud_id: null
    }
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
  static hasValidUser(user: User): boolean {
    return !!(user.opencloud_id && user.name !== 'Current User')
  }

  /**
   * Format user display name for UI
   */
  static formatDisplayName(user: User): string {
    if (user.opencloud_id) {
      return `${user.name} (${user.opencloud_id})`
    }
    return user.name
  }

  /**
   * Get user by ID from OpenCloud GraphUsers API
   */
  static async getUserById(userId: string, clientService?: any): Promise<User | null> {
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

  private static async fetchUserById(userId: string, clientService?: any): Promise<User | null> {
    // Try to get user from OpenCloud GraphUsers API
    if (clientService?.graphAuthenticated?.users) {
      try {
        const openCloudUser: OpenCloudUser = await clientService.graphAuthenticated.users.getUser(
          userId,
          {
            expand: ['photo', 'profilePicture', 'thumbnailPhoto', 'memberOf', 'avatar']
          }
        )
        if (openCloudUser) {
          return {
            name:
              openCloudUser.displayName ||
              openCloudUser.mail ||
              openCloudUser.onPremisesSamAccountName ||
              'Unknown User',
            opencloud_id: openCloudUser.id || userId,
            displayName: openCloudUser.displayName,
            mail: openCloudUser.mail,
            avatar:
              openCloudUser.photo ||
              openCloudUser.profilePicture ||
              openCloudUser.thumbnailPhoto ||
              openCloudUser.avatar,
            profileImage:
              openCloudUser.profilePicture || openCloudUser.photo || openCloudUser.thumbnailPhoto
          }
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
