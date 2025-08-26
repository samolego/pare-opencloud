<template>
  <div class="bill-form">
    <!-- Bill Details Section -->
    <FormSection :title="`Bill: ${localForm.description}`" icon="file-text">
      <!-- Description - Full width -->
      <div class="oc-mb-l">
        <FormField label="What was this for?" required :error="errors.description">
          <FormInput
            v-model="localForm.description"
            placeholder="e.g., Dinner at Italian restaurant"
            required
          />
        </FormField>
      </div>

      <!-- Amount and Category Row -->
      <div class="form-row">
        <div class="form-column">
          <FormField label="Total Amount" required :error="errors.total_amount">
            <div class="amount-input-wrapper">
              <div class="amount-currency">
                <oc-icon name="money-euro-circle" size="small" />
              </div>
              <FormInput
                v-model="localForm.total_amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                class="oc-pl-xl"
              />
            </div>
          </FormField>
        </div>
        <div class="form-column">
          <FormField label="Category" :error="errors.category_id">
            <div class="select-input-wrapper">
              <div class="select-icon">
                <oc-icon name="price-tag" size="small" />
              </div>
              <FormSelect
                v-model="localForm.category_id"
                :options="categoryOptions"
                placeholder="Select category..."
                class="oc-pl-xl"
              />
            </div>
          </FormField>
        </div>
      </div>

      <!-- Date and Time Row -->
      <div class="form-row">
        <div class="form-column">
          <FormField label="Date" required :error="errors.date">
            <div class="input-wrapper">
              <div class="input-icon">
                <oc-icon name="calendar" size="small" />
              </div>
              <FormInput v-model="localForm.date" type="date" required class="oc-pl-xl" />
            </div>
          </FormField>
        </div>
        <div class="form-column">
          <FormField label="Time" required :error="errors.time">
            <div class="input-wrapper">
              <div class="input-icon">
                <oc-icon name="time" size="small" />
              </div>
              <FormInput v-model="localForm.time" type="time" required class="oc-pl-xl" />
            </div>
          </FormField>
        </div>
      </div>
    </FormSection>

    <!-- Payment Details Section -->
    <FormSection title="Payment Details" icon="bank-card">
      <div class="form-row">
        <div class="form-column">
          <FormField label="Who paid initially?" required :error="errors.who_paid_id">
            <div class="who-paid-container">
              <div
                ref="whoPaidInputRef"
                class="who-paid-input"
                :class="{ 'is-open': showWhoPaidDropdown }"
                tabindex="0"
                role="combobox"
                :aria-expanded="showWhoPaidDropdown"
                aria-haspopup="listbox"
                @click="toggleWhoPaidDropdown"
                @keydown="onWhoPaidKeydown"
              >
                <div v-if="selectedUser" class="selected-user">
                  <UserTile :user="selectedUser" :avatar-size="32" :clickable="false" />
                </div>
                <span v-else class="placeholder">Select user...</span>
                <oc-icon name="keyboard-arrow-down" size="small" class="dropdown-arrow" />
              </div>

              <!-- Dropdown -->
              <div
                v-if="showWhoPaidDropdown"
                class="oc-select"
                role="listbox"
                aria-label="User selection"
              >
                <div class="dropdown-list">
                  <UserTile
                    v-for="(user, index) in users"
                    :key="user.id"
                    :user="user"
                    :is-selected="whoPaidSelectedIndex === index"
                    :show-email="false"
                    :show-open-cloud-id="true"
                    clickable
                    role="option"
                    :aria-selected="whoPaidSelectedIndex === index"
                    @click="selectWhoPaidUser(user)"
                    @mousedown.prevent="selectWhoPaidUser(user)"
                    @mouseenter="whoPaidSelectedIndex = index"
                  />
                </div>
              </div>
            </div>
          </FormField>
        </div>
        <div class="form-column">
          <FormField label="Payment Method" :error="errors.payment_mode_id">
            <FormSelect
              v-model="localForm.payment_mode_id"
              :options="paymentModeOptions"
              placeholder="Select payment mode..."
            />
          </FormField>
        </div>
      </div>
    </FormSection>

    <!-- Additional Details Section -->
    <FormSection title="Additional Details" icon="info-card">
      <!-- Repeat Field -->
      <div class="oc-mb-l">
        <FormField label="Repeat" :error="errors.repeat">
          <FormSelect v-model="localForm.repeat" :options="repeatOptions" />
        </FormField>
      </div>

      <!-- Comment -->
      <div class="oc-mb-l">
        <FormField label="Notes / Comments" :error="errors.comment">
          <FormTextarea
            v-model="localForm.comment"
            placeholder="Add any additional notes about this bill..."
            :rows="3"
          />
        </FormField>
      </div>

      <!-- File link -->
      <div class="oc-mb-l">
        <FormField
          label="Receipt / Document Link"
          help-text="Optional: Link to receipt or document"
          :error="errors.file_link"
        >
          <div class="input-wrapper">
            <div class="input-icon">
              <oc-icon name="link" size="small" />
            </div>
            <FormInput
              v-model="localForm.file_link"
              type="url"
              placeholder="https://example.com/receipt.pdf"
              class="oc-pl-xl"
            />
          </div>
        </FormField>
      </div>
    </FormSection>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  reactive,
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted
} from 'vue'
import { useClientService } from '@opencloud-eu/web-pkg'
import {
  User,
  PaymentMode,
  Category,
  Bill,
  BillSplit,
  PSONData,
  PSONParser
} from '../../../../utils/psonParser'
import { UserSplit, BillFormData, ValidationErrors } from '../../../../types/forms'
import { FormField, FormInput, FormSelect, FormTextarea, FormSection } from '../../forms'
import UserTile from '../../common/UserTile.vue'

