import { defineConfig } from '@opencloud-eu/extension-sdk'

export default defineConfig({
  name: 'web-app-pare',
  server: {
    port: 9224
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'index.js'
      }
    }
  }
})
