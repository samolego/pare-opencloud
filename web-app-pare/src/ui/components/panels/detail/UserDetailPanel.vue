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

    <div class="member-detail-content oc-p-l oc-p-m-sm">
      <FormSection title="Member Information" icon="user">
        <UserForm
          ref="userForm"
          :member="member"
          :mode="mode"
          @submit="onFormSubmit"
          @validation-change="onValidationChange"
        />
      </FormSection>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { User } from '../../../../utils/psonParser'
import { useUserDetailPanel } from '../../../../composables/useDetailPanelLogic'
import { FormMode } from '../../../../types/forms'
import DetailPanelHeader from '../DetailPanelHeader.vue'
import { UserForm } from '../forms'
import { FormSection } from '../../forms'

export default defineComponent({
  name: 'UserDetailPanel',
  components: {
    DetailPanelHeader,
    UserForm,
    FormSection
  },
  props: {
    member: {
      type: Object as PropType<User | null>,
      default: null
    },
    mode: {
      type: String as PropType<FormMode>,
      default: 'create'
    }
  },
  emits: ['cancel', 'create-member', 'save-member'],
  setup(props, { emit }) {
    const {
      canSave,
      formRef: userForm,
      isVisible,
      panelTitle,
      computedSaveText: saveText,
      onValidationChange,
      onSave,
      createEventHandlers
    } = useUserDetailPanel(props.mode)

    const { onCancel, onFormSubmit } = createEventHandlers(emit)

    return {
      canSave,
      isVisible,
      panelTitle,
      saveText,
      userForm,
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

  @media (max-width: 768px) {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 100;
  }
}
</style>
