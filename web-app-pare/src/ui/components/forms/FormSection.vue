<template>
  <div class="form-section oc-mb-l oc-border oc-rounded">
    <div
      class="section-header oc-flex oc-flex-center oc-gap-m oc-p-l oc-border-bottom oc-rounded-top"
    >
      <div v-if="icon" class="section-header-icon">
        <oc-icon :name="icon" size="medium" />
      </div>
      <h2 class="section-title oc-text-l oc-font-semibold">{{ title }}</h2>
    </div>

    <div class="oc-p-m">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FormSection',
  props: {
    title: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      default: null
    }
  }
})
</script>

<style scoped>
@import '../../styles/mixins/_index.scss';

.form-section {
  background-color: var(--oc-role-surface-container);
  overflow: hidden;
  flex-shrink: 0;
}

.section-header {
  background-color: var(--oc-role-surface-container-high);
}

.section-header-icon {
  color: var(--oc-role-primary);
}

.section-title {
  color: var(--oc-role-on-surface);
  margin: 0;
}
</style>
