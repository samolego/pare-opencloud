export interface PCSVTable {
  name: string
  headers: string[]
  rows: string[][]
}

export interface PCSVData {
  tables: { [tableName: string]: PCSVTable }
}

export interface User {
  id: number
  name: string
  opencloud_id: string | null
  balance: number | null
}

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

export class PCSVParser {
  static parse(content: string): PCSVData {
    const lines = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    const tables: { [tableName: string]: PCSVTable } = {}

    let currentTable: PCSVTable | null = null
    let expectingHeaders = false

    for (const line of lines) {
      if (line.startsWith('TABLE,')) {
        // Save previous table if exists
        if (currentTable) {
          tables[currentTable.name.toLowerCase()] = currentTable
        }

        // Start new table
        const tableName = line.substring(6).trim()
        currentTable = {
          name: tableName,
          headers: [],
          rows: []
        }
        expectingHeaders = true
      } else if (currentTable && expectingHeaders) {
        // Parse headers
        currentTable.headers = this.parseCSVLine(line)
        expectingHeaders = false
      } else if (currentTable) {
        // Parse data row
        const row = this.parseCSVLine(line)
        if (row.length > 0) {
          currentTable.rows.push(row)
        }
      }
    }

    // Save last table
    if (currentTable) {
      tables[currentTable.name.toLowerCase()] = currentTable
    }

    return { tables }
  }

  static generate(data: PCSVData): string {
    console.log('PCSVParser: Generating PCSV content')
    const lines: string[] = []

    // Define preferred table order (balances should be last)
    const tableOrder = ['users', 'payment_mode', 'category', 'bills', 'bill_splits']
    const processedTables = new Set<string>()

    // Process tables in preferred order
    for (const tableName of tableOrder) {
      const table = data.tables[tableName]
      if (table && table.rows.length > 0) {
        console.log(`PCSVParser: Adding table ${tableName} with ${table.rows.length} rows`)
        lines.push(`TABLE,${table.name}`)
        lines.push(table.headers.join(','))

        for (const row of table.rows) {
          lines.push(row.map((cell) => this.escapeCSVCell(cell)).join(','))
        }

        lines.push('') // Empty line between tables
        processedTables.add(tableName)
      }
    }

    // Process any remaining tables not in the preferred order
    for (const table of Object.values(data.tables)) {
      if (!processedTables.has(table.name.toLowerCase()) && table.rows.length > 0) {
        console.log(
          `PCSVParser: Adding additional table ${table.name} with ${table.rows.length} rows`
        )
        lines.push(`TABLE,${table.name}`)
        lines.push(table.headers.join(','))

        for (const row of table.rows) {
          lines.push(row.map((cell) => this.escapeCSVCell(cell)).join(','))
        }

        lines.push('') // Empty line between tables
      }
    }

    console.log('PCSVParser: PCSV content generation completed')
    return lines.join('\n')
  }

  static ensureDefaultTables(
    data: PCSVData,
    currentUserName: string,
    currentUserOpenCloudId: string | null
  ): PCSVData {
    // Ensure users table
    if (!data.tables.users) {
      data.tables.users = {
        name: 'users',
        headers: ['id', 'name', 'opencloud_id', 'balance'],
        rows: []
      }
    }

    // Add current user if not exists
    const usersTable = data.tables.users
    const hasCurrentUser = usersTable.rows.some(
      (row) => row[2] === currentUserOpenCloudId || row[1] === currentUserName
    )

    if (!hasCurrentUser) {
      const nextUserId = this.getNextId(usersTable, 0)
      usersTable.rows.push([
        nextUserId.toString(),
        currentUserName,
        currentUserOpenCloudId || '',
        '0.00'
      ])
    }

    // Ensure payment_mode table
    if (!data.tables.payment_mode) {
      data.tables.payment_mode = {
        name: 'payment_mode',
        headers: ['id', 'name'],
        rows: [
          ['1', '💵 Cash'],
          ['2', '💳 Credit Card'],
          ['3', '💳 Debit Card'],
          ['4', '🏦 Bank Transfer'],
          ['5', '💻 PayPal']
        ]
      }
    }

    // Ensure category table
    if (!data.tables.category) {
      data.tables.category = {
        name: 'category',
        headers: ['id', 'name'],
        rows: [
          ['1', '🍔 Food'],
          ['2', '🚗 Transport'],
          ['3', '💡 Utilities'],
          ['4', '🎬 Entertainment'],
          ['5', '🛍️ Shopping'],
          ['6', '⚕️ Healthcare'],
          ['7', '🔧 Equipment']
        ]
      }
    }

    // Ensure bills table
    if (!data.tables.bills) {
      data.tables.bills = {
        name: 'bills',
        headers: [
          'id',
          'description',
          'total_amount',
          'who_paid_id',
          'timestamp',
          'repeat',
          'payment_mode_id',
          'category_id',
          'comment',
          'file_link'
        ],
        rows: []
      }
    }

    // Ensure bill_splits table
    if (!data.tables.bill_splits) {
      data.tables.bill_splits = {
        name: 'bill_splits',
        headers: ['id', 'bill_id', 'user_id', 'amount'],
        rows: []
      }
    }

    console.log('PCSVParser: Ensured default tables')

    return data
  }

