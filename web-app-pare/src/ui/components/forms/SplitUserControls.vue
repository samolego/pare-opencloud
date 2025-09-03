<template>
  <div class="split-users oc-p-s oc-border oc-rounded">
    <div class="split-users-list">
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
          <UserAvatarImg :user="user" :avatar-size="24" class="oc-mx-s" />
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
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, watch } from 'vue'
import { UserSplitWithInclusion, BillUser } from '../../../types/user'
import FormInput from './FormInput.vue'
import UserAvatarImg from '../common/UserAvatarImg.vue'

export default defineComponent({
  name: 'SplitUserControls',
  components: {
    FormInput,
    UserAvatarImg
  },
  props: {
    users: {
      type: Array as PropType<BillUser[]>,
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

    const onSplitIncludedChange = (userId: number) => {
      const newSplits = { ...props.modelValue }

      if (!newSplits[userId]) {
        newSplits[userId] = { amount: '0.00', included: false }
      }

      newSplits[userId].included = !newSplits[userId].included

      if (newSplits[userId].included && props.totalAmount > 0) {
        calculateEqualSplits(newSplits)
      } else if (!newSplits[userId].included) {
        newSplits[userId].amount = '0.00'
      }

      emit('update:modelValue', newSplits)
    }

    const onSplitAmountChange = (userId: number, amount: string) => {
      const newSplits = { ...props.modelValue }

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
      onSplitIncludedChange,
      onSplitAmountChange
    }
  }
})
</script>

<style lang="scss" scoped>
@import '../../styles/mixins';

.split-users {
  background-color: var(--oc-role-surface-container);
}

.split-users-list {
  max-height: 240px;
  overflow-y: auto;
  @include custom-scrollbar;
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
</style>
