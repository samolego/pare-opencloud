<template>
  <BaseModal
    :title="$gettext('New Bill')"
    :confirm-text="$gettext('Create Bill')"
    :confirm-enabled="isFormValid"
    @cancel="$emit('cancel')"
    @confirm="onCreateBill"
  >
    <template #content>
      <form @submit.prevent="onCreateBill" class="new-bill-form">
        <!-- What? -->
        <div class="form-group oc-mb-m">
          <label class="oc-text-bold oc-mb-xs oc-display-block">
            {{ $gettext('What?') }}
          </label>
          <input
            v-model="form.description"
            type="text"
            class="oc-text-input oc-width-1-1"
            :placeholder="$gettext('Enter description...')"
            required
          />
        </div>

        <!-- How much? -->
        <div class="form-group oc-mb-m">
          <label class="oc-text-bold oc-mb-xs oc-display-block">
            {{ $gettext('How much?') }}
          </label>
          <input
            v-model="form.total_amount"
            type="number"
            step="0.01"
            class="oc-text-input oc-width-1-1"
            :placeholder="$gettext('0.00')"
            required
          />
        </div>

        <!-- Who paid? -->
        <div class="form-group oc-mb-m">
          <label class="oc-text-bold oc-mb-xs oc-display-block">
            {{ $gettext('Who paid?') }}
          </label>
          <select v-model="form.who_paid_id" class="oc-select oc-width-1-1" required>
            <option value="">{{ $gettext('Select user...') }}</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.name }}
            </option>
          </select>
        </div>

        <!-- For who -->
        <div class="form-group oc-mb-m">
          <label class="oc-text-bold oc-mb-xs oc-display-block">
            {{ $gettext('For who') }}
          </label>
          <div class="split-users oc-border oc-border-radius-medium oc-p-s oc-background-muted">
            <div
              v-for="user in users"
              :key="user.id"
              class="split-user-row oc-flex oc-flex-between oc-flex-middle oc-mb-xs"
            >
              <div class="oc-flex oc-flex-middle">
                <input
                  type="checkbox"
                  v-model="userSplits[user.id].included"
                  @change="onSplitIncludedChange"
                  class="oc-mr-xs"
                />
                <span class="oc-text-default">{{ user.name }}</span>
              </div>
              <div class="split-amount">
                <input
                  v-model="userSplits[user.id].amount"
                  type="number"
                  step="0.01"
                  class="oc-text-input-small"
                  :disabled="!userSplits[user.id].included"
                  @input="onSplitAmountChange"
                />
              </div>
            </div>
            <div class="split-summary oc-mt-s oc-pt-s oc-border-t">
              <div class="oc-flex oc-flex-between oc-text-small">
                <span>{{ $gettext('Total split:') }}</span>
                <span class="oc-text-bold">{{ totalSplitAmount.toFixed(2) }}</span>
              </div>
              <div v-if="splitDifference !== 0" class="oc-text-small oc-text-danger oc-mt-xs">
                {{ $gettext('Difference: %{diff}', { diff: splitDifference.toFixed(2) }) }}
              </div>
            </div>
          </div>
        </div>

        <!-- When? -->
        <div class="form-group oc-mb-m oc-flex oc-flex-gap-s">
          <div class="oc-flex-1">
            <label class="oc-text-bold oc-mb-xs oc-display-block">
              {{ $gettext('When?') }}
            </label>
            <input v-model="form.date" type="date" class="oc-text-input oc-width-1-1" required />
          </div>
          <div class="oc-flex-1">
            <label class="oc-text-bold oc-mb-xs oc-display-block">
              {{ $gettext('What time?') }}
            </label>
            <input v-model="form.time" type="time" class="oc-text-input oc-width-1-1" required />
          </div>
        </div>

        <!-- Repeat -->
        <div class="form-group oc-mb-m">
          <label class="oc-text-bold oc-mb-xs oc-display-block">
            {{ $gettext('Repeat') }}
          </label>
          <select v-model="form.repeat" class="oc-select oc-width-1-1">
            <option v-for="option in repeatOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <!-- Payment mode -->
        <div class="form-group oc-mb-m">
          <label class="oc-text-bold oc-mb-xs oc-display-block">
            {{ $gettext('Payment mode') }}
          </label>
          <select v-model="form.payment_mode_id" class="oc-select oc-width-1-1">
            <option value="">{{ $gettext('Select payment mode...') }}</option>
            <option v-for="mode in paymentModes" :key="mode.id" :value="mode.id">
              {{ mode.name }}
            </option>
          </select>
        </div>

        <!-- Category -->
        <div class="form-group oc-mb-m">
          <label class="oc-text-bold oc-mb-xs oc-display-block">
            {{ $gettext('Category') }}
          </label>
          <select v-model="form.category_id" class="oc-select oc-width-1-1">
            <option value="">{{ $gettext('Select category...') }}</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>

        <!-- Comment -->
        <div class="form-group oc-mb-m">
          <label class="oc-text-bold oc-mb-xs oc-display-block">
            {{ $gettext('Comment') }}
          </label>
          <textarea
            v-model="form.comment"
            class="oc-textarea oc-width-1-1"
            :placeholder="$gettext('Additional notes...')"
            rows="3"
          ></textarea>
        </div>

        <!-- File link -->
        <div class="form-group oc-mb-m">
          <label class="oc-text-bold oc-mb-xs oc-display-block">
            {{ $gettext('Attach public link to personal file') }}
          </label>
          <input
            v-model="form.file_link"
            type="url"
            class="oc-text-input oc-width-1-1"
            :placeholder="$gettext('https://example.com/receipt.pdf')"
          />
        </div>
      </form>
    </template>
  </BaseModal>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, reactive, ref, watch } from 'vue'
