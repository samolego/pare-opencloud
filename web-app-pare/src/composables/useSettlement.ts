// Vue composable for settlement functionality

import { computed, ref, watch, type Ref } from 'vue'
import { BalanceCalculator } from '../utils/balanceCalculator'
import { SettlementAlgorithm } from '../utils/settlementAlgorithm'
import { PSONParser, type PSONData } from '../utils/psonParser'
import type { UserBalance, Settlement, SettlementResult } from '../types/settlement'

export function useSettlement(parsedData: Ref<PSONData> | undefined) {
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
      billsLength: Object.keys(parsedData.value.data.bills).length || 0,
      splitsLength: Object.values(parsedData.value.data.bills).reduce((acc, bill) => acc + Object.keys(bill.splits).length, 0) || 0,
      usersLength: Object.keys(parsedData.value.data.users).length || 0
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
   * Generic method to create settlement bills from transactions
   */
  const createBillsFromTransactions = (
    transactions: any[],
    date?: string,
    time?: string
  ): Promise<SettlementResult | null> => {
    if (!parsedData?.value || transactions.length === 0) {
      return Promise.resolve(null)
    }

    isCalculating.value = true
    error.value = null

    try {
      // Convert transactions to settlement bills
      const now = new Date()
      const settlementDate = date || now.toISOString().split('T')[0]
      const settlementTime = time || now.toTimeString().split(' ')[0].slice(0, 5)

      const settlementBills = transactions.map((transaction) => ({
        description: `Settlement: ${transaction.fromUserName} → ${transaction.toUserName}`,
        fromUserId: transaction.fromUserId,
        toUserId: transaction.toUserId,
        amount: transaction.amount,
        date: settlementDate,
        time: settlementTime
      }))

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
        const result = PSONParser.addBill(updatedData, bill, splits)
        updatedData = result.data
      }

      // Update the parsed data
      parsedData.value = updatedData

      // Create a settlement object for the result
      const settlement = {
        transactions,
        totalTransactions: transactions.length,
        balancesBeforeSettlement: userBalances.value
      }

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
   * Create settlement bills for all transactions
   */
  const createSettlementBills = async (
    date?: string,
    time?: string
  ): Promise<SettlementResult | null> => {
    if (!parsedData?.value) {
      error.value = 'No data available'
      return Promise.resolve(null)
    }

    try {
      // Generate settlement plan
      const settlement = generateSettlement()
      if (!settlement) {
        return Promise.resolve(null)
      }

      return await createBillsFromTransactions(settlement.transactions, date, time)
    } catch (err) {
      console.error('Error creating settlement bills:', err)
      error.value = err instanceof Error ? err.message : 'Unknown error creating settlement bills'
      return Promise.resolve(null)
    }
  }

  /**
   * Create settlement bill for a single transaction
   */
  const createIndividualSettlementBill = async (
    transaction: any,
    date?: string,
    time?: string
  ): Promise<SettlementResult | null> => {
    if (!parsedData?.value) {
      error.value = 'No data available'
      return Promise.resolve(null)
    }

    try {
      return await createBillsFromTransactions([transaction], date, time)
    } catch (err) {
      console.error('Error creating individual settlement bill:', err)
      error.value =
        err instanceof Error ? err.message : 'Unknown error creating individual settlement bill'
      return Promise.resolve(null)
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
    createIndividualSettlementBill,
    getSettlementSummary,
    getTotalSettlementAmount,
    recalculateForBill,
    clearError
  }
}
