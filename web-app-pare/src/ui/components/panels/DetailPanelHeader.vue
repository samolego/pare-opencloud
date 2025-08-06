<template>
  <div class="detail-panel-header">
    <div class="header-title">
      <h2 class="title-text">{{ title }}</h2>
    </div>
    <div class="header-actions">
      <oc-button variation="passive" @click="$emit('cancel')" class="cancel-btn">
        Cancel
      </oc-button>
      <oc-button variation="primary" :disabled="!canSave" @click="$emit('save')" class="save-btn">
        {{ computedSaveText }}
      </oc-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'DetailPanelHeader',
  props: {
    title: {
      type: String,
      required: true
    },
    canSave: {
      type: Boolean,
      default: true
    },
    isCreating: {
      type: Boolean,
      default: false
    },
    saveText: {
      type: String,
      default: ''
    }
  },
  computed: {
    computedSaveText() {
      if (this.saveText) {
        return this.saveText
      }
      return this.isCreating ? 'Create' : 'Save'
    }
  },
  emits: ['cancel', 'save']
})
</script>

<style lang="scss" scoped>
@import '../../styles/mixins';

.detail-panel-header {
  @include panel-header;
}

.header-title {
  flex: 1;
}

.title-text {
  @include panel-header-title;
}

.header-actions {
  @include panel-header-actions;
}

.cancel-btn,
.save-btn {
  min-width: 80px;
  font-size: var(--oc-font-size-small);
}

.save-btn {
  &:not(:disabled) {
    background-color: var(--oc-role-secondary);
    color: var(--oc-role-on-secondary);

    &:hover {
      background-color: var(--oc-role-secondary-container);
      color: var(--oc-role-on-secondary-container);
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: var(--oc-role-outline-variant);
    color: var(--oc-role-on-surface-variant);
  }
}
</style>
