<template>
  <div class="oc-pare-app oc-width-1-1 oc-height-1-1 oc-flex">
    <!-- Navigation Sidebar -->
    <SideBar
      :is-open="true"
      :loading="false"
      :available-panels="navigationPanels"
      :active-panel="'navigation'"
      :class="{ 'navigation-sidebar-collapsed': isNavigationCollapsed }"
      class="navigation-sidebar"
      @select-panel="onNavigate"
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
      :active-panel="currentSection"
      class="content-sidebar"
      @select-panel="onNavigate"
    >
      <template #rootHeader>
        <div class="oc-p-s">
          <oc-button
            v-if="currentSidebarConfig.showCreateNewButton"
            variation="primary"
            size="medium"
            appearance="filled"
            class="oc-width-1-1"
            @click="onSidebarButtonClick"
          >
            <oc-icon :name="currentSidebarConfig.buttonIcon || 'add'" size="small" />
            {{ currentSidebarConfig.buttonText }}
          </oc-button>

          <!-- Settlement Action for Members Section -->
          <SettlementAction
            v-if="currentSection === 'member'"
            class="oc-mt-s"
            @view-transactions="onViewTransactions"
          />
        </div>
      </template>
    </SideBar>

    <!-- Main Content Area -->
    <div class="main-content oc-flex-1 oc-flex oc-width-1-1">
      <!-- Bill Detail Panel -->
      <BillDetailPanel
        v-if="detailPanel.type === 'bill'"
        :key="`bill-${detailPanel.mode}-${detailPanel.selectedItem?.id || 'new'}`"
        :bill="detailPanel.selectedItem"
        :mode="detailPanel.mode"
        :users="users"
        :payment-modes="paymentModes"
        :categories="categories"
        @cancel="onDetailPanelCancel"
        @create-bill="onCreateBill"
        @save-bill="onSaveBill"
      />

      <!-- Member Detail Panel -->
      <UserDetailPanel
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
        v-else-if="detailPanel.type === 'payment_mode'"
        :key="`payment_mode-${detailPanel.mode}-${detailPanel.selectedItem?.id || 'new'}`"
        :payment-mode="detailPanel.selectedItem"
        :mode="detailPanel.mode"
        @cancel="onDetailPanelCancel"
        @create-payment-mode="onCreatePaymentMode"
        @save-payment-mode="onSavePaymentMode"
      />

      <!-- Settlement Detail Panel -->
      <SettlementDetailPanel
        v-else-if="detailPanel.type === 'settlement'"
        :settlement="detailPanel.selectedItem"
        @cancel="onDetailPanelCancel"
        @settlement-created="onSettlementCreated"
      />

      <!-- Empty state when no panel is selected -->
      <div v-else class="empty-detail-state oc-flex oc-flex-center oc-flex-middle oc-p-l">
        <div class="empty-state-content">
          <oc-icon name="file-text" size="large" />
          <h2>Select an item to view details</h2>
          <p>Choose an item from the list or create a new one to get started.</p>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <ConfirmationDialog
      :is-visible="confirmDialog.isVisible"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :confirm-text="confirmDialog.confirmText"
      :cancel-text="confirmDialog.cancelText"
      @confirm="onConfirmDelete"
      @cancel="onCancelDelete"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, onMounted, provide, Ref } from 'vue'
import { useMessages, useThemeStore, SideBar } from '@opencloud-eu/web-pkg'
import { useGettext } from 'vue3-gettext'
import { PSONParser, PSONData } from './utils/psonParser'
import { SidebarItem, SidebarConfig } from './types/sidebar'
import { useUser } from './composables/useUser'
import NavigationPanel from './ui/components/panels/NavigationPanel.vue'
import ContentPanel from './ui/components/panels/ContentPanel.vue'
import UsersContentPanel from './ui/components/panels/UsersContentPanel.vue'
import {
  BillDetailPanel,
  UserDetailPanel,
  CategoryDetailPanel,
  PaymentModeDetailPanel,
  SettlementDetailPanel
} from './ui/components/panels/detail'
import SettlementAction from './ui/components/SettlementAction.vue'
import { ConfirmationDialog } from './ui/components/dialogs'

