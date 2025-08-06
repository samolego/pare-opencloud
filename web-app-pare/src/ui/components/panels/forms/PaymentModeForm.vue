<template>
  <div class="payment-mode-form">
    <form @submit.prevent="onSubmit">
      <!-- Name -->
      <FormField label="Payment Mode Name" required :error="errors.name">
        <FormInput
          v-model="localForm.name"
          placeholder="Enter payment mode name..."
          required
          ref="nameInput"
        />
      </FormField>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, reactive, ref, computed, watch, nextTick } from 'vue'
import { PaymentMode } from '../../../../utils/pcsvParser'
import { FormField, FormInput } from '../../forms'

interface PaymentModeFormData {
  name: string
}

export default defineComponent({
  name: 'PaymentModeForm',
  components: {
    FormField,
    FormInput
  },
  props: {
    paymentMode: {
      type: Object as PropType<PaymentMode | null>,
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

    const localForm = reactive<PaymentModeFormData>({
      name: ''
    })

    const errors = ref<{ [key: string]: string }>({})

    // Initialize form data
    const initializeForm = () => {
      if (props.paymentMode) {
        localForm.name = props.paymentMode.name
      } else {
        localForm.name = ''
      }

      // Focus name input for new payment modes
      if (props.mode === 'create') {
        nextTick(() => {
          if (nameInput.value) {
            nameInput.value.focus()
          }
        })
      }
    }

    // Watch for payment mode changes
    watch(() => props.paymentMode, initializeForm, { immediate: true })
    watch(() => props.mode, initializeForm)

    // Validation
    const validateForm = () => {
      const newErrors: { [key: string]: string } = {}

      if (!localForm.name.trim()) {
        newErrors.name = 'Payment mode name is required'
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

      const paymentMode: Omit<PaymentMode, 'id'> = {
        name: localForm.name.trim()
      }

      emit('submit', paymentMode)
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
.payment-mode-form {
  padding: var(--oc-space-medium);
}
</style>
