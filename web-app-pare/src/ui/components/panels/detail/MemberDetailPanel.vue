<template>
  <div v-if="isVisible" class="member-detail-panel">
    <DetailPanelHeader
      :title="panelTitle"
      :can-save="canSave"
      :is-creating="mode === 'create'"
      :save-text="saveText"
      @cancel="onCancel"
      @save="onSave"
    />

    <div class="member-detail-content">
      <MemberForm
        ref="memberForm"
        :member="member"
        :mode="mode"
        @submit="onFormSubmit"
        @validation-change="onValidationChange"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from 'vue'
import { User } from '../../../../utils/pcsvParser'
import DetailPanelHeader from '../DetailPanelHeader.vue'
import { MemberForm } from '../forms'

type MemberDetailMode = 'create' | 'edit'

export default defineComponent({
  name: 'MemberDetailPanel',
  components: {
    DetailPanelHeader,
    MemberForm
  },
  props: {
    member: {
      type: Object as PropType<User | null>,
      default: null
    },
    mode: {
      type: String as PropType<MemberDetailMode>,
      default: 'create'
    }
  },
  emits: ['cancel', 'create-member', 'save-member'],
  setup(props, { emit }) {
    const canSave = ref(false)
    const memberForm = ref()

    const isVisible = computed(() => {
      return true
    })

    const panelTitle = computed(() => {
      return props.mode === 'create' ? 'New Member' : 'Edit Member'
    })

    const saveText = computed(() => {
      return props.mode === 'create' ? 'Add Member' : 'Save Changes'
    })

    const onValidationChange = (isValid: boolean) => {
      canSave.value = isValid
    }

    const onCancel = () => {
      emit('cancel')
    }

    const onSave = () => {
      if (memberForm.value && memberForm.value.onSubmit) {
        memberForm.value.onSubmit()
      }
    }

    const onFormSubmit = (data: any) => {
      if (props.mode === 'create') {
        emit('create-member', data)
      } else {
        emit('save-member', data)
      }
    }

    return {
      canSave,
      isVisible,
      panelTitle,
      saveText,
      memberForm,
      onValidationChange,
      onCancel,
      onSave,
      onFormSubmit
    }
  }
})
</script>

<style lang="scss" scoped>
@import '../../../styles/mixins';

.member-detail-panel {
  @include detail-panel;
}
</style>
