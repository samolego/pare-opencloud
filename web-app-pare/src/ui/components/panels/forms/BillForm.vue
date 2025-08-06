<template>
  <div class="bill-form">
    <form @submit.prevent="onSubmit">
      <!-- Basic Info Row -->
      <div class="form-row">
        <div class="form-column">
          <!-- What? -->
          <FormField label="What?" required :error="errors.description">
            <FormInput
              v-model="localForm.description"
              placeholder="Enter description..."
              required
            />
          </FormField>
        </div>
        <div class="form-column">
          <!-- How much? -->
          <FormField label="How much?" required :error="errors.total_amount">
            <FormInput
              v-model="localForm.total_amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              required
            />
          </FormField>
        </div>
        <div class="form-column">
          <!-- Who paid? -->
          <FormField label="Who paid?" required :error="errors.who_paid_id">
            <FormSelect
              v-model="localForm.who_paid_id"
              :options="userOptions"
              placeholder="Select user..."
              required
            />
          </FormField>
        </div>
      </div>

      <!-- For who -->
      <FormField label="For who" required :error="errors.splits">
        <SplitUserControls
          v-model="userSplits"
          :users="users"
          :total-amount="parseFloat(localForm.total_amount) || 0"
        />
      </FormField>

      <!-- Date and Details Row -->
      <div class="form-row">
        <div class="form-column">
          <!-- When? -->
          <FormField label="When?" required :error="errors.date">
            <FormInput v-model="localForm.date" type="date" required />
          </FormField>
        </div>
        <div class="form-column">
          <!-- What time? -->
          <FormField label="What time?" required :error="errors.time">
            <FormInput v-model="localForm.time" type="time" required />
          </FormField>
        </div>
        <div class="form-column">
          <!-- Repeat -->
          <FormField label="Repeat">
            <FormSelect v-model="localForm.repeat" :options="repeatOptions" />
          </FormField>
        </div>
      </div>

      <!-- Payment and Category Row -->
      <div class="form-row">
        <div class="form-column">
          <!-- Payment mode -->
          <FormField label="Payment mode">
            <FormSelect
              v-model="localForm.payment_mode_id"
              :options="paymentModeOptions"
              placeholder="Select payment mode..."
            />
          </FormField>
        </div>
        <div class="form-column">
          <!-- Category -->
          <FormField label="Category">
            <FormSelect
              v-model="localForm.category_id"
              :options="categoryOptions"
              placeholder="Select category..."
            />
          </FormField>
        </div>
        <div class="form-column">
          <!-- Empty column for balance -->
        </div>
      </div>

      <!-- Comment -->
      <FormField label="Comment">
        <FormTextarea v-model="localForm.comment" placeholder="Additional notes..." :rows="3" />
      </FormField>

      <!-- File link -->
      <FormField
        label="Attach public link to personal file"
        help-text="Link to receipt or document"
        :error="errors.file_link"
      >
        <FormInput
          v-model="localForm.file_link"
          type="url"
          placeholder="https://example.com/receipt.pdf"
        />
      </FormField>
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
import { FormField, FormInput, FormSelect, FormTextarea, SplitUserControls } from '../../forms'

interface BillFormData {
  description: string
  total_amount: string
  who_paid_id: number | null
  date: string
  time: string
  repeat: string
  payment_mode_id: number | null
  category_id: number | null
  comment: string
  file_link: string
}

interface UserSplit {
  included: boolean
  amount: string
}

export default defineComponent({
  name: 'BillForm',
  components: {
    FormField,
    FormInput,
    FormSelect,
    FormTextarea,
    SplitUserControls
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
  emits: ['submit', 'validation-change'],
  setup(props, { emit }) {
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
    const errors = ref<{ [key: string]: string }>({})

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
      // Update existing userSplits object instead of replacing it
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
      const newErrors: { [key: string]: string } = {}

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
.bill-form {
  padding: var(--oc-space-large);
  max-width: 1200px;
  margin: 0 auto;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--oc-space-large);
  margin-bottom: var(--oc-space-medium);
}

.form-column {
  min-width: 0; // Prevent overflow
}

@media (max-width: 1024px) {
  .form-row {
    grid-template-columns: 1fr 1fr;
    gap: var(--oc-space-medium);
  }

  .form-column:nth-child(3) {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .bill-form {
    padding: var(--oc-space-medium);
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: var(--oc-space-small);
  }
}
</style>
