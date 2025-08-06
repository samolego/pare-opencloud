<template>
  <div class="member-form">
    <form @submit.prevent="onSubmit">
      <!-- Name -->
      <FormField label="Name" required :error="errors.name">
        <FormInput
          v-model="localForm.name"
          placeholder="Enter member name..."
          required
          ref="nameInput"
        />
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
import { defineComponent, PropType, reactive, ref, computed, watch, nextTick } from 'vue'
import { User } from '../../../../utils/pcsvParser'
import { FormField, FormInput } from '../../forms'

interface MemberFormData {
  name: string
  opencloud_id: string
}

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
    const nameInput = ref<HTMLInputElement>()

    const localForm = reactive<MemberFormData>({
      name: '',
      opencloud_id: ''
    })

    const errors = ref<{ [key: string]: string }>({})

    // Initialize form data
    const initializeForm = () => {
      if (props.member) {
        localForm.name = props.member.name
        localForm.opencloud_id = props.member.opencloud_id || ''
      } else {
        localForm.name = ''
        localForm.opencloud_id = ''
      }

      // Focus name input for new members
      if (props.mode === 'create') {
        nextTick(() => {
          if (nameInput.value) {
            nameInput.value.focus()
          }
        })
      }
    }

    // Watch for member changes
    watch(() => props.member, initializeForm, { immediate: true })
    watch(() => props.mode, initializeForm)

    // Validation
    const validateForm = () => {
      const newErrors: { [key: string]: string } = {}

      if (!localForm.name.trim()) {
        newErrors.name = 'Name is required'
      }

      // Validate OpenCloud ID format if provided
      if (localForm.opencloud_id && localForm.opencloud_id.trim()) {
        // todo - test via API if user exists
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

      const member: Omit<User, 'id'> = {
        name: localForm.name.trim(),
        opencloud_id: localForm.opencloud_id.trim() || null
      }

      emit('submit', member)
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

.member-form {
  @include form-base;
}
</style>
