<template>
  <div class="member-form" ref="formRef">
    <form @submit.prevent="onSubmit">
      <!-- Name -->
      <FormField label="Name" required :error="errors.name">
        <FormInput v-model="localForm.name" placeholder="Enter member name..." required />
      </FormField>

      <!-- OpenCloud ID -->
      <FormField
        label="OpenCloud ID"
        help-text="Leave empty if this person is not on this OpenCloud instance"
        :error="errors.opencloud_id"
      >
        <FormInput
          v-model="localForm.opencloud_id"
          placeholder="aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
        />
      </FormField>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, watch } from 'vue'
import { User } from '../../../../utils/pcsvParser'
import { useSimpleForm, useFormValidationEmits } from '../../../../composables/useSimpleForm'
import { MemberFormData, ValidationErrors } from '../../../../types/forms'
import { FormField, FormInput } from '../../forms'

export default defineComponent({
  name: 'MemberForm',
  components: {
    FormField,
    FormInput
  },
  props: {
    member: {
      type: Object as PropType<User | null>,
      default: null
    },
    mode: {
      type: String as PropType<'create' | 'edit'>,
      default: 'create'
    }
  },
  emits: ['submit', 'validation-change'],
  setup(props, { emit }) {
    // Custom validator for member form
    const memberValidator = (data: MemberFormData): ValidationErrors => {
      const errors: ValidationErrors = {}

      if (!data.name.trim()) {
        errors.name = 'Name is required'
      }

      // Validate OpenCloud ID format if provided
      if (data.opencloud_id && data.opencloud_id.trim()) {
        // todo - test via API if user exists
      }

      return errors
    }

    const initialData: MemberFormData = {
      name: props.member?.name || '',
      opencloud_id: props.member?.opencloud_id || ''
    }

    const form = useSimpleForm(initialData, memberValidator, props.mode)

    // Initialize form data when member changes
    const initializeForm = () => {
      if (props.member) {
        form.updateForm({
          name: props.member.name,
          opencloud_id: props.member.opencloud_id || ''
        })
      } else {
        form.resetForm()
      }
      form.autoFocus()
    }

    // Watch for member changes
    watch(() => props.member, initializeForm, { immediate: true })
    watch(() => props.mode, initializeForm)

    // Handle validation change emissions
    useFormValidationEmits(form.isValid, emit)

    const onSubmit = () => {
      if (!form.validateForm()) return

      const member: Omit<User, 'id'> = {
        name: form.localForm.name.trim(),
        opencloud_id: form.localForm.opencloud_id.trim() || null
      }

      emit('submit', member)
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

.member-form {
  @include form-base;
}
</style>
