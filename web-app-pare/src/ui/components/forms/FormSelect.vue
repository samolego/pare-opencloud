<template>
  <select
    :value="modelValue"
    :required="required"
    :disabled="disabled"
    class="form-select oc-cursor-pointer"
    :class="{ 'form-select-disabled': disabled }"
    @change="onChange"
    @blur="$emit('blur')"
    @focus="$emit('focus')"
  >
    <option v-if="placeholder" value="" disabled>
      {{ placeholder }}
    </option>
    <option v-for="option in normalizedOptions" :key="option.value" :value="option.value">
      {{ option.label }}
    </option>
  </select>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue'

interface SelectOption {
  value: string | number
  label: string
}

export default defineComponent({
  name: 'FormSelect',
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    options: {
      type: Array as PropType<SelectOption[] | string[] | number[]>,
      required: true
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
    }
  },
  emits: ['update:modelValue', 'blur', 'focus'],
  setup(props) {
    const normalizedOptions = computed(() => {
      return props.options.map((option) => {
        if (typeof option === 'object' && option !== null) {
          return option as SelectOption
        }
        return {
          value: option,
          label: String(option)
        }
      })
    })

    return {
      normalizedOptions
    }
  },
  methods: {
    onChange(event: Event) {
      const target = event.target as HTMLSelectElement
      let value: string | number = target.value

      // Convert to number if the original option value was a number
      const originalOption = this.normalizedOptions.find((opt) => String(opt.value) === value)
      if (originalOption && typeof originalOption.value === 'number') {
        value = Number(value)
      }

      this.$emit('update:modelValue', value)
    }
  }
})
</script>

<style lang="scss" scoped>
@import '../../styles/mixins';

.form-select {
  @include form-control;

  option {
    background-color: var(--oc-role-surface);
    color: var(--oc-role-on-surface);
    padding: var(--oc-space-small);

    &:disabled {
      color: var(--oc-role-on-surface-variant);
    }
  }

  // Arrow styling
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L2 4h8z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right var(--oc-space-small) center;
  padding-right: calc(var(--oc-space-large) + var(--oc-space-small));
}
</style>
