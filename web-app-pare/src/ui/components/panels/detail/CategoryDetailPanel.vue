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

    <div class="category-detail-content">
      <CategoryForm
        ref="categoryForm"
        :category="category"
        :mode="mode"
        @submit="onFormSubmit"
        @validation-change="onValidationChange"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Category } from '../../../../utils/pcsvParser'
import { useCategoryDetailPanel } from '../../../../composables/useDetailPanelLogic'
import { FormMode } from '../../../../types/forms'
import DetailPanelHeader from '../DetailPanelHeader.vue'
import { CategoryForm } from '../forms'

export default defineComponent({
  name: 'CategoryDetailPanel',
  components: {
    DetailPanelHeader,
    CategoryForm
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
    } = useCategoryDetailPanel(props.mode)

    const { onCancel, onFormSubmit } = createEventHandlers(emit)

    return {
      canSave,
      isVisible,
      panelTitle,
      saveText,
      categoryForm,
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

.category-detail-panel {
  @include detail-panel;
}
</style>
