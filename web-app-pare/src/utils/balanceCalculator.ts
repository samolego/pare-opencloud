// Balance calculation utilities for settlement system

import { UserBalance, BalanceCalculationInput } from '../types/settlement'
import { PSONParser, type PSONData } from './psonParser'

export class BalanceCalculator {
  /**
   * Calculate net balances for all users
   * @param input - Bills, splits, and users data
   * @returns Array of user balances
   */
  static calculateUserBalances(input: BalanceCalculationInput): UserBalance[] {
    console.log('BalanceCalculator: Starting balance calculation', {
      billsCount: input.bills.length,
      splitsCount: input.billSplits.length,
      usersCount: input.users.length
    })
    const { bills, billSplits, users } = input
    const balances = new Map<number, number>()

    // Initialize all users with 0 balance
    users.forEach((user) => {
      balances.set(user.id, 0)
    })

    // Create a map of bill splits by bill_id for faster lookup
    const splitsByBillId = new Map<number, typeof billSplits>()
    billSplits.forEach((split) => {
      if (!splitsByBillId.has(split.bill_id)) {
        splitsByBillId.set(split.bill_id, [])
      }
      splitsByBillId.get(split.bill_id)!.push(split)
    })

    console.log('BalanceCalculator: Processing bills and splits')

    // Process each bill
    bills.forEach((bill) => {
      const billId = bill.id
      const whoPaidId = bill.who_paid_id
      const totalAmount = bill.total_amount

      // Add the total amount to the person who paid (credit)
      const currentPayerBalance = balances.get(whoPaidId) || 0
      balances.set(whoPaidId, currentPayerBalance + totalAmount)

      // Subtract split amounts from each person who owes (debt)
      const billSplitsForThisBill = splitsByBillId.get(billId) || []

      billSplitsForThisBill.forEach((split) => {
        const currentUserBalance = balances.get(split.user_id) || 0
        balances.set(split.user_id, currentUserBalance - split.amount)
      })
    })

    // Convert to UserBalance array
    const result = users.map((user) => ({
      userId: user.id,
      name: user.name,
      balance: balances.get(user.id) || 0
    }))

    console.log('BalanceCalculator: Balance calculation completed', {
      resultCount: result.length
    })

    return result
  }

  /**
   * Async balance calculation with caching support
   * @param data - PSON data
   * @returns Promise<UserBalance[]>
   */
  static async calculateUserBalancesAsync(data: PSONData): Promise<UserBalance[]> {
    console.log('BalanceCalculator: Starting async balance calculation')

    const users = PSONParser.getUsers(data)

    // Check if all users have stored balances
    const hasStoredBalances = users.every((user) => user.balance !== null)

    if (hasStoredBalances && users.length > 0) {
      console.log('BalanceCalculator: Found stored balances in users table')
      const userBalances = users.map((user) => ({
        userId: user.id,
        name: user.name,
        balance: user.balance || 0
      }))

      console.log('BalanceCalculator: Returning stored balances', { count: userBalances.length })
      return userBalances
    }

    // No stored balances, calculate from scratch
    console.log('BalanceCalculator: No stored balances, calculating from scratch')

    // Use setTimeout to yield to event loop for large datasets
    await new Promise((resolve) => setTimeout(resolve, 0))

    const bills = PSONParser.getBills(data)
    const allBillSplits = PSONParser.getAllBillSplits(data)

    const input: BalanceCalculationInput = {
      bills,
      billSplits: allBillSplits,
      users
    }

    const balances = this.calculateUserBalances(input)

    // Save the results to users table
    await this.saveBalancesToUsers(data, balances)

    return balances
  }

  /**
   * Save calculated balances to users table
   * @param data - PSON data
   * @param balances - Calculated balances
   */
  static async saveBalancesToUsers(data: PSONData, balances: UserBalance[]): Promise<void> {
    console.log('BalanceCalculator: Saving balances to users table')

    // Update each user's balance in the users table
    const usersTable = data.data.users
    if (!usersTable) {
      console.error('BalanceCalculator: No users table found')
      return
    }

    balances.forEach((balance) => {
      const userIdStr = balance.userId.toString()
      if (usersTable[userIdStr]) {
        // Update the balance field in the user object
        usersTable[userIdStr] = {
          ...usersTable[userIdStr],
          balance: balance.balance
        }
      }
    })

    console.log('BalanceCalculator: Balances saved successfully to users table')
  }

  /**
   * Force recalculation of balances (clears existing balance data)
   * @param data - PSON data
   * @returns Promise<UserBalance[]>
   */
  static async forceRecalculateBalances(data: PSONData): Promise<UserBalance[]> {
    console.log('BalanceCalculator: Force recalculating balances (clearing existing data)')

    // Clear existing balances in users table to force recalculation
    const usersTable = data.data.users
    if (usersTable) {
      Object.keys(usersTable).forEach((userId) => {
        usersTable[userId] = {
          ...usersTable[userId],
          balance: 0
        }
      })
    }

    // Use setTimeout to yield to event loop for large datasets
    await new Promise((resolve) => setTimeout(resolve, 0))

    const bills = PSONParser.getBills(data)
    const users = PSONParser.getUsers(data)
    const allBillSplits = PSONParser.getAllBillSplits(data)

    const input: BalanceCalculationInput = {
      bills,
      billSplits: allBillSplits,
      users
    }

    const balances = this.calculateUserBalances(input)

    // Save the results to users table
    await this.saveBalancesToUsers(data, balances)

    return balances
  }

  /**
   * Recalculate balances for a specific bill (incremental update)
   * @param data - PSON data
   * @param billId - ID of the bill that changed
   */
  static async recalculateForBill(data: PSONData, billId: number): Promise<void> {
    console.log(`BalanceCalculator: Recalculating balances for bill ${billId}`)

    // For now, we'll do a full recalculation
    // TODO: Implement incremental calculation for better performance
    const balances = await this.forceRecalculateBalances(data)

    console.log(`BalanceCalculator: Balances recalculated for bill ${billId}`)
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
