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
      <div class="oc-flex oc-flex-row oc-gap-m">
        <!-- User Avatar -->
        <UserAvatarImg :user="item" />

        <!-- Neighbor Element -->
        <div class="oc-flex oc-flex-column oc-flex-auto oc-ml-m">
          <!-- Top Section: Username -->
          <div class="oc-flex oc-flex-row oc-flex-middle oc-gap-s">
            <div class="item-title oc-text-bold oc-text-large">
              {{ getUserName(item) }}
            </div>
          </div>

          <!-- Bottom Section: Balance and Trash Icon -->
          <div class="oc-flex oc-flex-row oc-flex-between oc-flex-middle oc-mt-xs">
            <!-- Balance -->
            <div
              class="item-subtitle oc-text-medium oc-font-semibold"
              :class="getBalanceClass(item)"
            >
              {{ getBalanceDisplay(item) }}
            </div>

            <!-- Trash Icon -->
            <div
              class="oc-text-muted oc-text-xsmall oc-cursor-pointer"
              @click.stop="onItemDelete(item)"
            >
              <oc-icon name="delete-bin-7" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Settlement Action Footer -->
  </ContentPanel>
</template>

<script lang="ts">
import { defineComponent, PropType, inject, type Ref } from 'vue'
import { SidebarItem, SidebarConfig } from '../../../types/sidebar'
import { useUserData } from '../../../composables/useUserData'
import { useContentItemFormatting } from '../../../composables/useContentItemFormatting'
import { useSettlement } from '../../../composables/useSettlement'
import ContentPanel from './ContentPanel.vue'
import UserAvatarImg from '../common/UserAvatarImg.vue'

import type { PSONData } from '../../../utils/psonParser'

export default defineComponent({
  name: 'UsersContentPanel',
  components: {
    ContentPanel,
    UserAvatarImg
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
      default: 8
    }
  },
  emits: ['page-change'],
  setup(props) {
    const {} = useUserData()
    const { getItemSubtitle, getItemDescription, isNegativeAmount, truncateText } =
      useContentItemFormatting()

    // Get parsed data from parent component
    const parsedData = inject<Ref<PSONData>>('parsedData')
    const { getUserBalance, formatBalance } = useSettlement(parsedData)

    const getUserName = (item: SidebarItem): string => {
      return item.displayName || item.name || item.mail
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

    return {
      getItemSubtitle: (item: SidebarItem) => getItemSubtitle(item, props.config),
      getItemDescription: (item: SidebarItem) => getItemDescription(item, props.config),
      isNegativeAmount: (item: SidebarItem) => isNegativeAmount(item, props.config),
      truncateText,
      getUserName,
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
