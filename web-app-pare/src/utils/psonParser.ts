// Define the data structure types for PSON format
import { BillUser } from '../types/user'

export interface PaymentMode {
  id: number
  name: string
}

export interface Category {
  id: number
  name: string
}

export interface Bill {
  id: number
  description: string
  total_amount: number
  who_paid_id: number
  timestamp: number
  repeat: string
  payment_mode_id: number | null
  category_id: number | null
  comment: string
  file_link: string
}

export interface BillSplit {
  id: number
  bill_id: number
  user_id: number
  amount: number
}

// Define the data structure types for PSON format
export interface PSONData {
  meta: {
    version: string
    created: string
    modified: string
  }
  data: {
    users: Record<string, Omit<BillUser, 'id'>>
    payment_modes: Record<string, Omit<PaymentMode, 'id'>>
    categories: Record<string, Omit<Category, 'id'>>
    bills: Record<
      string,
      Omit<Bill, 'id'> & { splits: Record<string, Omit<BillSplit, 'id' | 'bill_id'>> }
    >
  }
}

export class PSONParser {
  static parse(content: string): PSONData {
    console.log('PSONParser: Parsing content')
    console.log({ content })
    if (!content.trim()) {
      return this.createDefaultPSONData()
    }

    try {
      const data = JSON.parse(content) as PSONData
      return data
    } catch (error) {
      console.error('Error parsing PSON:', error)
      return this.createDefaultPSONData()
    }
  }

  static updateMetadata(data: PSONData) {
    // Update modified timestamp
    data.meta.modified = new Date().toISOString()
  }

  static fillDefaults(data: PSONData) {
    // Ensure payment_mode table
    if (!data.data.payment_modes || Object.keys(data.data.payment_modes).length === 0) {
      data.data.payment_modes = {
        '1': { name: '💵 Cash' },
        '2': { name: '💳 Credit Card' },
        '3': { name: '💳 Debit Card' },
        '4': { name: '🏦 Bank Transfer' },
        '5': { name: '💻 PayPal' }
      }
    }

    // Ensure category table
    if (!data.data.categories || Object.keys(data.data.categories).length === 0) {
      data.data.categories = {
        '1': { name: '🍔 Food' },
        '2': { name: '🚗 Transport' },
        '3': { name: '💡 Utilities' },
        '4': { name: '🎬 Entertainment' },
        '5': { name: '🛍️ Shopping' },
        '6': { name: '⚕️ Healthcare' },
        '7': { name: '🔧 Equipment' }
      }
    }
  }

  static addBill(
    data: PSONData,
    bill: Omit<Bill, 'id'>,
    splits: Omit<BillSplit, 'id' | 'bill_id'>[]
  ): { data: PSONData; billId: number } {
    console.log('PSONParser: Adding new bill')

    // Get next bill ID
    const billId = this.getNextId(Object.keys(data.data.bills).map(Number))

    // Prepare splits with IDs
    const splitsWithIds: Record<string, Omit<BillSplit, 'id' | 'bill_id'>> = {}
    let splitIdCounter = 1

    for (const split of splits) {
      splitsWithIds[splitIdCounter.toString()] = {
        user_id: split.user_id,
        amount: split.amount
      }
      splitIdCounter++
    }

    // Add bill
    data.data.bills[billId.toString()] = {
      ...bill,
      splits: splitsWithIds
    }

    // Update user balances incrementally
    this.applyBalanceChanges(data, bill.who_paid_id, bill.total_amount, splits, 1)

    console.log(`PSONParser: Added bill ${billId} with ${splits.length} splits`)
    return { data, billId }
  }

  static getBills(data: PSONData): Bill[] {
    return Object.entries(data.data.bills).map(([id, bill]) => ({
      id: parseInt(id),
      description: bill.description,
      total_amount: bill.total_amount,
      who_paid_id: bill.who_paid_id,
      timestamp: bill.timestamp,
      repeat: bill.repeat,
      payment_mode_id: bill.payment_mode_id,
      category_id: bill.category_id,
      comment: bill.comment,
      file_link: bill.file_link
    }))
  }

  static getAllBillSplits(data: PSONData): BillSplit[] {
    console.log('PSONParser: Getting all bill splits')
    const splits: BillSplit[] = []

    Object.entries(data.data.bills).forEach(([billId, bill]) => {
      Object.entries(bill.splits).forEach(([splitId, split]) => {
        splits.push({
          id: parseInt(splitId),
          bill_id: parseInt(billId),
          user_id: split.user_id,
          amount: split.amount
        })
      })
    })

    console.log(`PSONParser: Retrieved ${splits.length} bill splits`)
    return splits
  }

  static getBillSplits(data: PSONData, billId: number): BillSplit[] {
    const bill = data.data.bills[billId.toString()]
    if (!bill) return []

    return Object.entries(bill.splits).map(([splitId, split]) => ({
      id: parseInt(splitId),
      bill_id: billId,
      user_id: split.user_id,
      amount: split.amount
    }))
  }

  static updateBill(
    data: PSONData,
    billId: number,
    bill: Omit<Bill, 'id'>,
    splits: Omit<BillSplit, 'id' | 'bill_id'>[]
  ): { data: PSONData; billId: number } {
    console.log(`PSONParser: Updating bill ${billId}`)

    // Get old bill and splits for balance reversal
    const oldBills = this.getBills(data)
    const oldBill = oldBills.find((b) => b.id === billId)
    const oldSplits = this.getBillSplits(data, billId)

    // Reverse old balance changes if bill exists
    if (oldBill && oldSplits.length > 0) {
      this.applyBalanceChanges(data, oldBill.who_paid_id, oldBill.total_amount, oldSplits, -1)
    }

    // Prepare splits with IDs
    const splitsWithIds: Record<string, Omit<BillSplit, 'id' | 'bill_id'>> = {}
    let splitIdCounter = 1

    for (const split of splits) {
      splitsWithIds[splitIdCounter.toString()] = {
        user_id: split.user_id,
        amount: split.amount
      }
      splitIdCounter++
    }

    // Update the bill
    data.data.bills[billId.toString()] = {
      ...bill,
      splits: splitsWithIds
    }

    // Apply new balance changes
    this.applyBalanceChanges(data, bill.who_paid_id, bill.total_amount, splits, 1)

    console.log(`PSONParser: Updated bill ${billId}`)
    return { data, billId }
  }

