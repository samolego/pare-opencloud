<template>
  <oc-avatar :src="avatarUrl" :user-name="displayName" :size="avatarSize" />
</template>

<script lang="ts">
import { defineComponent, PropType, computed, onMounted } from 'vue'
import { useLoadAvatars, useAvatarsStore } from '@opencloud-eu/web-pkg'

interface AvatarInfo {
  name?: string
  displayName?: string
  mail?: string
  opencloud_id?: string | null
}

export default defineComponent({
  name: 'UserAvatarImg',
  props: {
    user: {
      type: Object as PropType<AvatarInfo>,
      required: true
    },
    avatarSize: {
      type: String as PropType<'small' | 'medium' | 'large'>,
      default: 'small'
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
