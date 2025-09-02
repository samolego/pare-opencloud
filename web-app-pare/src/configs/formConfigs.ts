import type { SimpleFormConfig } from '../ui/components/forms/SimpleForm.vue'

export const categoryFormConfig: SimpleFormConfig = {
  entityType: 'category',
  label: 'Category Name',
  placeholder: 'Enter category name...'
}

export const paymentModeFormConfig: SimpleFormConfig = {
  entityType: 'paymentMode',
  label: 'Payment Mode Name',
  placeholder: 'Enter payment mode name...'
}
