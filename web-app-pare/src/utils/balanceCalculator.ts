// Balance calculation utilities for settlement system

import { BalanceCalculationInput } from '../types/settlement'
import { UserBalance } from '../types/user'
import { PSONParser, type PSONData, type Bill, type BillSplit } from './psonParser'

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

    // Create a map of bill splits by bill_id for faster lookup
    const splitsByBillId = new Map<number, typeof billSplits>()
    billSplits.forEach((split) => {
      if (!splitsByBillId.has(split.bill_id)) {
        splitsByBillId.set(split.bill_id, [])
      }
      splitsByBillId.get(split.bill_id)!.push(split)
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

    return result
  }

  /**
   * Async balance calculation with caching support
   * @param data - PSON data
   * @returns Promise<UserBalance[]>
   */
  static async calculateUserBalancesAsync(data: PSONData): Promise<UserBalance[]> {
    const users = PSONParser.getUsers(data)

    // Check if all users have stored balances
    const hasStoredBalances = users.every((user) => user.balance !== null)

    if (hasStoredBalances && users.length > 0) {
      const userBalances = users.map((user) => ({
        userId: user.id,
        name: user.name,
        balance: user.balance || 0
      }))

      return userBalances
    }

    // No stored balances, calculate from scratch
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
  static saveBalancesToUsers(data: PSONData, balances: UserBalance[]) {
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
  }

  /**
   * Force recalculation of balances (clears existing balance data)
   * @param data - PSON data
   * @returns Promise<UserBalance[]>
   */
  static async forceRecalculateBalances(data: PSONData): Promise<UserBalance[]> {
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
    this.saveBalancesToUsers(data, balances)

    return balances
  }

  /**
   * Get a single bill with its splits efficiently using O(1) lookup
   * @param data - PSON data
   * @param billId - ID of the bill to retrieve
   * @returns Bill object with splits array, or null if not found
   */
  static getBillWithSplits(
    data: PSONData,
    billId: number
  ): { bill: Bill; splits: BillSplit[] } | null {
    const billData = data.data.bills[billId.toString()]
    if (!billData) return null

    const bill: Bill = {
      id: billId,
      description: billData.description,
      total_amount: billData.total_amount,
      who_paid_id: billData.who_paid_id,
      timestamp: billData.timestamp,
      repeat: billData.repeat,
      payment_mode_id: billData.payment_mode_id,
      category_id: billData.category_id,
      comment: billData.comment,
      file_link: billData.file_link
    }

    const splits: BillSplit[] = Object.entries(billData.splits).map(([splitIdStr, splitData]) => ({
      id: parseInt(splitIdStr),
      bill_id: billId,
      user_id: splitData.user_id,
      amount: splitData.amount
    }))

    return { bill, splits }
  }

  /**
   * Calculate the balance impact of a single bill
   * @param bill - The bill to calculate impact for
   * @param billSplits - The splits for this bill
   * @returns Map of userId to balance impact
   *
   * @example
   * // Calculate how a specific bill affects user balances
   * const bill = { id: 1, who_paid_id: 2, total_amount: 100, ... }
   * const splits = [{ user_id: 3, amount: 50 }, { user_id: 4, amount: 50 }]
   * const impact = BalanceCalculator.calculateSingleBillImpact(bill, splits)
   * // Result: Map { 2 => +100, 3 => -50, 4 => -50 }
   */
  static calculateSingleBillImpact(bill: Bill, billSplits: BillSplit[]): Map<number, number> {
    const impact = new Map<number, number>()

    // Add the total amount to the person who paid (credit)
    const whoPaidId = bill.who_paid_id
    const totalAmount = bill.total_amount
    impact.set(whoPaidId, (impact.get(whoPaidId) || 0) + totalAmount)

    // Subtract split amounts from each person who owes (debt)
    billSplits.forEach((split) => {
      impact.set(split.user_id, (impact.get(split.user_id) || 0) - split.amount)
    })

    return impact
  }

  /**
   * Recalculate balances for specific users only (incremental approach)
   * This method processes all bills but only updates balances for the specified users,
   * making it much more efficient than full recalculation when only a few users are affected.
   *
   * @param data - PSON data containing bills and user information
   * @param affectedUserIds - Set of user IDs to recalculate balances for
   *
   * @example
   * // Recalculate balances for users 2, 3, and 4 only
   * const affectedUsers = new Set([2, 3, 4])
   * BalanceCalculator.recalculateUsersBalances(data, affectedUsers)
   */
  static recalculateUsersBalances(data: PSONData, affectedUserIds: Set<number>): void {
    const usersTable = data.data.users
    const billsTable = data.data.bills

    if (!usersTable) {
      console.error('BalanceCalculator: No users table found')
      return
    }

    // Initialize balances for affected users
    const balances = new Map<number, number>()
    affectedUserIds.forEach((userId) => {
      balances.set(userId, 0)
    })

    // Process each bill directly from PSON bills table (O(1) lookup per bill)
    Object.entries(billsTable).forEach(([billIdStr, billData]) => {
      const billId = parseInt(billIdStr)
      const whoPaidId = billData.who_paid_id
      const totalAmount = billData.total_amount

      // Get splits for this bill directly from the bill data
      const billSplits = Object.entries(billData.splits).map(([splitIdStr, splitData]) => ({
        id: parseInt(splitIdStr),
        bill_id: billId,
        user_id: splitData.user_id,
        amount: splitData.amount
      }))

      // Check if this bill affects any of our target users
      const billAffectsTargetUsers =
        affectedUserIds.has(whoPaidId) ||
        billSplits.some((split) => affectedUserIds.has(split.user_id))

      if (billAffectsTargetUsers) {
        // Add the total amount to the person who paid (if they're in our target set)
        if (affectedUserIds.has(whoPaidId)) {
          const currentPayerBalance = balances.get(whoPaidId) || 0
          balances.set(whoPaidId, currentPayerBalance + totalAmount)
        }

        // Subtract split amounts from each person who owes (if they're in our target set)
        billSplits.forEach((split) => {
          if (affectedUserIds.has(split.user_id)) {
            const currentUserBalance = balances.get(split.user_id) || 0
            balances.set(split.user_id, currentUserBalance - split.amount)
          }
        })
      }
    })

    // Update the users table with new balances
    balances.forEach((balance, userId) => {
      const userIdStr = userId.toString()
      if (usersTable[userIdStr]) {
        usersTable[userIdStr] = {
          ...usersTable[userIdStr],
          balance: balance
        }
      }
    })
  }

  /**
   * Recalculate balances for a specific bill (incremental update)
   *
   * This method implements incremental balance calculation by:
   * 1. Finding the bill and identifying affected users (who paid + who owes)
   * 2. Recalculating balances only for those affected users
   * 3. Updating the stored balances in the users table
   *
   * @param data - PSON data containing bills and user information
   * @param billId - ID of the bill that changed (added, modified, or deleted)
   *
   * @example
   * // After adding, modifying, or deleting bill with ID 123
   * await BalanceCalculator.recalculateForBill(data, 123)
   *
   * @throws Will fall back to full recalculation if incremental update fails
   */
  static async recalculateForBill(data: PSONData, billId: number): Promise<void> {
    try {
      // Get the specific bill and its splits using O(1) lookup
      const billWithSplits = this.getBillWithSplits(data, billId)

      if (!billWithSplits) {
        // Bill doesn't exist (maybe deleted), do a full recalculation to be safe
        console.warn(`BalanceCalculator: Bill ${billId} not found, doing full recalculation`)
        await this.forceRecalculateBalances(data)
        return
      }

      const { bill, splits: billSplits } = billWithSplits

      // Identify affected users (who paid + who owes)
      const affectedUserIds = new Set<number>()
      affectedUserIds.add(bill.who_paid_id)
      billSplits.forEach((split) => {
        affectedUserIds.add(split.user_id)
      })

      // Use setTimeout to yield to event loop for large datasets
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Recalculate balances for only the affected users
      this.recalculateUsersBalances(data, affectedUserIds)

      console.log(
        `BalanceCalculator: Incrementally updated balances for ${affectedUserIds.size} users affected by bill ${billId}`
      )
    } catch (error) {
      console.error(
        `BalanceCalculator: Error in incremental calculation for bill ${billId}, falling back to full recalculation:`,
        error
      )
      // Fall back to full recalculation if anything goes wrong
      await this.forceRecalculateBalances(data)
    }
  }

  /**
   * Incrementally update balances when we know the before and after states of a bill
   *
   * This is the most efficient incremental update method when you have access to both
   * the old and new states of a bill. It calculates the net difference in impact and
   * applies only that difference to existing balances.
   *
   * @param data - PSON data containing user balance information
   * @param oldBill - Previous state of the bill (null if this is a new bill)
   * @param oldSplits - Previous splits for the bill (empty array if new bill)
   * @param newBill - Current state of the bill (null if bill was deleted)
   * @param newSplits - Current splits for the bill (empty array if deleted)
   *
   * @example
   * // Adding a new bill
   * BalanceCalculator.updateBalancesForBillChange(data, null, [], newBill, newSplits)
   *
   * @example
   * // Modifying an existing bill
   * BalanceCalculator.updateBalancesForBillChange(data, oldBill, oldSplits, newBill, newSplits)
   *
   * @example
   * // Deleting a bill
   * BalanceCalculator.updateBalancesForBillChange(data, oldBill, oldSplits, null, [])
   */
  static updateBalancesForBillChange(
    data: PSONData,
    oldBill: Bill | null,
    oldSplits: BillSplit[],
    newBill: Bill | null,
    newSplits: BillSplit[]
  ): void {
    const usersTable = data.data.users

    // Calculate the net impact (new impact - old impact)
    const netImpact = new Map<number, number>()

    // Subtract old bill impact
    if (oldBill && oldSplits) {
      const oldImpact = this.calculateSingleBillImpact(oldBill, oldSplits)
      oldImpact.forEach((impact, userId) => {
        netImpact.set(userId, (netImpact.get(userId) || 0) - impact)
      })
    }

    // Add new bill impact
    if (newBill && newSplits) {
      const newImpact = this.calculateSingleBillImpact(newBill, newSplits)
      newImpact.forEach((impact, userId) => {
        netImpact.set(userId, (netImpact.get(userId) || 0) + impact)
      })
    }

    // Apply net impact to current user balances
    netImpact.forEach((impact, userId) => {
      const userIdStr = userId.toString()
      if (usersTable[userIdStr] && Math.abs(impact) > 0.001) {
        const currentBalance = usersTable[userIdStr].balance || 0
        usersTable[userIdStr] = {
          ...usersTable[userIdStr],
          balance: currentBalance + impact
        }
      }
    })

    console.log(`BalanceCalculator: Applied incremental update affecting ${netImpact.size} users`)
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
