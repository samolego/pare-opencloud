<template>
  <div class="category-form oc-p-m" ref="formRef">
    <form @submit.prevent="onSubmit">
      <!-- Name -->
      <FormField label="Category Name" required :error="errors.name">
        <FormInput v-model="localForm.name" placeholder="Enter category name..." required />
      </FormField>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, watch } from 'vue'
import { Category } from '../../../../utils/psonParser'
import { useNameOnlyForm, useFormValidationEmits } from '../../../../composables/useSimpleForm'
import { FormField, FormInput } from '../../forms'

export default defineComponent({
  name: 'CategoryForm',
  components: {
    FormField,
    FormInput
  },
  props: {
    category: {
      type: Object as PropType<Category | null>,
      default: null
    },
    mode: {
      type: String as PropType<'create' | 'edit'>,
      default: 'create'
    }
  },
  emits: ['submit', 'validation-change'],
  setup(props, { emit }) {
    const form = useNameOnlyForm(props.category?.name || '', props.mode, 'Category name')

    // Initialize form data when category changes
    const initializeForm = () => {
      if (props.category) {
        form.updateForm({ name: props.category.name })
      } else {
        form.resetForm()
      }
      form.autoFocus()
    }

    // Watch for category changes
    watch(() => props.category, initializeForm, { immediate: true })
    watch(() => props.mode, initializeForm)

    // Handle validation change emissions
    useFormValidationEmits(form.isValid, emit)

    const onSubmit = () => {
      if (!form.validateForm()) return

      const category: Omit<Category, 'id'> = {
        name: form.localForm.name.trim()
      }

      emit('submit', category)
    }

    return {
      formRef: form.formRef,
      localForm: form.localForm,
      errors: form.errors,
      onSubmit
    }
  }
})
</script>
