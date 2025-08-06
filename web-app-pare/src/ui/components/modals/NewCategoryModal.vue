<template>
  <BaseModal
    :title="$gettext('Add New Category')"
    :confirm-text="$gettext('Add Category')"
    :confirm-enabled="isFormValid"
    @cancel="$emit('cancel')"
    @confirm="onCreateCategory"
  >
    <template #content>
      <form @submit.prevent="onCreateCategory" class="new-category-form">
        <!-- Name -->
        <div class="form-group oc-mb-m">
          <label class="oc-text-bold oc-mb-xs oc-display-block">
            {{ $gettext('Category Name') }}
          </label>
          <input
            v-model="form.name"
            type="text"
            class="oc-text-input oc-width-1-1"
            :placeholder="$gettext('Enter category name...')"
            required
            ref="nameInput"
          />
        </div>
      </form>
    </template>
  </BaseModal>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, reactive, ref } from 'vue'
import { useGettext } from 'vue3-gettext'
import BaseModal from './BaseModal.vue'

export default defineComponent({
  name: 'NewCategoryModal',
  components: {
    BaseModal
  },
  emits: ['cancel', 'create-category'],
  setup(props, { emit }) {
    const { $gettext } = useGettext()
    const nameInput = ref<HTMLInputElement>()

    const form = reactive({
      name: ''
    })

    const isFormValid = computed(() => {
      return form.name.trim() !== ''
    })

    const onCreateCategory = () => {
      if (!isFormValid.value) return

      emit('create-category', {
        name: form.name.trim()
      })
    }

    // Focus name input when modal opens
    nextTick(() => {
      if (nameInput.value) {
        nameInput.value.focus()
      }
    })

    return {
      form,
      isFormValid,
      onCreateCategory,
      nameInput
    }
  }
})
</script>
