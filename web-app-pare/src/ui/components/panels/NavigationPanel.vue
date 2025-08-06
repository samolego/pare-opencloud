<template>
  <div class="navigation-panel">
    <nav class="nav-content">
      <ul class="nav-list oc-m-remove oc-p-remove">
        <li v-for="item in navigationItems" :key="item.key" class="nav-item">
          <button
            @click="onNavigate(item.key)"
            class="nav-button oc-width-1-1"
            :class="{ 'nav-button-active': currentSection === item.key }"
          >
            <oc-icon :name="item.icon" size="small" class="nav-icon" />
            <span class="nav-text">{{ item.label }}</span>
            <span v-if="item.count !== undefined" class="nav-count">{{ item.count }}</span>
          </button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export interface NavigationItem {
  key: string
  label: string
  icon: string
  count?: number
}

export default defineComponent({
  name: 'NavigationPanel',
  props: {
    navigationItems: {
      type: Array as PropType<NavigationItem[]>,
      required: true
    },
    currentSection: {
      type: String,
      required: true
    },
    onNavigate: {
      type: Function as PropType<(section: string) => void>,
      required: true
    }
  },
  setup() {
    // No specific setup logic needed as we are passing the function directly
    return {}
  }
})
</script>

<style lang="scss" scoped>
.navigation-panel {
  padding: var(--oc-space-small);
}

.nav-list {
  list-style: none;
}

.nav-item {
  margin-bottom: var(--oc-space-xsmall);
}

.nav-button {
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--oc-space-small) var(--oc-space-medium);
  border: none;
  border-radius: var(--oc-space-small);
  background: none;
  color: var(--oc-role-text);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-size: 14px;

  &:hover {
    background-color: var(--oc-role-surface-container-high);
    color: var(--oc-role-text);
  }

  &.nav-button-active {
    background-color: var(--oc-role-primary);
    color: var(--oc-role-on-primary);
    font-weight: 600;

    .nav-icon,
    .nav-count {
      color: var(--oc-role-on-primary);
    }
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--oc-role-primary);
  }
}

.nav-icon {
  margin-right: var(--oc-space-small);
  color: var(--oc-role-text);
}

.nav-text {
  flex: 1;
}

.nav-count {
  background-color: var(--oc-role-surface-container-high);
  color: var(--oc-role-text);
  border-radius: var(--oc-space-small);
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  min-width: 20px;
  text-align: center;

  .nav-button-active & {
    background-color: rgba(255, 255, 255, 0.2);
    color: var(--oc-role-on-primary);
  }
}
</style>
