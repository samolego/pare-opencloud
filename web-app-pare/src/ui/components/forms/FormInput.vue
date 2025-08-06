<template>
  <input
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :required="required"
    :disabled="disabled"
    :step="step"
    :min="min"
    :max="max"
    class="form-input"
    :class="{ 'form-input-disabled': disabled }"
    @input="onInput"
    @blur="$emit('blur')"
    @focus="$emit('focus')"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FormInput',
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    type: {
      type: String,
      default: 'text'
    },
    placeholder: {
      type: String,
      default: ''
    },
    required: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    step: {
      type: [String, Number],
      default: undefined
    },
    min: {
      type: [String, Number],
      default: undefined
    },
    max: {
      type: [String, Number],
      default: undefined
    }
  },
  emits: ['update:modelValue', 'blur', 'focus'],
  methods: {
    onInput(event: Event) {
      const target = event.target as HTMLInputElement
      let value: string | number = target.value

      // Convert to number for numeric input types
      if (this.type === 'number' && value !== '') {
        value = parseFloat(value)
        if (isNaN(value)) {
          value = ''
        }
      }

      this.$emit('update:modelValue', value)
    }
  }
})
</script>

<style lang="scss" scoped>
.form-input {
  width: 100%;
  padding: var(--oc-space-small);
  border: 1px solid var(--oc-role-outline-variant);
  border-radius: var(--oc-space-small);
  background-color: var(--oc-role-surface);
  color: var(--oc-role-on-surface);
  font-size: var(--oc-font-size-small);
  font-family: var(--oc-font-family);
  line-height: 1.4;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--oc-role-primary);
    box-shadow: 0 0 0 2px var(--oc-role-primary-container);
  }

  &:disabled,
  &.form-input-disabled {
    background-color: var(--oc-role-surface-container);
    color: var(--oc-role-on-surface-variant);
    cursor: not-allowed;
    opacity: 0.6;
  }

  &::placeholder {
    color: var(--oc-role-on-surface-variant);
    opacity: 0.7;
  }

  // Special styling for different input types
  &[type='number'] {
    text-align: right;
  }

  &[type='date'],
  &[type='time'] {
    cursor: pointer;
  }

  // Small variant for inline inputs
  &.form-input-small {
    width: 100px;
    padding: var(--oc-space-xsmall) var(--oc-space-small);
    text-align: right;
  }
}
</style>
