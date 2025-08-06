<template>
  <div class="category-form">
    <form @submit.prevent="onSubmit">
      <!-- Name -->
      <FormField label="Category Name" required :error="errors.name">
        <FormInput
          v-model="localForm.name"
          placeholder="Enter category name..."
          required
          ref="nameInput"
        />
      </FormField>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, reactive, ref, computed, watch, nextTick } from 'vue'
import { Category } from '../../../../utils/pcsvParser'
import { FormField, FormInput } from '../../forms'

interface CategoryFormData {
  name: string
}

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
    const nameInput = ref<HTMLInputElement>()

    const localForm = reactive<CategoryFormData>({
      name: ''
    })

    const errors = ref<{ [key: string]: string }>({})

    // Initialize form data
    const initializeForm = () => {
      if (props.category) {
        localForm.name = props.category.name
      } else {
        localForm.name = ''
      }

      // Focus name input for new categories
      if (props.mode === 'create') {
        nextTick(() => {
          if (nameInput.value) {
            nameInput.value.focus()
          }
        })
      }
    }

    // Watch for category changes
    watch(() => props.category, initializeForm, { immediate: true })
    watch(() => props.mode, initializeForm)

    // Validation
    const validateForm = () => {
      const newErrors: { [key: string]: string } = {}

      if (!localForm.name.trim()) {
        newErrors.name = 'Category name is required'
      }

      errors.value = newErrors
      return Object.keys(newErrors).length === 0
    }

    const isValid = computed(() => {
      validateForm()
      return Object.keys(errors.value).length === 0
    })

    // Watch for validation changes
    watch(
      isValid,
      (valid) => {
        emit('validation-change', valid)
      },
      { immediate: true }
    )

    const onSubmit = () => {
      if (!validateForm()) return

      const category: Omit<Category, 'id'> = {
        name: localForm.name.trim()
      }

      emit('submit', category)
    }

    return {
      localForm,
      errors,
      nameInput,
      onSubmit
    }
  }
})
</script>

<style lang="scss" scoped>
@import '../../../styles/mixins';

.category-form {
  @include form-base;
}
</style>
