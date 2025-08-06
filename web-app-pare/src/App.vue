<template>
  <div class="oc-json-viewer oc-width-1-1 oc-height-1-1">
    <div
      ref="editorRef"
      class="oc-width-1-1 oc-height-1-1"
      :class="{ 'jse-theme-dark': darkTheme }"
    >
      Hello, world!
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { Resource } from '@opencloud-eu/web-client'
import { AppConfigObject, useMessages, useThemeStore } from '@opencloud-eu/web-pkg'
import { useGettext } from 'vue3-gettext'

export default defineComponent({
  props: {
    applicationConfig: { type: Object as PropType<AppConfigObject>, required: true },
    currentContent: {
      type: String,
      required: true
    },
    isReadOnly: { type: Boolean, required: false },
    resource: { type: Object as PropType<Resource>, required: true }
  },
  setup: (props) => {
    const editorRef = ref<HTMLDivElement>()
    const { $gettext } = useGettext()
    const { showErrorMessage } = useMessages()
    const themeStore = useThemeStore()
    const darkTheme = computed(() => {
      return themeStore.currentTheme.isDark
    })

    watch([props.currentContent], async () => {
      let content = null
      try {
        content = {
          json: JSON.parse(props.currentContent)
        }
      } catch {
        content = {
          text: props.currentContent
        }
        showErrorMessage({ title: $gettext('JSON not properly formatted') })
      }
      console.log(content)
    })

    return {
      editorRef,
      darkTheme
    }
  }
})
</script>
<style lang="scss">
.jse {
  &-menu {
    background-color: var(--oc-role-chrome) !important;
  }

  &-error {
    display: none !important; // Hide, as we show our own error via showErrorMessage to keep it simple
  }

  &-menu {
    button:nth-of-type(1) {
      border-bottom-left-radius: 8px !important;
      border-top-left-radius: 8px !important;
    }

    button:nth-of-type(3) {
      border-bottom-right-radius: 8px !important;
      border-top-right-radius: 8px !important;
    }
  }
}
</style>
