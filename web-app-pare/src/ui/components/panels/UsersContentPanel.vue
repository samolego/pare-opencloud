<template>
  <ContentPanel
    :dark-theme="darkTheme"
    :items="items"
    :config="config"
    :on-item-click="onItemClick"
    :selected-item-id="selectedItemId"
    :items-per-page="itemsPerPage"
    :on-item-delete="onItemDelete"
    @page-change="$emit('page-change', $event)"
  >
    <template #item="{ item }">
      <div class="user-item-content">
        <div class="item-header oc-flex oc-flex-middle oc-gap-s">
          <user-avatar :user-name="getEnhancedItemTitle(item)" :user-id="item.opencloud_id" />
          <div class="item-title oc-text-bold oc-text-small">
            {{ getEnhancedItemTitle(item) }}
          </div>
        </div>
        <div class="item-details oc-flex oc-flex-between oc-flex-middle oc-mt-xs">
          <div class="item-subtitle" :class="getBalanceClass(item)">
            {{ getBalanceDisplay(item) }}
          </div>
          <div class="oc-text-muted oc-text-xsmall" @click="onItemDelete(item)">
            <oc-icon name="delete-bin-7" />
          </div>
        </div>
        <div v-if="getItemDescription(item)" class="item-description oc-text-xsmall oc-mt-xs">
          {{ truncateText(getItemDescription(item), 50) }}
        </div>
      </div>
    </template>

    <!-- Settlement Action Footer -->
  </ContentPanel>
</template>

<script lang="ts">
import { defineComponent, PropType, onMounted, watch, inject, type Ref } from 'vue'
import { SidebarItem, SidebarConfig } from '../../../types/sidebar'
import { useUserData } from '../../../composables/useUserData'
import { useContentItemFormatting } from '../../../composables/useContentItemFormatting'
import { useSettlement } from '../../../composables/useSettlement'
import ContentPanel from './ContentPanel.vue'

import type { PCSVData } from '../../../utils/pcsvParser'

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
    onItemDelete: {
      type: Function as PropType<(item: SidebarItem) => void>,
      required: true
    },
    selectedItemId: {
      type: [String, Number],
      default: null
    },
    itemsPerPage: {
      type: Number,
      default: 20
    }
  },
  emits: ['page-change'],
  setup(props) {
    const { getUserAvatar, getUserDisplayName, preloadUsers } = useUserData()
    const { getItemSubtitle, getItemDescription, isNegativeAmount, truncateText } =
      useContentItemFormatting()

    // Get parsed data from parent component
    const parsedData = inject<Ref<PCSVData>>('parsedData')
    const { getUserBalance, formatBalance } = useSettlement(parsedData)

    const getItemAvatar = (item: SidebarItem): string => {
      // Use opencloud_id if available, fallback to CSV id for display
      const userId = item.opencloud_id || item.id.toString()
      const avatar = getUserAvatar(userId)
      return avatar
    }

    const getEnhancedItemTitle = (item: SidebarItem): string => {
      // If we have opencloud_id, get enhanced name from API, otherwise use CSV name
      if (item.opencloud_id) {
        return getUserDisplayName(item.opencloud_id)
      }
      return item[props.config.titleField] || ''
    }

    const getBalanceDisplay = (item: SidebarItem): string => {
      if (!parsedData?.value) return ''

      const userBalance = getUserBalance(Number(item.id))
      if (!userBalance) return ''

      const formattedBalance = formatBalance(userBalance.balance)

      return `${formattedBalance}`
    }

    const getBalanceClass = (item: SidebarItem): string => {
      if (!parsedData?.value) return ''

      const userBalance = getUserBalance(Number(item.id))
      if (!userBalance) return ''

      if (Math.abs(userBalance.balance) < 0.01) {
        return 'item-balance-settled'
      }

      return userBalance.balance > 0 ? 'item-balance-credit' : 'item-balance-debt'
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
      getItemSubtitle: (item: SidebarItem) => getItemSubtitle(item, props.config),
      getItemDescription: (item: SidebarItem) => getItemDescription(item, props.config),
      isNegativeAmount: (item: SidebarItem) => isNegativeAmount(item, props.config),
      truncateText,
      getItemAvatar,
      getEnhancedItemTitle,
      getBalanceDisplay,
      getBalanceClass
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

    &.item-balance-credit {
      color: var(--oc-role-success);
    }

    &.item-balance-debt {
      color: var(--oc-role-error);
    }

    &.item-balance-settled {
      color: var(--oc-role-on-surface-muted);
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
