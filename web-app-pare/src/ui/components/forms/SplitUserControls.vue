<template>
  <div class="split-users">
    <div v-for="user in users" :key="user.id" class="split-user-row">
      <div class="split-user-info">
        <input
          :id="`user-${user.id}`"
          :checked="isUserIncluded(user.id)"
          type="checkbox"
          class="split-user-checkbox"
          @change="onSplitIncludedChange(user.id)"
        />
        <label :for="`user-${user.id}`" class="split-user-name">
          {{ user.name }}
        </label>
      </div>
      <div class="split-user-amount">
        <FormInput
          :model-value="getUserAmount(user.id)"
          type="number"
          step="0.01"
          :disabled="!isUserIncluded(user.id)"
          class="split-amount-input"
          @update:model-value="(value) => onSplitAmountChange(user.id, value)"
        />
      </div>
    </div>

    <div class="split-summary">
      <div class="split-summary-row">
        <span class="split-summary-label">Total split:</span>
        <span class="split-summary-value">{{ totalSplitAmount.toFixed(2) }}</span>
      </div>
      <div v-if="splitDifference !== 0" class="split-summary-error">
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
  border: 1px solid var(--oc-role-outline-variant);
  border-radius: var(--oc-space-small);
  padding: var(--oc-space-small);
  background-color: var(--oc-role-surface-container);
}

.split-user-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--oc-space-xsmall);

  &:last-of-type {
    margin-bottom: 0;
  }
}

.split-user-info {
  display: flex;
  align-items: center;
  gap: var(--oc-space-xsmall);
}

.split-user-checkbox {
  margin: 0;
  accent-color: var(--oc-role-primary);
}

.split-user-name {
  font-size: var(--oc-font-size-small);
  color: var(--oc-role-on-surface);
  cursor: pointer;
  margin: 0;
}

.split-user-amount {
  width: 100px;
}

.split-amount-input {
  text-align: right;
  font-size: var(--oc-font-size-small);
}

.split-summary {
  margin-top: var(--oc-space-small);
  padding-top: var(--oc-space-small);
  border-top: 1px solid var(--oc-role-outline-variant);
}

.split-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.split-summary-label {
  font-size: var(--oc-font-size-small);
  color: var(--oc-role-on-surface);
}

.split-summary-value {
  font-size: var(--oc-font-size-small);
  font-weight: var(--oc-font-weight-semibold);
  color: var(--oc-role-on-surface);
}

.split-summary-error {
  font-size: var(--oc-font-size-xsmall);
  color: var(--oc-role-error);
  margin-top: var(--oc-space-xsmall);
  text-align: right;
}
</style>
