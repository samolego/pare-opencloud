<template>
  <div class="bill-form">
    <form @submit.prevent="onSubmit">
      <!-- Bill Details Section -->
      <div class="bill-form-section">
        <div class="section-header">
          <div class="section-header-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
          </div>
          <h2 class="section-title">Bill Details</h2>
        </div>

        <div class="section-content">
          <!-- Description - Full width -->
          <div class="form-field-full">
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
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </div>
                  <FormInput
                    v-model="localForm.total_amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                    class="amount-input"
                  />
                </div>
              </FormField>
            </div>
            <div class="form-column">
              <FormField label="Category" :error="errors.category_id">
                <div class="select-input-wrapper">
                  <div class="select-icon">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
                      ></path>
                      <line x1="7" y1="7" x2="7.01" y2="7"></line>
                    </svg>
                  </div>
                  <FormSelect
                    v-model="localForm.category_id"
                    :options="categoryOptions"
                    placeholder="Select category..."
                    class="select-with-icon"
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
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <FormInput
                    v-model="localForm.date"
                    type="date"
                    required
                    class="input-with-icon"
                  />
                </div>
              </FormField>
            </div>
            <div class="form-column">
              <FormField label="Time" required :error="errors.time">
                <div class="input-wrapper">
                  <div class="input-icon">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12,6 12,12 16,14"></polyline>
                    </svg>
                  </div>
                  <FormInput
                    v-model="localForm.time"
                    type="time"
                    required
                    class="input-with-icon"
                  />
                </div>
              </FormField>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Details Section -->
      <div class="bill-form-section">
        <div class="section-header">
          <div class="section-header-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
          </div>
          <h2 class="section-title">Payment Details</h2>
        </div>

        <div class="section-content">
          <div class="form-row">
            <div class="form-column">
              <FormField label="Who paid initially?" required :error="errors.who_paid_id">
                <FormSelect
                  v-model="localForm.who_paid_id"
                  :options="userOptions"
                  placeholder="Select user..."
                  required
                />
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
        </div>
      </div>

      <!-- Additional Details Section -->
      <div class="bill-form-section">
        <div class="section-header">
          <div class="section-header-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
          </div>
          <h2 class="section-title">Additional Details</h2>
        </div>

        <div class="section-content">
          <!-- Repeat Field -->
          <div class="form-field-full">
            <FormField label="Repeat" :error="errors.repeat">
              <FormSelect v-model="localForm.repeat" :options="repeatOptions" />
            </FormField>
          </div>

          <!-- Comment -->
          <div class="form-field-full">
            <FormField label="Notes / Comments" :error="errors.comment">
              <FormTextarea
                v-model="localForm.comment"
                placeholder="Add any additional notes about this bill..."
                :rows="3"
              />
            </FormField>
          </div>

          <!-- File link -->
          <div class="form-field-full">
            <FormField
              label="Receipt / Document Link"
              help-text="Optional: Link to receipt or document"
              :error="errors.file_link"
            >
              <div class="input-wrapper">
                <div class="input-icon">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                </div>
                <FormInput
                  v-model="localForm.file_link"
                  type="url"
                  placeholder="https://example.com/receipt.pdf"
                  class="input-with-icon"
                />
              </div>
            </FormField>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, reactive, ref, computed, watch } from 'vue'
import {
  User,
  PaymentMode,
  Category,
  Bill,
  BillSplit,
  PCSVData,
  PCSVParser
} from '../../../../utils/pcsvParser'
import { UserSplit, BillFormData, ValidationErrors } from '../../../../types/forms'
import { FormField, FormInput, FormSelect, FormTextarea } from '../../forms'