  static addBill(
    data: PCSVData,
    bill: Omit<Bill, 'id'>,
    splits: Omit<BillSplit, 'id' | 'bill_id'>[]
  ): { data: PCSVData; billId: number } {
    console.log('PCSVParser: Adding new bill')
    const billsTable = data.tables.bills
    const billSplitsTable = data.tables.bill_splits

    // Get next bill ID
    const billId = this.getNextId(billsTable, 0)

    // Add bill
    billsTable.rows.push([
      billId.toString(),
      bill.description,
      bill.total_amount.toString(),
      bill.who_paid_id.toString(),
      bill.timestamp.toString(),
      bill.repeat,
      bill.payment_mode_id?.toString() || '',
      bill.category_id?.toString() || '',
      bill.comment,
      bill.file_link
    ])

    // Add splits
    for (const split of splits) {
      const splitId = this.getNextId(billSplitsTable, 0)
      billSplitsTable.rows.push([
        splitId.toString(),
        billId.toString(),
        split.user_id.toString(),
        split.amount.toString()
      ])
    }

    // Update user balances incrementally
    this.applyBalanceChanges(data, bill.who_paid_id, bill.total_amount, splits, 1)

    console.log(`PCSVParser: Added bill ${billId} with ${splits.length} splits`)
    return { data, billId }
  }

  static getBills(data: PCSVData): Bill[] {
    const billsTable = data.tables.bills
    if (!billsTable) return []

    return billsTable.rows.map((row) => ({
      id: parseInt(row[0]),
      description: row[1],
      total_amount: parseFloat(row[2]),
      who_paid_id: parseInt(row[3]),
      timestamp: parseInt(row[4]),
      repeat: row[5],
      payment_mode_id: row[6] ? parseInt(row[6]) : null,
      category_id: row[7] ? parseInt(row[7]) : null,
      comment: row[8],
      file_link: row[9]
    }))
  }

  static getAllBillSplits(data: PCSVData): BillSplit[] {
    console.log('PCSVParser: Getting all bill splits')
    const billSplitsTable = data.tables.bill_splits
    if (!billSplitsTable || !billSplitsTable.rows) {
      console.log('PCSVParser: No bill splits table found')
      return []
    }

    const splits = billSplitsTable.rows
      .filter((row) => row && row.length >= 4)
      .map((row) => ({
        id: parseInt(row[0]) || 0,
        bill_id: parseInt(row[1]) || 0,
        user_id: parseInt(row[2]) || 0,
        amount: parseFloat(row[3]) || 0
      }))

    console.log(`PCSVParser: Retrieved ${splits.length} bill splits`)
    return splits
  }

  static getBillSplits(data: PCSVData, billId: number): BillSplit[] {
    const billSplitsTable = data.tables.bill_splits
    if (!billSplitsTable || !billSplitsTable.rows) {
      return []
    }

    return billSplitsTable.rows
      .filter((row) => row && row.length >= 4 && parseInt(row[1]) === billId)
      .map((row) => ({
        id: parseInt(row[0]) || 0,
        bill_id: parseInt(row[1]) || 0,
        user_id: parseInt(row[2]) || 0,
        amount: parseFloat(row[3]) || 0
      }))
  }

