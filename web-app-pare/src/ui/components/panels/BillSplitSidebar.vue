<template>
  <div class="bill-split-sidebar">
    <div class="split-header">
      <div class="split-header-content">
        <div class="split-header-icon">
          <oc-icon name="group" size="medium" />
        </div>
        <h2 class="split-title">Split Bill</h2>
      </div>
    </div>

    <div class="split-content">
      <!-- Split Mode Selection -->
      <div class="split-mode-section">
        <label class="split-mode-label">How to split?</label>
        <div class="split-mode-buttons">
          <button
            v-for="mode in splitModes"
            :key="mode.value"
            :class="['split-mode-button', { 'split-mode-button-active': splitMode === mode.value }]"
            @click="setSplitMode(mode.value)"
          >
            {{ mode.label }}
          </button>
        </div>
      </div>

      <!-- Total Summary -->
      <div class="split-summary oc-mt-s oc-p-s oc-border oc-rounded">
        <div class="split-summary-row oc-flex oc-flex-between oc-flex-center">
          <span class="split-summary-label oc-text-s">Total split:</span>
          <span class="split-summary-value oc-text-s oc-font-semibold">{{
            totalSplitAmount.toFixed(2)
          }}</span>
        </div>
        <div
          v-if="splitDifference !== 0"
          class="split-summary-error oc-text-xs oc-mt-xs oc-text-right"
        >
          Difference: {{ splitDifference.toFixed(2) }}
        </div>
      </div>

      <div class="split-users-section oc-mb-xl">
        <SplitUserControls
          :model-value="modelValue"
          :users="users"
          :total-amount="totalAmount"
          @update:model-value="onSplitsUpdate"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch, computed } from 'vue'
import { User } from '../../../utils/psonParser'
import { UserSplit } from '../../../types/forms'
import { SplitUserControls } from '../forms'

// Extended UserSplit with included property for component communication
interface UserSplitWithInclusion extends UserSplit {
  included: boolean
}

type SplitMode = 'equal' | 'custom'

interface SplitModeOption {
  value: SplitMode
  label: string
}

export default defineComponent({
  name: 'BillSplitSidebar',
  components: {
    SplitUserControls
  },
  props: {
    users: {
      type: Array as PropType<User[]>,
      required: true
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    modelValue: {
      type: Object as PropType<{ [userId: number]: UserSplitWithInclusion }>,
      default: () => ({})
    }
  },
  emits: ['update:model-value'],
  setup(props, { emit }) {
    const splitMode = ref<SplitMode>('equal')

    const splitModes: SplitModeOption[] = [
      { value: 'equal', label: 'Equal' },
      { value: 'custom', label: 'Custom' }
    ]

    // Auto-detect split mode based on amount differences
    const detectSplitMode = () => {
      const includedUsers = Object.values(props.modelValue).filter((split) => split.included)

      if (includedUsers.length <= 1) {
        splitMode.value = 'equal'
        return
      }

      const amounts = includedUsers.map((split) => parseFloat(split.amount || '0'))
      const minAmount = Math.min(...amounts)
      const maxAmount = Math.max(...amounts)
      const difference = maxAmount - minAmount

      // If difference is within 1 cent, consider it equal
      if (difference <= 0.01) {
        splitMode.value = 'equal'
      } else {
        splitMode.value = 'custom'
      }
    }

    // Watch for changes in modelValue to auto-detect split mode
    watch(
      () => props.modelValue,
      () => {
        detectSplitMode()
      },
      { deep: true, immediate: true }
    )

    const setSplitMode = (mode: SplitMode) => {
      splitMode.value = mode
      // The SplitUserControls component will handle the actual split calculation
    }

    const onSplitsUpdate = (splits: { [userId: number]: UserSplitWithInclusion }) => {
      emit('update:model-value', splits)
    }

    const totalSplitAmount = computed(() => {
      return Object.values(props.modelValue)
        .filter((split) => split.included)
        .reduce((sum, split) => sum + parseFloat(split.amount || '0'), 0)
    })

    const splitDifference = computed(() => {
      return totalSplitAmount.value - props.totalAmount
    })

    return {
      splitMode,
      splitModes,
      setSplitMode,
      onSplitsUpdate,
      totalSplitAmount,
      splitDifference
    }
  }
})
</script>

<style lang="scss" scoped>
@import '../../styles/mixins';

.bill-split-sidebar {
  display: flex;
  flex-direction: column;
  background-color: var(--oc-role-surface-container);
}

.split-header {
  padding: var(--oc-space-medium);
  border-bottom: 1px solid var(--oc-role-outline-variant);
}

.split-header-content {
  display: flex;
  align-items: center;
  gap: var(--oc-space-small);
}

.split-header-icon {
  color: var(--oc-role-primary);
}

.split-title {
  font-size: var(--oc-font-size-large);
  font-weight: var(--oc-font-weight-semibold);
  color: var(--oc-role-on-surface);
  margin: 0;
}

.split-content {
  flex: 1;
  padding: var(--oc-space-medium);
  display: flex;
  flex-direction: column;
  gap: var(--oc-space-large);
  min-height: 0;
}

.split-mode-section {
  margin-bottom: var(--oc-space-medium);
}

.split-mode-label {
  display: block;
  font-size: var(--oc-font-size-small);
  font-weight: var(--oc-font-weight-semibold);
  color: var(--oc-role-on-surface);
  margin-bottom: var(--oc-space-small);
}

.split-mode-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--oc-space-xsmall);
}

.split-mode-button {
  @include button-base;
  padding: var(--oc-space-small);
  font-size: var(--oc-font-size-xsmall);
  background-color: var(--oc-role-surface-container-high);
  color: var(--oc-role-on-surface-variant);
  border: 1px solid var(--oc-role-outline-variant);

  &:hover {
    background-color: var(--oc-role-surface-container-highest);
  }

  &.split-mode-button-active {
    background-color: var(--oc-role-primary);
    color: var(--oc-role-on-primary);
    border-color: var(--oc-role-primary);
  }
}

.split-users-section {
  flex: 1;
  min-height: 0;
}

.split-summary {
  background-color: var(--oc-role-surface-container);
}

.split-summary-label {
  color: var(--oc-role-on-surface);
}

.split-summary-value {
  color: var(--oc-role-on-surface);
}

.split-summary-error {
  color: var(--oc-role-error);
}
</style>