  static updateUser(data: PSONData, userId: number, user: Omit<BillUser, 'id'>): PSONData {
    const userIdStr = userId.toString()

    // Update the user
    if (data.data.users[userIdStr]) {
      data.data.users[userIdStr] = user
    }

    return data
  }

  static getUsers(data: PSONData): BillUser[] {
    return Object.entries(data.data.users).map(([id, user]) => ({
      id: parseInt(id),
      name: user.name,
      opencloud_id: user.opencloud_id,
      balance: user.balance
    }))
  }

  static getPaymentModes(data: PSONData): PaymentMode[] {
    return Object.entries(data.data.payment_modes).map(([id, paymentMode]) => ({
      id: parseInt(id),
      name: paymentMode.name
    }))
  }

  static updateCategory(
    data: PSONData,
    categoryId: number,
    category: Omit<Category, 'id'>
  ): PSONData {
    const categoryIdStr = categoryId.toString()

    // Update the category
    if (data.data.categories[categoryIdStr]) {
      data.data.categories[categoryIdStr] = category
    }

    return data
  }

  static updatePaymentMode(
    data: PSONData,
    paymentModeId: number,
    paymentMode: Omit<PaymentMode, 'id'>
  ): PSONData {
    const paymentModeIdStr = paymentModeId.toString()

    // Update the payment mode
    if (data.data.payment_modes[paymentModeIdStr]) {
      data.data.payment_modes[paymentModeIdStr] = paymentMode
    }

    return data
  }

  static getCategories(data: PSONData): Category[] {
    return Object.entries(data.data.categories).map(([id, category]) => ({
      id: parseInt(id),
      name: category.name
    }))
  }

  static deleteBill(data: PSONData, billId: number): PSONData {
    console.log(`PSONParser: Deleting bill ${billId}`)

    // Get bill and splits for balance reversal before deletion
    const bills = this.getBills(data)
    const bill = bills.find((b) => b.id === billId)
    const splits = this.getBillSplits(data, billId)

    // Reverse balance changes if bill exists
    if (bill && splits.length > 0) {
      this.applyBalanceChanges(data, bill.who_paid_id, bill.total_amount, splits, -1)
    }

    // Remove the bill
    delete data.data.bills[billId.toString()]

    console.log(`PSONParser: Deleted bill ${billId}`)
    return data
  }

  static deleteUser(data: PSONData, userId: number): PSONData {
    // Remove the user
    delete data.data.users[userId.toString()]
    return data
  }

  static deletePaymentMode(data: PSONData, paymentModeId: number): PSONData {
    // Remove the payment mode
    delete data.data.payment_modes[paymentModeId.toString()]
    return data
  }

  static deleteCategory(data: PSONData, categoryId: number): PSONData {
    // Remove the category
    delete data.data.categories[categoryId.toString()]
    return data
  }

  /**
   * Apply balance changes for a bill (generic method that handles both adding and reversing)
   * @param data - PSON data
   * @param whoPaidId - BillUser who paid the bill
   * @param totalAmount - Total amount of the bill
   * @param splits - How the bill is split among users
   * @param direction - 1 for adding bill, -1 for reversing bill
   */
  private static applyBalanceChanges(
    data: PSONData,
    whoPaidId: number,
    totalAmount: number,
    splits: (Omit<BillSplit, 'id' | 'bill_id'> | BillSplit)[],
    direction: 1 | -1
  ): void {
    const userIdStr = whoPaidId.toString()

    // Update balance for user who paid
    if (data.data.users[userIdStr]) {
      const currentBalance = data.data.users[userIdStr].balance || 0
      const newBalance = currentBalance + totalAmount * direction
      data.data.users[userIdStr] = {
        ...data.data.users[userIdStr],
        balance: parseFloat(newBalance.toFixed(2))
      }
    }

    // Update balances for users who owe money
    splits.forEach((split) => {
      const splitUserIdStr = split.user_id.toString()
      if (data.data.users[splitUserIdStr]) {
        const currentBalance = data.data.users[splitUserIdStr].balance || 0
        const newBalance = currentBalance - split.amount * direction
        data.data.users[splitUserIdStr] = {
          ...data.data.users[splitUserIdStr],
          balance: parseFloat(newBalance.toFixed(2))
        }
      }
    })

    const action = direction === 1 ? 'Applied' : 'Reversed'
    console.log(
      `PSONParser: ${action} balance changes for bill - payer: ${whoPaidId}, splits: ${splits.length}`
    )
  }

  private static getNextId(existingIds: number[]): number {
    let maxId = 0
    for (const id of existingIds) {
      if (!isNaN(id) && id > maxId) {
        maxId = id
      }
    }
    return maxId + 1
  }

  public static createDefaultPSONData(): PSONData {
    const now = new Date().toISOString()
    const data = {
      meta: {
        version: '1.0',
        created: now,
        modified: now
      },
      data: {
        users: {},
        payment_modes: {},
        categories: {},
        bills: {}
      }
    }

    PSONParser.fillDefaults(data)

    return data
  }
}
