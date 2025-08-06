<template>
  <div class="payment-mode-form" ref="formRef">
    <form @submit.prevent="onSubmit">
      <!-- Name -->
      <FormField label="Payment Mode Name" required :error="errors.name">
        <FormInput v-model="localForm.name" placeholder="Enter payment mode name..." required />
      </FormField>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, watch } from 'vue'
import { PaymentMode } from '../../../../utils/pcsvParser'
import { useNameOnlyForm, useFormValidationEmits } from '../../../../composables/useSimpleForm'
import { FormField, FormInput } from '../../forms'

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
    const form = useNameOnlyForm(props.paymentMode?.name || '', props.mode, 'Payment mode name')

    // Initialize form data when payment mode changes
    const initializeForm = () => {
      if (props.paymentMode) {
        form.updateForm({ name: props.paymentMode.name })
      } else {
        form.resetForm()
      }
      form.autoFocus()
    }

    // Watch for payment mode changes
    watch(() => props.paymentMode, initializeForm, { immediate: true })
    watch(() => props.mode, initializeForm)

    // Handle validation change emissions
    useFormValidationEmits(form.isValid, emit)

    const onSubmit = () => {
      if (!form.validateForm()) return

      const paymentMode: Omit<PaymentMode, 'id'> = {
        name: form.localForm.name.trim()
      }

      emit('submit', paymentMode)
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

<style lang="scss" scoped>
@import '../../../styles/mixins';

.payment-mode-form {
  @include form-base;
}
</style>
