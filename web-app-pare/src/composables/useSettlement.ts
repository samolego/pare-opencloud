// Vue composable for settlement functionality

import { computed, ref, watch, type Ref } from 'vue'
import { BalanceCalculator } from '../utils/balanceCalculator'
import { SettlementAlgorithm } from '../utils/settlementAlgorithm'
import { PCSVParser, type PCSVData } from '../utils/pcsvParser'
import type { UserBalance, Settlement, SettlementResult } from '../types/settlement'

export function useSettlement(parsedData: Ref<PCSVData> | undefined) {
  const isCalculating = ref(false)
  const lastSettlement = ref<Settlement | null>(null)
  const error = ref<string | null>(null)
  const userBalances = ref<UserBalance[]>([])
  const lastCalculationHash = ref<string>('')

  /**
   * Calculate current user balances asynchronously
   */
  const calculateBalances = async () => {
    if (!parsedData?.value) {
      console.log('useSettlement: No parsed data available')
      userBalances.value = []
      return
    }

    // Create a hash to avoid recalculating if data hasn't changed
    const dataHash = JSON.stringify({
      billsLength: parsedData.value.tables.bills?.rows.length || 0,
      splitsLength: parsedData.value.tables.bill_splits?.rows.length || 0,
      usersLength: parsedData.value.tables.users?.rows.length || 0
    })

    if (dataHash === lastCalculationHash.value && userBalances.value.length > 0) {
      console.log('useSettlement: Data unchanged, skipping calculation')
      return
    }

    console.log('useSettlement: Starting balance calculation')
    isCalculating.value = true
    error.value = null

    try {
      const balances = await BalanceCalculator.calculateUserBalancesAsync(parsedData.value)
      userBalances.value = balances
      lastCalculationHash.value = dataHash
      console.log('useSettlement: Balance calculation completed', { count: balances.length })
    } catch (err) {
      console.error('useSettlement: Error calculating user balances:', err)
      error.value = err instanceof Error ? err.message : 'Unknown error calculating balances'
      userBalances.value = []
    } finally {
      isCalculating.value = false
    }
  }

  // Watch for data changes and recalculate
  watch(
    parsedData,
    () => {
      if (parsedData?.value) {
        calculateBalances()
      }
    },
    { immediate: true, deep: false }
  )

  /**
   * Get users who are owed money (creditors)
   */
  const creditors = computed<UserBalance[]>(() => {
    return BalanceCalculator.getCreditors(userBalances.value)
  })

  /**
   * Get users who owe money (debtors)
   */
  const debtors = computed<UserBalance[]>(() => {
    return BalanceCalculator.getDebtors(userBalances.value)
  })

  /**
   * Check if settlement is needed
   */
  const needsSettlement = computed<boolean>(() => {
    return !BalanceCalculator.isSettled(userBalances.value)
  })

  /**
   * Get unsettled balances only
   */
  const unsettledBalances = computed<UserBalance[]>(() => {
    return BalanceCalculator.getUnsettledBalances(userBalances.value)
  })

  /**
   * Get balance for a specific user
   */
  const getUserBalance = (userId: number): UserBalance | null => {
    return userBalances.value.find((balance) => balance.userId === userId) || null
  }

  /**
   * Format balance for display
   */
  const formatBalance = (balance: number): string => {
    return BalanceCalculator.formatBalance(balance)
  }

  /**
   * Generate optimal settlement plan
   */
  const generateSettlement = (): Settlement | null => {
    try {
      if (!needsSettlement.value) {
        return {
          transactions: [],
          totalTransactions: 0,
          balancesBeforeSettlement: userBalances.value
        }
      }

      const settlement = SettlementAlgorithm.createSettlement(userBalances.value)

      // Validate the settlement
      if (!SettlementAlgorithm.validateSettlement(settlement, userBalances.value)) {
        error.value = 'Generated settlement is invalid'
        return null
      }

      lastSettlement.value = settlement
      return settlement
    } catch (err) {
      console.error('Error generating settlement:', err)
      error.value = err instanceof Error ? err.message : 'Unknown error generating settlement'
      return null
    }
  }

  /**
   * Create settlement bills and add them to the data
   */
  const createSettlementBills = async (
    date?: string,
    time?: string
  ): Promise<SettlementResult | null> => {
    if (!parsedData?.value) {
      error.value = 'No data available'
      return Promise.resolve(null)
    }

    isCalculating.value = true
    error.value = null

    try {
      // Generate settlement plan
      const settlement = generateSettlement()
      if (!settlement) {
        return Promise.resolve(null)
      }

      // Convert to settlement bills
      const settlementBills = SettlementAlgorithm.createSettlementBills(settlement, date, time)

      if (settlementBills.length === 0) {
        return Promise.resolve({
          settlement,
          settlementBills: []
        })
      }

      // Add each settlement bill to the data
      let updatedData = { ...parsedData.value }

      for (const settlementBill of settlementBills) {
        // Create bill data
        const bill = {
          description: settlementBill.description,
          total_amount: settlementBill.amount,
          who_paid_id: settlementBill.fromUserId,
          timestamp: Date.now(),
          repeat: '',
          payment_mode_id: null,
          category_id: null,
          comment: 'Auto-generated settlement bill',
          file_link: ''
        }

        // Create split data (only one split - to the person being paid)
        const splits = [
          {
            user_id: settlementBill.toUserId,
            amount: settlementBill.amount
          }
        ]

        // Add to data
        const result = PCSVParser.addBill(updatedData, bill, splits)
        updatedData = result.data
      }

      // Update the parsed data
      parsedData.value = updatedData

      return Promise.resolve({
        settlement,
        settlementBills
      })
    } catch (err) {
      console.error('Error creating settlement bills:', err)
      error.value = err instanceof Error ? err.message : 'Unknown error creating settlement bills'
      return Promise.resolve(null)
    } finally {
      isCalculating.value = false
    }
  }

  /**
   * Get settlement summary for display
   */
  const getSettlementSummary = (settlement: Settlement): string => {
    return SettlementAlgorithm.getSettlementSummary(settlement)
  }

  /**
   * Get total settlement amount
   */
  const getTotalSettlementAmount = (settlement: Settlement): number => {
    return SettlementAlgorithm.getTotalSettlementAmount(settlement)
  }

  /**
   * Recalculate balances for a specific bill
   */
  const recalculateForBill = async (billId: number) => {
    if (!parsedData?.value) return

    console.log(`useSettlement: Recalculating balances for bill ${billId}`)
    isCalculating.value = true
    error.value = null

    try {
      await BalanceCalculator.recalculateForBill(parsedData.value, billId)
      // Force recalculation by clearing the hash
      lastCalculationHash.value = ''
      await calculateBalances()
    } catch (err) {
      console.error('useSettlement: Error recalculating balances for bill:', err)
      error.value = err instanceof Error ? err.message : 'Unknown error recalculating balances'
    } finally {
      isCalculating.value = false
    }
  }

  /**
   * Clear any errors
   */
  const clearError = () => {
    error.value = null
  }

  return {
    // Computed values
    userBalances: computed(() => userBalances.value),
    creditors,
    debtors,
    needsSettlement,
    unsettledBalances,

    // Reactive refs
    isCalculating: computed(() => isCalculating.value),
    lastSettlement: computed(() => lastSettlement.value),
    error: computed(() => error.value),

    // Methods
    getUserBalance,
    formatBalance,
    generateSettlement,
    createSettlementBills,
    getSettlementSummary,
    getTotalSettlementAmount,
    recalculateForBill,
    clearError
  }
}
