import { ref, computed } from 'vue'
import type { FormMode } from '../types/forms'

/**
 * Composable for detail panel logic
 * Eliminates common patterns across BillDetailPanel, CategoryDetailPanel, etc.
 */
export function useDetailPanelLogic<T = any>(mode: FormMode, itemType: string, saveText?: string) {
  const canSave = ref(false)
  const formRef = ref()

  const isVisible = computed(() => true)

  const panelTitle = computed(() => {
    return mode === 'create' ? `New ${itemType}` : `Edit ${itemType}`
  })

  const computedSaveText = computed(() => {
    if (saveText) return saveText

    // Generate appropriate save text based on item type and mode
    if (mode === 'create') {
      switch (itemType.toLowerCase()) {
        case 'bill':
          return 'Create Bill'
        case 'member':
          return 'Add Member'
        case 'category':
          return 'Add Category'
        case 'payment mode':
          return 'Add Payment Mode'
        default:
          return 'Create'
      }
    } else {
      return 'Save Changes'
    }
  })

  const onValidationChange = (isValid: boolean) => {
    canSave.value = isValid
  }

  const onSave = () => {
    if (formRef.value && formRef.value.onSubmit) {
      formRef.value.onSubmit()
    }
  }

  // Generic event handlers that emit with proper naming
  const createEventHandlers = (
    emit: any,
    postSaveCallback?: (billId?: number) => Promise<void>
  ) => {
    const onCancel = () => {
      emit('cancel')
    }

    const onFormSubmit = async (data: T) => {
      const eventName =
        mode === 'create'
          ? `create-${itemType.toLowerCase().replace(' ', '-')}`
          : `save-${itemType.toLowerCase().replace(' ', '-')}`

      emit(eventName, data)

      // Execute post-save callback if provided
      if (postSaveCallback && (data as any)?.id) {
        console.log(`useDetailPanelLogic: Executing post-save callback for ${itemType}`)
        try {
          await postSaveCallback((data as any).id)
        } catch (error) {
          console.error(`useDetailPanelLogic: Error in post-save callback:`, error)
        }
      }
    }

    return {
      onCancel,
      onFormSubmit
    }
  }

  return {
    canSave,
    formRef,
    isVisible,
    panelTitle,
    computedSaveText,
    onValidationChange,
    onSave,
    createEventHandlers
  }
}
