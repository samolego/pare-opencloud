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

    <div class="payment-mode-detail-content">
      <PaymentModeForm
        ref="paymentModeForm"
        :payment-mode="paymentMode"
        :mode="mode"
        @submit="onFormSubmit"
        @validation-change="onValidationChange"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from 'vue'
import { PaymentMode } from '../../../../utils/pcsvParser'
import DetailPanelHeader from '../DetailPanelHeader.vue'
import { PaymentModeForm } from '../forms'

type PaymentModeDetailMode = 'create' | 'edit'

export default defineComponent({
  name: 'PaymentModeDetailPanel',
  components: {
    DetailPanelHeader,
    PaymentModeForm
  },
  props: {
    paymentMode: {
      type: Object as PropType<PaymentMode | null>,
      default: null
    },
    mode: {
      type: String as PropType<PaymentModeDetailMode>,
      default: 'create'
    }
  },
  emits: ['cancel', 'create-payment-mode', 'save-payment-mode'],
  setup(props, { emit }) {
    const canSave = ref(false)
    const paymentModeForm = ref()

    const isVisible = computed(() => {
      return true
    })

    const panelTitle = computed(() => {
      return props.mode === 'create' ? 'New Payment Mode' : 'Edit Payment Mode'
    })

    const saveText = computed(() => {
      return props.mode === 'create' ? 'Add Payment Mode' : 'Save Changes'
    })

    const onValidationChange = (isValid: boolean) => {
      canSave.value = isValid
    }

    const onCancel = () => {
      emit('cancel')
    }

    const onSave = () => {
      if (paymentModeForm.value && paymentModeForm.value.onSubmit) {
        paymentModeForm.value.onSubmit()
      }
    }

    const onFormSubmit = (data: any) => {
      if (props.mode === 'create') {
        emit('create-payment-mode', data)
      } else {
        emit('save-payment-mode', data)
      }
    }

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
@import '../../../styles/mixins';

.payment-mode-detail-panel {
  @include detail-panel;
}
</style>
