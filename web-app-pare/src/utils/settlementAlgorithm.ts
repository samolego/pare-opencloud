// Settlement algorithm for debt simplification

import { Settlement, SettlementTransaction, SettlementBillData } from '../types/settlement'
import { UserBalance } from '../types/user'
import { BalanceCalculator } from './balanceCalculator'

export class SettlementAlgorithm {
  /**
   * Create an optimal settlement plan using greedy algorithm
   * @param balances - Array of user balances
   * @returns Settlement with minimal number of transactions
   */
  static createSettlement(balances: UserBalance[]): Settlement {
    // Clone balances to avoid mutating original data
    const workingBalances = balances.map((balance) => ({ ...balance }))
    const transactions: SettlementTransaction[] = []

    // Get creditors and debtors
    const creditors = BalanceCalculator.getCreditors(workingBalances)
    const debtors = BalanceCalculator.getDebtors(workingBalances)

    // Create copies for iteration
    const workingCreditors = creditors.map((c) => ({ ...c }))
    const workingDebtors = debtors.map((d) => ({ ...d }))

    // Greedy algorithm: match largest creditor with largest debtor
    let creditorIndex = 0
    let debtorIndex = 0

    while (creditorIndex < workingCreditors.length && debtorIndex < workingDebtors.length) {
      const creditor = workingCreditors[creditorIndex]
      const debtor = workingDebtors[debtorIndex]

      if (Math.abs(creditor.balance) < 0.01) {
        creditorIndex++
        continue
      }

      if (Math.abs(debtor.balance) < 0.01) {
        debtorIndex++
        continue
      }

      // Calculate settlement amount (minimum of what creditor is owed and what debtor owes)
      const settlementAmount = Math.min(creditor.balance, Math.abs(debtor.balance))

      // Create transaction
      transactions.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: settlementAmount,
        fromUserName: debtor.name,
        toUserName: creditor.name
      })

      // Update balances
      creditor.balance -= settlementAmount
      debtor.balance += settlementAmount

      // Move to next creditor or debtor if current one is settled
      if (Math.abs(creditor.balance) < 0.01) {
        creditorIndex++
      }
      if (Math.abs(debtor.balance) < 0.01) {
        debtorIndex++
      }
    }

    return {
      transactions,
      totalTransactions: transactions.length,
      balancesBeforeSettlement: balances
    }
  }

  /**
   * Convert settlement transactions to settlement bill data
   * @param settlement - Settlement with transactions
   * @param date - Date for the settlement bills (optional, defaults to today)
   * @param time - Time for the settlement bills (optional, defaults to now)
   * @returns Array of settlement bill data
   */
  static createSettlementBills(
    settlement: Settlement,
    date?: string,
    time?: string
  ): SettlementBillData[] {
    const now = new Date()
    const settlementDate = date || now.toISOString().split('T')[0]
    const settlementTime = time || now.toTimeString().split(' ')[0].slice(0, 5)

    return settlement.transactions.map((transaction) => ({
      description: `Settlement: ${transaction.fromUserName} → ${transaction.toUserName}`,
      fromUserId: transaction.fromUserId,
      toUserId: transaction.toUserId,
      amount: transaction.amount,
      date: settlementDate,
      time: settlementTime
    }))
  }

  /**
   * Validate that a settlement is mathematically correct
   * @param settlement - Settlement to validate
   * @param originalBalances - Original balances before settlement
   * @returns True if settlement is valid
   */
  static validateSettlement(settlement: Settlement, originalBalances: UserBalance[]): boolean {
    // Calculate net effect of all transactions
    const transactionEffects = new Map<number, number>()

    // Initialize with original balances
    originalBalances.forEach((balance) => {
      transactionEffects.set(balance.userId, balance.balance)
    })

    // Apply transaction effects
    settlement.transactions.forEach((transaction) => {
      // Debtor pays (reduces their debt)
      const fromCurrentBalance = transactionEffects.get(transaction.fromUserId) || 0
      transactionEffects.set(transaction.fromUserId, fromCurrentBalance + transaction.amount)

      // Creditor receives (reduces what they're owed)
      const toCurrentBalance = transactionEffects.get(transaction.toUserId) || 0
      transactionEffects.set(transaction.toUserId, toCurrentBalance - transaction.amount)
    })

    // Check that all balances are now zero (or very close)
    for (const [userId, finalBalance] of transactionEffects) {
      if (Math.abs(finalBalance) > 0.01) {
        console.warn(
          `Settlement validation failed: BillUser ${userId} has remaining balance ${finalBalance}`
        )
        return false
      }
    }

    return true
  }

  /**
   * Calculate total amount that will be transferred in settlement
   * @param settlement - Settlement to analyze
   * @returns Total amount of money that will change hands
   */
  static getTotalSettlementAmount(settlement: Settlement): number {
    return settlement.transactions.reduce((total, transaction) => total + transaction.amount, 0)
  }

  /**
   * Get settlement summary for display
   * @param settlement - Settlement to summarize
   * @returns Human-readable summary
   */
  static getSettlementSummary(settlement: Settlement): string {
    if (settlement.transactions.length === 0) {
      return 'No settlements needed - all balances are zero'
    }

    const totalAmount = this.getTotalSettlementAmount(settlement)
    const transactionCount = settlement.transactions.length

    return `${transactionCount} transaction${transactionCount > 1 ? 's' : ''} needed, total amount: ${totalAmount.toFixed(2)}`
  }
}
