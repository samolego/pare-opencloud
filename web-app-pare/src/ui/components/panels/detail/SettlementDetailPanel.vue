<template>
  <div v-if="isVisible" class="settlement-detail-panel oc-flex oc-flex-column oc-border-l">
    <DetailPanelHeader
      :title="panelTitle"
      :can-save="canCreateSettlement"
      :is-creating="false"
      :save-text="$gettext('Settle All')"
      @cancel="onCancel"
      @save="onCreateSettlement"
    />

    <div class="settlement-detail-content oc-flex-1 oc-p-l oc-p-m-sm">
      <FormSection title="Settlement Overview" icon="exchange">
        <div class="settlement-overview oc-mb-l oc-borrder-rounded oc-p-m">
          <div class="overview-item oc-mb-s oc-flex">
            <span class="overview-label oc-text-bold">Total Transactions:</span>
            <span class="overview-value">{{ settlement?.totalTransactions || 0 }}</span>
          </div>
          <div class="overview-item oc-mb-s oc-flex">
            <span class="overview-label oc-text-bold">Total Amount:</span>
            <span class="overview-value">{{ getTotalAmount() }}</span>
          </div>
          <div class="overview-item oc-flex">
            <span class="overview-label oc-text-bold">Settlement Date:</span>
            <span class="overview-value">{{ getCurrentDate() }}</span>
          </div>
        </div>
      </FormSection>

      <FormSection title="Transactions" icon="file-list-3">
        <div class="transactions-list">
          <div
            v-for="(transaction, index) in settlement?.transactions || []"
            :key="`${transaction.fromUserId}-${transaction.toUserId}`"
            class="transaction-card oc-p-m oc-mb-s oc-border oc-rounded"
          >
            <div class="transaction-header oc-flex oc-flex-between oc-flex-middle oc-mb-xs">
              <div class="transaction-number oc-text-small oc-text-muted">
                Transaction #{{ index + 1 }}
              </div>
              <div class="transaction-amount oc-text-bold oc-text-large">
                {{ formatAmount(transaction.amount) }}
              </div>
            </div>

            <div class="transaction-flow oc-flex oc-flex-middle oc-gap-m">
              <div class="participant oc-flex-1 from-participant">
                <div class="participant-label oc-text-xsmall oc-text-muted">From</div>
                <div class="participant-name oc-mt-xs oc-text-bold transaction-from">
                  {{ transaction.fromUserName }}
                </div>
              </div>

              <div class="flow-arrow oc-flex oc-flex-middle oc-p-rm">
                <oc-icon name="arrow-right" size="medium" />
              </div>

              <div class="participant oc-flex-1 to-participant">
                <div class="participant-label oc-text-xsmall oc-text-muted">To</div>
                <div class="participant-name oc-mt-xs oc-text-bold transaction-to">
                  {{ transaction.toUserName }}
                </div>
              </div>
            </div>

            <div class="oc-border-t oc-mt-s oc-flex oc-flex-right oc-pt-m">
              <oc-button
                variation="primary"
                size="small"
                appearance="filled"
                @click="onSettleTransaction"
                class="oc-text-small"
              >
                <oc-icon name="check" size="small" />
                {{ $gettext('Settle') }}
              </oc-button>
            </div>
          </div>
        </div>

        <div
          v-if="!settlement?.transactions?.length"
          class="empty-transactions oc-text-center oc-p-xl"
        >
          <oc-icon name="file-text" size="large" class="oc-text-muted" />
          <h3 class="oc-text-muted oc-mt-m">No transactions to display</h3>
          <p class="oc-text-muted">All balances are already settled.</p>
        </div>
      </FormSection>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, inject, type Ref } from 'vue'
import { useGettext } from 'vue3-gettext'
import { useMessages } from '@opencloud-eu/web-pkg'
import { useSettlement } from '../../../../composables/useSettlement'
import type { Settlement } from '../../../../types/settlement'
import type { PCSVData } from '../../../../utils/pcsvParser'
import DetailPanelHeader from '../DetailPanelHeader.vue'
import { FormSection } from '../../forms'

