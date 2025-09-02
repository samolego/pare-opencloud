// Settlement-related types for debt simplification

import { Bill, BillSplit } from '../utils/psonParser'
import { BillUser, UserBalance } from './user'

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
  users: BillUser[]
}
