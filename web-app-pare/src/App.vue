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
      class="navigation-sidebar"
      :class="{ 'navigation-sidebar-collapsed': isNavigationCollapsed }"
    >
      <template #rootHeader>
        <div class="oc-p-s oc-flex oc-flex-between oc-flex-middle">
          <h2 v-if="!isNavigationCollapsed" class="oc-text-bold oc-mb-remove">
            {{
              resource.name && resource.extension
                ? resource.name.slice(0, resource.name.length - resource.extension.length - 1) ||
                  resource.name
                : $gettext('Pare Finance')
            }}
          </h2>
          <oc-button
            appearance="raw"
            class="oc-p-xs"
            :aria-label="
              isNavigationCollapsed
                ? $gettext('Expand navigation')
                : $gettext('Collapse navigation')
            "
            @click="toggleNavigation"
          >
            <oc-icon :name="isNavigationCollapsed ? 'arrow-right-s' : 'arrow-left-s'" />
          </oc-button>
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

    <!-- Main Content Area -->
    <div class="main-content oc-flex oc-width-1-1">
      <!-- Bill Detail Panel -->
      <BillDetailPanel
        v-if="detailPanel.type === 'bill'"
        :key="`bill-${detailPanel.mode}-${detailPanel.selectedItem?.id || 'new'}`"
        :bill="detailPanel.selectedItem"
        :mode="detailPanel.mode"
        :users="users"
        :payment-modes="paymentModes"
        :categories="categories"
        :parsed-data="parsedData"
        @cancel="onDetailPanelCancel"
        @create-bill="onCreateBill"
        @save-bill="onSaveBill"
      />

      <!-- Member Detail Panel -->
      <MemberDetailPanel
        v-else-if="detailPanel.type === 'member'"
        :key="`member-${detailPanel.mode}-${detailPanel.selectedItem?.id || 'new'}`"
        :member="detailPanel.selectedItem"
        :mode="detailPanel.mode"
        @cancel="onDetailPanelCancel"
        @create-member="onCreateMember"
        @save-member="onSaveMember"
      />

      <!-- Category Detail Panel -->
      <CategoryDetailPanel
        v-else-if="detailPanel.type === 'category'"
        :key="`category-${detailPanel.mode}-${detailPanel.selectedItem?.id || 'new'}`"
        :category="detailPanel.selectedItem"
        :mode="detailPanel.mode"
        @cancel="onDetailPanelCancel"
        @create-category="onCreateCategory"
        @save-category="onSaveCategory"
      />

      <!-- Payment Mode Detail Panel -->
      <PaymentModeDetailPanel
        v-else-if="detailPanel.type === 'payment-mode'"
        :key="`payment-mode-${detailPanel.mode}-${detailPanel.selectedItem?.id || 'new'}`"
        :payment-mode="detailPanel.selectedItem"
        :mode="detailPanel.mode"
        @cancel="onDetailPanelCancel"
        @create-payment-mode="onCreatePaymentMode"
        @save-payment-mode="onSavePaymentMode"
      />

      <!-- Empty state when no panel is selected -->
      <div v-else class="empty-detail-state">
        <div class="empty-state-content">
          <oc-icon name="file-text" size="large" />
          <h3>Select an item to view details</h3>
          <p>Choose an item from the list or create a new one to get started.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch, onMounted } from 'vue'
import { Resource } from '@opencloud-eu/web-client'
import { AppConfigObject, useMessages, useThemeStore, SideBar } from '@opencloud-eu/web-pkg'
import { useGettext } from 'vue3-gettext'
import { PCSVParser, PCSVData } from './utils/pcsvParser'
import { SidebarItem, SidebarConfig } from './types/sidebar'
import { useUser } from './composables/useUser'
import NavigationPanel from './ui/components/panels/NavigationPanel.vue'
import ContentPanel from './ui/components/panels/ContentPanel.vue'
import UsersContentPanel from './ui/components/panels/UsersContentPanel.vue'
import {
  BillDetailPanel,
  MemberDetailPanel,
  CategoryDetailPanel,
  PaymentModeDetailPanel
} from './ui/components/panels/detail'

