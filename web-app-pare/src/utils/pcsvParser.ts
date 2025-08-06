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
  datetime: string
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
  included: number
}

export class PCSVParser {
  static parse(content: string): PCSVData {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0)
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
    const lines: string[] = []

    for (const table of Object.values(data.tables)) {
      lines.push(`TABLE,${table.name}`)
      lines.push(table.headers.join(','))

      for (const row of table.rows) {
        lines.push(row.map(cell => this.escapeCSVCell(cell)).join(','))
      }

      lines.push('') // Empty line between tables
    }

    return lines.join('\n')
  }

  static ensureDefaultTables(data: PCSVData, currentUserName: string, currentUserOpenCloudId: string | null): PCSVData {
    // Ensure users table
    if (!data.tables.users) {
      data.tables.users = {
        name: 'users',
        headers: ['id', 'name', 'opencloud_id'],
        rows: []
      }
    }

    // Add current user if not exists
    const usersTable = data.tables.users
    const hasCurrentUser = usersTable.rows.some(row =>
      row[2] === currentUserOpenCloudId || row[1] === currentUserName
    )

    if (!hasCurrentUser) {
      const nextUserId = this.getNextId(usersTable, 0)
      usersTable.rows.push([
        nextUserId.toString(),
        currentUserName,
        currentUserOpenCloudId || ''
      ])
    }

    // Ensure payment_mode table
    if (!data.tables.payment_mode) {
      data.tables.payment_mode = {
        name: 'payment_mode',
        headers: ['id', 'name'],
        rows: [
          ['1', 'Cash'],
          ['2', 'Credit Card'],
          ['3', 'Debit Card'],
          ['4', 'Bank Transfer'],
          ['5', 'PayPal']
        ]
      }
    }

    // Ensure category table
    if (!data.tables.category) {
      data.tables.category = {
        name: 'category',
        headers: ['id', 'name'],
        rows: [
          ['1', 'Food'],
          ['2', 'Transport'],
          ['3', 'Utilities'],
          ['4', 'Entertainment'],
          ['5', 'Shopping'],
          ['6', 'Healthcare'],
          ['7', 'Equipment']
        ]
      }
    }

    // Ensure bills table
    if (!data.tables.bills) {
      data.tables.bills = {
        name: 'bills',
        headers: ['id', 'description', 'total_amount', 'who_paid_id', 'datetime', 'repeat', 'payment_mode_id', 'category_id', 'comment', 'file_link'],
        rows: []
      }
    }

    // Ensure bill_splits table
    if (!data.tables.bill_splits) {
      data.tables.bill_splits = {
        name: 'bill_splits',
        headers: ['id', 'bill_id', 'user_id', 'amount', 'included'],
        rows: []
      }
    }

    return data
  }

  static addBill(data: PCSVData, bill: Omit<Bill, 'id'>, splits: Omit<BillSplit, 'id' | 'bill_id'>[]): PCSVData {
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
      bill.datetime,
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
        split.amount.toString(),
        split.included.toString()
      ])
    }

    return data
  }

  static getBills(data: PCSVData): Bill[] {
    const billsTable = data.tables.bills
    if (!billsTable) return []

    return billsTable.rows.map(row => ({
      id: parseInt(row[0]),
      description: row[1],
      total_amount: parseFloat(row[2]),
      who_paid_id: parseInt(row[3]),
      datetime: row[4],
      repeat: row[5],
      payment_mode_id: row[6] ? parseInt(row[6]) : null,
      category_id: row[7] ? parseInt(row[7]) : null,
      comment: row[8],
      file_link: row[9]
    }))
  }

  static getUsers(data: PCSVData): User[] {
    const usersTable = data.tables.users
    if (!usersTable) return []

    return usersTable.rows.map(row => ({
      id: parseInt(row[0]),
      name: row[1],
      opencloud_id: row[2] || null
    }))
  }

  static getPaymentModes(data: PCSVData): PaymentMode[] {
    const paymentTable = data.tables.payment_mode
    if (!paymentTable) return []

    return paymentTable.rows.map(row => ({
      id: parseInt(row[0]),
      name: row[1]
    }))
  }

  static getCategories(data: PCSVData): Category[] {
    const categoryTable = data.tables.category
    if (!categoryTable) return []

    return categoryTable.rows.map(row => ({
      id: parseInt(row[0]),
      name: row[1]
    }))
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
