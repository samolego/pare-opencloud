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
          :class="{
            'content-item-dark': darkTheme,
            'content-item-selected': selectedItemId === item.id
          }"
          @click="onItemClick(item)"
        >
          <slot name="item" :item="item">
            <div class="item-main">
              <div class="item-header oc-flex oc-flex-between oc-flex-middle">
                <div class="item-title oc-text-bold oc-text-large">
                  {{ getItemTitle(item) }}
                </div>
                <div v-if="getItemMeta(item)" class="oc-text-muted oc-text-small">
                  {{ getItemMeta(item) }}
                </div>
              </div>
              <div class="item-details oc-flex oc-flex-between oc-flex-middle oc-mt-xs">
                <div
                  class="item-subtitle"
                  :class="{ 'item-amount-negative': isNegativeAmount(item) }"
                >
                  {{ getItemSubtitle(item) || '' }}
                </div>
                <div class="oc-text-muted oc-text-xsmall" @click.stop="onItemDelete(item)">
                  <oc-icon name="delete-bin-7" />
                </div>
              </div>
              <div
                v-if="getItemDescription(item)"
                class="item-description oc-text-muted oc-text-small oc-mt-xs"
              >
                {{ truncateText(getItemDescription(item), 50) }}
              </div>
            </div>
          </slot>
        </div>
      </div>

      <!-- Pagination Controls - Floating at bottom -->
      <div v-if="items.length > 0 && totalPages > 1" class="pagination-controls">
        <div class="oc-flex oc-flex-center oc-flex-middle">
          <button
            class="pagination-btn"
            :disabled="currentPage === 1"
            @click="goToFirstPage"
            title="First page"
          >
            <oc-icon name="skip-back" />
          </button>

          <button
            class="pagination-btn oc-ml-s"
            :disabled="currentPage === 1"
            @click="goToPreviousPage"
            title="Previous page"
          >
            <oc-icon name="arrow-left-s" />
          </button>

          <input
            v-model="pageInputValue"
            type="number"
            class="page-input oc-ml-s oc-mr-s"
            :min="1"
            :max="totalPages"
            @change="onPageInputChange"
            @blur="onPageInputChange"
          />

          <button
            class="pagination-btn"
            :disabled="currentPage === totalPages"
            @click="goToNextPage"
            title="Next page"
          >
            <oc-icon name="arrow-right-s" />
          </button>

          <button
            class="pagination-btn oc-ml-s"
            :disabled="currentPage === totalPages"
            @click="goToLastPage"
            title="Last page"
          >
            <oc-icon name="skip-forward" />
          </button>
        </div>

        <div class="oc-text-small oc-text-muted oc-text-center oc-mt-s">
          {{ totalPages }} pages, {{ items.length }} items
        </div>
      </div>
    </div>

    <!-- Footer slot -->
    <div v-if="$slots.footer" class="content-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed, watch } from 'vue'
import { SidebarItem, SidebarConfig } from '../../../types/sidebar'
import { useContentItemFormatting } from '../../../composables/useContentItemFormatting'

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
      default: 10
    }
  },
  emits: ['page-change'],
  setup(props, { emit }) {
    const currentPage = ref(1)
    const pageInputValue = ref(1)
    const { getItemSubtitle, getItemMeta, getItemDescription, isNegativeAmount, truncateText } =
      useContentItemFormatting()

    const totalPages = computed(() => {
      return Math.ceil(props.items.length / props.itemsPerPage)
    })

    const paginatedItems = computed(() => {
      const start = (currentPage.value - 1) * props.itemsPerPage
      const end = start + props.itemsPerPage
      return props.items.slice(start, end)
    })

    // Watch for changes in totalPages and adjust currentPage if necessary
    watch(totalPages, (newTotalPages) => {
      if (currentPage.value > newTotalPages && newTotalPages > 0) {
        currentPage.value = newTotalPages
        pageInputValue.value = newTotalPages
        emit('page-change', currentPage.value)
      }
    })

    // Watch currentPage to update input value
    watch(
      currentPage,
      (newPage) => {
        pageInputValue.value = newPage
      },
      { immediate: true }
    )

    const goToFirstPage = () => {
      if (currentPage.value > 1) {
        currentPage.value = 1
        emit('page-change', currentPage.value)
      }
    }

    const goToLastPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value = totalPages.value
        emit('page-change', currentPage.value)
      }
    }

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

    const onPageInputChange = () => {
      const inputValue = parseInt(pageInputValue.value.toString())
      if (inputValue >= 1 && inputValue <= totalPages.value) {
        currentPage.value = inputValue
        emit('page-change', currentPage.value)
      } else {
        // Reset input to current page if invalid
        pageInputValue.value = currentPage.value
      }
    }

    const getItemTitle = (item: SidebarItem): string => {
      return item[props.config.titleField] || ''
    }

    return {
      getItemTitle,
      getItemSubtitle: (item: SidebarItem) => getItemSubtitle(item, props.config),
      getItemMeta: (item: SidebarItem) => getItemMeta(item, props.config),
      getItemDescription: (item: SidebarItem) => getItemDescription(item, props.config),
      isNegativeAmount: (item: SidebarItem) => isNegativeAmount(item, props.config),
      truncateText,
      emptyMessage: props.config.emptyMessage,
      currentPage,
      totalPages,
      paginatedItems,
      pageInputValue,
      goToFirstPage,
      goToLastPage,
      goToNextPage,
      goToPreviousPage,
      onPageInputChange
    }
  }
})
</script>

<style lang="scss" scoped>
@import '../../styles/mixins';

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
  padding-bottom: 120px; // Space for floating pagination
}

.content-list {
  flex: 1;
  overflow-y: auto;
  @include custom-scrollbar;

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

    &.content-item-selected {
      background-color: var(--oc-role-primary-container);
      border-color: var(--oc-role-primary);
      color: var(--oc-role-on-primary-container);

      .item-title {
        color: var(--oc-role-on-primary-container);
      }

      .item-subtitle {
        color: var(--oc-role-on-primary-container);

        &.item-amount-negative {
          color: var(--oc-role-error);
        }
      }
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

  .item-description {
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
  z-index: 1000;
}

.pagination-btn {
  background-color: var(--oc-role-primary);
  color: var(--oc-role-on-primary);
  border: none;
  border-radius: var(--oc-space-small);
  cursor: pointer;
  transition: all 0.2s ease;
  padding: var(--oc-space-small);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;

  &:hover:not(:disabled) {
    background-color: var(--oc-role-primary-container);
    color: var(--oc-role-on-primary-container);
  }

  &:disabled {
    background-color: var(--oc-role-outline-variant);
    color: var(--oc-role-on-surface-variant);
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.page-input {
  width: 50px;
  padding: var(--oc-space-xsmall) var(--oc-space-small);
  border: 1px solid var(--oc-role-outline-variant);
  border-radius: var(--oc-space-small);
  background-color: var(--oc-role-surface);
  color: var(--oc-role-on-surface);
  font-size: var(--oc-font-size-small);
  text-align: center;

  &:focus {
    outline: none;
    border-color: var(--oc-role-primary);
    box-shadow: 0 0 0 2px var(--oc-role-primary-container);
  }
}

// Custom styles for input number field
input[type='number'] {
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &[type='number'] {
    -moz-appearance: textfield;
  }

  &:focus {
    outline: none;
    border-color: var(--oc-role-primary) !important;
    box-shadow: 0 0 0 2px var(--oc-role-primary-container);
  }
}

.content-footer {
  border-top: 1px solid var(--oc-role-outline-variant);
  margin-top: auto;
}
</style>