  static updateBill(
    data: PCSVData,
    billId: number,
    bill: Omit<Bill, 'id'>,
    splits: Omit<BillSplit, 'id' | 'bill_id'>[]
  ): { data: PCSVData; billId: number } {
    console.log(`PCSVParser: Updating bill ${billId}`)
    const billsTable = data.tables.bills
    const billSplitsTable = data.tables.bill_splits

    // Get old bill and splits for balance reversal
    const oldBills = this.getBills(data)
    const oldBill = oldBills.find((b) => b.id === billId)
    const oldSplits = this.getBillSplits(data, billId)

    // Reverse old balance changes if bill exists
    if (oldBill && oldSplits.length > 0) {
      this.applyBalanceChanges(data, oldBill.who_paid_id, oldBill.total_amount, oldSplits, -1)
    }

    // Find and update the bill
    const billRowIndex = billsTable.rows.findIndex((row) => parseInt(row[0]) === billId)
    if (billRowIndex !== -1) {
      billsTable.rows[billRowIndex] = [
        billId.toString(),
        bill.description,
        bill.total_amount.toString(),
        bill.who_paid_id.toString(),
        bill.timestamp.toString(),
        bill.repeat || '',
        bill.payment_mode_id?.toString() || '',
        bill.category_id?.toString() || '',
        bill.comment || '',
        bill.file_link || ''
      ]
    }

    // Remove existing splits for this bill
    billSplitsTable.rows = billSplitsTable.rows.filter((row) => parseInt(row[1]) !== billId)

    // Add new splits
    for (const split of splits) {
      const splitId = this.getNextId(billSplitsTable, 0)
      billSplitsTable.rows.push([
        splitId.toString(),
        billId.toString(),
        split.user_id.toString(),
        split.amount.toString()
      ])
    }

    // Apply new balance changes
    this.applyBalanceChanges(data, bill.who_paid_id, bill.total_amount, splits, 1)

    console.log(`PCSVParser: Updated bill ${billId}`)
    return { data, billId }
  }

  static updateUser(data: PCSVData, userId: number, user: Omit<User, 'id'>): PCSVData {
    const usersTable = data.tables.users

    // Find and update the user
    const userRowIndex = usersTable.rows.findIndex((row) => parseInt(row[0]) === userId)
    if (userRowIndex !== -1) {
      usersTable.rows[userRowIndex] = [
        userId.toString(),
        user.name,
        user.opencloud_id || '',
        user.balance?.toString() || ''
      ]
    }

    return data
  }

  static getUsers(data: PCSVData): User[] {
    const usersTable = data.tables.users
    if (!usersTable) return []

    return usersTable.rows.map((row) => ({
      id: parseInt(row[0]),
      name: row[1],
      opencloud_id: row[2] || null,
      balance: row[3] ? parseFloat(row[3]) : null
    }))
  }

  static getPaymentModes(data: PCSVData): PaymentMode[] {
    const paymentTable = data.tables.payment_mode
    if (!paymentTable) return []

    return paymentTable.rows.map((row) => ({
      id: parseInt(row[0]),
      name: row[1]
    }))
  }

  static updateCategory(
    data: PCSVData,
    categoryId: number,
    category: Omit<Category, 'id'>
  ): PCSVData {
    const categoryTable = data.tables.category

    // Find and update the category
    const categoryRowIndex = categoryTable.rows.findIndex((row) => parseInt(row[0]) === categoryId)
    if (categoryRowIndex !== -1) {
      categoryTable.rows[categoryRowIndex] = [categoryId.toString(), category.name]
    }

    return data
  }

  static updatePaymentMode(
    data: PCSVData,
    paymentModeId: number,
    paymentMode: Omit<PaymentMode, 'id'>
  ): PCSVData {
    const paymentModeTable = data.tables.payment_mode

    // Find and update the payment mode
    const paymentModeRowIndex = paymentModeTable.rows.findIndex(
      (row) => parseInt(row[0]) === paymentModeId
    )
    if (paymentModeRowIndex !== -1) {
      paymentModeTable.rows[paymentModeRowIndex] = [paymentModeId.toString(), paymentMode.name]
    }

    return data
  }

  static getCategories(data: PCSVData): Category[] {
    const categoryTable = data.tables.category
    if (!categoryTable) return []

    return categoryTable.rows.map((row) => ({
      id: parseInt(row[0]),
      name: row[1]
    }))
  }

