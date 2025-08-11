<template>
  <div class="form-section">
    <div class="section-header">
      <div v-if="icon" class="section-header-icon">
        <oc-icon :name="icon" size="medium" />
      </div>
      <h2 class="section-title">{{ title }}</h2>
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
  border: 1px solid var(--oc-role-outline-variant);
  border-radius: var(--oc-space-medium);
  overflow: hidden;
  flex-shrink: 0;
  margin-bottom: var(--oc-space-large);
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--oc-space-medium);
  padding: var(--oc-space-large);
  background-color: var(--oc-role-surface-container-high);
  border-bottom: 1px solid var(--oc-role-outline-variant);
}

.section-header-icon {
  color: var(--oc-role-primary);
}

.section-title {
  font-size: var(--oc-font-size-large);
  font-weight: var(--oc-font-weight-semibold);
  color: var(--oc-role-on-surface);
  margin: 0;
}
</style>
