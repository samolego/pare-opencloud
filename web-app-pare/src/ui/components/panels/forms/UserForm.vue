<template>
  <div ref="formRef" class="member-form oc-gap-m">
    <form class="oc-flex oc-flex-row oc-flex-center oc-gap-m" @submit.prevent="onSubmit">
      <!-- Additional Avatar Image -->
      <div
        class="oc-flex oc-flex-column oc-flex-center oc-flex-middle oc-surface-container oc-rounded"
      >
        <UserAvatarImg :user="localForm" :avatar-size="100" />
      </div>

      <!-- Form Fields -->
      <div class="oc-flex oc-flex-column oc-gap-m oc-flex-auto oc-ml-l">
        <!-- Name with User Search -->
        <FormField label="Name" required :error="errors.name">
          <div class="name-field-container oc-relative">
            <input
              ref="nameInputRef"
              v-model="localForm.name"
              type="text"
              placeholder="Start typing to search for users..."
              required
              class="oc-input name-input"
              :class="{ 'has-suggestions': showSuggestions && hasSuggestions }"
              @input="onNameInput"
              @focus="onNameFocus"
              @blur="onNameBlur"
              @keydown="onKeydown"
            />

            <!-- Loading indicator -->
            <div class="loading-indicator oc-flex oc-flex-middle">
              <span class="oc-spinner oc-spinner-s"></span>
            </div>

            <!-- Suggestions dropdown -->
            <div
              v-if="showSuggestions && hasSuggestions"
              class="suggestions-dropdown oc-absolute"
              role="listbox"
              aria-label="User suggestions"
            >
              <div class="suggestions-list oc-p-rm">
                <UserTile
                  v-for="(suggestion, index) in suggestions"
                  :key="suggestion.id"
                  :user="toUserFormData(suggestion)"
                  :is-selected="selectedIndex === index"
                  :show-email="true"
                  :show-open-cloud-id="false"
                  clickable
                  role="option"
                  :aria-selected="selectedIndex === index"
                  @click="selectSuggestion(suggestion)"
                  @mousedown.prevent="selectSuggestion(suggestion)"
                  @mouseenter="selectedIndex = index"
                />
              </div>

              <!-- No results message -->
              <div
                v-if="!isLoading && query.length >= minQueryLength && suggestions.length === 0"
                class="oc-text-center oc-p-m"
              >
                <span class="oc-text-muted">No users found</span>
              </div>
            </div>
          </div>
        </FormField>

        <!-- OpenCloud ID (always visible but disabled) -->
        <FormField
          label="OpenCloud ID"
          help-text="Filled automatically if existing user is selected"
          :error="errors.opencloud_id"
        >
          <FormInput v-model="localForm.opencloud_id" :disabled="true" readonly />
        </FormField>
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, watch, ref, computed, onMounted, onUnmounted } from 'vue'
import { useClientService } from '@opencloud-eu/web-pkg'
import { useSimpleForm, useFormValidationEmits } from '../../../../composables/useSimpleForm'
import { ValidationErrors } from '../../../../types/forms'
import { UserFormData, BillUser, UserTypeConverter } from '../../../../types/user'
import { User } from '@opencloud-eu/web-client/graph/generated'
import { FormField, FormInput } from '../../forms'
import { UserSearchService } from '../../../../services/userSearchService'
import UserTile from '../../common/UserTile.vue'
import UserAvatarImg from '../../common/UserAvatarImg.vue'

