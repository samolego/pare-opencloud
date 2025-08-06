<template>
  <div class="oc-pare-app oc-width-1-1 oc-height-1-1 oc-flex">
    <!-- Navigation Sidebar -->
    <NavigationSidebar
      :dark-theme="darkTheme"
      :current-section="currentSection"
      :bills-count="bills.length"
      :members-count="users.length"
      :categories-count="categories.length"
      @navigate="onNavigate"
    />

    <!-- Content Sidebar -->
    <Sidebar
      :dark-theme="darkTheme"
      :items="currentSidebarItems"
      :config="currentSidebarConfig"
      @button-click="onSidebarButtonClick"
      @item-click="onSidebarItemClick"
    >
      <template #modal>
        <!-- New Bill Modal -->
        <NewBillModal
          v-if="showNewBillModal"
          :users="users"
          :payment-modes="paymentModes"
          :categories="categories"
          @cancel="showNewBillModal = false"
          @create-bill="onCreateBill"
        />

        <!-- Modals -->
        <NewBillModal
          v-if="showNewBillModal"
          :users="users"
          :payment-modes="paymentModes"
          :categories="categories"
          @cancel="showNewBillModal = false"
          @create-bill="onCreateBill"
        />

        <NewMemberModal
          v-if="showNewMemberModal"
          @cancel="showNewMemberModal = false"
          @create-member="onCreateMember"
        />

        <NewCategoryModal
          v-if="showNewCategoryModal"
          @cancel="showNewCategoryModal = false"
          @create-category="onCreateCategory"
        />
      </template>
    </Sidebar>

    <!-- Main Content Area -->
    <div class="main-content oc-flex oc-flex-column oc-width-1-1">
      <!-- Header -->
      <div class="content-header oc-p-s oc-border-b">
        <div class="oc-flex oc-flex-between oc-flex-middle">
          <h2 class="oc-text-bold">{{ resource.name }}</h2>
          <div class="oc-flex oc-flex-middle oc-text-small oc-text-muted">
            <span v-if="hasUnsavedChanges" class="oc-mr-s">{{ $gettext('Unsaved changes') }}</span>
            <span>{{ $gettext('Lines: %{lines}', { lines: lineCount }) }}</span>
            <span class="oc-ml-s">{{
              $gettext('Characters: %{chars}', { chars: characterCount })
            }}</span>
          </div>
        </div>
      </div>

      <!-- Editor Area -->
      <div class="editor-container oc-flex-1 oc-p-s">
        <textarea
          ref="textEditor"
          v-model="editableContent"
          class="text-editor oc-width-1-1 oc-height-1-1"
          :class="{ 'text-editor-dark': darkTheme }"
          :readonly="isReadOnly"
          :placeholder="
            $gettext(
              'Enter your CSV content here...\n\nExample:\nDate,Description,Amount,Category\n2024-01-15,Grocery Store,-45.50,Food\n2024-01-16,Salary,2500.00,Income'
            )
          "
          @input="onContentChange"
          @keydown="onKeyDown"
        />
      </div>

      <!-- Status Bar -->
      <div
        class="status-bar oc-p-xs oc-flex oc-flex-between oc-text-small oc-text-muted oc-border-t"
      >
        <div>
          {{ $gettext('Ready') }}
        </div>
        <div v-if="lastSaved">
          {{ $gettext('Last saved: %{time}', { time: lastSaved }) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch, nextTick } from 'vue'
import { Resource } from '@opencloud-eu/web-client'
import { AppConfigObject, useMessages, useThemeStore } from '@opencloud-eu/web-pkg'
import { useGettext } from 'vue3-gettext'
import { PCSVParser, PCSVData } from './utils/pcsvParser'
import { SidebarItem, SidebarConfig } from './types/sidebar'
// Using custom sidebar implementation due to AppSidebar import issues
import NavigationSidebar from './ui/components/NavigationSidebar.vue'
import { NewBillModal, NewMemberModal, NewCategoryModal } from './ui/components/modals'

export default defineComponent({
  name: 'App',
  components: {
    NavigationSidebar,
    NewBillModal,
    NewMemberModal,
    NewCategoryModal
  },
  props: {
    applicationConfig: { type: Object as PropType<AppConfigObject>, required: true },
    currentContent: {
      type: String,
      required: true
    },
    isReadOnly: { type: Boolean, required: false, default: false },
    resource: { type: Object as PropType<Resource>, required: true }
  },
  emits: ['update:currentContent'],
  setup: (props, { emit }) => {
    const textEditor = ref<HTMLTextAreaElement>()
    const editableContent = ref(props.currentContent)
    const originalContent = ref(props.currentContent)
    const lastSaved = ref<string>('')
    const currentSection = ref<string>('bills')

    // Modals
    const showNewBillModal = ref(false)
    const showNewMemberModal = ref(false)
    const showNewCategoryModal = ref(false)

    const currentUser = computed(() => ({
      name: 'Current User', // TODO: Get from OpenCloud user context
      opencloud_id: null // TODO: Get actual OpenCloud user ID
    }))

    const { $gettext } = useGettext()
    const { showMessage } = useMessages()
    const themeStore = useThemeStore()

    const darkTheme = computed(() => {
      return themeStore.currentTheme.isDark
    })

    const hasUnsavedChanges = computed(() => {
      return editableContent.value !== originalContent.value
    })

    const lineCount = computed(() => {
      return editableContent.value.split('\n').length
    })

    const characterCount = computed(() => {
      return editableContent.value.length
    })

    // Parse PCSV data
    const parsedData = computed(() => {
      try {
        let data = PCSVParser.parse(editableContent.value)
        data = PCSVParser.ensureDefaultTables(
          data,
          currentUser.value.name,
          currentUser.value.opencloud_id
        )
        return data
      } catch (error) {
        console.error('Error parsing PCSV:', error)
        return { tables: {} } as PCSVData
      }
    })

    const bills = computed(() => {
      return PCSVParser.getBills(parsedData.value)
        .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
        .slice(0, 10) // Show only last 10 bills
    })

    const users = computed(() => {
      return PCSVParser.getUsers(parsedData.value)
    })

    const paymentModes = computed(() => {
      return PCSVParser.getPaymentModes(parsedData.value)
    })

    const categories = computed(() => {
      return PCSVParser.getCategories(parsedData.value)
    })

    // Sidebar configuration based on current section
    const currentSidebarItems = computed((): SidebarItem[] => {
      switch (currentSection.value) {
        case 'bills':
          return bills.value as SidebarItem[]
        case 'members':
          return users.value as SidebarItem[]
        case 'categories':
          return categories.value as SidebarItem[]
        case 'statistics':
          return []
        default:
          return []
      }
    })

    const currentSidebarConfig = computed((): SidebarConfig => {
      switch (currentSection.value) {
        case 'bills':
          return {
            title: $gettext('Recent Bills'),
            buttonText: $gettext('New Bill'),
            buttonIcon: 'plus',
            emptyMessage: $gettext('No bills yet. Create your first bill!'),
            showButton: true,
            titleField: 'description',
            subtitleField: 'total_amount',
            metaField: 'datetime',
            descriptionField: 'comment'
          }
        case 'members':
          return {
            title: $gettext('Members'),
            buttonText: $gettext('Add Member'),
            buttonIcon: 'user-plus',
            emptyMessage: $gettext('No members yet. Add your first member!'),
            showButton: true,
            titleField: 'name',
            subtitleField: 'opencloud_id',
            metaField: '',
            descriptionField: ''
          }
        case 'categories':
          return {
            title: $gettext('Categories'),
            buttonText: $gettext('Add Category'),
            buttonIcon: 'tag',
            emptyMessage: $gettext('No categories yet. Add your first category!'),
            showButton: true,
            titleField: 'name',
            subtitleField: '',
            metaField: '',
            descriptionField: ''
          }
        case 'statistics':
          return {
            title: $gettext('Statistics'),
            emptyMessage: $gettext('Statistics will appear here'),
            showButton: false,
            titleField: 'name',
            subtitleField: '',
            metaField: '',
            descriptionField: ''
          }
        default:
          return {
            title: $gettext('Content'),
            emptyMessage: $gettext('No items'),
            showButton: false,
            titleField: 'name',
            subtitleField: '',
            metaField: '',
            descriptionField: ''
          }
      }
    })

    // Watch for external content changes
    watch(
      () => props.currentContent,
      (newContent) => {
        if (newContent !== editableContent.value) {
          editableContent.value = newContent
          originalContent.value = newContent
        }
      }
    )

    const onContentChange = () => {
      emit('update:currentContent', editableContent.value)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      // Handle any keyboard shortcuts if needed
      // Save is handled by OpenCloud's top bar
    }

    const onNavigate = (section: string) => {
      currentSection.value = section
    }

    const onSidebarButtonClick = () => {
      switch (currentSection.value) {
        case 'bills':
          showNewBillModal.value = true
          break
        case 'members':
          showNewMemberModal.value = true
          break
        case 'categories':
          showNewCategoryModal.value = true
          break
      }
    }

    const onSidebarItemClick = (item: SidebarItem) => {
      console.log('Item clicked:', item)
      // TODO: Handle item selection (e.g., edit item)
    }

    const onCreateBill = (data: { bill: any; splits: any[] }) => {
      try {
        let updatedData = { ...parsedData.value }
        updatedData = PCSVParser.addBill(updatedData, data.bill, data.splits)
        const newContent = PCSVParser.generate(updatedData)
        editableContent.value = newContent
        emit('update:currentContent', newContent)
        showNewBillModal.value = false

        showMessage({
          title: $gettext('Bill created'),
          desc: $gettext('Your bill has been created successfully')
        })
      } catch (error) {
        console.error('Error creating bill:', error)
      }
    }

    const onCreateMember = (data: { name: string; opencloud_id: string }) => {
      try {
        let updatedData = { ...parsedData.value }
        const usersTable = updatedData.tables.users
        const nextUserId = Math.max(...usersTable.rows.map((row) => parseInt(row[0])), 0) + 1

        usersTable.rows.push([nextUserId.toString(), data.name, data.opencloud_id || ''])

        const newContent = PCSVParser.generate(updatedData)
        editableContent.value = newContent
        emit('update:currentContent', newContent)
        showNewMemberModal.value = false

        showMessage({
          title: $gettext('Member added'),
          desc: $gettext('New member has been added successfully')
        })
      } catch (error) {
        console.error('Error creating member:', error)
      }
    }

    const onCreateCategory = (data: { name: string }) => {
      try {
        let updatedData = { ...parsedData.value }
        const categoriesTable = updatedData.tables.category
        const nextCategoryId =
          Math.max(...categoriesTable.rows.map((row) => parseInt(row[0])), 0) + 1

        categoriesTable.rows.push([nextCategoryId.toString(), data.name])

        const newContent = PCSVParser.generate(updatedData)
        editableContent.value = newContent
        emit('update:currentContent', newContent)
        showNewCategoryModal.value = false

        showMessage({
          title: $gettext('Category added'),
          desc: $gettext('New category has been added successfully')
        })
      } catch (error) {
        console.error('Error creating category:', error)
      }
    }

    const onContentUpdate = (newContent: string) => {
      editableContent.value = newContent
      emit('update:currentContent', newContent)
    }

    // Focus the editor when component mounts
    nextTick(() => {
      if (textEditor.value && !props.isReadOnly) {
        textEditor.value.focus()
      }
    })

    return {
      textEditor,
      editableContent,
      hasUnsavedChanges,
      lineCount,
      characterCount,
      darkTheme,
      lastSaved,
      currentUser,
      currentSection,
      showNewBillModal,
      showNewMemberModal,
      showNewCategoryModal,
      bills,
      users,
      paymentModes,
      categories,
      currentSidebarItems,
      currentSidebarConfig,
      onContentChange,
      onKeyDown,
      // Helper functions for item display
      getItemTitle,
      getItemSubtitle,
      getItemMeta,
      getItemDescription,
      isNegativeAmount,
      truncateText,
      onNavigate,
      onSidebarButtonClick,
      onSidebarItemClick,
      onCreateBill,
      onCreateMember,
      onCreateCategory,
      onContentUpdate
    }

    // Helper functions for item display
    function getItemTitle(item: any): string {
      return item[currentSidebarConfig.value.titleField] || ''
    }

    function getItemSubtitle(item: any): string {
      const config = currentSidebarConfig.value
      if (!config.subtitleField) return ''
      const value = item[config.subtitleField]

      // Special formatting for amounts
      if (typeof value === 'number' && config.subtitleField.includes('amount')) {
        const prefix = value < 0 ? '-' : ''
        const absValue = Math.abs(value)
        return `${prefix}$${absValue.toFixed(2)}`
      }

      return value || ''
    }

    function getItemMeta(item: any): string {
      const config = currentSidebarConfig.value
      if (!config.metaField) return ''
      const value = item[config.metaField]

      // Special formatting for dates
      if ((typeof value === 'string' && value.includes('/')) || value.includes('-')) {
        try {
          const date = new Date(value.replace(' ', 'T'))
          return date.toLocaleDateString()
        } catch {
          return value.split(' ')[0] || ''
        }
      }

      return value || ''
    }

    function getItemDescription(item: any): string {
      const config = currentSidebarConfig.value
      if (!config.descriptionField) return ''
      return item[config.descriptionField] || ''
    }

    function isNegativeAmount(item: any): boolean {
      const config = currentSidebarConfig.value
      if (!config.subtitleField?.includes('amount')) return false
      const value = item[config.subtitleField]
      return typeof value === 'number' && value < 0
    }

    function truncateText(text: string, maxLength: number): string {
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    }
  }
})
</script>

<style lang="scss">
.oc-pare-app {
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  min-width: 0; // Prevent flex item from growing beyond container
  background-color: var(--oc-role-background);
}

.content-header {
  background-color: var(--oc-role-background);
  min-height: 60px;
}

.editor-container {
  position: relative;
  overflow: hidden;
}

.text-editor {
  border: 1px solid var(--oc-color-border);
  border-radius: var(--oc-border-radius-medium);
  padding: var(--oc-space-medium);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  outline: none;
  background-color: var(--oc-role-background);
  color: var(--oc-role-text);

  &:focus {
    border-color: var(--oc-role-primary);
    box-shadow: 0 0 0 2px var(--oc-role-primary-muted);
  }

  &:read-only {
    background-color: var(--oc-role-background-muted);
    cursor: not-allowed;
  }

  &.text-editor-dark {
    background-color: var(--oc-role-background);
    border-color: var(--oc-color-border);
  }
}

.status-bar {
  background-color: var(--oc-role-background-muted);
  min-height: 32px;
}

// Sidebar content styles
.content-list {
  .content-item {
    background-color: var(--oc-role-background);
    border: 1px solid var(--oc-color-border);
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: var(--oc-role-surface-container-high);
    }

    &.content-item-dark {
      background-color: var(--oc-role-background);
      border-color: var(--oc-color-border);
    }
  }
}

.item-main {
  .item-title {
    color: var(--oc-role-text);
    line-height: 1.3;
  }

  .item-subtitle {
    color: var(--oc-role-primary);
    font-weight: 600;
    font-size: 0.9rem;

    &.item-amount-negative {
      color: var(--oc-role-error);
    }
  }

  .item-meta {
    font-size: 0.75rem;
  }

  .item-description {
    line-height: 1.2;
    font-style: italic;
  }
}

// Content sidebar styles
.content-sidebar {
  width: 300px;
  min-width: 300px;
  max-width: 300px;
  border-right: 1px solid var(--oc-color-border);
  display: flex;
  flex-direction: column;
  background-color: var(--oc-role-surface-container-low);

  &.content-sidebar-dark {
    background-color: var(--oc-role-surface-container);
  }
}

.sidebar-header {
  border-bottom: 1px solid var(--oc-color-border);
  background-color: var(--oc-role-background);

  h3 {
    color: var(--oc-role-text);
  }
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
}
</style>
