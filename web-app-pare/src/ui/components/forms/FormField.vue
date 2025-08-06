<template>
  <div class="form-field" :class="{ 'form-field-error': hasError }">
    <label v-if="label" class="form-field-label">
      {{ label }}
      <span v-if="required" class="form-field-required">*</span>
    </label>

    <div class="form-field-content">
      <slot></slot>
    </div>

    <div v-if="error" class="form-field-error-text">
      {{ error }}
    </div>

    <div v-if="helpText && !error" class="form-field-help-text">
      {{ helpText }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FormField',
  props: {
    label: {
      type: String,
      default: ''
    },
    required: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    },
    helpText: {
      type: String,
      default: ''
    }
  },
  computed: {
    hasError() {
      return !!this.error
    }
  }
})
</script>

<style lang="scss" scoped>
@import '../../styles/mixins';

.form-field {
  @include form-field-spacing;

  &.form-field-error {
    .form-field-content :deep(input),
    .form-field-content :deep(select),
    .form-field-content :deep(textarea) {
      @include form-control-error;
    }
  }
}

.form-field-label {
  display: block;
  font-size: var(--oc-font-size-small);
  font-weight: var(--oc-font-weight-semibold);
  color: var(--oc-role-on-surface);
  margin-bottom: var(--oc-space-xsmall);
  line-height: 1.4;
}

.form-field-required {
  color: var(--oc-role-error);
  margin-left: 2px;
}

.form-field-content {
  position: relative;
}

.form-field-error-text {
  font-size: var(--oc-font-size-xsmall);
  color: var(--oc-role-error);
  margin-top: var(--oc-space-xsmall);
  line-height: 1.3;
}

.form-field-help-text {
  font-size: var(--oc-font-size-xsmall);
  color: var(--oc-role-on-surface-variant);
  margin-top: var(--oc-space-xsmall);
  line-height: 1.3;
}
</style>
