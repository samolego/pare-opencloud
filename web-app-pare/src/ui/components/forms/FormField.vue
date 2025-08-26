<template>
  <div class="form-field oc-mb-m" :class="{ 'form-field-error': hasError }">
    <label v-if="label" class="form-field-label oc-font-weight-semibold oc-mb-xs">
      {{ label }}
      <span v-if="required" class="form-field-error-text oc-ml-xs">*</span>
    </label>

    <div class="oc-position-relative">
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
  &.form-field-error {
    .oc-position-relative :deep(input),
    .oc-position-relative :deep(select),
    .oc-position-relative :deep(textarea) {
      @include form-control-error;
    }
  }
}

.form-field-label {
  display: block;
  color: var(--oc-role-on-surface);
  line-height: 1.4;
}

.form-field-error-text {
  color: var(--oc-role-error);
}

.form-field-help-text {
  color: var(--oc-role-on-surface-variant);
}
</style>
