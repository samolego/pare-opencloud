<template>
  <div class="navigation-sidebar" :class="{ 'navigation-sidebar-dark': darkTheme }">
    <div class="nav-header oc-p-s oc-mb-l">
      <h2 class="oc-text-bold oc-mb-s">{{ $gettext('Pare Finance') }}</h2>
    </div>

    <nav class="nav-content oc-p-s">
      <ul class="nav-list oc-m-remove oc-p-remove">
        <li v-for="item in navigationItems" :key="item.key" class="nav-item">
          <button
            class="nav-button oc-width-1-1"
            :class="{ 'nav-button-active': currentSection === item.key }"
            @click="onNavigationClick(item.key)"
          >
            <oc-icon :name="item.icon" size="small" class="nav-icon" />
            <span class="nav-text">{{ item.label }}</span>
            <span v-if="item.count !== undefined && item.count > 0" class="nav-count">
              {{ item.count }}
            </span>
          </button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useGettext } from 'vue3-gettext'

export interface NavigationItem {
  key: string
  label: string
  icon: string
  count?: number
}

export default defineComponent({
  name: 'NavigationSidebar',
  props: {
    darkTheme: {
      type: Boolean,
      required: true
    },
    currentSection: {
      type: String,
      required: true
    },
    billsCount: {
      type: Number,
      default: 0
    },
    membersCount: {
      type: Number,
      default: 0
    },
    categoriesCount: {
      type: Number,
      default: 0
    }
  },
  emits: ['navigate'],
  setup(props, { emit }) {
    const { $gettext } = useGettext()

    const navigationItems = computed<NavigationItem[]>(() => [
      {
        key: 'bills',
        label: $gettext('Bills'),
        icon: 'receipt-fill',
        count: props.billsCount
      },
      {
        key: 'statistics',
        label: $gettext('Statistics'),
        icon: 'chart-bar'
      },
      {
        key: 'members',
        label: $gettext('Members'),
        icon: 'group-fill',
        count: props.membersCount
      },
      {
        key: 'categories',
        label: $gettext('Categories'),
        icon: 'tag',
        count: props.categoriesCount
      }
    ])

    const onNavigationClick = (section: string) => {
      emit('navigate', section)
    }

    return {
      navigationItems,
      onNavigationClick,
      $gettext
    }
  }
})
</script>

<style lang="scss" scoped>
.navigation-sidebar {
  width: 200px;
  min-width: 200px;
  max-width: 200px;
  border-right: 1px solid var(--oc-color-border);
  display: flex;
  flex-direction: column;
  background-color: var(--oc-role-surface-container-low);
  border-radius: var(--oc-space-small) 0 0 var(--oc-space-small);

  &.navigation-sidebar-dark {
    background-color: var(--oc-role-surface-container);
  }
}

.nav-header {
  border-bottom: 1px solid var(--oc-color-border);

  h2 {
    color: var(--oc-role-text);
    font-size: 1.1rem;
    margin: 0;
  }
}

.nav-content {
  flex: 1;
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
    border-radius: var(--oc-space-small);

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
  text-align: left;
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
