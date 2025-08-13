<template>
  <div class="user-tile" :class="{ 'is-clickable': clickable, 'is-selected': isSelected }">
    <div class="user-tile-content">
      <!-- User avatar -->
      <oc-avatar
        :src="avatarUrl"
        :user-name="displayName"
        :size="avatarSize"
        class="user-avatar"
      />

      <!-- User info -->
      <div class="user-info">
        <div class="user-name" :title="displayName">{{ displayName }}</div>
        <div
          v-if="secondaryText"
          class="user-secondary oc-text-muted"
          :title="secondaryText"
        >
          {{ secondaryText }}
        </div>
      </div>

      <!-- Optional slot for additional content -->
      <slot name="actions" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { useClientService } from '@opencloud-eu/web-pkg'

interface UserLike {
  id?: number | string
  name?: string
  displayName?: string
  mail?: string
  opencloud_id?: string | null
  avatar?: string
  profileImage?: string
}

export default defineComponent({
  name: 'UserTile',
  props: {
    user: {
      type: Object as PropType<UserLike>,
      required: true
    },
    clickable: {
      type: Boolean,
      default: false
    },
    isSelected: {
      type: Boolean,
      default: false
    },
    avatarSize: {
      type: String as PropType<'small' | 'medium' | 'large'>,
      default: 'small'
    },
    showEmail: {
      type: Boolean,
      default: true
    },
    showOpenCloudId: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    const clientService = useClientService()

    // Computed display name
    const displayName = computed(() => {
      return (
        props.user.displayName ||
        props.user.name ||
        props.user.mail ||
        'Unknown User'
      )
    })

    // Computed secondary text (email or OpenCloud ID)
    const secondaryText = computed(() => {
      if (props.showEmail && props.user.mail) {
        return props.user.mail
      }
      if (props.showOpenCloudId && props.user.opencloud_id) {
        return props.user.opencloud_id
      }
      return null
    })

    // Computed avatar URL
    const avatarUrl = computed(() => {
      // If avatar is already provided, use it
      if (props.user.avatar) {
        return props.user.avatar
      }

      // If we have an OpenCloud ID, construct the avatar URL
      if (props.user.opencloud_id && clientService) {
        try {
          const baseUrl =
            clientService.httpAuthenticatedClient?.defaults?.baseURL || window.location.origin
          return `${baseUrl}/graph/v1.0/users/${props.user.opencloud_id}/photo/$value`
        } catch (error) {
          console.debug('Failed to construct avatar URL:', error)
        }
      }

      // If we have a profile image, use it
      if (props.user.profileImage) {
        return props.user.profileImage
      }

      // Return undefined to let oc-avatar handle the fallback
      return undefined
    })

    return {
      displayName,
      secondaryText,
      avatarUrl
    }
  }
})
</script>

<style lang="scss" scoped>
.user-tile {
  width: 100%;
  transition: background-color 0.15s ease;

  &.is-clickable {
    cursor: pointer;

    &:hover {
      background-color: var(--oc-role-surface-container-high);
    }
  }

  &.is-selected {
    background-color: var(--oc-role-surface-container-highest);
  }
}

.user-tile-content {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
  width: 100%;
}

.user-avatar {
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.user-name {
  font-weight: 500;
  color: var(--oc-role-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.user-secondary {
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
  line-height: 1.3;
}

// Mobile responsive
@media (max-width: 768px) {
  .user-tile-content {
    padding: 10px 12px;
    gap: 10px;
  }

  .user-name {
    font-size: 0.9rem;
  }

  .user-secondary {
    font-size: 0.8rem;
  }
}
</style>
