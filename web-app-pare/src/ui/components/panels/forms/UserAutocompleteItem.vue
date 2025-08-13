<template>
  <div class="user-autocomplete-item">
    <div class="user-avatar">
      <img
        v-if="user.avatar"
        :src="user.avatar"
        :alt="user.displayName"
        class="avatar-image"
        @error="onAvatarError"
      />
      <span v-else class="avatar-fallback oc-icon oc-icon-m">
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
      <div
        v-else-if="user.onPremisesSamAccountName"
        class="user-username oc-text-muted"
        v-text="user.onPremisesSamAccountName"
      />
    </div>
    <div v-if="user.userType" class="user-type">
      <span class="oc-text-xsmall oc-text-muted" v-text="user.userType" />
    </div>
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
  name: 'UserAutocompleteItem',
  props: {
    user: {
      type: Object as PropType<OpenCloudUser>,
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
.user-autocomplete-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 12px;
  width: 100%;
}

.user-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
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
    width: 20px;
    height: 20px;
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
}

.user-email,
.user-username {
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.user-type {
  flex-shrink: 0;
  margin-left: auto;
}

// Hover state
.user-autocomplete-item:hover {
  background-color: var(--oc-color-background-hover);
}
</style>