import { useGettext } from 'vue3-gettext'
import { User, PaymentMode, Category, Bill, BillSplit } from '../../../utils/pcsvParser'
import BaseModal from './BaseModal.vue'

export default defineComponent({
  name: 'NewBillModal',
  components: {
    BaseModal
  },
  props: {
    users: { type: Array as PropType<User[]>, required: true },
    paymentModes: { type: Array as PropType<PaymentMode[]>, required: true },
    categories: { type: Array as PropType<Category[]>, required: true }
  },
  emits: ['cancel', 'create-bill'],
  setup(props, { emit }) {
    const { $gettext } = useGettext()

    const form = reactive({
      description: '',
      total_amount: '',
      who_paid_id: null as number | null,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      repeat: 'None',
      payment_mode_id: null as number | null,
      category_id: null as number | null,
      comment: '',
      file_link: ''
    })

    const userSplits = ref<{ [userId: number]: { included: boolean; amount: string } }>({})

    // Initialize user splits
    const initializeUserSplits = () => {
      const splits: { [userId: number]: { included: boolean; amount: string } } = {}
      props.users.forEach((user) => {
        splits[user.id] = {
          included: false,
          amount: '0.00'
        }
      })
      userSplits.value = splits
    }

    // Initialize splits when users change
    watch(() => props.users, initializeUserSplits, { immediate: true })

    const repeatOptions = computed(() => [
      { label: $gettext('None'), value: 'None' },
      { label: $gettext('Daily'), value: 'Daily' },
      { label: $gettext('Weekly'), value: 'Weekly' },
      { label: $gettext('Monthly'), value: 'Monthly' },
      { label: $gettext('Yearly'), value: 'Yearly' }
    ])

    const totalSplitAmount = computed(() => {
      return Object.values(userSplits.value)
        .filter((split) => split.included)
        .reduce((sum, split) => sum + parseFloat(split.amount || '0'), 0)
    })

    const splitDifference = computed(() => {
      const totalAmount = parseFloat(form.total_amount || '0')
      return totalSplitAmount.value - totalAmount
    })

    const isFormValid = computed(() => {
      return (
        form.description.trim() !== '' &&
        form.total_amount !== '' &&
        parseFloat(form.total_amount) > 0 &&
        form.who_paid_id !== null &&
        Math.abs(splitDifference.value) < 0.01
      )
    })

    const onSplitIncludedChange = () => {
      calculateEqualSplits()
    }

    const onSplitAmountChange = () => {
      // Allow manual adjustment - no automatic recalculation
    }

    const calculateEqualSplits = () => {
      const totalAmount = parseFloat(form.total_amount || '0')
      const includedUsers = Object.entries(userSplits.value).filter(([_, split]) => split.included)

      if (includedUsers.length === 0 || totalAmount <= 0) return

      const equalAmount = totalAmount / includedUsers.length

      includedUsers.forEach(([_userId, split]) => {
        split.amount = equalAmount.toFixed(2)
      })

      // Set excluded users to 0
      Object.entries(userSplits.value).forEach(([_userId, split]) => {
        if (!split.included) {
          split.amount = '0.00'
        }
      })
    }

    // Auto-calculate splits when total amount changes
    watch(
      () => form.total_amount,
      () => {
        if (form.total_amount) {
          calculateEqualSplits()
        }
      }
    )

    const onCreateBill = () => {
      if (!isFormValid.value) return

      const bill: Omit<Bill, 'id'> = {
        description: form.description,
        total_amount: parseFloat(form.total_amount),
        who_paid_id: form.who_paid_id!,
        datetime: `${form.date} ${form.time}`,
        repeat: form.repeat,
        payment_mode_id: form.payment_mode_id,
        category_id: form.category_id,
        comment: form.comment,
        file_link: form.file_link
      }

      const splits: Omit<BillSplit, 'id' | 'bill_id'>[] = Object.entries(userSplits.value).map(
        ([userId, split]) => ({
          user_id: parseInt(userId),
          amount: parseFloat(split.amount),
          included: split.included ? 1 : 0
        })
      )

      emit('create-bill', { bill, splits })
    }

    return {
      form,
      userSplits,
      repeatOptions,
      totalSplitAmount,
      splitDifference,
      isFormValid,
      onSplitIncludedChange,
      onSplitAmountChange,
      onCreateBill
    }
  }
})
</script>
