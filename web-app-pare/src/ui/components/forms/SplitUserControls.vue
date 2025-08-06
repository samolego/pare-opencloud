<template>
  <div class="split-users">
    <div v-for="user in users" :key="user.id" class="split-user-row">
      <div class="split-user-info">
        <input
          :id="`user-${user.id}`"
          v-model="userSplits[user.id].included"
          type="checkbox"
          class="split-user-checkbox"
          @change="onSplitIncludedChange"
        />
        <label :for="`user-${user.id}`" class="split-user-name">
          {{ user.name }}
        </label>
      </div>
      <div class="split-user-amount">
        <FormInput
          v-model="userSplits[user.id].amount"
          type="number"
          step="0.01"
          :disabled="!userSplits[user.id].included"
          class="split-amount-input"
          @input="onSplitAmountChange"
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
import { defineComponent, PropType, ref, computed, watch } from 'vue'
import { User } from '../../../utils/pcsvParser'
import FormInput from './FormInput.vue'

interface UserSplit {
  included: boolean
  amount: string
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
      type: Object as PropType<{ [userId: number]: UserSplit }>,
      required: true
    },
    totalAmount: {
      type: Number,
      default: 0
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const userSplits = ref<{ [userId: number]: UserSplit }>({})

    // Initialize user splits
    const initializeUserSplits = () => {
      const splits: { [userId: number]: UserSplit } = {}
      props.users.forEach((user) => {
        splits[user.id] = {
          included: props.modelValue[user.id]?.included || false,
          amount: props.modelValue[user.id]?.amount || '0.00'
        }
      })
      userSplits.value = splits
    }

    // Initialize splits when users change or component mounts
    watch(() => props.users, initializeUserSplits, { immediate: true })
    watch(() => props.modelValue, initializeUserSplits, { deep: true })

    const totalSplitAmount = computed(() => {
      return Object.values(userSplits.value)
        .filter((split) => split.included)
        .reduce((sum, split) => sum + parseFloat(split.amount || '0'), 0)
    })

    const splitDifference = computed(() => {
      return totalSplitAmount.value - props.totalAmount
    })

    const onSplitIncludedChange = () => {
      calculateEqualSplits()
      emitUpdate()
    }

    const onSplitAmountChange = () => {
      emitUpdate()
    }

    const calculateEqualSplits = () => {
      if (props.totalAmount <= 0) return

      const includedUsers = Object.entries(userSplits.value).filter(([_, split]) => split.included)

      if (includedUsers.length === 0) return

      const equalAmount = props.totalAmount / includedUsers.length

      includedUsers.forEach(([, split]) => {
        split.amount = equalAmount.toFixed(2)
      })

      // Set excluded users to 0
      Object.entries(userSplits.value).forEach(([, split]) => {
        if (!split.included) {
          split.amount = '0.00'
        }
      })
    }

    // Auto-calculate splits when total amount changes
    watch(
      () => props.totalAmount,
      () => {
        if (props.totalAmount > 0) {
          calculateEqualSplits()
          emitUpdate()
        }
      }
    )

    const emitUpdate = () => {
      emit('update:modelValue', { ...userSplits.value })
    }

    return {
      userSplits,
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
