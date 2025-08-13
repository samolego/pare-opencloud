<template>
  <div class="split-users oc-p-s oc-border oc-rounded">
    <div
      v-for="user in users"
      :key="user.id"
      class="oc-flex oc-flex-between oc-flex-center oc-mb-xs"
    >
      <label
        class="split-user-info oc-cursor-pointer oc-flex oc-flex-start oc-gap-m oc-flex-1"
        :for="`user-${user.id}`"
      >
        <input
          :id="`user-${user.id}`"
          :checked="isUserIncluded(user.id)"
          type="checkbox"
          class="split-user-checkbox"
          @change="onSplitIncludedChange(user.id)"
        />
        <span class="split-user-name oc-text-s">
          {{ user.name }}
        </span>
      </label>
      <div class="split-user-amount oc-flex-shrink-0">
        <FormInput
          :model-value="getUserAmount(user.id)"
          type="number"
          step="0.01"
          :disabled="!isUserIncluded(user.id)"
          class="split-amount-input oc-text-s oc-text-right"
          @update:model-value="(value) => onSplitAmountChange(user.id, value)"
        />
      </div>
    </div>

    <div class="split-summary oc-mt-s oc-pt-s oc-border-top">
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
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, watch } from 'vue'
import { User } from '../../../utils/pcsvParser'
import { UserSplit } from '../../../types/forms'
import FormInput from './FormInput.vue'

// Extended UserSplit with included property for component communication
interface UserSplitWithInclusion extends UserSplit {
  included: boolean
}

export default defineComponent({
  name: 'SplitUserControls',
  components: {
    FormInput
  },
  props: {
    users: {
      type: Array as PropType<User[]>,
      required: true
    },
    modelValue: {
      type: Object as PropType<{ [userId: number]: UserSplitWithInclusion }>,
      required: true
    },
    totalAmount: {
      type: Number,
      default: 0
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const isUserIncluded = (userId: number): boolean => {
      return props.modelValue[userId]?.included || false
    }

    const getUserAmount = (userId: number): string => {
      return props.modelValue[userId]?.amount || '0.00'
    }

    const totalSplitAmount = computed(() => {
      return Object.values(props.modelValue)
        .filter((split) => split.included)
        .reduce((sum, split) => sum + parseFloat(split.amount || '0'), 0)
    })

    const splitDifference = computed(() => {
      return totalSplitAmount.value - props.totalAmount
    })

    const onSplitIncludedChange = (userId: number) => {
      const newSplits = { ...props.modelValue }

      // Initialize user split if it doesn't exist
      if (!newSplits[userId]) {
        newSplits[userId] = { amount: '0.00', included: false }
      }

      newSplits[userId].included = !newSplits[userId].included

      // If switching to included and we have a total amount, recalculate equal splits
      if (newSplits[userId].included && props.totalAmount > 0) {
        calculateEqualSplits(newSplits)
      } else if (!newSplits[userId].included) {
        newSplits[userId].amount = '0.00'
      }

      emit('update:modelValue', newSplits)
    }

    const onSplitAmountChange = (userId: number, amount: string) => {
      const newSplits = { ...props.modelValue }

      // Initialize user split if it doesn't exist
      if (!newSplits[userId]) {
        newSplits[userId] = { amount: '0.00', included: false }
      }

      newSplits[userId].amount = amount
      emit('update:modelValue', newSplits)
    }

    const calculateEqualSplits = (splits: { [userId: number]: UserSplitWithInclusion }) => {
      if (props.totalAmount <= 0) return

      const includedUserIds = Object.entries(splits)
        .filter(([, split]) => split.included)
        .map(([userId]) => parseInt(userId))

      if (includedUserIds.length === 0) return

      const equalAmount = props.totalAmount / includedUserIds.length

      // Set equal amounts for included users
      includedUserIds.forEach((userId) => {
        splits[userId].amount = equalAmount.toFixed(2)
      })

      // Set excluded users to 0
      Object.entries(splits).forEach(([userId, split]) => {
        if (!split.included) {
          splits[parseInt(userId)].amount = '0.00'
        }
      })
    }

    // Auto-calculate splits when total amount changes and we have included users
    watch(
      () => props.totalAmount,
      () => {
        if (props.totalAmount > 0) {
          const newSplits = { ...props.modelValue }

          // Ensure all users have split entries
          props.users.forEach((user) => {
            if (!newSplits[user.id]) {
              newSplits[user.id] = { amount: '0.00', included: false }
            }
          })

          calculateEqualSplits(newSplits)
          emit('update:modelValue', newSplits)
        }
      }
    )

    return {
      isUserIncluded,
      getUserAmount,
      totalSplitAmount,
      splitDifference,
      onSplitIncludedChange,
      onSplitAmountChange
    }
  }
})
</script>

<style lang="scss" scoped>
.split-users {
  background-color: var(--oc-role-surface-container);
}

.split-user-info {
  align-items: center;
}

.split-user-info:last-child {
  margin-bottom: 0 !important;
}

.split-user-checkbox {
  accent-color: var(--oc-role-primary);
}

.split-user-name {
  color: var(--oc-role-on-surface);
  line-height: 1;
}

.split-user-amount {
  width: 120px;
  max-width: 120px;

  :deep(.form-input) {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
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
