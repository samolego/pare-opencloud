<template>
  <div class="settlement-action oc-p-s oc-card">
    <!-- Settlement Status -->
    <div class="settlement-status oc-mb-s">
      <div v-if="needsSettlement" class="settlement-needed oc-flex oc-flex-middle oc-gap-xs">
        <oc-icon name="alert-circle" />
        <span class="oc-text-bold oc-text-xlarge">
          {{ $gettext('Settlement available') }}
        </span>
      </div>
      <div v-else class="settlement-balanced oc-flex oc-flex-middle oc-gap-xs">
        <oc-icon name="check-circle" />
        <span class="oc-text-bold oc-text-large">
          {{ $gettext('All balances settled') }}
        </span>
      </div>
    </div>

    <!-- Settlement Summary -->
    <div v-if="needsSettlement && lastSettlement" class="settlement-summary oc-mb-s">
      <div class="oc-text-medium oc-text-muted">
        {{ getSettlementSummary(lastSettlement) }}
      </div>
    </div>

    <!-- See Transactions Button -->
    <div v-if="needsSettlement && lastSettlement" class="settlement-actions oc-mb-s">
      <oc-button
        variation="outline"
        size="medium"
        appearance="outline"
        class="oc-width-1-1 oc-mb-xs"
        @click="onViewTransactions"
      >
        <oc-icon name="list" size="small" />
        {{ $gettext('See Transactions') }}
      </oc-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, inject, type Ref } from 'vue'
import { useGettext } from 'vue3-gettext'
import { useSettlement } from '../../composables/useSettlement'
import type { Settlement } from '../../types/settlement'
import type { PSONData } from '../../utils/psonParser'

export default defineComponent({
  name: 'SettlementAction',
  emits: ['view-transactions'],
  setup(props, { emit }) {
    const { $gettext } = useGettext()

    // Get parsed data from parent component
    const parsedData = inject<Ref<PSONData>>('parsedData')

    if (!parsedData) {
      throw new Error(
        'SettlementAction component must be used within a provider that injects parsedData'
      )
    }

    const { needsSettlement, generateSettlement, getSettlementSummary, getTotalSettlementAmount } =
      useSettlement(parsedData)

    const lastSettlement = ref<Settlement | null>(null)

    // Generate settlement preview when data changes
    watch(
      needsSettlement,
      () => {
        if (needsSettlement.value) {
          lastSettlement.value = generateSettlement()
        } else {
          lastSettlement.value = null
        }
      },
      { immediate: true }
    )

    const onViewTransactions = () => {
      if (lastSettlement.value) {
        emit('view-transactions', lastSettlement.value)
      }
    }

    const formatAmount = (amount: number): string => {
      return amount.toFixed(2)
    }

    return {
      // Computed properties
      needsSettlement,
      lastSettlement: computed(() => lastSettlement.value),

      // Methods
      formatAmount,
      getSettlementSummary,
      getTotalSettlementAmount,
      onViewTransactions
    }
  }
})
</script>

<style lang="scss" scoped>
.settlement-action {
  background-color: var(--oc-role-surface-variant);
}

.settlement-status {
  .settlement-needed {
    color: var(--oc-role-warning);
  }

  .settlement-balanced {
    color: var(--oc-role-success);
  }
}

.settlement-summary {
  color: var(--oc-role-on-surface-variant);
}
</style>
