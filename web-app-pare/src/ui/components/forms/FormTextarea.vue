<template>
  <textarea
    :value="modelValue"
    :placeholder="placeholder"
    :required="required"
    :disabled="disabled"
    :rows="rows"
    :maxlength="maxlength"
    class="oc-textarea"
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
@import '../../styles/mixins';

.form-textarea {
  @include form-control;
  @include custom-scrollbar;
  resize: vertical;
  min-height: 40px;

  &:disabled,
  &.form-textarea-disabled {
    resize: none;
  }
}
</style>
