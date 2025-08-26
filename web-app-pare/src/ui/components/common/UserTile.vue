<template>
  <div
    class="user-tile oc-rounded"
    :class="{ 'is-clickable': clickable, 'is-selected': isSelected }"
  >
    <div
      class="oc-rounded oc-flex oc-p-m oc-flex-row oc-flex-middle oc-flex-center user-tile-content"
    >
      <!-- User avatar -->
      <UserAvatarImg :user="user" />

      <!-- User info -->
      <div class="user-name oc-ml-l oc-text-center" :title="displayName">{{ displayName }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, onMounted } from 'vue'
import { useLoadAvatars, useAvatarsStore } from '@opencloud-eu/web-pkg'
import UserAvatarImg from './UserAvatarImg.vue'

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
  components: {
    UserAvatarImg
  },
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
