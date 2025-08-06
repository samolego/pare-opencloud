declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $gettext: (message: string, replacements?: Record<string, any>) => string
  }
}

export {}
