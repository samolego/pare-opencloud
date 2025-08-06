<template>
  <div class="oc-pare-app oc-width-1-1 oc-height-1-1 oc-flex">
    <!-- Navigation Sidebar -->
    <SideBar
      :is-open="true"
      :loading="false"
      :available-panels="navigationPanels"
      :panel-context="panelContext"
      :active-panel="'navigation'"
      @select-panel="onNavigate"
      @close="closeSidebar"
      class="navigation-sidebar"
    >
      <template #rootHeader>
        <div class="oc-p-s">
          <h2 class="oc-text-bold oc-mb-s">{{ $gettext('Pare Finance') }}</h2>
        </div>
      </template>
    </SideBar>

    <!-- Content Sidebar -->
    <SideBar
      :is-open="true"
      :loading="false"
      :available-panels="contentPanels"
      :panel-context="panelContext"
      :active-panel="currentSection"
      @select-panel="onNavigate"
      @close="closeSidebar"
      class="content-sidebar"
    >
      <template #rootHeader>
        <div class="oc-p-s">
          <oc-button
            v-if="currentSidebarConfig.showButton"
            variation="primary"
            size="small"
            appearance="filled"
            @click="onSidebarButtonClick"
            class="oc-width-1-1"
          >
            <oc-icon :name="currentSidebarConfig.buttonIcon || 'plus'" size="small" />
            {{ currentSidebarConfig.buttonText }}
          </oc-button>
        </div>
      </template>
    </SideBar>

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
import { AppConfigObject, useMessages, useThemeStore, SideBar } from '@opencloud-eu/web-pkg'
import { useGettext } from 'vue3-gettext'
import { PCSVParser, PCSVData } from './utils/pcsvParser'
import { SidebarItem, SidebarConfig } from './types/sidebar'
import NavigationPanel from './ui/components/panels/NavigationPanel.vue'
import ContentPanel from './ui/components/panels/ContentPanel.vue'
import { NewBillModal, NewMemberModal, NewCategoryModal } from './ui/components/modals'

export default defineComponent({
  name: 'App',
  components: {
    SideBar,
    NewBillModal,
    NewMemberModal,
    NewCategoryModal
  },
  props: {
    applicationConfig: { type: PropType<AppConfigObject>, required: true },
    currentContent: {
      type: String,
      required: true
    },
    isReadOnly: { type: Boolean, required: false, default: false },
    resource: { type: Object as PropType<Resource>, required: true }
  },
  emits: ['update:currentContent'],
  setup(props, { emit }) {
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

    // Sidebar configuration map
    const sidebarConfigMap = computed(
      (): Record<string, { items: SidebarItem[]; config: SidebarConfig }> => ({
        bills: {
          items: bills.value as SidebarItem[],
          config: {
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
        },
        members: {
          items: users.value as SidebarItem[],
          config: {
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
        },
        categories: {
          items: categories.value as SidebarItem[],
          config: {
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
        },
        statistics: {
          items: [],
          config: {
            title: $gettext('Statistics'),
            emptyMessage: $gettext('Statistics will appear here'),
            showButton: false,
            titleField: 'name',
            subtitleField: '',
            metaField: '',
            descriptionField: ''
          }
        }
      })
    )

    const currentSidebarItems = computed((): SidebarItem[] => {
      return sidebarConfigMap.value[currentSection.value]?.items || []
    })

    const currentSidebarConfig = computed((): SidebarConfig => {
      return (
        sidebarConfigMap.value[currentSection.value]?.config || {
          title: $gettext('Content'),
          emptyMessage: $gettext('No items'),
          showButton: false,
          titleField: 'name',
          subtitleField: '',
          metaField: '',
          descriptionField: ''
        }
      )
    })

    // OpenCloud Sidebar Panels
    const panelContext = computed(() => ({
      // Add any context needed by panels
    }))

    const navigationItems = computed(() => [
      {
        key: 'bills',
        label: $gettext('Bills'),
        icon: 'receipt',
        count: bills.value.length
      },
      {
        key: 'statistics',
        label: $gettext('Statistics'),
        icon: 'chart-bar'
      },
      {
        key: 'members',
        label: $gettext('Members'),
        icon: 'users',
        count: users.value.length
      },
      {
        key: 'categories',
        label: $gettext('Categories'),
        icon: 'tag',
        count: categories.value.length
      }
    ])

    const navigationPanels = computed(() => [
      {
        name: 'navigation',
        title: () => $gettext('Pare Finance'),
        isRoot: () => true,
        isVisible: () => true,
        component: NavigationPanel,
        componentAttrs: () => ({
          navigationItems: navigationItems.value,
          currentSection: currentSection.value,
          onNavigate: onNavigate
        })
      }
    ])

    const contentPanels = computed(() => {
      const allPanels = [
        {
          name: 'bills',
          title: () => $gettext('Bills'),
          isRoot: () => true,
          isVisible: () => currentSection.value === 'bills',
          component: ContentPanel,
          componentAttrs: () => ({
            darkTheme: darkTheme.value,
            items: bills.value,
            config: sidebarConfigMap.value.bills.config,
            onItemClick: onSidebarItemClick
          })
        },
        {
          name: 'members',
          title: () => $gettext('Members'),
          isRoot: () => true,
          isVisible: () => currentSection.value === 'members',
          component: ContentPanel,
          componentAttrs: () => ({
            darkTheme: darkTheme.value,
            items: users.value,
            config: sidebarConfigMap.value.members.config,
            onItemClick: onSidebarItemClick
          })
        },
        {
          name: 'categories',
          title: () => $gettext('Categories'),
          isRoot: () => true,
          isVisible: () => currentSection.value === 'categories',
          component: ContentPanel,
          componentAttrs: () => ({
            darkTheme: darkTheme.value,
            items: categories.value,
            config: sidebarConfigMap.value.categories.config,
            onItemClick: onSidebarItemClick
          })
        },
        {
          name: 'statistics',
          title: () => $gettext('Statistics'),
          isRoot: () => true,
          isVisible: () => currentSection.value === 'statistics',
          component: ContentPanel,
          componentAttrs: () => ({
            darkTheme: darkTheme.value,
            items: [],
            config: sidebarConfigMap.value.statistics.config,
            onItemClick: onSidebarItemClick
          })
        }
      ]

      return allPanels.filter((panel) => panel.isVisible())
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

    const closeSidebar = () => {
      // Handle sidebar close if needed
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
      navigationPanels,
      contentPanels,
      panelContext,
      onContentChange,
      onKeyDown,
      onNavigate,
      onSidebarButtonClick,
      onCreateBill,
      onCreateMember,
      onCreateCategory,
      closeSidebar
    }
  }
})
</script>

<style lang="scss">
.oc-pare-app {
  height: 100vh;
  overflow: hidden;
}

.navigation-sidebar {
  min-width: 200px !important;
  width: 200px !important;
  border-right: 1px solid var(--oc-color-border);
  background-color: var(--oc-role-surface-container-low);
}

.content-sidebar {
  min-width: 280px !important;
  width: 280px !important;
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
    box-shadow: 0 0 0 2px var(--oc-role-primary);
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
</style>
