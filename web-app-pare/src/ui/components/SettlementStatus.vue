<template>
  <div v-if="needsSettlement" class="settlement-status oc-mt-s oc-rounded">
    <div class="settlement-indicator oc-flex oc-flex-middle oc-gap-xs oc-p-xs">
      <oc-icon name="alert-circle" size="small" />
      <span class="oc-text-small oc-text-bold">
        {{ $gettext('Settlement needed') }}
      </span>
    </div>

    <oc-button
      variation="primary"
      size="small"
      appearance="filled"
      :disabled="isCalculating || !lastSettlement"
      class="oc-width-1-1 oc-mt-xs"
      @click="onCreateSettlement"
    >
      <oc-icon
        :name="isCalculating ? 'loader' : 'exchange'"
        :class="{ 'oc-spinner': isCalculating }"
        size="small"
      />
      {{ isCalculating ? $gettext('Creating...') : $gettext('Create Settlement') }}
    </oc-button>

    <!-- Error Display -->
    <div v-if="error" class="settlement-error oc-mt-xs oc-p-xs oc-rounded">
      <div class="oc-text-xsmall oc-text-error">
        <oc-icon name="alert-triangle" size="small" class="oc-mr-xs" />
        {{ error }}
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="lastCreatedSettlement" class="settlement-success oc-mt-xs oc-p-xs oc-rounded">
      <div class="oc-text-xsmall oc-text-success">
        <oc-icon name="check-circle" size="small" class="oc-mr-xs" />
        {{ $gettext('Settlement created!') }}
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
  name: 'SettlementStatus',
  emits: ['settlement-created'],
  setup(props, { emit }) {
    const { $gettext } = useGettext()
    const { showMessage } = useMessages()

    // Get parsed data from parent component
    const parsedData = inject<Ref<PCSVData>>('parsedData')

    if (!parsedData) {
      throw new Error(
        'SettlementStatus component must be used within a provider that injects parsedData'
      )
    }

    const {
      needsSettlement,
      generateSettlement,
      createSettlementBills,
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
      onCreateSettlement,
      clearError
    }
  }
})
</script>

<style lang="scss" scoped>
.settlement-status {
  background-color: var(--oc-role-warning-container);
  padding: var(--oc-space-small);
}

.settlement-indicator {
  color: var(--oc-role-warning);
}

.settlement-error {
  background-color: var(--oc-role-error-container);
  color: var(--oc-role-on-error-container);
}

.settlement-success {
  background-color: var(--oc-role-success-container);
  color: var(--oc-role-on-success-container);
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
