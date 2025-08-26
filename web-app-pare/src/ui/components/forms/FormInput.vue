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
    class="oc-input"
    :class="{
      'form-input-disabled': disabled,
      'oc-text-right': type === 'number',
      'oc-cursor-pointer': type === 'date' || type === 'time'
    }"
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
@import '../../styles/mixins';

.form-input {
  @include form-control;

  // Small variant for inline inputs
  &.form-input-small {
    @include form-control-small;
  }
}
</style>
