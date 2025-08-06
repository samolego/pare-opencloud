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
.member-detail-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--oc-role-surface);
  border-left: 1px solid var(--oc-role-outline-variant);
  width: 100%;
}

.member-detail-content {
  flex: 1;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: var(--oc-role-surface-container);
  }

  &::-webkit-scrollbar-thumb {
    background: var(--oc-role-outline-variant);
    border-radius: 4px;

    &:hover {
      background: var(--oc-role-outline);
    }
  }
}

@media (max-width: 768px) {
  .member-detail-panel {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 100;
  }
}
</style>