export default defineComponent({
  name: 'App',
  components: {
    SideBar,
    BillDetailPanel,
    UserDetailPanel,
    CategoryDetailPanel,
    PaymentModeDetailPanel,
    SettlementDetailPanel,
    SettlementAction,
    ConfirmationDialog
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
    console.debug('Initial content:')
    console.debug(props.currentContent)
    const lastSaved = ref<string>('')
    const currentSection = ref<string>('bill')
    const isNavigationCollapsed = ref(true)

    // Detail Panel State
    const detailPanel = ref<{
      type: 'bill' | 'member' | 'category' | 'payment_mode' | 'settlement' | null
      mode: 'create' | 'edit'
      selectedItem: any
    }>({
      type: null,
      mode: 'create',
      selectedItem: null
    })

    // Confirmation dialog state
    const confirmDialog = ref({
      isVisible: false,
      title: '',
      message: '',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      pendingItem: null as SidebarItem | null
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

    // Parse PSON data
    const parsedData = ref(PSONParser.parse(props.currentContent) as PSONData)

    // Provide parsedData to child components
    provide('parsedData', parsedData as Ref<PSONData>)

    const bills = computed(() => {
      return PSONParser.getBills(parsedData.value).sort((a, b) => b.timestamp - a.timestamp)
    })

    const users = computed(() => {
      return PSONParser.getUsers(parsedData.value)
    })

    const paymentModes = computed(() => {
      return PSONParser.getPaymentModes(parsedData.value)
    })

    const categories = computed(() => {
      return PSONParser.getCategories(parsedData.value)
    })

    // Sidebar configuration map
    const sidebarConfigMap = computed(
      (): Record<string, { items: SidebarItem[]; config: SidebarConfig }> => ({
        bill: {
          items: bills.value as SidebarItem[],
          config: {
            title: $gettext('Recent Bills'),
            buttonText: $gettext('New Bill'),
            buttonIcon: 'add',
            emptyMessage: $gettext('No bills yet. Create your first bill!'),
            showCreateNewButton: true,
            titleField: 'description',
            subtitleField: 'total_amount',
            metaField: 'timestamp',
            descriptionField: 'comment'
          }
        },
        member: {
          items: users.value as SidebarItem[],
          config: {
            title: $gettext('Members'),
            buttonText: $gettext('Add Member'),
            buttonIcon: 'user-add',
            emptyMessage: $gettext('No members yet. Add your first member!'),
            showCreateNewButton: true,
            titleField: 'name',
            subtitleField: 'opencloud_id',
            metaField: '',
            descriptionField: ''
          }
        },
        category: {
          items: categories.value as SidebarItem[],
          config: {
            title: $gettext('Categories'),
            buttonText: $gettext('Add Category'),
            buttonIcon: 'price-tag-3',
            emptyMessage: $gettext('No categories yet. Add your first one!'),
            showCreateNewButton: true,
            titleField: 'name',
            subtitleField: '',
            metaField: '',
            descriptionField: ''
          }
        },
        payment_mode: {
          items: paymentModes.value as SidebarItem[],
          config: {
            title: $gettext('Payment Modes'),
            buttonText: $gettext('Add Payment Mode'),
            buttonIcon: 'money-euro-circle',
            emptyMessage: $gettext('No payment modes yet. Add your first one!'),
            showCreateNewButton: true,
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
            showCreateNewButton: false,
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
          showCreateNewButton: false,
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
          key: 'bill',
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
          key: 'member',
          label: $gettext('Members'),
          icon: 'user',
          count: users.value.length
        },
        {
          key: 'category',
          label: $gettext('Categories'),
          icon: 'price-tag',
          count: categories.value.length
        },
        {
          key: 'payment_mode',
          label: $gettext('Payment Modes'),
          icon: 'money-euro-circle',
          count: paymentModes.value.length
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
          name: 'bill',
          title: () => $gettext('Bills'),
          isRoot: () => true,
          isVisible: () => currentSection.value === 'bill',
          component: ContentPanel,
          componentAttrs: () => ({
            darkTheme: darkTheme.value,
            items: bills.value,
            config: sidebarConfigMap.value.bill.config,
            onItemClick: onSidebarItemClick,
            onItemDelete: onSidebarItemDelete,
            selectedItemId: detailPanel.value.selectedItem?.id || null
          })
        },
        {
          name: 'member',
          title: () => $gettext('Members'),
          isRoot: () => true,
          isVisible: () => currentSection.value === 'member',
          component: UsersContentPanel,
          componentAttrs: () => ({
            darkTheme: darkTheme.value,
            items: users.value,
            config: sidebarConfigMap.value.member.config,
            onItemClick: onSidebarItemClick,
            onItemDelete: onSidebarItemDelete,
            selectedItemId: detailPanel.value.selectedItem?.id || null,
            onSettlementCreated
          })
        },
        {
          name: 'category',
          title: () => $gettext('Categories'),
          isRoot: () => true,
          isVisible: () => currentSection.value === 'category',
          component: ContentPanel,
          componentAttrs: () => ({
            darkTheme: darkTheme.value,
            items: categories.value,
            config: sidebarConfigMap.value.category.config,
            onItemClick: onSidebarItemClick,
            onItemDelete: onSidebarItemDelete,
            selectedItemId: detailPanel.value.selectedItem?.id || null
          })
        },
        {
          name: 'payment_mode',
          title: () => $gettext('Payment Modes'),
          isRoot: () => true,
          isVisible: () => currentSection.value === 'payment_mode',
          component: ContentPanel,
          componentAttrs: () => ({
            darkTheme: darkTheme.value,
            items: paymentModes.value,
            config: sidebarConfigMap.value.payment_mode.config,
            onItemClick: onSidebarItemClick,
            onItemDelete: onSidebarItemDelete,
            selectedItemId: detailPanel.value.selectedItem?.id || null
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
            onItemClick: onSidebarItemClick,
            onItemDelete: onSidebarItemDelete,
            selectedItemId: detailPanel.value.selectedItem?.id || null
          })
        }
      ]

      return allPanels
    })

    const onNavigate = (section: string) => {
      currentSection.value = section
      // Reset detail panel and selected item when switching sections
      detailPanel.value = {
        type: null,
        mode: 'create',
        selectedItem: null
      }
    }

    const toggleNavigation = () => {
      isNavigationCollapsed.value = !isNavigationCollapsed.value
    }

    const onSidebarButtonClick = () => {
      detailPanel.value = {
        type: currentSection.value as 'bill' | 'member' | 'category' | 'payment_mode',
        mode: 'create',
        selectedItem: null
      }
    }

    const onSidebarItemClick = (item: SidebarItem) => {
      detailPanel.value = {
        type: currentSection.value as 'bill' | 'member' | 'category' | 'payment_mode',
        mode: 'edit',
        selectedItem: item
      }
    }

    const onSidebarItemDelete = (item: SidebarItem) => {
      // Store the item to be deleted and show confirmation dialog
      confirmDialog.value.pendingItem = item

      // Set dialog content based on item type
      let itemTypeName = ''
      if (currentSection.value === 'bill') {
        itemTypeName = $gettext('bill')
      } else if (currentSection.value === 'member') {
        itemTypeName = $gettext('member')
      } else if (currentSection.value === 'category') {
        itemTypeName = $gettext('category')
      } else if (currentSection.value === 'payment_mode') {
        itemTypeName = $gettext('payment mode')
      } else {
        itemTypeName = $gettext('item')
      }

      confirmDialog.value.title = $gettext('Delete %{itemType}', { itemType: itemTypeName })
      confirmDialog.value.message = $gettext(
        'Are you sure you want to delete this %{itemType}? This action cannot be undone.',
        { itemType: itemTypeName }
      )
      confirmDialog.value.confirmText = $gettext('Delete')
      confirmDialog.value.cancelText = $gettext('Cancel')
      confirmDialog.value.isVisible = true
    }

    const onConfirmDelete = () => {
      const item = confirmDialog.value.pendingItem
      if (!item) return

      try {
        // Close detail panel first if the deleted item was selected
        if (detailPanel.value.selectedItem?.id === item.id) {
          onDetailPanelCancel()
        }

        let updatedData = { ...parsedData.value }

        if (currentSection.value === 'bill') {
          updatedData = PSONParser.deleteBill(updatedData, item.id)
          showMessage({
            title: $gettext('Bill deleted'),
            desc: $gettext('The bill has been deleted successfully')
          })
        } else if (currentSection.value === 'member') {
          updatedData = PSONParser.deleteUser(updatedData, item.id)
          showMessage({
            title: $gettext('Member deleted'),
            desc: $gettext('The member has been deleted successfully')
          })
        } else if (currentSection.value === 'category') {
          updatedData = PSONParser.deleteCategory(updatedData, item.id)
          showMessage({
            title: $gettext('Category deleted'),
            desc: $gettext('The category has been deleted successfully')
          })
        } else if (currentSection.value === 'payment_mode') {
          updatedData = PSONParser.deletePaymentMode(updatedData, item.id)
          showMessage({
            title: $gettext('Payment mode deleted'),
            desc: $gettext('The payment mode has been deleted successfully')
          })
        }

        PSONParser.updateMetadata(updatedData)
        emit('update:currentContent', updatedData)
      } catch (error) {
        console.error('Error deleting item:', error)
        showMessage({
          title: $gettext('Error'),
          desc: $gettext('Failed to delete the item')
        })
      } finally {
        // Always close the dialog
        confirmDialog.value.isVisible = false
        confirmDialog.value.pendingItem = null
      }
    }

    const onCancelDelete = () => {
      confirmDialog.value.isVisible = false
      confirmDialog.value.pendingItem = null
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
        const result = PSONParser.addBill(updatedData, data.bill, data.splits)
        updatedData = result.data
        PSONParser.updateMetadata(updatedData)
        emit('update:currentContent', updatedData)
        onDetailPanelCancel()

        showMessage({
          title: $gettext('Bill created'),
          desc: $gettext('Your bill has been created successfully')
        })

        console.log(`App: Bill created with ID ${result.billId}`)
      } catch (error) {
        console.error('Error creating bill:', error)
      }
    }

    const onCreateMember = (data: { name: string; opencloud_id: string }) => {
      try {
        const updatedData = { ...parsedData.value }
        // Find next available user ID
        const nextUserId = Math.max(...Object.keys(updatedData.data.users).map(Number), 0) + 1

        updatedData.data.users[nextUserId.toString()] = {
          name: data.name,
          opencloud_id: data.opencloud_id || null,
          balance: 0
        }

        PSONParser.updateMetadata(updatedData)
        emit('update:currentContent', updatedData)
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
        // Find next available category ID
        const nextCategoryId =
          Math.max(...Object.keys(updatedData.data.categories).map(Number), 0) + 1

        updatedData.data.categories[nextCategoryId.toString()] = { name: data.name }

        PSONParser.updateMetadata(updatedData)
        emit('update:currentContent', updatedData)
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
        // Find next available payment mode ID
        const nextPaymentModeId =
          Math.max(...Object.keys(updatedData.data.payment_modes).map(Number), 0) + 1

        updatedData.data.payment_modes[nextPaymentModeId.toString()] = { name: data.name }

        PSONParser.updateMetadata(updatedData)
        emit('update:currentContent', updatedData)
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
          const result = PSONParser.updateBill(updatedData, selectedItem.id, data.bill, data.splits)
          updatedData = result.data

          PSONParser.updateMetadata(updatedData)
          emit('update:currentContent', updatedData)
          onDetailPanelCancel()

          showMessage({
            title: $gettext('Bill updated'),
            desc: $gettext('Your bill has been updated successfully')
          })

          console.log(`App: Bill updated with ID ${result.billId}`)
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
          updatedData = PSONParser.updateUser(updatedData, selectedItem.id, data)

          PSONParser.updateMetadata(updatedData)
          emit('update:currentContent', updatedData)
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
          updatedData = PSONParser.updateCategory(updatedData, selectedItem.id, data)

          PSONParser.updateMetadata(updatedData)
          emit('update:currentContent', updatedData)
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
          updatedData = PSONParser.updatePaymentMode(updatedData, selectedItem.id, data)

          PSONParser.updateMetadata(updatedData)
          emit('update:currentContent', updatedData)
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

    const onSettlementCreated = (settlementResult: any) => {
      try {
        // The settlement bills have already been added to parsedData by the composable
        // Just need to update the content and show a success message
        PSONParser.updateMetadata(parsedData.value)
        emit('update:currentContent', parsedData.value)

        // Handle individual transaction settlement - update the settlement detail panel
        if (
          settlementResult.settledTransaction &&
          detailPanel.value.type === 'settlement' &&
          detailPanel.value.selectedItem
        ) {
          const settledTransaction = settlementResult.settledTransaction
          const currentSettlement = detailPanel.value.selectedItem

          // Remove the settled transaction from the current settlement
          if (currentSettlement.transactions) {
            currentSettlement.transactions = currentSettlement.transactions.filter(
              (transaction: any) =>
                !(
                  transaction.fromUserId === settledTransaction.fromUserId &&
                  transaction.toUserId === settledTransaction.toUserId &&
                  transaction.amount === settledTransaction.amount
                )
            )

            // Update total transactions count
            currentSettlement.totalTransactions = currentSettlement.transactions.length

            // Update the detail panel with the modified settlement
            detailPanel.value.selectedItem = { ...currentSettlement }
          }

          showMessage({
            title: $gettext('Transaction Settled'),
            desc: $gettext('Settlement bill created successfully')
          })

          if (currentSettlement.transactions.length === 0) {
            // All transactions settled, close the detail panel
            onDetailPanelCancel()
          }
        } else {
          // Handle bulk settlement (Settle All)
          showMessage({
            title: $gettext('Settlement Complete'),
            desc: $gettext(
              `${settlementResult.settlementBills?.length || 1} settlement bills created successfully`
            )
          })

          // Close the detail panel for bulk settlements
          onDetailPanelCancel()
        }
      } catch (error) {
        console.error('Error updating content after settlement:', error)
        showMessage({
          title: $gettext('Settlement Error'),
          desc: $gettext('Failed to update content after creating settlement bills'),
          status: 'danger'
        })
      }
    }

    const onViewTransactions = (settlement: any) => {
      detailPanel.value = {
        type: 'settlement',
        mode: 'edit',
        selectedItem: settlement
      }
    }

    return {
      textEditor,
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
      onNavigate,
      toggleNavigation,
      onSidebarButtonClick,
      onSidebarItemClick,
      onSidebarItemDelete,
      onDetailPanelCancel,
      confirmDialog,
      onConfirmDelete,
      onCancelDelete,
      onCreateBill,
      onCreateMember,
      onCreateCategory,
      onCreatePaymentMode,
      onSaveBill,
      onSaveMember,
      onSaveCategory,
      onSavePaymentMode,
      onSettlementCreated,
      onViewTransactions
    }
  }
})
</script>

<style lang="scss">
.navigation-sidebar {
  min-width: 200px !important;
  width: 200px !important;
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
  min-width: 0; // Prevent flex item from growing beyond container
  background-color: var(--oc-role-background);
  height: 100vh;
}

.empty-detail-state {
  height: 100%;
  width: 100%;
}

.empty-state-content {
  text-align: center;
}
</style>
