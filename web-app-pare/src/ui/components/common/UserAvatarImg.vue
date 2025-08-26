<template>
  <oc-avatar :src="avatarUrl" :user-name="displayName" :width="avatarSize" />
</template>

<script lang="ts">
import { defineComponent, PropType, computed, onMounted } from 'vue'
import { useLoadAvatars, useAvatarsStore } from '@opencloud-eu/web-pkg'
import type { DisplayUser } from '../../../types/users'

export default defineComponent({
  name: 'UserAvatarImg',
  props: {
    user: {
      type: Object as PropType<DisplayUser>,
      required: true
    },
    avatarSize: {
      type: Number,
      default: 50
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
