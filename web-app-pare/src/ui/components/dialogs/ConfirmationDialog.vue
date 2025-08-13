<template>
  <div v-if="isVisible" class="oc-modal-background" @click="onCancel">
    <div
      class="oc-modal"
      tabindex="0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="oc-modal-title"
      @click.stop
    >
      <div class="oc-modal-title">
        <h2 id="oc-modal-title" class="oc-text-truncate">{{ title }}</h2>
      </div>

      <div class="oc-modal-body">
        <div class="oc-modal-body-message">
          <span class="oc-display-inline-block oc-mb-m">{{ message }}</span>

          <div class="oc-my-m"></div>

          <div class="oc-flex oc-flex-right oc-flex-middle oc-mt-m">
            <div class="oc-modal-body-actions-grid">
              <oc-button type="button" variation="passive" @click="onCancel">
                {{ cancelText }}
              </oc-button>

              <button
                type="button"
                class="oc-button oc-rounded oc-button-m oc-button-justify-content-center oc-button-gap-m oc-button-filled oc-modal-body-actions-confirm oc-ml-s delete-button"
                @click="onConfirm"
              >
                {{ confirmText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ConfirmationDialog',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Confirm Action'
    },
    message: {
      type: String,
      default: 'Are you sure you want to proceed?'
    },
    confirmText: {
      type: String,
      default: 'Delete'
    },
    cancelText: {
      type: String,
      default: 'Cancel'
    }
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    const onConfirm = () => {
      emit('confirm')
    }

    const onCancel = () => {
      emit('cancel')
    }

    return {
      onConfirm,
      onCancel
    }
  }
})
</script>

<style lang="scss" scoped>
.delete-button {
  background-color: var(--oc-role-error) !important;
  border-color: var(--oc-role-error) !important;
  color: var(--oc-role-on-error) !important;

  &:hover {
    background-color: var(--oc-role-error-container) !important;
    border-color: var(--oc-role-error-container) !important;
    color: var(--oc-role-on-error-container) !important;
  }
}
</style>