export default defineComponent({
  name: 'UserForm',
  components: {
    FormField,
    FormInput,
    UserTile,
    UserAvatarImg
  },
  props: {
    member: {
      type: Object as PropType<BillUser | null>,
      default: null
    },
    mode: {
      type: String as PropType<'create' | 'edit'>,
      default: 'create'
    }
  },
  emits: ['submit', 'validation-change'],
  setup(props, { emit }) {
    const clientService = useClientService()
    const nameInputRef = ref<HTMLInputElement>()
    const containerRef = ref<HTMLElement>()

    // Search state
    const query = ref('')
    const suggestions = ref<User[]>([])
    const isLoading = ref(false)
    const error = ref<string | null>(null)
    const selectedIndex = ref(-1)
    const showSuggestions = ref(false)
    const minQueryLength = 2

    // Debounce timer
    let debounceTimer: NodeJS.Timeout | null = null

    // Computed
    const hasSuggestions = computed(() => suggestions.value.length > 0)

    const toUserFormData = (user: User) => UserTypeConverter.fromOpenCloudUser(user)

    // Custom validator for member form
    const memberValidator = (data: UserFormData): ValidationErrors => {
      const errors: ValidationErrors = {}

      if (!data.name.trim()) {
        errors.name = 'Name is required'
      }

      return errors
    }

    const initialData: UserFormData = {
      name: props.member?.name || '',
      opencloud_id: props.member?.opencloud_id || ''
    }

    const form = useSimpleForm(initialData, memberValidator, props.mode)

    // Search users function
    const searchUsers = async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < minQueryLength) {
        suggestions.value = []
        isLoading.value = false
        return
      }

      isLoading.value = true
      error.value = null

      try {
        const results = await UserSearchService.searchUsers(searchQuery, clientService, 10)
        suggestions.value = results
        selectedIndex.value = -1
        showSuggestions.value = results.length > 0
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to search users'
        suggestions.value = []
        console.error('Error searching users:', err)
      } finally {
        isLoading.value = false
      }
    }

    // Update query with debouncing
    const updateQuery = (newQuery: string) => {
      query.value = newQuery

      // Clear previous timer
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      // Set new timer
      debounceTimer = setTimeout(() => {
        searchUsers(newQuery)
      }, 300)
    }

    // Input handlers
    const onNameInput = (event: Event) => {
      const target = event.target as HTMLInputElement
      const value = target.value
      form.localForm.name = value

      // Clear OpenCloud ID when user types
      form.localForm.opencloud_id = ''

      // Always allow searching
      updateQuery(value)
    }

    const onNameFocus = () => {
      if (suggestions.value.length > 0) {
        showSuggestions.value = true
      }
    }

    const onNameBlur = () => {
      // Delay hiding suggestions to allow clicking on them
      setTimeout(() => {
        showSuggestions.value = false
        selectedIndex.value = -1
      }, 150)
    }

    const onKeydown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          if (selectedIndex.value > 0) {
            selectedIndex.value--
          } else if (suggestions.value.length > 0) {
            selectedIndex.value = suggestions.value.length - 1
          }
          break

        case 'ArrowDown':
          event.preventDefault()
          if (selectedIndex.value < suggestions.value.length - 1) {
            selectedIndex.value++
          } else {
            selectedIndex.value = 0
          }
          break

        case 'Enter':
          event.preventDefault()
          if (selectedIndex.value >= 0 && selectedIndex.value < suggestions.value.length) {
            selectSuggestion(suggestions.value[selectedIndex.value])
          }
          break

        case 'Escape':
          event.preventDefault()
          showSuggestions.value = false
          selectedIndex.value = -1
          nameInputRef.value?.blur()
          break
      }
    }

    // Suggestion handlers
    const selectSuggestion = (user: User) => {
      // Console log the selected user as requested
      console.log('Selected user:', user)

      // Update form fields
      form.updateForm({
        name: user.displayName || user.mail || '',
        opencloud_id: user.id || ''
      })

      showSuggestions.value = false
      selectedIndex.value = -1
      nameInputRef.value?.blur()
    }

    const onAvatarError = (event: Event) => {
      const img = event.target as HTMLImageElement
      img.style.display = 'none'
    }

    // Click outside to close
    const handleClickOutside = (event: Event) => {
      if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
        showSuggestions.value = false
        selectedIndex.value = -1
      }
    }

    // Initialize form data when member changes
    const initializeForm = () => {
      if (props.member) {
        form.updateForm({
          name: props.member.name,
          opencloud_id: props.member.opencloud_id || ''
        })
      } else {
        form.resetForm()
      }
      form.autoFocus()
    }

    // Watch for member changes
    watch(() => props.member, initializeForm, { immediate: true })
    watch(() => props.mode, initializeForm)

    // Handle validation change emissions
    useFormValidationEmits(form.isValid, emit)

    const onSubmit = () => {
      if (!form.validateForm()) return

      const member: Omit<BillUser, 'id'> = {
        name: form.localForm.name.trim(),
        opencloud_id: form.localForm.opencloud_id.trim() || null,
        balance: null
      }

      emit('submit', member)
    }

    // Lifecycle
    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    })

    return {
      formRef: form.formRef,
      localForm: form.localForm,
      errors: form.errors,
      onSubmit,
      toUserFormData,

      // Search functionality
      nameInputRef,
      containerRef,
      query,
      suggestions,
      isLoading,
      error,
      selectedIndex,
      showSuggestions,
      hasSuggestions,
      minQueryLength,
      onNameInput,
      onNameFocus,
      onNameBlur,
      onKeydown,
      selectSuggestion,
      onAvatarError
    }
  }
})
</script>

<style lang="scss" scoped>
@import '../../../styles/mixins';

/* Name Field Container */
.name-field-container {
  z-index: 1000;
  overflow: visible;
}

/* Loading Indicator */
.loading-indicator {
  position: absolute;
  right: var(--oc-space-small);
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* Suggestions Dropdown */
.suggestions-dropdown {
  top: 100%;
  left: 0;
  right: 0;
  z-index: 9999;
  max-height: 300px;
  overflow-y: auto;
}

/* Suggestions List */
.suggestions-list {
  padding: 0;
  margin: 0;
}

/* Ensure parent containers don't clip the dropdown */
:deep(.form-field),
:deep(.oc-p-m),
:deep(.member-form) {
  overflow: visible !important;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .suggestions-dropdown {
    max-height: 250px;
  }

  :deep(.user-tile-content) {
    padding: var(--oc-space-small) var(--oc-space-medium);
    gap: var(--oc-space-small);
  }
}
</style>
