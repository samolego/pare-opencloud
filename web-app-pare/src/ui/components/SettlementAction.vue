<template>
  <div class="settlement-action oc-p-s oc-card">
    <!-- Settlement Status -->
    <div class="settlement-status oc-mb-s">
      <div v-if="needsSettlement" class="settlement-needed">
        <oc-icon name="alert-circle" class="oc-mr-xs" />
        <span class="oc-text-bold oc-text-xlarge">
          {{ $gettext('Settlement needed') }}
        </span>
      </div>
      <div v-else class="settlement-balanced">
        <oc-icon name="check-circle" class="oc-mr-xs" />
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

    <!-- Settlement Transactions Preview -->
    <div v-if="needsSettlement && lastSettlement" class="settlement-transactions oc-mb-s">
      <div class="oc-text-large oc-text-bold oc-mb-xs">
        {{ $gettext('Transactions:') }}
      </div>
      <div
        v-for="transaction in lastSettlement.transactions"
        :key="`${transaction.fromUserId}-${transaction.toUserId}`"
        class="transaction-item oc-text-medium oc-mb-xs"
      >
        <span class="transaction-from">{{ transaction.fromUserName }}</span>
        <oc-icon name="arrow-right" size="small" class="oc-mx-xs" />
        <span class="transaction-to">{{ transaction.toUserName }}</span>
        <span class="transaction-amount oc-text-bold oc-ml-xs">
          {{ formatAmount(transaction.amount) }}
        </span>
      </div>
    </div>

    <!-- Action Button -->
    <oc-button
      v-if="needsSettlement"
      variation="primary"
      size="medium"
      appearance="filled"
      :disabled="isCalculating || !lastSettlement"
      class="oc-width-1-1 oc-text-large"
      @click="onCreateSettlement"
    >
      <oc-icon
        :name="isCalculating ? 'loader' : 'exchange'"
        :class="{ 'oc-spinner': isCalculating }"
      />
      {{ isCalculating ? $gettext('Creating ...') : $gettext('Create Settlement Bills') }}
    </oc-button>

    <!-- Error Display -->
    <div v-if="error" class="settlement-error oc-mt-s">
      <div class="oc-text-xsmall oc-text-error">
        <oc-icon name="alert-triangle" size="small" class="oc-mr-xs" />
        {{ error }}
      </div>
      <oc-button appearance="raw" size="small" @click="clearError" class="oc-text-xsmall oc-mt-xs">
        {{ $gettext('Dismiss') }}
      </oc-button>
    </div>

    <!-- Success Message -->
    <div v-if="lastCreatedSettlement" class="settlement-success oc-mt-s">
      <div class="oc-text-xsmall oc-text-success">
        <oc-icon name="check-circle" size="small" class="oc-mr-xs" />
        {{ $gettext('Settlement bills created successfully!') }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, inject, type Ref } from 'vue'
import { useGettext } from 'vue3-gettext'
import { useMessages } from '@opencloud-eu/web-pkg'
import { useSettlement } from '../../composables/useSettlement'
import type { Settlement, SettlementResult } from '../../types/settlement'
import type { PCSVData } from '../../utils/pcsvParser'

export default defineComponent({
  name: 'SettlementAction',
  emits: ['settlement-created', 'update:current-content'],
  setup(props, { emit }) {
    const { $gettext } = useGettext()
    const { showMessage } = useMessages()

    // Get parsed data from parent component
    const parsedData = inject<Ref<PCSVData>>('parsedData')

    if (!parsedData) {
      throw new Error(
        'SettlementAction component must be used within a provider that injects parsedData'
      )
    }

    const {
      needsSettlement,
      generateSettlement,
      createSettlementBills,
      getSettlementSummary,
      getTotalSettlementAmount,
      isCalculating,
      error,
      clearError
    } = useSettlement(parsedData)

    const lastSettlement = ref<Settlement | null>(null)
    const lastCreatedSettlement = ref<SettlementResult | null>(null)

    // Generate settlement preview when data changes
    watch(
      needsSettlement,
      () => {
        if (needsSettlement.value) {
          lastSettlement.value = generateSettlement()
        } else {
          lastSettlement.value = null
          lastCreatedSettlement.value = null
        }
      },
      { immediate: true }
    )

    const formatAmount = (amount: number): string => {
      return amount.toFixed(2)
    }

    const onCreateSettlement = async () => {
      try {
        clearError()
        lastCreatedSettlement.value = null

        const result = await createSettlementBills()

        if (result) {
          lastCreatedSettlement.value = result

          showMessage({
            title: $gettext('Settlement Complete'),
            desc: $gettext('Settlement bills have been created successfully.'),
            status: 'success'
          })

          // Emit event to parent
          emit('settlement-created', result)

          // Clear success message after 3 seconds
          setTimeout(() => {
            lastCreatedSettlement.value = null
          }, 3000)
        }
      } catch (err) {
        console.error('Error creating settlement:', err)
        showMessage({
          title: $gettext('Settlement Failed'),
          desc: err instanceof Error ? err.message : $gettext('Unknown error occurred'),
          status: 'danger'
        })
      }
    }

    return {
      // Computed properties
      needsSettlement,
      lastSettlement: computed(() => lastSettlement.value),
      isCalculating,
      error,
      lastCreatedSettlement: computed(() => lastCreatedSettlement.value),

      // Methods
      formatAmount,
      getSettlementSummary,
      getTotalSettlementAmount,
      onCreateSettlement,
      clearError
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
    display: flex;
    align-items: center;
  }

  .settlement-balanced {
    color: var(--oc-role-success);
    display: flex;
    align-items: center;
  }
}

.settlement-summary {
  color: var(--oc-role-on-surface-variant);
}

.settlement-transactions {
  .transaction-item {
    display: flex;
    align-items: center;
    padding: 2px 0;

    .transaction-from {
      color: var(--oc-role-error);
    }

    .transaction-to {
      color: var(--oc-role-success);
    }

    .transaction-amount {
      color: var(--oc-role-on-surface);
      margin-left: auto;
    }
  }
}

.settlement-error {
  background-color: var(--oc-role-error-container);
  color: var(--oc-role-on-error-container);
  padding: 8px;
  border-radius: 4px;
}

.settlement-success {
  background-color: var(--oc-role-success-container);
  color: var(--oc-role-on-success-container);
  padding: 8px;
  border-radius: 4px;
}

.oc-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
