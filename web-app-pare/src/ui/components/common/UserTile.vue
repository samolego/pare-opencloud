<template>
  <div
    class="user-tile oc-rounded"
    :class="{ 'is-clickable': clickable, 'is-selected': isSelected }"
  >
    <div class="oc-rounded oc-flex oc-flex-row oc-flex-middle user-tile-content oc-p-s">
      <!-- User avatar -->
      <UserAvatarImg :user="user" :avatar-size="avatarSize" />

      <!-- User info -->
      <div class="user-name oc-ml-m oc-text-left oc-flex-1" :title="displayName">
        {{ displayName }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, onMounted } from 'vue'
import { useLoadAvatars, useAvatarsStore } from '@opencloud-eu/web-pkg'
import UserAvatarImg from './UserAvatarImg.vue'
import type { DisplayUser } from '../../../types/users'

export default defineComponent({
  name: 'UserTile',
  components: {
    UserAvatarImg
  },
  props: {
    user: {
      type: Object as PropType<DisplayUser>,
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
      type: Number,
      default: 50
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
    // Computed display name
    const displayName = computed(() => {
      return props.user.displayName || props.user.name || props.user.mail || 'Unknown User'
    })

    const avatarsStore = useAvatarsStore()
    const { enqueueAvatar } = useLoadAvatars()
    // Get the avatar source from the store
    const avatarUrl = computed(() => {
      return avatarsStore.avatarMap[props.user.opencloud_id]
    })

    // Load the avatar when component is mounted
    onMounted(() => {
      if (props.user.opencloud_id) {
        enqueueAvatar(props.user.opencloud_id)
      }
    })

    return {
      displayName,
      avatarUrl
    }
  }
})
</script>

<style lang="scss" scoped>
.user-tile {
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

.user-name {
  color: var(--oc-role-on-surface);
  line-height: 1.4;
}
</style>
