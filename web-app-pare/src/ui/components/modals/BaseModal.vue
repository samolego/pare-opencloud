<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal-content oc-border-radius-medium">
      <div class="modal-header oc-p-m oc-border-b">
        <h3 class="oc-text-bold oc-m-remove">{{ title }}</h3>
        <oc-button variation="raw" @click="$emit('cancel')" class="close-btn">
          <oc-icon name="x" size="medium" />
        </oc-button>
      </div>

      <div class="modal-body oc-p-m">
        <slot name="content"></slot>
      </div>

      <div class="modal-footer oc-p-m oc-border-t oc-background-muted">
        <div class="oc-flex oc-flex-right oc-flex-gap-s">
          <oc-button variation="passive" @click="$emit('cancel')">
            {{ $gettext('Cancel') }}
          </oc-button>
          <oc-button
            variation="primary"
            :disabled="!confirmEnabled"
            @click="$emit('confirm')"
          >
            {{ confirmText }}
          </oc-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useGettext } from 'vue3-gettext'

export default defineComponent({
  name: 'BaseModal',
  props: {
    title: {
      type: String,
      required: true
    },
    confirmText: {
      type: String,
      default: 'Confirm'
    },
    confirmEnabled: {
      type: Boolean,
      default: true
    }
  },
  emits: ['cancel', 'confirm'],
  setup() {
    const { $gettext } = useGettext()

    return {
      // Make $gettext available in template
    }
  }
})
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--oc-role-background);
  box-shadow: var(--oc-box-shadow-medium);
  max-width: 600px;
  max-height: 90vh;
  width: 90%;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .close-btn {
    color: var(--oc-role-text-muted);

    &:hover {
      color: var(--oc-role-text);
    }
  }
}

.modal-body {
  max-height: 60vh;
  overflow-y: auto;
}

.modal-footer {
  .oc-flex-gap-s > * + * {
    margin-left: var(--oc-space-small);
  }
}

// Shared form styles for modal content
:deep(.form-group) {
  margin-bottom: var(--oc-space-medium);
}

:deep(.oc-text-input),
:deep(.oc-select),
:deep(.oc-textarea) {
  padding: var(--oc-space-small);
  border: 1px solid var(--oc-color-border);
  border-radius: var(--oc-space-small);
  background-color: var(--oc-role-background);
  color: var(--oc-role-text);
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: var(--oc-role-primary);
    box-shadow: 0 0 0 2px var(--oc-role-primary);
  }

  &:disabled {
    background-color: var(--oc-role-background-muted);
    color: var(--oc-role-text-muted);
    cursor: not-allowed;
  }

  &::placeholder {
    color: var(--oc-role-text-muted);
  }
}

:deep(.oc-select) {
  background-color: var(--oc-role-surface-container);
  border: 2px solid var(--oc-color-border);

  &:focus {
    background-color: var(--oc-role-background);
  }
}

:deep(.oc-text-input-small) {
  @extend :deep(.oc-text-input);
  width: 100px;
  padding: var(--oc-space-xsmall) var(--oc-space-small);
  text-align: right;
}

:deep(.oc-textarea) {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

:deep(.split-users) {
  .split-user-row:last-child {
    margin-bottom: 0;
  }
}

:deep(.split-summary) {
  .oc-text-danger {
    color: var(--oc-role-error);
  }
}

:deep(input[type='checkbox']) {
  margin: 0;
  accent-color: var(--oc-role-primary);
}

:deep(input[type='date']),
:deep(input[type='time']),
:deep(input[type='number']),
:deep(input[type='url']) {
  @extend :deep(.oc-text-input);
}
</style>
