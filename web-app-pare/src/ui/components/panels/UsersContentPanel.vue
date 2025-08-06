<template>
  <ContentPanel
    :dark-theme="darkTheme"
    :items="items"
    :config="config"
    :on-item-click="onItemClick"
    :items-per-page="itemsPerPage"
    @page-change="$emit('page-change', $event)"
  >
    <template #item="{ item }">
      <div class="user-item-content">
        <div class="item-header oc-flex oc-flex-middle oc-gap-s">
          <oc-avatar
            :user-name="getEnhancedItemTitle(item)"
            :src="getItemAvatar(item)"
            :width="36"
          />
          <div class="item-title oc-text-bold oc-text-small">
            {{ getEnhancedItemTitle(item) }}
          </div>
        </div>
        <div
          v-if="getItemSubtitle(item)"
          class="item-details oc-flex oc-flex-between oc-flex-middle oc-mt-xs"
        >
          <div class="item-subtitle" :class="{ 'item-amount-negative': isNegativeAmount(item) }">
            {{ getItemSubtitle(item) }}
          </div>
          <div v-if="getItemMeta(item)" class="item-meta oc-text-muted oc-text-xsmall">
            {{ getItemMeta(item) }}
          </div>
        </div>
        <div
          v-if="getItemDescription(item)"
          class="item-description oc-text-muted oc-text-xsmall oc-mt-xs"
        >
          {{ truncateText(getItemDescription(item), 50) }}
        </div>
      </div>
    </template>
  </ContentPanel>
</template>

<script lang="ts">
import { defineComponent, PropType, onMounted, watch } from 'vue'
import { SidebarItem, SidebarConfig } from '../../../types/sidebar'
import { useUserData } from '../../../composables/useUserData'
import ContentPanel from './ContentPanel.vue'

export default defineComponent({
  name: 'UsersContentPanel',
  components: {
    ContentPanel
  },
  props: {
    darkTheme: {
      type: Boolean,
      required: true
    },
    items: {
      type: Array as PropType<SidebarItem[]>,
      required: true
    },
    config: {
      type: Object as PropType<SidebarConfig>,
      required: true
    },
    onItemClick: {
      type: Function as PropType<(item: SidebarItem) => void>,
      required: true
    },
    itemsPerPage: {
      type: Number,
      default: 20
    }
  },
  emits: ['page-change'],
  setup(props) {
    const { getCachedUser, getUserAvatar, getUserDisplayName, preloadUsers } = useUserData()

    const getItemAvatar = (item: SidebarItem): string => {
      // Use opencloud_id if available, fallback to CSV id for display
      const userId = item.opencloud_id || item.id.toString()
      const avatar = getUserAvatar(userId)
      console.log(`Avatar for user ${userId}:`, avatar)
      return avatar
    }

    const getEnhancedItemTitle = (item: SidebarItem): string => {
      // If we have opencloud_id, get enhanced name from API, otherwise use CSV name
      if (item.opencloud_id) {
        return getUserDisplayName(item.opencloud_id)
      }
      return item[props.config.titleField] || ''
    }

    const getItemSubtitle = (item: SidebarItem): string => {
      if (!props.config.subtitleField) return ''
      const value = item[props.config.subtitleField]

      if (typeof value === 'number' && props.config.subtitleField.includes('amount')) {
        const prefix = value < 0 ? '-' : ''
        const absValue = Math.abs(value)
        return `${prefix}$${absValue.toFixed(2)}`
      }

      return value || ''
    }

    const getItemMeta = (item: SidebarItem): string => {
      if (!props.config.metaField) return ''
      const value = item[props.config.metaField]

      if ((typeof value === 'string' && value.includes('/')) || value.includes('-')) {
        try {
          const date = new Date(value.replace(' ', 'T'))
          return date.toLocaleDateString()
        } catch {
          return value.split(' ')[0] || ''
        }
      }

      return value || ''
    }

    const getItemDescription = (item: SidebarItem): string => {
      if (!props.config.descriptionField) return ''
      return item[props.config.descriptionField] || ''
    }

    const isNegativeAmount = (item: SidebarItem): boolean => {
      if (!props.config.subtitleField?.includes('amount')) return false
      const value = item[props.config.subtitleField]
      return typeof value === 'number' && value < 0
    }

    const truncateText = (text: string, maxLength: number): string => {
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    }

    // Preload user data when items change
    watch(
      () => props.items,
      async (newItems) => {
        const userIds = newItems.map((item) => item.opencloud_id).filter((id) => id && id !== '')

        if (userIds.length > 0) {
          await preloadUsers(userIds)
        }
      },
      { immediate: true }
    )

    // Also preload when component mounts
    onMounted(async () => {
      const userIds = props.items.map((item) => item.opencloud_id).filter((id) => id && id !== '')

      if (userIds.length > 0) {
        await preloadUsers(userIds)
      }
    })

    return {
      getItemSubtitle,
      getItemMeta,
      getItemDescription,
      isNegativeAmount,
      truncateText,
      getItemAvatar,
      getEnhancedItemTitle
    }
  }
})
</script>

<style lang="scss" scoped>
.user-item-content {
  .item-header {
    align-items: flex-start;
  }

  .item-title {
    color: var(--oc-role-on-surface);
    line-height: 1.3;
    flex: 1;
  }

  .item-subtitle {
    color: var(--oc-role-primary);
    font-weight: var(--oc-font-weight-semibold);
    font-size: var(--oc-font-size-small);

    &.item-amount-negative {
      color: var(--oc-role-error);
    }
  }

  .item-meta {
    font-size: var(--oc-font-size-xsmall);
  }

  .item-description {
    line-height: 1.2;
    font-style: italic;
  }
}
</style>
