<template>
  <div v-if="isVisible" class="payment-mode-detail-panel">
    <DetailPanelHeader
      :title="panelTitle"
      :can-save="canSave"
      :is-creating="mode === 'create'"
      :save-text="saveText"
      @cancel="onCancel"
      @save="onSave"
    />

    <div class="payment-mode-detail-content oc-p-l oc-p-m-sm">
      <FormSection title="Payment Method Information" icon="bank-card">
        <PaymentModeForm
          ref="paymentModeForm"
          :payment-mode="paymentMode"
          :mode="mode"
          @submit="onFormSubmit"
          @validation-change="onValidationChange"
        />
      </FormSection>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { PaymentMode } from '../../../../utils/psonParser'
import { usePaymentModeDetailPanel } from '../../../../composables/useDetailPanelLogic'
import { FormMode } from '../../../../types/forms'
import DetailPanelHeader from '../DetailPanelHeader.vue'
import { PaymentModeForm } from '../forms'
import { FormSection } from '../../forms'

export default defineComponent({
  name: 'PaymentModeDetailPanel',
  components: {
    DetailPanelHeader,
    PaymentModeForm,
    FormSection
  },
  props: {
    paymentMode: {
      type: Object as PropType<PaymentMode | null>,
      default: null
    },
    mode: {
      type: String as PropType<FormMode>,
      default: 'create'
    }
  },
  emits: ['cancel', 'create-payment-mode', 'save-payment-mode'],
  setup(props, { emit }) {
    const {
      canSave,
      formRef: paymentModeForm,
      isVisible,
      panelTitle,
      computedSaveText: saveText,
      onValidationChange,
      onSave,
      createEventHandlers
    } = usePaymentModeDetailPanel(props.mode)

    const { onCancel, onFormSubmit } = createEventHandlers(emit)

    return {
      canSave,
      isVisible,
      panelTitle,
      saveText,
      paymentModeForm,
      onValidationChange,
      onCancel,
      onSave,
      onFormSubmit
    }
  }
})
</script>

<style lang="scss" scoped>
.payment-mode-detail-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--oc-role-surface);
  border-left: 1px solid var(--oc-role-outline-variant);
  width: 100%;

  @media (max-width: 768px) {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 100;
  }
}
</style>
