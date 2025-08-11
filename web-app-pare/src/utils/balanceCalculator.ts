// Balance calculation utilities for settlement system

import { UserBalance, BalanceCalculationInput } from '../types/settlement'

export class BalanceCalculator {
  /**
   * Calculate net balances for all users
   * @param input - Bills, splits, and users data
   * @returns Array of user balances
   */
  static calculateUserBalances(input: BalanceCalculationInput): UserBalance[] {
    const { bills, billSplits, users } = input
    const balances = new Map<number, number>()

    // Initialize all users with 0 balance
    users.forEach((user) => {
      balances.set(user.id, 0)
    })

    // Process each bill
    bills.forEach((bill) => {
      const billId = bill.id
      const whoPaidId = bill.who_paid_id
      const totalAmount = bill.total_amount

      // Add the total amount to the person who paid (credit)
      const currentPayerBalance = balances.get(whoPaidId) || 0
      balances.set(whoPaidId, currentPayerBalance + totalAmount)

      // Subtract split amounts from each person who owes (debt)
      const billSplitsForThisBill = billSplits.filter((split) => split.bill_id === billId)

      billSplitsForThisBill.forEach((split) => {
        const currentUserBalance = balances.get(split.user_id) || 0
        balances.set(split.user_id, currentUserBalance - split.amount)
      })
    })

    // Convert to UserBalance array
    return users.map((user) => ({
      userId: user.id,
      name: user.name,
      balance: balances.get(user.id) || 0
    }))
  }

  /**
   * Get users who are owed money (creditors)
   * @param balances - Array of user balances
   * @returns Array of creditors sorted by amount owed (descending)
   */
  static getCreditors(balances: UserBalance[]): UserBalance[] {
    return balances.filter((balance) => balance.balance > 0).sort((a, b) => b.balance - a.balance)
  }

  /**
   * Get users who owe money (debtors)
   * @param balances - Array of user balances
   * @returns Array of debtors sorted by amount owed (ascending - most negative first)
   */
  static getDebtors(balances: UserBalance[]): UserBalance[] {
    return balances.filter((balance) => balance.balance < 0).sort((a, b) => a.balance - b.balance)
  }

  /**
   * Check if all balances are settled (all individual balances are zero)
   * @param balances - Array of user balances
   * @returns True if all individual balances are zero
   */
  static isSettled(balances: UserBalance[]): boolean {
    return balances.every((balance) => Math.abs(balance.balance) < 0.01)
  }

  /**
   * Get users with non-zero balances
   * @param balances - Array of user balances
   * @returns Array of users with non-zero balances
   */
  static getUnsettledBalances(balances: UserBalance[]): UserBalance[] {
    return balances.filter((balance) => Math.abs(balance.balance) > 0.01)
  }

  /**
   * Format balance amount for display
   * @param balance - Balance amount
   * @returns Formatted string with + or - prefix
   */
  static formatBalance(balance: number): string {
    if (Math.abs(balance) < 0.01) {
      return '0.00'
    }

    const formattedAmount = Math.abs(balance).toFixed(2)
    return balance > 0 ? `+${formattedAmount}` : `-${formattedAmount}`
  }
}
