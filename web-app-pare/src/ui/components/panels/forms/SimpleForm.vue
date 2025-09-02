<template>
  <div ref="formRef" class="simple-form oc-p-m">
    <form @submit.prevent="onSubmit">
      <FormField :label="config.label" required :error="errors.name">
        <FormInput v-model="localForm.name" :placeholder="config.placeholder" required />
      </FormField>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, watch } from 'vue'
import { useNameOnlyForm, useFormValidationEmits } from '../../../../composables/useSimpleForm'
import { FormField, FormInput } from '../../forms'
import { FormMode } from '../../../types/forms'

export interface SimpleFormConfig {
  entityType: string
  label: string
  placeholder: string
}

export default defineComponent({
  name: 'SimpleForm',
  components: {
    FormField,
    FormInput
  },
  props: {
    config: {
      type: Object as PropType<SimpleFormConfig>,
      required: true
    },
    item: {
      type: Object as PropType<{ name: string } | null>,
      default: null
    },
    mode: {
      type: String as PropType<FormMode>,
      default: 'create'
    }
  },
  emits: ['submit', 'validation-change'],
  setup(props, { emit, expose }) {
    const form = useNameOnlyForm(props.item?.name || '', props.mode, props.config.label)

    const initializeForm = () => {
      if (props.item) {
        form.updateForm({ name: props.item.name })
      } else {
        form.resetForm()
      }
      form.autoFocus()
    }

    watch(() => props.item, initializeForm, { immediate: true })
    watch(() => props.mode, initializeForm)

    useFormValidationEmits(form.isValid, emit)

    const onSubmit = () => {
      if (!form.validateForm()) return

      const entityData = {
        name: form.localForm.name.trim()
      }

      emit('submit', entityData)
    }

    expose({
      onSubmit
    })

    return {
      formRef: form.formRef,
      localForm: form.localForm,
      errors: form.errors,
      onSubmit
    }
  }
})
</script>
