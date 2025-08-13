import { SidebarItem, SidebarConfig } from '../types/sidebar'

/**
 * Composable for content item formatting logic
 * Eliminates duplication between ContentPanel and UsersContentPanel
 */
export function useContentItemFormatting() {
  const getItemSubtitle = (item: SidebarItem, config: SidebarConfig): string => {
    if (!config.subtitleField) return ''
    const value = item[config.subtitleField]

    // Special formatting for amounts
    if (typeof value === 'number' && config.subtitleField.includes('amount')) {
      const prefix = value < 0 ? '-' : ''
      const absValue = Math.abs(value)
      return `${prefix}${absValue.toFixed(2)}`
    }

    return value || ''
  }

  const getItemMeta = (item: SidebarItem, config: SidebarConfig): string => {
    if (!config.metaField) return ''
    const value = item[config.metaField]

    // Special formatting for timestamps (Unix timestamp in milliseconds)
    if (typeof value === 'number' && value > 1000000000000) {
      try {
        const date = new Date(value)
        return date.toLocaleDateString()
      } catch {
        return value.toString()
      }
    }

    return value || ''
  }

  const getItemDescription = (item: SidebarItem, config: SidebarConfig): string => {
    if (!config.descriptionField) return ''
    return item[config.descriptionField] || ''
  }

  const isNegativeAmount = (item: SidebarItem, config: SidebarConfig): boolean => {
    if (!config.subtitleField?.includes('amount')) return false
    const value = item[config.subtitleField]
    return typeof value === 'number' && value < 0
  }

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return {
    getItemSubtitle,
    getItemMeta,
    getItemDescription,
    isNegativeAmount,
    truncateText
  }
}
