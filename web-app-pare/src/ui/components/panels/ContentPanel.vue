<template>
  <div class="content-panel">
    <div v-if="items.length === 0" class="oc-text-muted oc-text-small oc-p-s">
      {{ emptyMessage }}
    </div>

    <div v-else class="content-list">
      <div
        v-for="item in items"
        :key="item.id"
        class="content-item oc-p-s oc-mb-xs oc-border-radius-small"
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
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
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
    }
  },
  emits: [],
  setup(props) {
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
      emptyMessage: props.config.emptyMessage
    }
  }
})
</script>

<style lang="scss" scoped>
.content-list {
  .content-item {
    background-color: var(--oc-role-background);
    border: 1px solid var(--oc-color-border);
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: var(--oc-role-surface-container-high);
    }

    &.content-item-dark {
      background-color: var(--oc-role-background);
      border-color: var(--oc-color-border);
    }
  }
}

.item-main {
  .item-title {
    color: var(--oc-role-text);
    line-height: 1.3;
  }

  .item-subtitle {
    color: var(--oc-role-primary);
    font-weight: 600;
    font-size: 0.9rem;

    &.item-amount-negative {
      color: var(--oc-role-error);
    }
  }

  .item-meta {
    font-size: 0.75rem;
  }

  .item-description {
    line-height: 1.2;
    font-style: italic;
  }
}
</style>
