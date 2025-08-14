// Settlement-related types for debt simplification

import { Bill, BillSplit, User } from '../utils/psonParser'

export interface UserBalance {
  userId: number
  name: string
  balance: number // positive = credit (owed money), negative = debt (owes money)
}

export interface SettlementTransaction {
  fromUserId: number
  toUserId: number
  amount: number
  fromUserName: string
  toUserName: string
}

export interface Settlement {
  transactions: SettlementTransaction[]
  totalTransactions: number
  balancesBeforeSettlement: UserBalance[]
}

export interface SettlementBillData {
  description: string
  fromUserId: number
  toUserId: number
  amount: number
  date: string
  time: string
}

// Type for the settlement creation result
export interface SettlementResult {
  settlement: Settlement
  settlementBills: SettlementBillData[]
}

// Balance calculation inputs
export interface BalanceCalculationInput {
  bills: Bill[]
  billSplits: BillSplit[]
  users: User[]
}
