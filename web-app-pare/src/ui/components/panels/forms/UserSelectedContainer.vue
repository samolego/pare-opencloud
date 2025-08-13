<template>
  <div class="user-selected-container">
    <div class="user-avatar">
      <img
        v-if="user.avatar"
        :src="user.avatar"
        :alt="user.displayName"
        class="avatar-image"
        @error="onAvatarError"
      />
      <span v-else class="avatar-fallback oc-icon oc-icon-s">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
          />
        </svg>
      </span>
    </div>
    <div class="user-info">
      <div class="user-name" v-text="user.displayName" />
      <div v-if="user.mail" class="user-email oc-text-muted" v-text="user.mail" />
    </div>
    <button
      type="button"
      class="remove-button"
      :aria-label="`Remove ${user.displayName}`"
      @click="deselect"
      @mousedown.prevent
    >
      <span class="oc-icon oc-icon-s">×</span>
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

interface OpenCloudUser {
  id: string
  displayName?: string
  mail?: string
  onPremisesSamAccountName?: string
  userType?: string
  avatar?: string
}

export default defineComponent({
  name: 'UserSelectedContainer',
  props: {
    user: {
      type: Object as PropType<OpenCloudUser>,
      required: true
    },
    deselect: {
      type: Function,
      required: true
    }
  },
  methods: {
    onAvatarError(event: Event) {
      const img = event.target as HTMLImageElement
      img.style.display = 'none'
    }
  }
})
</script>

<style lang="scss" scoped>
.user-selected-container {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  gap: 8px;
  background-color: var(--oc-color-background-highlight);
  border: 1px solid var(--oc-color-border);
  border-radius: var(--oc-border-radius-medium);
  margin: 2px;
  max-width: 100%;
}

.user-avatar {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--oc-color-background-muted);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  color: var(--oc-color-text-muted);

  svg {
    width: 16px;
    height: 16px;
  }
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 500;
  color: var(--oc-color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.875rem;
}

.user-email {
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.remove-button {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--oc-color-text-muted);
  cursor: pointer;
  border-radius: 50%;
  font-size: 16px;
  line-height: 1;
  margin-left: 4px;

  &:hover {
    background-color: var(--oc-color-background-hover);
    color: var(--oc-color-text);
  }

  &:focus {
    outline: 2px solid var(--oc-color-shr-highlight);
    outline-offset: 1px;
  }
}
</style>
