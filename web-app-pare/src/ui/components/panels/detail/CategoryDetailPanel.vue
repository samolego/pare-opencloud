<template>
  <div v-if="isVisible" class="category-detail-panel">
    <DetailPanelHeader
      :title="panelTitle"
      :can-save="canSave"
      :is-creating="mode === 'create'"
      :save-text="saveText"
      @cancel="onCancel"
      @save="onSave"
    />

    <div class="oc-p-l">
      <FormSection title="Category Information" icon="price-tag">
        <SimpleForm
          ref="categoryForm"
          :config="categoryFormConfig"
          :item="category"
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
import { Category } from '../../../../utils/psonParser'
import { useDetailPanelLogic } from '../../../../composables/useDetailPanel'
import { FormMode } from '../../../../types/forms'
import DetailPanelHeader from '../DetailPanelHeader.vue'
import { SimpleForm } from '../forms'
import { categoryFormConfig } from '../../../../configs/formConfigs'
import { FormSection } from '../../forms'

export default defineComponent({
  name: 'CategoryDetailPanel',
  components: {
    DetailPanelHeader,
    SimpleForm,
    FormSection
  },
  props: {
    category: {
      type: Object as PropType<Category | null>,
      default: null
    },
    mode: {
      type: String as PropType<FormMode>,
      default: 'create'
    }
  },
  emits: ['cancel', 'create-category', 'save-category'],
  setup(props, { emit }) {
    const {
      canSave,
      formRef: categoryForm,
      isVisible,
      panelTitle,
      computedSaveText: saveText,
      onValidationChange,
      onSave,
      createEventHandlers
    } = useDetailPanelLogic(props.mode, 'Category')

    const { onCancel, onFormSubmit } = createEventHandlers(emit)

    return {
      canSave,
      isVisible,
      panelTitle,
      saveText,
      categoryForm,
      categoryFormConfig,
      onValidationChange,
      onCancel,
      onSave,
      onFormSubmit
    }
  }
})
</script>

<style lang="scss" scoped>
.category-detail-panel {
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