export default defineComponent({
  name: 'BillForm',
  components: {
    FormField,
    FormInput,
    FormSelect,
    FormTextarea,
    FormSection,
    UserTile
  },
  props: {
    bill: {
      type: Object as PropType<Bill | null>,
      default: null
    },
    users: {
      type: Array as PropType<User[]>,
      required: true
    },
    paymentModes: {
      type: Array as PropType<PaymentMode[]>,
      required: true
    },
    categories: {
      type: Array as PropType<Category[]>,
      required: true
    },
    parsedData: {
      type: Object as PropType<PSONData>,
      required: true
    },
    mode: {
      type: String as PropType<'create' | 'edit'>,
      default: 'create'
    }
  },
  emits: {
    submit: (_data: { bill: Omit<Bill, 'id'>; splits: Omit<BillSplit, 'id' | 'bill_id'>[] }) =>
      true,
    'validation-change': (_isValid: boolean) => true,
    'splits-change': (
      _splits: { [userId: number]: UserSplit & { included: boolean } },
      _totalAmount: number
    ) => true
  },
  setup(props, { emit, expose }) {
    const clientService = useClientService()

    // Who paid dropdown state
    const whoPaidInputRef = ref<HTMLElement>()
    const showWhoPaidDropdown = ref(false)
    const whoPaidSelectedIndex = ref(-1)

    // Computed for selected user
    const selectedUser = computed(
      () => props.users.find((user) => user.id === localForm.who_paid_id) || null
    )

    // Computed avatar URL for selected user
    const selectedUserAvatarUrl = computed(() => {
      if (!selectedUser.value) return undefined

      // If user already has an avatar, use it
      if (selectedUser.value.avatar) {
        return selectedUser.value.avatar
      }

      // If we have an OpenCloud ID, construct the avatar URL
      if (selectedUser.value.opencloud_id && clientService) {
        try {
          const baseUrl =
            clientService.httpAuthenticatedClient?.defaults?.baseURL || window.location.origin
          return `${baseUrl}/graph/v1.0/users/${selectedUser.value.opencloud_id}/photo/$value`
        } catch (error) {
          console.debug('Failed to construct avatar URL:', error)
        }
      }

      return undefined
    })

    const localForm = reactive<BillFormData>({
      description: '',
      total_amount: '',
      who_paid_id: null,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      repeat: 'None',
      payment_mode_id: null,
      category_id: null,
      comment: '',
      file_link: ''
    })

    const userSplits = ref<{ [userId: number]: UserSplit }>({})
    const includedUsers = ref<Set<number>>(new Set())
    const errors = ref<ValidationErrors>({})

    // Initialize form data
    const initializeForm = () => {
      if (props.bill) {
        localForm.description = props.bill.description || ''
        localForm.total_amount = props.bill.total_amount.toString()
        localForm.who_paid_id = props.bill.who_paid_id || null

        // Convert timestamp to date/time format
        const billDate = new Date(props.bill.timestamp)
        const date = billDate.toISOString().split('T')[0]
        const time = billDate.toTimeString().slice(0, 5)
        localForm.date = date
        localForm.time = time || null

        localForm.repeat = props.bill.repeat || 'None'
        localForm.payment_mode_id = props.bill.payment_mode_id || null
        localForm.category_id = props.bill.category_id || null
        localForm.comment = props.bill.comment || ''
        localForm.file_link = props.bill.file_link || ''
      } else {
        // Reset form for new bills
        localForm.description = ''
        localForm.total_amount = ''
        localForm.who_paid_id = null
        localForm.date = new Date().toISOString().split('T')[0]
        localForm.time = new Date().toTimeString().slice(0, 5)
        localForm.repeat = 'None'
        localForm.payment_mode_id = null
        localForm.category_id = null
        localForm.comment = ''
        localForm.file_link = ''
      }
    }

    // Initialize user splits
    const initializeUserSplits = () => {
      // Initialize all users with default amounts first
      props.users.forEach((user) => {
        if (!userSplits.value[user.id]) {
          userSplits.value[user.id] = {
            amount: '0.00'
          }
        }
      })

      // Load bill splits for existing bills
      if (props.bill && props.parsedData) {
        loadBillSplits()
      }
    }

    // Load bill splits data
    const loadBillSplits = () => {
      if (!props.bill || !props.parsedData) {
        return
      }

      const billSplits = PSONParser.getBillSplits(props.parsedData, props.bill.id)

      // Clear included users set
      includedUsers.value.clear()

      // Update userSplits with the loaded data
      billSplits.forEach((split) => {
        if (userSplits.value[split.user_id]) {
          includedUsers.value.add(split.user_id)
          userSplits.value[split.user_id].amount = split.amount.toFixed(2)
        }
      })

      // Set excluded users to 0.00
      props.users.forEach((user) => {
        if (!includedUsers.value.has(user.id)) {
          userSplits.value[user.id].amount = '0.00'
        }
      })
    }

    // Watch for bill changes
    watch(() => props.bill, initializeForm, { immediate: true })

    // Watch for users changes and reinitialize splits
    watch(
      () => props.users,
      () => {
        initializeUserSplits()
        // Trigger auto-inclusion for new bills after users are available
        if (!props.bill && localForm.who_paid_id) {
          const totalAmount = parseFloat(localForm.total_amount) || 0
          includedUsers.value.clear()
          includedUsers.value.add(localForm.who_paid_id)

          if (userSplits.value[localForm.who_paid_id]) {
            userSplits.value[localForm.who_paid_id].amount = totalAmount.toFixed(2)
            props.users.forEach((user) => {
              if (user.id !== localForm.who_paid_id) {
                userSplits.value[user.id].amount = '0.00'
              }
            })
          }
        }
      },
      { immediate: true }
    )

    // Watch for parsedData availability - retry loading splits when it becomes available
    watch(
      () => props.parsedData,
      (parsedData) => {
        if (
          parsedData &&
          props.bill &&
          userSplits.value &&
          Object.keys(userSplits.value).length > 0
        ) {
          // Small delay to ensure userSplits is fully initialized
          setTimeout(() => {
            loadBillSplits()
          }, 0)
        }
      },
      { immediate: true }
    )

    // Emit splits changes to parent for sidebar
    watch(
      [userSplits, includedUsers, () => localForm.total_amount],
      () => {
        // Create splits data with inclusion info for sidebar
        const splitsWithInclusion: { [userId: number]: UserSplit & { included: boolean } } = {}
        props.users.forEach((user) => {
          splitsWithInclusion[user.id] = {
            amount: userSplits.value[user.id]?.amount || '0.00',
            included: includedUsers.value.has(user.id)
          }
        })
        emit('splits-change', splitsWithInclusion, parseFloat(localForm.total_amount) || 0)
      },
      { deep: true, immediate: true }
    )

    // Computed options
    const userOptions = computed(() =>
      props.users.map((user) => ({ value: user.id, label: user.name }))
    )

    const paymentModeOptions = computed(() =>
      props.paymentModes.map((mode) => ({ value: mode.id, label: mode.name }))
    )

    const categoryOptions = computed(() =>
      props.categories.map((category) => ({ value: category.id, label: category.name }))
    )

    const repeatOptions = [
      { value: 'None', label: 'None' },
      { value: 'Daily', label: 'Daily' },
      { value: 'Weekly', label: 'Weekly' },
      { value: 'Monthly', label: 'Monthly' },
      { value: 'Yearly', label: 'Yearly' }
    ]

    // Validation
    const validateForm = () => {
      const newErrors: ValidationErrors = {}

      if (!localForm.description.trim()) {
        newErrors.description = 'Description is required'
      }

      if (!localForm.total_amount || parseFloat(localForm.total_amount) <= 0) {
        newErrors.total_amount = 'Valid amount is required'
      }

      if (!localForm.who_paid_id) {
        newErrors.who_paid_id = 'Please select who paid'
      }

      if (!localForm.date) {
        newErrors.date = 'Date is required'
      }

      if (!localForm.time) {
        newErrors.time = 'Time is required'
      }

      // Validate splits - only validate if there are included users and a valid total amount
      const totalAmount = parseFloat(localForm.total_amount) || 0
      const includedUserCount = includedUsers.value.size

      if (totalAmount > 0 && includedUserCount > 0) {
        const splitAmount = props.users
          .filter((user) => includedUsers.value.has(user.id))
          .reduce((sum, user) => sum + parseFloat(userSplits.value[user.id]?.amount || '0'), 0)

        if (Math.abs(splitAmount - totalAmount) > 0.01) {
          newErrors.splits = 'Split amounts must equal total amount'
        }
      } else if (totalAmount > 0 && includedUserCount === 0) {
        newErrors.splits = 'Please select at least one user to split the bill'
      }

      // Special case: if only payer is included and amount matches, this is valid
      if (
        totalAmount > 0 &&
        includedUserCount === 1 &&
        localForm.who_paid_id &&
        includedUsers.value.has(localForm.who_paid_id)
      ) {
        const payerAmount = parseFloat(userSplits.value[localForm.who_paid_id]?.amount || '0')
        if (Math.abs(payerAmount - totalAmount) <= 0.01) {
          delete newErrors.splits
        }
      }

      // Validate URL if provided
      if (localForm.file_link && localForm.file_link.trim()) {
        try {
          new URL(localForm.file_link)
        } catch {
          newErrors.file_link = 'Please enter a valid URL'
        }
      }

      errors.value = newErrors
      return Object.keys(newErrors).length === 0
    }

    const isValid = computed(() => {
      return Object.keys(errors.value).length === 0
    })

    // Watch for form changes to trigger validation
    watch(
      [
        () => localForm.description,
        () => localForm.total_amount,
        () => localForm.who_paid_id,
        () => localForm.date,
        () => localForm.time,
        () => localForm.file_link,
        userSplits,
        includedUsers
      ],
      () => {
        validateForm()
      },
      { deep: true, immediate: true }
    )

    // Watch for who_paid_id changes to auto-include the payer
    watch(
      () => localForm.who_paid_id,
      (newWhoPaidId) => {
        if (!props.bill && newWhoPaidId && userSplits.value[newWhoPaidId]) {
          // Clear all included users and include only the payer
          includedUsers.value.clear()
          includedUsers.value.add(newWhoPaidId)

          // Set the full amount to the person who paid
          const totalAmount = parseFloat(localForm.total_amount) || 0
          props.users.forEach((user) => {
            if (user.id === newWhoPaidId) {
              userSplits.value[user.id].amount = totalAmount.toFixed(2)
            } else {
              userSplits.value[user.id].amount = '0.00'
            }
          })
        }
      }
    )

    // Watch for total amount changes to update the payer's amount for new bills
    watch(
      () => localForm.total_amount,
      (newAmount) => {
        if (
          !props.bill &&
          localForm.who_paid_id &&
          includedUsers.value.has(localForm.who_paid_id) &&
          userSplits.value[localForm.who_paid_id]
        ) {
          const totalAmount = parseFloat(newAmount) || 0
          userSplits.value[localForm.who_paid_id].amount = totalAmount.toFixed(2)
        }
      }
    )

    // Watch for validation changes
    watch(
      isValid,
      (valid) => {
        emit('validation-change', valid)
      },
      { immediate: true }
    )

    const onSubmit = () => {
      if (!validateForm()) return

      const bill: Omit<Bill, 'id'> = {
        description: localForm.description,
        total_amount: parseFloat(localForm.total_amount),
        who_paid_id: localForm.who_paid_id!,
        timestamp: new Date(`${localForm.date} ${localForm.time}`).getTime(),
        repeat: localForm.repeat,
        payment_mode_id: localForm.payment_mode_id,
        category_id: localForm.category_id,
        comment: localForm.comment,
        file_link: localForm.file_link
      }

      const splits: Omit<BillSplit, 'id' | 'bill_id'>[] = Array.from(includedUsers.value).map(
        (userId) => ({
          user_id: userId,
          amount: parseFloat(userSplits.value[userId]?.amount || '0')
        })
      )

      emit('submit', { bill, splits })
    }

    // Method to update splits from parent (sidebar)
    const updateSplits = (newSplits: { [userId: number]: UserSplit & { included: boolean } }) => {
      // Clear and rebuild included users
      includedUsers.value.clear()

      Object.entries(newSplits).forEach(([userId, split]) => {
        const id = parseInt(userId)
        userSplits.value[id] = { amount: split.amount }
        if (split.included) {
          includedUsers.value.add(id)
        }
      })
    }

    // Who paid dropdown handlers
    const toggleWhoPaidDropdown = () => {
      showWhoPaidDropdown.value = !showWhoPaidDropdown.value
      if (showWhoPaidDropdown.value) {
        whoPaidSelectedIndex.value = props.users.findIndex(
          (user) => user.id === localForm.who_paid_id
        )
      }
    }

    const selectWhoPaidUser = (user: User) => {
      localForm.who_paid_id = user.id
      showWhoPaidDropdown.value = false
      whoPaidSelectedIndex.value = -1
      whoPaidInputRef.value?.blur()
    }

    const onWhoPaidKeydown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          if (whoPaidSelectedIndex.value > 0) {
            whoPaidSelectedIndex.value--
          } else if (props.users.length > 0) {
            whoPaidSelectedIndex.value = props.users.length - 1
          }
          break

        case 'ArrowDown':
          event.preventDefault()
          if (whoPaidSelectedIndex.value < props.users.length - 1) {
            whoPaidSelectedIndex.value++
          } else {
            whoPaidSelectedIndex.value = 0
          }
          break

        case 'Enter':
        case ' ':
          event.preventDefault()
          if (showWhoPaidDropdown.value) {
            if (
              whoPaidSelectedIndex.value >= 0 &&
              whoPaidSelectedIndex.value < props.users.length
            ) {
              selectWhoPaidUser(props.users[whoPaidSelectedIndex.value])
            }
          } else {
            toggleWhoPaidDropdown()
          }
          break

        case 'Escape':
          event.preventDefault()
          showWhoPaidDropdown.value = false
          whoPaidSelectedIndex.value = -1
          whoPaidInputRef.value?.blur()
          break
      }
    }

    // Click outside to close dropdown
    const handleClickOutside = (event: Event) => {
      if (whoPaidInputRef.value && !whoPaidInputRef.value.contains(event.target as Node)) {
        showWhoPaidDropdown.value = false
        whoPaidSelectedIndex.value = -1
      }
    }

    // Lifecycle
    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
    })

    // Expose methods to parent component
    expose({
      updateSplits,
      onSubmit
    })

    return {
      localForm,
      userSplits,
      errors,
      userOptions,
      paymentModeOptions,
      categoryOptions,
      repeatOptions,
      onSubmit,
      // Who paid dropdown
      whoPaidInputRef,
      showWhoPaidDropdown,
      whoPaidSelectedIndex,
      selectedUser,
      toggleWhoPaidDropdown,
      selectWhoPaidUser,
      onWhoPaidKeydown,
      // Expose users for template
      users: computed(() => props.users),
      selectedUserAvatarUrl
    }
  }
})
</script>