export default defineComponent({
  name: 'BillForm',
  components: {
    FormField,
    FormInput,
    FormSelect,
    FormTextarea
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
      type: Object as PropType<PCSVData>,
      required: true
    },
    mode: {
      type: String as PropType<'create' | 'edit'>,
      default: 'create'
    }
  },
  emits: ['submit', 'validation-change', 'splits-change'],
  setup(props, { emit, expose }) {
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
    const errors = ref<ValidationErrors>({})

    // Initialize form data
    const initializeForm = () => {
      if (props.bill) {
        localForm.description = props.bill.description
        localForm.total_amount = props.bill.total_amount.toString()
        localForm.who_paid_id = props.bill.who_paid_id

        const [date, time] = props.bill.datetime.split(' ')
        localForm.date = date
        localForm.time = time || '12:00'

        localForm.repeat = props.bill.repeat || 'None'
        localForm.payment_mode_id = props.bill.payment_mode_id
        localForm.category_id = props.bill.category_id
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
      props.users.forEach((user) => {
        if (!userSplits.value[user.id]) {
          userSplits.value[user.id] = {
            included: false,
            amount: '0.00'
          }
        }
      })

      // Remove any users that no longer exist
      Object.keys(userSplits.value).forEach((userId) => {
        const userExists = props.users.some((user) => user.id === parseInt(userId))
        if (!userExists) {
          delete userSplits.value[parseInt(userId)]
        }
      })

      // Load bill splits after userSplits is initialized
      if (props.bill && props.parsedData) {
        loadBillSplits()
      }
    }

    // Load bill splits data
    const loadBillSplits = () => {
      if (!props.bill || !props.parsedData) {
        return
      }

      const billSplits = PCSVParser.getBillSplits(props.parsedData, props.bill.id)

      // Update userSplits with the loaded data
      billSplits.forEach((split) => {
        if (userSplits.value[split.user_id]) {
          userSplits.value[split.user_id].included = split.included === 1
          userSplits.value[split.user_id].amount = split.amount.toFixed(2)
        }
      })
    }

    // Watch for bill changes
    watch(() => props.bill, initializeForm, { immediate: true })
    watch(() => props.users, initializeUserSplits, { immediate: true })

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
      [userSplits, () => localForm.total_amount],
      () => {
        emit('splits-change', userSplits.value, parseFloat(localForm.total_amount) || 0)
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

      // Validate splits
      const totalAmount = parseFloat(localForm.total_amount) || 0
      const splitAmount = Object.values(userSplits.value)
        .filter((split) => split.included)
        .reduce((sum, split) => sum + parseFloat(split.amount || '0'), 0)

      if (Math.abs(splitAmount - totalAmount) > 0.01) {
        newErrors.splits = 'Split amounts must equal total amount'
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
      validateForm()
      return Object.keys(errors.value).length === 0
    })

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
        datetime: `${localForm.date} ${localForm.time}`,
        repeat: localForm.repeat,
        payment_mode_id: localForm.payment_mode_id,
        category_id: localForm.category_id,
        comment: localForm.comment,
        file_link: localForm.file_link
      }

      const splits: Omit<BillSplit, 'id' | 'bill_id'>[] = Object.entries(userSplits.value).map(
        ([userId, split]) => ({
          user_id: parseInt(userId),
          amount: parseFloat(split.amount),
          included: split.included ? 1 : 0
        })
      )

      emit('submit', { bill, splits })
    }

    // Method to update splits from parent (sidebar)
    const updateSplits = (newSplits: { [userId: number]: UserSplit }) => {
      userSplits.value = { ...newSplits }
    }

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
      onSubmit
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

.bill-form-section {
  background-color: var(--oc-role-surface-container);
  border: 1px solid var(--oc-role-outline-variant);
  border-radius: var(--oc-space-medium);
  overflow: hidden;
  flex-shrink: 0;
  margin-bottom: var(--oc-space-large);
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--oc-space-medium);
  padding: var(--oc-space-large);
  background-color: var(--oc-role-surface-container-high);
  border-bottom: 1px solid var(--oc-role-outline-variant);
}

.section-header-icon {
  color: var(--oc-role-primary);
}

.section-title {
  font-size: var(--oc-font-size-large);
  font-weight: var(--oc-font-weight-semibold);
  color: var(--oc-role-on-surface);
  margin: 0;
}

.section-content {
  padding: var(--oc-space-medium);
}

.form-row {
  @include form-row-responsive;
}

.form-column {
  @include form-column;
}

.form-field-full {
  @include form-field-spacing;
  margin-bottom: var(--oc-space-large);
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

.input-with-icon,
.amount-input {
  padding-left: calc(var(--oc-space-xlarge) + var(--oc-space-medium));
}

.select-with-icon {
  padding-left: calc(var(--oc-space-xlarge) + var(--oc-space-medium));
}
</style>
