<template>
  <div class="form-field" :class="{ 'form-field-error': hasError }">
    <label v-if="label" class="form-field-label">
      {{ label }}
      <span v-if="required" class="form-field-required oc-ml-xs">*</span>
    </label>

    <div class="form-field-content">
      <slot></slot>
    </div>

    <div v-if="error" class="form-field-error-text oc-text-small oc-mt-s">
      {{ error }}
    </div>

    <div v-if="helpText && !error" class="form-field-help-text oc-text-small oc-mt-xs">
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
  font-weight: var(--oc-font-weight-semibold);
  color: var(--oc-role-on-surface);
  margin-bottom: var(--oc-space-xsmall);
  line-height: 1.4;
}

.form-field-content {
  position: relative;
}

.form-field-required,
.form-field-error-text {
  color: var(--oc-role-error);
}

.form-field-help-text {
  color: var(--oc-role-on-surface-variant);
}
</style>
