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
import { defineComponent, PropType } from 'vue'
import { User } from '../../../../utils/pcsvParser'
import { useMemberDetailPanel } from '../../../../composables/useDetailPanelLogic'
import { FormMode } from '../../../../types/forms'
import DetailPanelHeader from '../DetailPanelHeader.vue'
import { MemberForm } from '../forms'

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
      type: String as PropType<FormMode>,
      default: 'create'
    }
  },
  emits: ['cancel', 'create-member', 'save-member'],
  setup(props, { emit }) {
    const {
      canSave,
      formRef: memberForm,
      isVisible,
      panelTitle,
      computedSaveText: saveText,
      onValidationChange,
      onSave,
      createEventHandlers
    } = useMemberDetailPanel(props.mode)

    const { onCancel, onFormSubmit } = createEventHandlers(emit)

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
