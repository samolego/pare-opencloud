<template>
  <BaseModal
    :title="$gettext('Add New Member')"
    :confirm-text="$gettext('Add Member')"
    :confirm-enabled="isFormValid"
    @cancel="$emit('cancel')"
    @confirm="onCreateMember"
  >
    <template #content>
      <form @submit.prevent="onCreateMember" class="new-member-form">
        <!-- Name -->
        <div class="form-group oc-mb-m">
          <label class="oc-text-bold oc-mb-xs oc-display-block">
            {{ $gettext('Name') }}
          </label>
          <input
            v-model="form.name"
            type="text"
            class="oc-text-input oc-width-1-1"
            :placeholder="$gettext('Enter member name...')"
            required
            ref="nameInput"
          />
        </div>

        <!-- OpenCloud ID -->
        <div class="form-group oc-mb-m">
          <label class="oc-text-bold oc-mb-xs oc-display-block">
            {{ $gettext('OpenCloud ID') }}
          </label>
          <input
            v-model="form.opencloud_id"
            type="text"
            class="oc-text-input oc-width-1-1"
            :placeholder="$gettext('user@example.com (optional)')"
          />
          <div class="oc-text-small oc-text-muted oc-mt-xs">
            {{ $gettext('Leave empty if this person is not on this OpenCloud instance') }}
          </div>
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
  name: 'NewMemberModal',
  components: {
    BaseModal
  },
  emits: ['cancel', 'create-member'],
  setup(props, { emit }) {
    const { $gettext } = useGettext()
    const nameInput = ref<HTMLInputElement>()

    const form = reactive({
      name: '',
      opencloud_id: ''
    })

    const isFormValid = computed(() => {
      return form.name.trim() !== ''
    })

    const onCreateMember = () => {
      if (!isFormValid.value) return

      emit('create-member', {
        name: form.name.trim(),
        opencloud_id: form.opencloud_id.trim()
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
      onCreateMember,
      nameInput
    }
  }
})
</script>
