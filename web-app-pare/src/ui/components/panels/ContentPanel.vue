<template>
  <div class="content-panel">
    <div v-if="items.length === 0" class="oc-text-muted oc-text-small oc-p-s">
      {{ emptyMessage }}
    </div>

    <div v-else class="content-container">
      <div class="content-list">
        <div
          v-for="item in paginatedItems"
          :key="item.id"
          class="content-item oc-p-s oc-mb-xs"
          :class="{ 'content-item-dark': darkTheme }"
          @click="props.onItemClick(item)"
        >
          <div class="item-main">
            <div class="item-title oc-text-bold oc-text-small">
              {{ getItemTitle(item) }}
            </div>
            <div
              v-if="getItemSubtitle(item)"
              class="item-details oc-flex oc-flex-between oc-flex-middle oc-mt-xs"
            >
              <div
                class="item-subtitle"
                :class="{ 'item-amount-negative': isNegativeAmount(item) }"
              >
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
        </div>
      </div>

      <!-- Pagination Controls - Floating at bottom -->
      <div v-if="items.length > 0 && totalPages > 1" class="pagination-controls">
        <div class="pagination-buttons oc-flex oc-flex-between oc-flex-middle">
          <button
            class="pagination-btn"
            :class="{ 'pagination-btn-disabled': currentPage === 1 }"
            :disabled="currentPage === 1"
            @click="goToPreviousPage"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
            Previous
          </button>

          <button
            class="pagination-btn"
            :class="{ 'pagination-btn-disabled': currentPage === totalPages }"
            :disabled="currentPage === totalPages"
            @click="goToNextPage"
          >
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </button>
        </div>

        <div class="pagination-info oc-text-small oc-text-muted oc-text-center">
          Page {{ currentPage }} of {{ totalPages }} ({{ items.length }} items)
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed } from 'vue'
import { SidebarItem, SidebarConfig } from '../../../types/sidebar'

export default defineComponent({
  name: 'ContentPanel',
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
  setup(props, { emit }) {
    const currentPage = ref(1)

    const totalPages = computed(() => {
      return Math.ceil(props.items.length / props.itemsPerPage)
    })

    const paginatedItems = computed(() => {
      const start = (currentPage.value - 1) * props.itemsPerPage
      const end = start + props.itemsPerPage
      return props.items.slice(start, end)
    })

    const goToNextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++
        emit('page-change', currentPage.value)
      }
    }

    const goToPreviousPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--
        emit('page-change', currentPage.value)
      }
    }

    const getItemTitle = (item: SidebarItem): string => {
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

    return {
      getItemTitle,
      getItemSubtitle,
      getItemMeta,
      getItemDescription,
      isNegativeAmount,
      truncateText,
      emptyMessage: props.config.emptyMessage,
      currentPage,
      totalPages,
      paginatedItems,
      goToNextPage,
      goToPreviousPage
    }
  }
})
</script>

<style lang="scss" scoped>
.content-panel {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding-bottom: 100px; // Space for floating pagination
}

.content-list {
  flex: 1;
  overflow-y: auto;

  .content-item {
    background-color: var(--oc-role-background);
    border: 1px solid var(--oc-role-outline-variant);
    border-radius: var(--oc-space-small);
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: var(--oc-role-surface-container-high);
    }

    &.content-item-dark {
      background-color: var(--oc-role-background);
      border-color: var(--oc-role-outline-variant);
    }
  }
}

.item-main {
  .item-title {
    color: var(--oc-role-on-surface);
    line-height: 1.3;
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

.pagination-controls {
  position: fixed;
  bottom: var(--oc-space-medium);
  left: var(--oc-space-medium);
  right: var(--oc-space-medium);
  background-color: var(--oc-role-surface);
  border-radius: var(--oc-space-small);
  padding: var(--oc-space-medium);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

.pagination-buttons {
  margin-bottom: var(--oc-space-small);
}

.pagination-btn {
  background-color: var(--oc-role-primary);
  color: var(--oc-role-on-primary);
  border: none;
  border-radius: var(--oc-space-small);
  cursor: pointer;
  transition: all 0.2s ease;
  padding: var(--oc-space-small) var(--oc-space-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--oc-space-xsmall);
  font-size: var(--oc-font-size-small);
  font-weight: var(--oc-font-weight-medium);
  min-width: 100px;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover:not(:disabled) {
    background-color: var(--oc-role-primary-container);
    color: var(--oc-role-on-primary-container);
  }

  &:disabled,
  &.pagination-btn-disabled {
    background-color: var(--oc-role-outline-variant);
    color: var(--oc-role-on-surface-variant);
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.pagination-info {
  font-weight: var(--oc-font-weight-medium);
  color: var(--oc-role-on-surface-variant);
}
</style>
