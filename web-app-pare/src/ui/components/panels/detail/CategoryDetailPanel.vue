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
import { defineComponent, PropType, computed, ref } from 'vue'
import { Category } from '../../../../utils/pcsvParser'
import DetailPanelHeader from '../DetailPanelHeader.vue'
import { CategoryForm } from '../forms'

type CategoryDetailMode = 'create' | 'edit'

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
      type: String as PropType<CategoryDetailMode>,
      default: 'create'
    }
  },
  emits: ['cancel', 'create-category', 'save-category'],
  setup(props, { emit }) {
    const canSave = ref(false)
    const categoryForm = ref()

    const isVisible = computed(() => {
      return true
    })

    const panelTitle = computed(() => {
      return props.mode === 'create' ? 'New Category' : 'Edit Category'
    })

    const saveText = computed(() => {
      return props.mode === 'create' ? 'Add Category' : 'Save Changes'
    })

    const onValidationChange = (isValid: boolean) => {
      canSave.value = isValid
    }

    const onCancel = () => {
      emit('cancel')
    }

    const onSave = () => {
      if (categoryForm.value && categoryForm.value.onSubmit) {
        categoryForm.value.onSubmit()
      }
    }

    const onFormSubmit = (data: any) => {
      if (props.mode === 'create') {
        emit('create-category', data)
      } else {
        emit('save-category', data)
      }
    }

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