<style lang="scss" scoped>
@import '../../../styles/mixins';

.bill-form {
  display: flex;
  flex-direction: column;
  gap: var(--oc-space-large);
}

.form-row {
  @include form-row-responsive;
}

.form-column {
  @include form-column;
}

.input-wrapper,
.amount-input-wrapper,
.select-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon,
.amount-currency,
.select-icon {
  position: absolute;
  left: var(--oc-space-medium);
  z-index: 1;
  color: var(--oc-role-on-surface-variant);
  pointer-events: none;
}

// Who paid dropdown styles
.who-paid-container {
  position: relative;
  width: 100%;
  z-index: 10000;
  overflow: visible;
}

.who-paid-input {
  @include form-control;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  min-height: 44px;
  padding: 8px 12px;
  background-color: var(--oc-role-surface);
  border: 1px solid var(--oc-role-outline-variant);
  border-radius: var(--oc-border-radius-medium);
  transition: border-color 0.15s ease;

  &:hover {
    border-color: var(--oc-role-outline);
  }

  &:focus {
    outline: none;
    border-color: var(--oc-role-primary);
    box-shadow: 0 0 0 2px var(--oc-role-primary-container);
  }

  &.is-open {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-color: var(--oc-role-primary);
  }
}

.selected-user {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.placeholder {
  color: var(--oc-role-on-surface-variant);
  flex: 1;
}

.dropdown-arrow {
  color: var(--oc-role-on-surface-variant);
  transition: transform 0.15s ease;

  .who-paid-input.is-open & {
    transform: rotate(180deg);
  }
}

.who-paid-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 99999;
  background-color: var(--oc-role-surface);
  border: 1px solid var(--oc-role-outline-variant);
  border-top: none;
  border-bottom-left-radius: var(--oc-border-radius-medium);
  border-bottom-right-radius: var(--oc-border-radius-medium);
  box-shadow: var(--oc-shadow-depth-2);
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-list {
  padding: 0;
  margin: 0;
}

:deep(.user-tile) {
  border-bottom: 1px solid var(--oc-role-outline-variant);
  user-select: none;
  position: relative;

  &:last-child {
    border-bottom: none;
  }

  // Ensure the entire area is clickable
  * {
    pointer-events: none;
  }

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: auto;
  }
}

// Ensure parent containers don't clip the dropdown
:deep(.form-field),
:deep(.bill-form),
:deep(.form-section),
:deep(.form-row),
:deep(.form-column),
:deep(.oc-panel),
:deep(.oc-panel-body) {
  overflow: visible !important;
}

// Mobile responsive
@media (max-width: 768px) {
  .who-paid-dropdown {
    max-height: 250px;
  }

  :deep(.user-tile-content) {
    padding: 10px 12px;
    gap: 10px;
  }
}
</style>
