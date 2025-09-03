<template>
  <div v-if="isVisible" class="simple-detail-panel">
    <DetailPanelHeader
      :title="panelTitle"
      :can-save="canSave"
      :is-creating="mode === 'create'"
      :save-text="saveText"
      @cancel="onCancel"
      @save="onSave"
    />

    <div class="oc-p-l">
      <FormSection :title="formSectionTitle" :icon="formSectionIcon">
        <GenericForm
          ref="simpleForm"
          :config="formConfig"
          :item="item"
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
import { useDetailPanelLogic } from '../../../../composables/useDetailPanel'
import { FormMode } from '../../../../types/forms'
import DetailPanelHeader from '../DetailPanelHeader.vue'
import GenericForm, { type SimpleFormConfig } from '../forms/GenericForm.vue'
import { FormSection } from '../../forms'

export default defineComponent({
  name: 'GenericDetailPanel',
  components: {
    DetailPanelHeader,
    GenericForm,
    FormSection
  },
  props: {
    item: {
      type: Object as PropType<{ name: string } | null>,
      default: null
    },
    mode: {
      type: String as PropType<FormMode>,
      default: 'create'
    },
    itemType: {
      type: String,
      required: true
    },
    formConfig: {
      type: Object as PropType<SimpleFormConfig>,
      required: true
    },
    formSectionTitle: {
      type: String,
      required: true
    },
    formSectionIcon: {
      type: String,
      required: true
    }
  },
  emits: ['cancel', 'create-category', 'save-category', 'create-payment-mode', 'save-payment-mode'],
  setup(props, { emit }) {
    const {
      canSave,
      formRef: simpleForm,
      isVisible,
      panelTitle,
      computedSaveText: saveText,
      onValidationChange,
      onSave,
      createEventHandlers
    } = useDetailPanelLogic(props.mode, props.itemType)

    const { onCancel, onFormSubmit } = createEventHandlers(emit)

    return {
      canSave,
      isVisible,
      panelTitle,
      saveText,
      simpleForm,
      onValidationChange,
      onCancel,
      onSave,
      onFormSubmit
    }
  }
})
</script>

<style lang="scss" scoped>
.simple-detail-panel {
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
