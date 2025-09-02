<template>
  <div ref="containerRef" class="user-autocomplete-input">
    <div class="input-wrapper" :class="{ 'has-suggestions': showSuggestions && hasSuggestions }">
      <input
        ref="inputRef"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        class="oc-input user-input"
        :class="{
          'form-input-disabled': disabled,
          'has-error': hasError
        }"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeydown"
      />

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading-indicator">
        <span class="oc-spinner oc-spinner-s"></span>
      </div>

      <!-- Clear button -->
      <button
        v-if="modelValue && !disabled"
        type="button"
        class="clear-button"
        @click="clearInput"
        @mousedown.prevent
      >
        <span class="oc-icon oc-icon-s">×</span>
      </button>
    </div>

    <!-- Suggestions dropdown -->
    <div
      v-if="showSuggestions && hasSuggestions"
      class="suggestions-dropdown"
      role="listbox"
      aria-label="User suggestions"
    >
      <div class="suggestions-list oc-list oc-m-rm">
        <UserTile
          v-for="(user, index) in suggestions"
          :key="user.opencloud_id"
          :user="user"
          :class="{ 'is-selected': selectedIndex === index }"
          :show-email="false"
          :show-open-cloud-id="true"
          clickable
          role="option"
        />
      </div>

      <!-- No results message -->
      <div
        v-if="!isLoading && query.length >= minQueryLength && suggestions.length === 0"
        class="no-results"
      >
        <span class="oc-text-muted">No users found</span>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="error-message oc-text-danger oc-text-s oc-mt-xs">
      {{ error }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useClientService } from '@opencloud-eu/web-pkg'
import { UserService } from '../../../services/userService'
import UserTile from '../common/UserTile.vue'
import { UserFormData } from '../../../types/user'

export default defineComponent({
  name: 'UserAutocompleteInput',
  components: {
    UserTile
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: 'Search for users...'
    },
    required: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    hasError: {
      type: Boolean,
      default: false
    },
    minQueryLength: {
      type: Number,
      default: 2
    },
    maxResults: {
      type: Number,
      default: 10
    }
  },
  emits: ['update:modelValue', 'user-selected', 'focus', 'blur'],
  data() {
    return {
      query: '',
      suggestions: [] as UserFormData[],
      isLoading: false,
      error: null as string | null,
      selectedIndex: -1,
      showSuggestions: false,
      debounceTimer: null as NodeJS.Timeout | null,
      clientService: useClientService()
    }
  },
  computed: {
    hasSuggestions(): boolean {
      return this.suggestions.length > 0
    }
  },
  watch: {
    query(newQuery: string) {
      if (newQuery.length < this.minQueryLength) {
        this.suggestions = []
        this.showSuggestions = false
        this.selectedIndex = -1
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside)
  },
  unmounted() {
    document.removeEventListener('click', this.handleClickOutside)
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
  },
  methods: {
    async searchUsers(searchQuery: string) {
      if (!searchQuery || searchQuery.length < this.minQueryLength) {
        this.isLoading = false
        this.suggestions = []
        return
      }

      this.isLoading = true
      this.error = null

      try {
        const results = await UserService.searchUsers(
          searchQuery,
          this.clientService,
          this.maxResults
        )
        this.suggestions = results
        this.selectedIndex = -1
        this.showSuggestions = results.length > 0
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to search users'
        this.suggestions = []
        console.error('Error searching users:', err)
      }

      this.isLoading = false
    },

    updateQuery(newQuery: string) {
      this.query = newQuery

      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
      }

      this.debounceTimer = setTimeout(() => {
        this.searchUsers(newQuery)
      }, 300)
    },

    onInput(event: Event) {
      const target = event.target as HTMLInputElement
      const value = target.value

      this.updateQuery(value)
      this.$emit('update:modelValue', value)
    },

    onFocus() {
      if (this.suggestions.length > 0) {
        this.showSuggestions = true
      }
      this.$emit('focus')
    },

    onBlur() {
      setTimeout(() => {
        this.showSuggestions = false
        this.selectedIndex = -1
      }, 150)
      this.$emit('blur')
    },

    onKeydown(event: KeyboardEvent) {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          if (this.selectedIndex > 0) {
            this.selectedIndex--
          } else if (this.suggestions.length > 0) {
            this.selectedIndex = this.suggestions.length - 1
          }
          break

        case 'ArrowDown':
          event.preventDefault()
          if (this.selectedIndex < this.suggestions.length - 1) {
            this.selectedIndex++
          } else {
            this.selectedIndex = 0
          }
          break

        case 'Enter':
          event.preventDefault()
          if (this.selectedIndex >= 0 && this.selectedIndex < this.suggestions.length) {
            this.selectSuggestion(this.suggestions[this.selectedIndex])
          }
          break

        case 'Escape':
          event.preventDefault()
          this.showSuggestions = false
          this.selectedIndex = -1
          const inputRef = this.$refs.inputRef as HTMLInputElement
          inputRef?.blur()
          break
      }
    },

    selectSuggestion(user: UserFormData) {
      this.$emit('update:modelValue', user.name || '')
      this.$emit('user-selected', user)
      this.showSuggestions = false
      this.selectedIndex = -1
      const inputRef = this.$refs.inputRef as HTMLInputElement
      inputRef?.blur()
    },

    clearInput() {
      this.updateQuery('')
      this.$emit('update:modelValue', '')
      this.suggestions = []
      this.showSuggestions = false
      this.selectedIndex = -1
      const inputRef = this.$refs.inputRef as HTMLInputElement
      inputRef?.focus()
    },

    handleClickOutside(event: Event) {
      const containerRef = this.$refs.containerRef as HTMLElement
      if (containerRef && !containerRef.contains(event.target as Node)) {
        this.showSuggestions = false
        this.selectedIndex = -1
      }
    },

    focus() {
      const inputRef = this.$refs.inputRef as HTMLInputElement
      inputRef?.focus()
    }
  }
})
</script>

<style lang="scss" scoped>
@import '../../styles/mixins';

.user-autocomplete-input {
  position: relative;
  width: 100%;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;

  &.has-suggestions {
    .user-input {
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
  }
}

.user-input {
  @include form-control;
  padding-right: 40px;
  flex: 1;

  &.has-error {
    border-color: var(--oc-color-danger);
  }
}

.loading-indicator {
  position: absolute;
  right: 12px;
  display: flex;
  align-items: center;
  pointer-events: none;
}

.clear-button {
  position: absolute;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--oc-color-text-muted);
  cursor: pointer;
  border-radius: 50%;
  font-size: 18px;
  line-height: 1;

  &:hover {
    background-color: var(--oc-color-background-hover);
    color: var(--oc-color-text);
  }
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--oc-color-background-default);
  border: 1px solid var(--oc-color-border);
  border-top: none;
  border-bottom-left-radius: var(--oc-border-radius-medium);
  border-bottom-right-radius: var(--oc-border-radius-medium);
  box-shadow: var(--oc-shadow-depth-2);
  max-height: 300px;
  overflow-y: auto;
}

.suggestions-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.no-results {
  padding: 16px;
  text-align: center;
}

.error-message {
  margin-top: 4px;
}
</style>