export default defineComponent({
  name: 'App',
  components: {
    SideBar,
    BillDetailPanel,
    MemberDetailPanel,
    CategoryDetailPanel,
    PaymentModeDetailPanel
  },
  props: {
    applicationConfig: { type: Object, required: true },
    currentContent: {
      type: String,
      required: true
    },
    isReadOnly: { type: Boolean, required: false, default: false },
    resource: { type: Object, required: true }
  },
  emits: ['update:currentContent'],
  setup(props, { emit }) {
    const textEditor = ref<HTMLTextAreaElement>()
    const editableContent = ref(props.currentContent)
    const originalContent = ref(props.currentContent)
    const lastSaved = ref<string>('')
    const currentSection = ref<string>('bills')
    const isNavigationCollapsed = ref(true)

    // Detail Panel State
    const detailPanel = ref<{
      type: 'bill' | 'member' | 'category' | 'payment-mode' | null
      mode: 'create' | 'edit'
      selectedItem: any
    }>({
      type: null,
      mode: 'create',
      selectedItem: null
    })

    const { $gettext } = useGettext()
    const { showMessage } = useMessages()
    const themeStore = useThemeStore()
    const { user: currentUser, initUser } = useUser()

    // Initialize user on component mount
    onMounted(async () => {
      await initUser(props.resource)
    })

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
    const parsedData = ref<PCSVData>({ tables: {} })

    const updateParsedData = () => {
      try {
        let data = PCSVParser.parse(editableContent.value)
        data = PCSVParser.ensureDefaultTables(
          data,
          currentUser.value?.name || 'Current User',
          currentUser.value?.opencloud_id || null
        )
        parsedData.value = data
      } catch (error) {
        console.error('Error parsing PCSV:', error)
        parsedData.value = { tables: {} } as PCSVData
      }
    }

    // Update parsed data when content changes
    watch(editableContent, updateParsedData, { immediate: true })
    watch(() => currentUser.value, updateParsedData)

    const bills = computed(() => {
      return PCSVParser.getBills(parsedData.value).sort(
        (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
      )
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

    const navigationItems = computed(() => {
      const items = [
        {
          key: 'bills',
          label: $gettext('Bills'),
          icon: 'bill',
          count: bills.value.length
        },
        {
          key: 'statistics',
          label: $gettext('Statistics'),
          icon: 'bar-chart'
        },
        {
          key: 'members',
          label: $gettext('Members'),
          icon: 'user',
          count: users.value.length
        },
        {
          key: 'categories',
          label: $gettext('Categories'),
          icon: 'folder',
          count: categories.value.length
        }
      ]

      return items
    })

    const navigationPanels = computed(() => [
      {
        name: 'navigation',
        title: () => {},
        isRoot: () => true,
        isVisible: () => true,
        component: NavigationPanel,
        componentAttrs: () => ({
          navigationItems: navigationItems.value,
          currentSection: currentSection.value,
          collapsed: isNavigationCollapsed.value,
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
          component: UsersContentPanel,
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

      return allPanels
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

    const onNavigate = (section: string) => {
      currentSection.value = section
    }

    const toggleNavigation = () => {
      isNavigationCollapsed.value = !isNavigationCollapsed.value
    }

    const onSidebarButtonClick = () => {
      detailPanel.value = {
        type: currentSection.value as any,
        mode: 'create',
        selectedItem: null
      }
    }

    const onSidebarItemClick = (item: SidebarItem) => {
      let itemType: 'bill' | 'member' | 'category' | 'payment-mode'

      switch (currentSection.value) {
        case 'bills':
          itemType = 'bill'
          break
        case 'members':
          itemType = 'member'
          break
        case 'categories':
          itemType = 'category'
          break
        default:
          itemType = 'bill'
      }

      detailPanel.value = {
        type: itemType,
        mode: 'edit',
        selectedItem: item
      }
    }

    const onDetailPanelCancel = () => {
      detailPanel.value = {
        type: null,
        mode: 'create',
        selectedItem: null
      }
    }

    const onCreateBill = (data: { bill: any; splits: any[] }) => {
      try {
        let updatedData = { ...parsedData.value }
        updatedData = PCSVParser.addBill(updatedData, data.bill, data.splits)
        const newContent = PCSVParser.generate(updatedData)
        editableContent.value = newContent
        emit('update:currentContent', newContent)
        onDetailPanelCancel()

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
        const updatedData = { ...parsedData.value }
        const usersTable = updatedData.tables.users
        const nextUserId = Math.max(...usersTable.rows.map((row) => parseInt(row[0])), 0) + 1

        usersTable.rows.push([nextUserId.toString(), data.name, data.opencloud_id || ''])

        const newContent = PCSVParser.generate(updatedData)
        editableContent.value = newContent
        emit('update:currentContent', newContent)
        onDetailPanelCancel()

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
        const updatedData = { ...parsedData.value }
        const categoriesTable = updatedData.tables.category
        const nextCategoryId =
          Math.max(...categoriesTable.rows.map((row) => parseInt(row[0])), 0) + 1

        categoriesTable.rows.push([nextCategoryId.toString(), data.name])

        const newContent = PCSVParser.generate(updatedData)
        editableContent.value = newContent
        emit('update:currentContent', newContent)
        onDetailPanelCancel()

        showMessage({
          title: $gettext('Category added'),
          desc: $gettext('New category has been added successfully')
        })
      } catch (error) {
        console.error('Error creating category:', error)
      }
    }

    const onCreatePaymentMode = (data: { name: string }) => {
      try {
        const updatedData = { ...parsedData.value }
        const paymentModesTable = updatedData.tables.payment_mode
        const nextPaymentModeId =
          Math.max(...paymentModesTable.rows.map((row) => parseInt(row[0])), 0) + 1

        paymentModesTable.rows.push([nextPaymentModeId.toString(), data.name])

        const newContent = PCSVParser.generate(updatedData)
        editableContent.value = newContent
        emit('update:currentContent', newContent)
        onDetailPanelCancel()

        showMessage({
          title: $gettext('Payment mode added'),
          desc: $gettext('New payment mode has been added successfully')
        })
      } catch (error) {
        console.error('Error creating payment mode:', error)
      }
    }

    const onSaveBill = (data: any) => {
      try {
        const { selectedItem } = detailPanel.value
        if (selectedItem && selectedItem.id) {
          let updatedData = { ...parsedData.value }
          updatedData = PCSVParser.updateBill(updatedData, selectedItem.id, data.bill, data.splits)

          const newContent = PCSVParser.generate(updatedData)
          editableContent.value = newContent
          emit('update:currentContent', newContent)
          onDetailPanelCancel()

          showMessage({
            title: $gettext('Bill updated'),
            desc: $gettext('Your bill has been updated successfully')
          })
        }
      } catch (error) {
        console.error('Error saving bill:', error)
        showMessage({
          title: $gettext('Error saving bill'),
          desc: $gettext('There was an error saving your changes. Please try again.')
        })
      }
    }

    const onSaveMember = (data: any) => {
      try {
        const { selectedItem } = detailPanel.value
        if (selectedItem && selectedItem.id) {
          let updatedData = { ...parsedData.value }
          updatedData = PCSVParser.updateUser(updatedData, selectedItem.id, data)

          const newContent = PCSVParser.generate(updatedData)
          editableContent.value = newContent
          emit('update:currentContent', newContent)
          onDetailPanelCancel()

          showMessage({
            title: $gettext('Member updated'),
            desc: $gettext('Member has been updated successfully')
          })
        }
      } catch (error) {
        console.error('Error saving member:', error)
        showMessage({
          title: $gettext('Error saving member'),
          desc: $gettext('There was an error saving your changes. Please try again.')
        })
      }
    }

    const onSaveCategory = (data: any) => {
      try {
        const { selectedItem } = detailPanel.value
        if (selectedItem && selectedItem.id) {
          let updatedData = { ...parsedData.value }
          updatedData = PCSVParser.updateCategory(updatedData, selectedItem.id, data)

          const newContent = PCSVParser.generate(updatedData)
          editableContent.value = newContent
          emit('update:currentContent', newContent)
          onDetailPanelCancel()

          showMessage({
            title: $gettext('Category updated'),
            desc: $gettext('Category has been updated successfully')
          })
        }
      } catch (error) {
        console.error('Error saving category:', error)
        showMessage({
          title: $gettext('Error saving category'),
          desc: $gettext('There was an error saving your changes. Please try again.')
        })
      }
    }

    const onSavePaymentMode = (data: any) => {
      try {
        const { selectedItem } = detailPanel.value
        if (selectedItem && selectedItem.id) {
          let updatedData = { ...parsedData.value }
          updatedData = PCSVParser.updatePaymentMode(updatedData, selectedItem.id, data)

          const newContent = PCSVParser.generate(updatedData)
          editableContent.value = newContent
          emit('update:currentContent', newContent)
          onDetailPanelCancel()

          showMessage({
            title: $gettext('Payment mode updated'),
            desc: $gettext('Payment mode has been updated successfully')
          })
        }
      } catch (error) {
        console.error('Error saving payment mode:', error)
        showMessage({
          title: $gettext('Error saving payment mode'),
          desc: $gettext('There was an error saving your changes. Please try again.')
        })
      }
    }

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
      detailPanel,
      bills,
      users,
      paymentModes,
      categories,
      currentSidebarItems,
      currentSidebarConfig,
      navigationPanels,
      contentPanels,
      isNavigationCollapsed,
      onContentChange,
      onNavigate,
      toggleNavigation,
      onSidebarButtonClick,
      onSidebarItemClick,
      onDetailPanelCancel,
      onCreateBill,
      onCreateMember,
      onCreateCategory,
      onCreatePaymentMode,
      onSaveBill,
      onSaveMember,
      onSaveCategory,
      onSavePaymentMode
    }
  }
})
</script>

<style lang="scss">
.navigation-sidebar {
  min-width: 200px !important;
  width: 200px !important;
  border-right: 1px solid var(--oc-color-border);
  background-color: var(--oc-role-surface-container);
  transition:
    width 0.3s ease,
    min-width 0.3s ease;

  &.navigation-sidebar-collapsed {
    min-width: 56px !important;
    width: 56px !important;
  }

  .sidebar-panel {
    background-color: var(--oc-role-surface-container) !important;
  }
}

.navigation-sidebar {
  .header__close {
    display: none !important;
  }
}
.content-sidebar {
  min-width: 280px !important;
  width: 280px !important;

  .header__close {
    display: none !important;
  }
}

/* Global override for OpenCloud sidebar border */
#app-sidebar {
  border-left: none !important;
}

.main-content {
  flex: 1;
  min-width: 0; // Prevent flex item from growing beyond container
  background-color: var(--oc-role-background);
  height: 100vh;
}

.empty-detail-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding: var(--oc-space-large);
}

.empty-state-content {
  text-align: center;
  max-width: 300px;

  svg {
    color: var(--oc-role-on-surface-variant);
    margin-bottom: var(--oc-space-medium);
    opacity: 0.6;
  }

  h3 {
    font-size: var(--oc-font-size-large);
    font-weight: var(--oc-font-weight-semibold);
    color: var(--oc-role-on-surface);
    margin: 0 0 var(--oc-space-small) 0;
  }

  p {
    font-size: var(--oc-font-size-small);
    color: var(--oc-role-on-surface-variant);
    margin: 0;
    line-height: 1.4;
  }
}
</style>
