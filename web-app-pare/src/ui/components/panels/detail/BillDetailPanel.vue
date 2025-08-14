<template>
  <div v-if="isVisible" class="bill-detail-panel oc-flex oc-flex-column">
    <DetailPanelHeader
      :title="panelTitle"
      :can-save="canSave"
      :is-creating="mode === 'create'"
      :save-text="saveText"
      @cancel="onCancel"
      @save="onSave"
    />

    <div class="bill-detail-content oc-flex-1 oc-overflow-hidden">
      <div class="bill-detail-grid">
        <!-- Main Content -->
        <div class="bill-detail-main oc-p-l oc-overflow-auto">
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
            @splits-change="onSplitsChange"
          />
        </div>

        <!-- Sidebar -->
        <div class="bill-detail-sidebar">
          <BillSplitSidebar v-model="userSplits" :users="users" :total-amount="totalAmount" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, inject, ref, watch, nextTick } from 'vue'
import { Bill, User, PaymentMode, Category, PSONData } from '../../../../utils/psonParser'
import { useBillDetailPanel } from '../../../../composables/useDetailPanelLogic'
import { FormMode } from '../../../../types/forms'
import { UserSplit } from '../../../../types/forms'

// Extended UserSplit with included property for component communication
interface UserSplitWithInclusion extends UserSplit {
  included: boolean
}
import DetailPanelHeader from '../DetailPanelHeader.vue'
import { BillForm } from '../forms'
import BillSplitSidebar from '../BillSplitSidebar.vue'

export default defineComponent({
  name: 'BillDetailPanel',
  components: {
    DetailPanelHeader,
    BillForm,
    BillSplitSidebar
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
      formRef,
      isVisible,
      panelTitle,
      computedSaveText: saveText,
      onValidationChange,
      onSave,
      createEventHandlers
    } = useBillDetailPanel(props.mode)

    // Use the formRef from composable as billForm
    const billForm = formRef

    const parsedData = inject<PSONData>('parsedData')
    const totalAmount = ref(0)
    const userSplits = ref<{ [userId: number]: UserSplitWithInclusion }>({})
    const isUpdatingFromForm = ref(false)

    const { onCancel, onFormSubmit } = createEventHandlers(emit)

    const onSplitsChange = (
      splits: { [userId: number]: UserSplitWithInclusion },
      amount: number
    ) => {
      isUpdatingFromForm.value = true
      userSplits.value = splits
      totalAmount.value = amount
      nextTick(() => {
        isUpdatingFromForm.value = false
      })
    }

    // Watch for sidebar changes and update the form (but not when form is updating us)
    watch(
      userSplits,
      (newSplits) => {
        if (!isUpdatingFromForm.value) {
          if (billForm.value && billForm.value.updateSplits) {
            billForm.value.updateSplits(newSplits)
          }
        }
      },
      { deep: true }
    )

    return {
      canSave,
      isVisible,
      panelTitle,
      saveText,
      billForm,
      totalAmount,
      userSplits,
      onValidationChange,
      onCancel,
      onSave,
      onFormSubmit,
      onSplitsChange,
      parsedData
    }
  }
})
</script>

<style lang="scss" scoped>
@import '../../../styles/mixins';

.bill-detail-panel {
  background-color: var(--oc-role-surface);
  width: 100%;
  height: 100%;
  border-left: 1px solid var(--oc-role-outline-variant);

  @media (max-width: 768px) {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 100;
  }
}

.bill-detail-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 0;
  flex: 1;
  height: 100%;
  min-height: 0;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }
}

.bill-detail-main {
  @include custom-scrollbar;
}

.bill-detail-sidebar {
  background-color: var(--oc-role-surface-container);
  height: 100%;
  border-left: 1px solid var(--oc-role-outline-variant);

  @media (max-width: 1024px) {
    border-left: none;
    border-top: 1px solid var(--oc-role-outline-variant);
  }
}
</style>