export default defineComponent({
  name: 'SettlementDetailPanel',
  components: {
    DetailPanelHeader,
    FormSection
  },
  props: {
    settlement: {
      type: Object as PropType<Settlement | null>,
      default: null
    }
  },
  emits: ['cancel', 'settlement-created'],
  setup(props, { emit }) {
    const { $gettext } = useGettext()
    const { showMessage } = useMessages()

    // Get parsed data from parent component for settlement creation
    const parsedData = inject<Ref<PCSVData>>('parsedData')
    const { createSettlementBills, isCalculating, error, clearError } = useSettlement(parsedData)

    const isVisible = computed(() => props.settlement !== null)

    const panelTitle = computed(() => $gettext('Settlement Details'))

    const canCreateSettlement = computed(() => {
      return !isCalculating.value && props.settlement && props.settlement.transactions.length > 0
    })

    const formatAmount = (amount: number): string => {
      return amount.toFixed(2)
    }

    const getTotalAmount = (): string => {
      if (!props.settlement?.transactions?.length) return '0.00'

      const total = props.settlement.transactions.reduce((sum, transaction) => {
        return sum + transaction.amount
      }, 0)

      return formatAmount(total)
    }

    const getCurrentDate = (): string => {
      return new Date().toLocaleDateString()
    }

    const onCancel = () => {
      emit('cancel')
    }

    const onCreateSettlement = async () => {
      try {
        clearError()
        const result = await createSettlementBills()

        if (result) {
          showMessage({
            title: $gettext('Settlement Complete'),
            desc: $gettext('Settlement bills have been created successfully.'),
            status: 'success'
          })

          // Emit event to parent
          emit('settlement-created', result)

          // Close the panel
          emit('cancel')
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

    const onSettleTransaction = () => {
      try {
        // For now, this could create a single settlement bill for this transaction
        // This is a placeholder - you might want to implement individual transaction settling
        showMessage({
          title: $gettext('Individual Settlement'),
          desc: $gettext(
            'Individual transaction settling is not yet implemented. Use "Settle All" instead.'
          ),
          status: 'info'
        })
      } catch (err) {
        console.error('Error settling individual transaction:', err)
        showMessage({
          title: $gettext('Settlement Failed'),
          desc: err instanceof Error ? err.message : $gettext('Unknown error occurred'),
          status: 'danger'
        })
      }
    }

    return {
      isVisible,
      panelTitle,
      canCreateSettlement,
      formatAmount,
      getTotalAmount,
      getCurrentDate,
      onCancel,
      onCreateSettlement,
      onSettleTransaction
    }
  }
})
</script>

<style lang="scss" scoped>
.settlement-detail-panel {
  height: 100%;
  background-color: var(--oc-role-surface);
  width: 100%;

  @media (max-width: 768px) {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 100;
  }
}

.settlement-detail-content {
  overflow-y: auto;
}

.settlement-overview {
  background-color: var(--oc-role-surface-container);

  .overview-item {
    justify-content: space-between;
    align-items: center;

    .overview-label {
      color: var(--oc-role-on-surface-variant);
    }

    .overview-value {
      color: var(--oc-role-on-surface);
      font-weight: var(--oc-font-weight-semibold);
    }
  }
}

.transactions-list {
  .transaction-card {
    background-color: var(--oc-role-surface-container);
    transition: box-shadow 0.2s ease;

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .transaction-amount {
      color: var(--oc-role-primary);
    }

    .transaction-flow {
      .participant {
        text-align: center;

        .participant-label {
          text-transform: uppercase;
          font-weight: var(--oc-font-weight-bold);
          letter-spacing: 0.5px;
        }

        &.from-participant .participant-name {
          color: var(--oc-role-error);
        }

        &.to-participant .participant-name {
          color: var(--oc-role-success);
        }
      }

      .flow-arrow {
        color: var(--oc-role-on-surface-variant);
      }
    }
  }
}

.transaction-actions {
  border-top: 1px solid var(--oc-role-outline-variant);
  padding-top: var(--oc-space-small);
}

.empty-transactions {
  color: var(--oc-role-on-surface-variant);

  h3 {
    margin: 0;
    font-size: var(--oc-font-size-large);
  }

  p {
    margin: var(--oc-space-small) 0 0 0;
    font-size: var(--oc-font-size-medium);
  }
}
</style>
