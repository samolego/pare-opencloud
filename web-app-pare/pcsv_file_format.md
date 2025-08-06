# PCSV File Format Specification

## Overview

PCSV (Pare CSV) is a CSV-compatible file format for budget tracking and expense splitting. It supports multiple tables within a single file while maintaining compatibility with standard CSV readers.

## File Structure

The file consists of multiple tables, each preceded by a `TABLE,<table_name>` row. The order of tables does not matter. Each table has its own header row followed by data rows.

### Basic Format
```
TABLE,<table_name>
header1,header2,header3
data1,data2,data3
data4,data5,data6
TABLE,<another_table>
header1,header2
data1,data2
```

## Table Definitions

### 1. Bills Table
Primary table containing expense/income transactions.

**Structure:**
```
TABLE,bills
id,description,total_amount,who_paid_id,datetime,repeat,payment_mode_id,category_id,comment,file_link
```

**Fields:**
- `id`: Unique identifier for the bill (integer)
- `description`: What was purchased/paid for (string)
- `total_amount`: Total amount in currency (decimal, can be negative for income)
- `who_paid_id`: Reference to users table - who made the payment (integer)
- `datetime`: When the transaction occurred (format: DD/MM/YYYY HH:MM)
- `repeat`: Recurring frequency (None, Daily, Weekly, Monthly, Yearly)
- `payment_mode_id`: Reference to payment_mode table (integer, can be null)
- `category_id`: Reference to category table (integer, can be null)
- `comment`: Additional notes (string, can be empty)
- `file_link`: URL or path to attached file (string, can be empty)

**Example:**
```
TABLE,bills
id,description,total_amount,who_paid_id,datetime,repeat,payment_mode_id,category_id,comment,file_link
1,Space suits,8000.00,5,21/01/1981 13:00,None,1,2,With radio heater and 2 hours oxygen!!!,https://example.com/receipt.pdf
2,Grocery shopping,-45.50,1,15/01/2024 18:30,None,2,1,Weekly groceries,
```

### 2. Bill Splits Table
Defines how each bill is split among users.

**Structure:**
```
TABLE,bill_splits
id,bill_id,user_id,amount,included
```

**Fields:**
- `id`: Unique identifier for the split entry (integer)
- `bill_id`: Reference to bills table (integer)
- `user_id`: Reference to users table (integer)
- `amount`: Amount this user owes for this bill (decimal)
- `included`: Whether this user is included in the bill split (1 for yes, 0 for no)

**Example:**
```
TABLE,bill_splits
id,bill_id,user_id,amount,included
1,1,1,2666.67,1
2,1,2,2666.67,1
3,1,3,2666.67,1
4,1,4,0,0
5,1,5,0,0
6,2,1,45.50,1
```

### 3. Users Table
People who can pay bills or owe money.

**Structure:**
```
TABLE,users
id,name,opencloud_id
```

**Fields:**
- `id`: Unique identifier for the user (integer)
- `name`: Display name of the user (string)
- `opencloud_id`: OpenCloud user ID for integration (string, can be null/empty for users not in this OpenCloud instance)

**Example:**
```
TABLE,users
id,name,opencloud_id
1,Ash,ash.android
2,Bishop,bishop.synthetic
3,Ripley,ripley.warrant
4,8th passenger,
5,Weyland,weyland.corp
```

### 4. Payment Mode Table
Methods of payment (cash, card, bank transfer, etc.).

**Structure:**
```
TABLE,payment_mode
id,name
```

**Fields:**
- `id`: Unique identifier for the payment mode (integer)
- `name`: Name of the payment method (string)

**Example:**
```
TABLE,payment_mode
id,name
1,Cash
2,Credit Card
3,Bank Transfer
4,PayPal
```

### 5. Category Table
Expense categories for organizing transactions.

**Structure:**
```
TABLE,category
id,name
```

**Fields:**
- `id`: Unique identifier for the category (integer)
- `name`: Name of the category (string)

**Example:**
```
TABLE,category
id,name
1,Food
2,Equipment
3,Transport
4,Utilities
```

## File Creation Rules

### Auto-Creation of Missing Tables
When a new bill is created, the system should automatically create any missing tables with appropriate default headers. This ensures data integrity and prevents reference errors.

### Default Data
New files may be populated with basic default entries:
- Default user: Current OpenCloud user
- Basic categories: Food, Transport, Utilities, Entertainment
- Common payment modes: Cash, Card, Bank Transfer

## Parsing Rules

1. **Table Detection**: Any row starting with `TABLE,` followed by a table name indicates the start of a new table section
2. **Header Row**: The row immediately following a `TABLE,` row contains the column headers
3. **Data Rows**: All subsequent rows belong to that table until the next `TABLE,` row or end of file
4. **Empty Rows**: Empty rows should be ignored
5. **Case Sensitivity**: Table names are case-insensitive
6. **Comments**: Standard CSV parsers don't support comments, so avoid using # or other comment markers

## Validation Rules

1. **Referential Integrity**: 
   - `who_paid_id` in bills must reference existing user
   - `bill_id` in bill_splits must reference existing bill
   - `user_id` in bill_splits must reference existing user
   - `payment_mode_id` and `category_id` can be null or must reference existing entries

2. **Amount Validation**:
   - Sum of included bill_splits amounts should equal the bill's total_amount
   - Amounts can be negative (for income/refunds)

3. **Date Format**: DD/MM/YYYY HH:MM format for datetime fields

4. **Required Fields**: 
   - Bills: id, description, total_amount, who_paid_id, datetime
   - All other fields can be empty/null

## CSV Compatibility

This format is designed to be fully compatible with standard CSV readers:
- Excel, Google Sheets, and other spreadsheet applications can open PCSV files
- They will display all tables as one continuous table, which is acceptable for manual editing
- No special characters or escape sequences that might break CSV parsing
- Standard comma-separated values with proper quoting when necessary

## Example Complete File

```
TABLE,users
id,name,opencloud_id
1,Ellen Ripley,ripley.lv426
2,Carter Burke,burke.corp

TABLE,payment_mode
id,name
1,Company Card
2,Personal Cash

TABLE,category
id,name
1,Equipment
2,Food

TABLE,bills
id,description,total_amount,who_paid_id,datetime,repeat,payment_mode_id,category_id,comment,file_link
1,Space suits,8000.00,1,21/01/1981 13:00,None,1,1,Emergency suits for away mission,
2,Coffee supplies,25.00,2,22/01/1981 09:15,Weekly,2,2,Keep the crew caffeinated,

TABLE,bill_splits
id,bill_id,user_id,amount,included
1,1,1,4000.00,1
2,1,2,4000.00,1
3,2,1,12.50,1
4,2,2,12.50,1
```
