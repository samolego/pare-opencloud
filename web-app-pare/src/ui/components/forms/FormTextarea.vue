<template>
  <textarea
    :value="modelValue"
    :placeholder="placeholder"
    :required="required"
    :disabled="disabled"
    :rows="rows"
    :maxlength="maxlength"
    class="form-textarea"
    :class="{ 'form-textarea-disabled': disabled }"
    @input="onInput"
    @blur="$emit('blur')"
    @focus="$emit('focus')"
  ></textarea>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FormTextarea',
  props: {
    modelValue: {
      type: String,
      default: ''
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
    rows: {
      type: Number,
      default: 3
    },
    maxlength: {
      type: Number,
      default: undefined
    }
  },
  emits: ['update:modelValue', 'blur', 'focus'],
  methods: {
    onInput(event: Event) {
      const target = event.target as HTMLTextAreaElement
      this.$emit('update:modelValue', target.value)
    }
  }
})
</script>

<style lang="scss" scoped>
.form-textarea {
  width: 100%;
  padding: var(--oc-space-small);
  border: 1px solid var(--oc-role-outline-variant);
  border-radius: var(--oc-space-small);
  background-color: var(--oc-role-surface);
  color: var(--oc-role-on-surface);
  font-size: var(--oc-font-size-small);
  font-family: var(--oc-font-family);
  line-height: 1.4;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--oc-role-primary);
    box-shadow: 0 0 0 2px var(--oc-role-primary-container);
  }

  &:disabled,
  &.form-textarea-disabled {
    background-color: var(--oc-role-surface-container);
    color: var(--oc-role-on-surface-variant);
    cursor: not-allowed;
    opacity: 0.6;
    resize: none;
  }

  &::placeholder {
    color: var(--oc-role-on-surface-variant);
    opacity: 0.7;
  }

  // Scrollbar styling
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: var(--oc-role-surface-container);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--oc-role-outline-variant);
    border-radius: 4px;

    &:hover {
      background: var(--oc-role-outline);
    }
  }
}
</style>
