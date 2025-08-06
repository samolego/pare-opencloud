<template>
  <div v-if="isVisible" class="bill-detail-panel">
    <DetailPanelHeader
      :title="panelTitle"
      :can-save="canSave"
      :is-creating="mode === 'create'"
      :save-text="saveText"
      @cancel="onCancel"
      @save="onSave"
    />

    <div class="bill-detail-content">
      <BillForm
        ref="billForm"
        :bill="bill"
        :users="users"
        :payment-modes="paymentModes"
        :categories="categories"
        :parsed-data="parsedData"
        :mode="mode"
        @submit="onFormSubmit"
        @validation-change="onValidationChange"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, inject } from 'vue'
import { Bill, User, PaymentMode, Category, PCSVData } from '../../../../utils/pcsvParser'
import { useBillDetailPanel } from '../../../../composables/useDetailPanelLogic'
import { FormMode } from '../../../../types/forms'
import DetailPanelHeader from '../DetailPanelHeader.vue'
import { BillForm } from '../forms'

export default defineComponent({
  name: 'BillDetailPanel',
  components: {
    DetailPanelHeader,
    BillForm
  },
  props: {
    bill: {
      type: Object as PropType<Bill | null>,
      default: null
    },
    mode: {
      type: String as PropType<FormMode>,
      default: 'create'
    },
    users: {
      type: Array as PropType<User[]>,
      required: true
    },
    paymentModes: {
      type: Array as PropType<PaymentMode[]>,
      required: true
    },
    categories: {
      type: Array as PropType<Category[]>,
      required: true
    }
  },
  emits: ['cancel', 'create-bill', 'save-bill'],
  setup(props, { emit }) {
    const {
      canSave,
      formRef: billForm,
      isVisible,
      panelTitle,
      computedSaveText: saveText,
      onValidationChange,
      onSave,
      createEventHandlers
    } = useBillDetailPanel(props.mode)

    const parsedData = inject<PCSVData>('parsedData')

    const { onCancel, onFormSubmit } = createEventHandlers(emit)

    return {
      canSave,
      isVisible,
      panelTitle,
      saveText,
      billForm,
      onValidationChange,
      onCancel,
      onSave,
      onFormSubmit,
      parsedData
    }
  }
})
</script>

<style lang="scss" scoped>
@import '../../../styles/mixins';

.bill-detail-panel {
  @include detail-panel;
}
</style>