  static deleteBill(data: PCSVData, billId: number): PCSVData {
    console.log(`PCSVParser: Deleting bill ${billId}`)
    const billsTable = data.tables.bills
    const billSplitsTable = data.tables.bill_splits

    // Get bill and splits for balance reversal before deletion
    const bills = this.getBills(data)
    const bill = bills.find((b) => b.id === billId)
    const splits = this.getBillSplits(data, billId)

    // Reverse balance changes if bill exists
    if (bill && splits.length > 0) {
      this.applyBalanceChanges(data, bill.who_paid_id, bill.total_amount, splits, -1)
    }

    // Remove the bill
    billsTable.rows = billsTable.rows.filter((row) => parseInt(row[0]) !== billId)

    // Remove all splits for this bill
    billSplitsTable.rows = billSplitsTable.rows.filter((row) => parseInt(row[1]) !== billId)

    console.log(`PCSVParser: Deleted bill ${billId}`)
    return data
  }

  static deleteUser(data: PCSVData, userId: number): PCSVData {
    const usersTable = data.tables.users

    // Remove the user
    usersTable.rows = usersTable.rows.filter((row) => parseInt(row[0]) !== userId)

    return data
  }

  static deletePaymentMode(data: PCSVData, paymentModeId: number): PCSVData {
    const paymentModeTable = data.tables.payment_mode

    // Remove the payment mode
    paymentModeTable.rows = paymentModeTable.rows.filter(
      (row) => parseInt(row[0]) !== paymentModeId
    )

    return data
  }

  static deleteCategory(data: PCSVData, categoryId: number): PCSVData {
    const categoryTable = data.tables.category

    // Remove the category
    categoryTable.rows = categoryTable.rows.filter((row) => parseInt(row[0]) !== categoryId)

    return data
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0

    while (i < line.length) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i += 2
        } else {
          inQuotes = !inQuotes
          i++
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
        i++
      } else {
        current += char
        i++
      }
    }

    result.push(current)
    return result
  }

  private static escapeCSVCell(cell: string): string {
    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
      return `"${cell.replace(/"/g, '""')}"`
    }
    return cell
  }

  /**
   * Apply balance changes for a bill (generic method that handles both adding and reversing)
   * @param data - PCSV data
   * @param whoPaidId - User who paid the bill
   * @param totalAmount - Total amount of the bill
   * @param splits - How the bill is split among users
   * @param direction - 1 for adding bill, -1 for reversing bill
   */
  private static applyBalanceChanges(
    data: PCSVData,
    whoPaidId: number,
    totalAmount: number,
    splits: (Omit<BillSplit, 'id' | 'bill_id'> | BillSplit)[],
    direction: 1 | -1
  ): void {
    const usersTable = data.tables.users
    if (!usersTable) {
      console.error('PCSVParser: No users table found for balance update')
      return
    }

    // Update balance for user who paid
    const payerRowIndex = usersTable.rows.findIndex((row) => parseInt(row[0]) === whoPaidId)
    if (payerRowIndex !== -1) {
      const currentBalance = parseFloat(usersTable.rows[payerRowIndex][3]) || 0
      const newBalance = currentBalance + totalAmount * direction
      usersTable.rows[payerRowIndex][3] = newBalance.toFixed(2)
    }

    // Update balances for users who owe money
    splits.forEach((split) => {
      const userRowIndex = usersTable.rows.findIndex((row) => parseInt(row[0]) === split.user_id)
      if (userRowIndex !== -1) {
        const currentBalance = parseFloat(usersTable.rows[userRowIndex][3]) || 0
        const newBalance = currentBalance - split.amount * direction
        usersTable.rows[userRowIndex][3] = newBalance.toFixed(2)
      }
    })

    const action = direction === 1 ? 'Applied' : 'Reversed'
    console.log(
      `PCSVParser: ${action} balance changes for bill - payer: ${whoPaidId}, splits: ${splits.length}`
    )
  }

  private static getNextId(table: PCSVTable, columnIndex: number): number {
    let maxId = 0
    for (const row of table.rows) {
      const id = parseInt(row[columnIndex])
      if (!isNaN(id) && id > maxId) {
        maxId = id
      }
    }
    return maxId + 1
  }
}
