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
import { defineComponent, PropType, computed, ref, inject } from 'vue'
import { Bill, User, PaymentMode, Category, PCSVData } from '../../../../utils/pcsvParser'
import DetailPanelHeader from '../DetailPanelHeader.vue'
import { BillForm } from '../forms'

type BillDetailMode = 'create' | 'edit'

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
      type: String as PropType<BillDetailMode>,
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
    const canSave = ref(false)
    const billForm = ref()
    const parsedData = inject<PCSVData>('parsedData')

    const isVisible = computed(() => {
      return true
    })

    const panelTitle = computed(() => {
      return props.mode === 'create' ? 'New Bill' : 'Edit Bill'
    })

    const saveText = computed(() => {
      return props.mode === 'create' ? 'Create Bill' : 'Save Changes'
    })

    const onValidationChange = (isValid: boolean) => {
      canSave.value = isValid
    }

    const onCancel = () => {
      emit('cancel')
    }

    const onSave = () => {
      if (billForm.value && billForm.value.onSubmit) {
        billForm.value.onSubmit()
      }
    }

    const onFormSubmit = (data: any) => {
      if (props.mode === 'create') {
        emit('create-bill', data)
      } else {
        emit('save-bill', data)
      }
    }

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
