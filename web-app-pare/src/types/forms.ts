// Common form types used across components

export interface UserSplit {
  included: boolean
  amount: string
}

export interface SimpleFormData {
  name: string
}

export type FormMode = 'create' | 'edit'

export interface ValidationErrors {
  [key: string]: string
}

export interface FormValidationEmits {
  'validation-change': (isValid: boolean) => void
  submit: (data: any) => void
}

export interface DetailPanelEmits {
  cancel: () => void
  create: (data: any) => void
  save: (data: any) => void
}

// Generic form data types
export interface BillFormData {
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

export interface MemberFormData {
  name: string
  opencloud_id: string
}

export interface CategoryFormData {
  name: string
}

export interface PaymentModeFormData {
  name: string
}

// Form validation function type
export type ValidatorFunction<T> = (data: T) => ValidationErrors

// Form submission data types
export interface BillSubmissionData {
  bill: any
  splits: any[]
}
