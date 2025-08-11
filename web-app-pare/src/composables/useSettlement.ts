// Vue composable for settlement functionality

import { computed, ref, type Ref } from 'vue'
import { BalanceCalculator } from '../utils/balanceCalculator'
import { SettlementAlgorithm } from '../utils/settlementAlgorithm'
import { PCSVParser, type PCSVData } from '../utils/pcsvParser'
import type {
  UserBalance,
  Settlement,
  SettlementResult,
  BalanceCalculationInput
} from '../types/settlement'

export function useSettlement(parsedData: Ref<PCSVData> | undefined) {
  const isCalculating = ref(false)
  const lastSettlement = ref<Settlement | null>(null)
  const error = ref<string | null>(null)

  /**
   * Calculate current user balances
   */
  const userBalances = computed<UserBalance[]>(() => {
    if (!parsedData?.value) return []

    try {
      const bills = PCSVParser.getBills(parsedData.value)
      const users = PCSVParser.getUsers(parsedData.value)

      // Get all bill splits
      const allBillSplits = bills.flatMap((bill) =>
        PCSVParser.getBillSplits(parsedData.value!, bill.id)
      )

      const input: BalanceCalculationInput = {
        bills,
        billSplits: allBillSplits,
        users
      }

      return BalanceCalculator.calculateUserBalances(input)
    } catch (err) {
      console.error('Error calculating user balances:', err)
      error.value = err instanceof Error ? err.message : 'Unknown error calculating balances'
      return []
    }
  })

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
  const createSettlementBills = (
    date?: string,
    time?: string
  ): Promise<SettlementResult | null> => {
    if (!parsedData?.value) {
      error.value = 'No data available'
      return null
    }

    isCalculating.value = true
    error.value = null

    try {
      // Generate settlement plan
      const settlement = generateSettlement()
      if (!settlement) {
        return null
      }

      // Convert to settlement bills
      const settlementBills = SettlementAlgorithm.createSettlementBills(settlement, date, time)

      if (settlementBills.length === 0) {
        return {
          settlement,
          settlementBills: []
        }
      }

      // Add each settlement bill to the data
      let updatedData = { ...parsedData.value }

      for (const settlementBill of settlementBills) {
        // Create bill data
        const bill = {
          description: settlementBill.description,
          total_amount: settlementBill.amount,
          who_paid_id: settlementBill.fromUserId,
          datetime: `${settlementBill.date} ${settlementBill.time}`,
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
        updatedData = PCSVParser.addBill(updatedData, bill, splits)
      }

      // Update the parsed data
      parsedData.value = updatedData

      return {
        settlement,
        settlementBills
      }
    } catch (err) {
      console.error('Error creating settlement bills:', err)
      error.value = err instanceof Error ? err.message : 'Unknown error creating settlement bills'
      return null
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
   * Clear any errors
   */
  const clearError = () => {
    error.value = null
  }

  return {
    // Computed values
    userBalances,
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
    clearError
  }
}
