/**
 * Base OpenCloud user interface from the Graph API
 */
import { User } from '@opencloud-eu/web-client/graph/generated'

/**
 * Core user interface used throughout the application
 * Represents a normalized user with both internal ID and OpenCloud ID
 */
export interface BillUser {
  id: number // Internal numeric ID for PSON data
  name: string
  opencloud_id: string | null
  balance?: number | null // For PSON compatibility
}

export type UserFormData = Pick<BillUser, 'name' | 'opencloud_id'>
export type UserDataCache = Record<string, BillUser | null>
export type UserLoadingState = Record<string, boolean>

/**
 * BillUser balance interface for settlement calculations
 */
export interface UserBalance {
  userId: number
  name: string
  balance: number // positive = credit (owed money), negative = debt (owes money)
}

/**
 * Split amount interface for bill splitting
 */
export interface UserSplit {
  amount: string
}

/**
 * Extended user split with UI state
 */
export interface UserSplitWithInclusion extends UserSplit {
  included: boolean
}

/**
 * Type guards for runtime type checking
 */
export function isUser(obj: any): obj is BillUser {
  return obj && typeof obj.id === 'number' && typeof obj.name === 'string'
}

export function isOpenCloudUser(obj: any): obj is User {
  return obj && typeof obj.id === 'string'
}

/**
 * Utility functions for user type conversions
 */
export class UserTypeConverter {
  /**
   * Convert OpenCloud API user to normalized BillUser
   */
  static fromOpenCloudUser(ocUser: User, id: number = 0): BillUser {
    const name = UserTypeConverter.getDisplayName(ocUser)

    return {
      id,
      name,
      opencloud_id: ocUser.id
    }
  }

  /**
   * Get display name from User
   */
  static getDisplayName(ocUser: User): string {
    return ocUser.displayName || ocUser.mail || ocUser.onPremisesSamAccountName || 'Unknown User'
  }
}

/**
 * Utility functions for user operations
 */
export class UserUtils {
  /**
   * Get display name for any user type
   */
  static getDisplayName(user: BillUser | User): string {
    if (!user) return 'Unknown User'

    // Handle User
    if (isOpenCloudUser(user)) {
      return UserTypeConverter.getDisplayName(user)
    }

    // Handle BillUser
    return user.name || 'Unknown User'
  }

  /**
   * Get formatted name with OpenCloud ID
   */
  static getFormattedName(user: BillUser | User): string {
    const displayName = this.getDisplayName(user)
    const opencloudId = isOpenCloudUser(user) ? user.id : user.opencloud_id

    if (opencloudId) {
      return `${displayName} (${opencloudId})`
    }
    return displayName
  }

  /**
   * Check if user has valid OpenCloud integration
   */
  static hasValidOpenCloudId(user: BillUser | User): boolean {
    const opencloudId = isOpenCloudUser(user) ? user.id : user.opencloud_id
    const name = isOpenCloudUser(user) ? UserTypeConverter.getDisplayName(user) : user.name
    return !!(opencloudId && name !== 'Current User')
  }

  /**
   * Create fallback user for error states
   */
  static createFallbackUser(name: string = 'Unknown User', id: number = 0): BillUser {
    return {
      id,
      name,
      opencloud_id: null
    }
  }
}
