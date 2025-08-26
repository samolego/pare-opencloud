import { ref, reactive, computed, watch, nextTick, type Ref } from 'vue'
import type { ValidationErrors, ValidatorFunction, SimpleFormData } from '../types/forms'

/**
 * Composable for simple form logic - handles focus, validation, and common patterns
 * Used by CategoryForm, UserForm, PaymentModeForm, etc.
 */
export function useSimpleForm<T extends Record<string, any>>(
  initialData: T,
  validator: ValidatorFunction<T>,
  mode: 'create' | 'edit' = 'create'
) {
  const formRef = ref<HTMLElement>()
  const localForm = reactive<T>({ ...initialData })
  const errors = ref<ValidationErrors>({})

  // Auto-focus first input on create mode
  const autoFocus = async () => {
    if (mode === 'create') {
      await nextTick()
      const firstInput = formRef.value?.querySelector('input, select, textarea') as HTMLElement
      if (firstInput) {
        firstInput.focus()
      }
    }
  }

  // Validation logic
  const validateForm = (): boolean => {
    const newErrors = validator(localForm as T)
    errors.value = newErrors
    return Object.keys(newErrors).length === 0
  }

  const isValid = computed(() => {
    validateForm()
    return Object.keys(errors.value).length === 0
  })

  // Reset form to initial state
  const resetForm = () => {
    Object.keys(initialData).forEach((key) => {
      localForm[key] = initialData[key]
    })
    errors.value = {}
  }

  // Update form data (useful for edit mode)
  const updateForm = (newData: Partial<T>) => {
    Object.keys(newData).forEach((key) => {
      if (key in localForm) {
        localForm[key] = newData[key]
      }
    })
  }

  return {
    formRef,
    localForm,
    errors,
    isValid,
    validateForm,
    resetForm,
    updateForm,
    autoFocus
  }
}

/**
 * Specialized composable for forms with just a name field
 */
export function useNameOnlyForm(
  initialName: string = '',
  mode: 'create' | 'edit' = 'create',
  fieldLabel: string = 'Name'
) {
  const validator: ValidatorFunction<SimpleFormData> = (data) => {
    const errors: ValidationErrors = {}
    if (!data.name.trim()) {
      errors.name = `${fieldLabel} is required`
    }
    return errors
  }

  const form = useSimpleForm<SimpleFormData>({ name: initialName }, validator, mode)

  return {
    ...form
  }
}

/**
 * Composable for form validation watching and emit handling
 */
export function useFormValidationEmits(
  isValid: Ref<boolean>,
  emit: (event: 'validation-change', isValid: boolean) => void
) {
  // Watch for validation changes and emit to parent
  watch(
    isValid,
    (valid) => {
      emit('validation-change', valid)
    },
    { immediate: true }
  )
}
