# PSON File Format Specification

## Overview

PSON (Pare JSON) is a JSON-based file format for budget tracking and expense splitting. It provides a structured, efficient way to store and manage financial data with direct object access by ID.

## File Structure

The file consists of two main sections: `meta` for metadata and `data` for the actual content. All data objects are stored as key-value pairs where keys are string representations of their IDs.

### Basic Format
```json
{
  "meta": {
    "version": "1.0",
    "created": "timestamp",
    "modified": "timestamp"
  },
  "data": {
    "users": { /* user objects */ },
    "payment_modes": { /* payment mode objects */ },
    "categories": { /* category objects */ },
    "bills": { /* bill objects with nested splits */ }
  }
}
```

## Data Definitions

### 1. Users
People who can pay bills or owe money, including their current balances.

**Structure:**
```json
"users": {
  "1": {
    "name": "Display name of the user (string)",
    "opencloud_id": "OpenCloud user ID for integration (string, can be null/empty)",
    "balance": "Current calculated balance for this user (decimal, can be null)"
  }
}
```

**Fields:**
- `name`: Display name of the user (string)
- `opencloud_id`: OpenCloud user ID for integration (string, can be null/empty for users not in this OpenCloud instance)
- `balance`: Current calculated balance for this user (decimal, can be null if not calculated)

**Balance Calculation:**
- Balance = (Total amount paid by user) - (Total amount owed by user across all bill splits)
- Positive balance means the user is owed money
- Negative balance means the user owes money
- Balance field is optional and used for performance optimization

**Example:**
```json
"users": {
  "1": {
    "name": "Ash",
    "opencloud_id": "ash.android",
    "balance": -100.00
  },
  "2": {
    "name": "Bishop",
    "opencloud_id": "bishop.synthetic",
    "balance": -200.00
  }
}
```

### 2. Payment Modes
Methods of payment (cash, card, bank transfer, etc.).

**Structure:**
```json
"payment_modes": {
  "1": {
    "name": "Name of the payment method (string)"
  }
}
```

**Fields:**
- `name`: Name of the payment method (string)

**Example:**
```json
"payment_modes": {
  "1": { "name": "Cash" },
  "2": { "name": "Credit Card" },
  "3": { "name": "Bank Transfer" },
  "4": { "name": "PayPal" }
}
```

### 3. Categories
Expense categories for organizing transactions.

**Structure:**
```json
"categories": {
  "1": {
    "name": "Name of the category (string)"
  }
}
```

**Fields:**
- `name`: Name of the category (string)

**Example:**
```json
"categories": {
  "1": { "name": "Food" },
  "2": { "name": "Equipment" },
  "3": { "name": "Transport" },
  "4": { "name": "Utilities" }
}
```

### 4. Bills
Primary objects containing expense/income transactions with nested splits.

**Structure:**
```json
"bills": {
  "1": {
    "description": "What was purchased/paid for (string)",
    "total_amount": "Total amount in currency (decimal, can be negative for income)",
    "who_paid_id": "Reference to users - who made the payment (string)",
    "timestamp": "Unix timestamp when the transaction occurred (integer, milliseconds since epoch)",
    "repeat": "Recurring frequency (None, Daily, Weekly, Monthly, Yearly)",
    "payment_mode_id": "Reference to payment_modes (string, can be null)",
    "category_id": "Reference to categories (string, can be null)",
    "comment": "Additional notes (string, can be empty)",
    "file_link": "URL or path to attached file (string, can be empty)",
    "splits": {
      "1": {
        "user_id": "Reference to users (string)",
        "amount": "Amount this user owes for this bill (decimal)"
      }
    }
  }
}
```

**Fields:**
- `description`: What was purchased/paid for (string)
- `total_amount`: Total amount in currency (decimal, can be negative for income)
- `who_paid_id`: Reference to users - who made the payment (string)
- `timestamp`: Unix timestamp when the transaction occurred (integer, milliseconds since epoch)
- `repeat`: Recurring frequency (None, Daily, Weekly, Monthly, Yearly)
- `payment_mode_id`: Reference to payment_modes (string, can be null)
- `category_id`: Reference to categories (string, can be null)
- `comment`: Additional notes (string, can be empty)
- `file_link`: URL or path to attached file (string, can be empty)
- `splits`: Nested object containing how the bill is split among users

**Example:**
```json
"bills": {
  "1": {
    "description": "Space suits",
    "total_amount": 8000.00,
    "who_paid_id": "5",
    "timestamp": 348872400000,
    "repeat": "None",
    "payment_mode_id": "1",
    "category_id": "2",
    "comment": "With radio heater and 2 hours oxygen!!!",
    "file_link": "https://example.com/receipt.pdf",
    "splits": {
      "1": {
        "user_id": "1",
        "amount": 2666.67
      },
      "2": {
        "user_id": "2",
        "amount": 2666.67
      }
    }
  }
}
```

## Validation Rules

1. **Referential Integrity**:
   - `who_paid_id` in bills must reference existing user
   - `user_id` in bill splits must reference existing user
   - `payment_mode_id` and `category_id` can be null or must reference existing entries

2. **Amount Validation**:
   - Sum of included bill split amounts should equal the bill's total_amount
   - Amounts can be negative (for income/refunds)

3. **Balance Validation**:
   - If balance field is present, applications should validate against calculated balances periodically
   - If balance field is missing or null, fall back to real-time calculation
   - When bills/splits change, update user balances or mark them for recalculation

4. **Timestamp Format**: Unix timestamps in milliseconds since epoch (integer values)

5. **Required Fields**:
   - Bills: description, total_amount, who_paid_id, timestamp
   - Users: name
   - All other fields can be empty/null

## Example Complete File

```json
{
  "meta": {
    "version": "1.0",
    "created": "2023-01-01T00:00:00Z",
    "modified": "2023-01-02T00:00:00Z"
  },
  "data": {
    "users": {
      "1": {
        "name": "Ellen Ripley",
        "opencloud_id": "ripley.lv426",
        "balance": 3987.50
      },
      "2": {
        "name": "Carter Burke",
        "opencloud_id": "burke.corp",
        "balance": -3987.50
      }
    },
    "payment_modes": {
      "1": { "name": "Company Card" },
      "2": { "name": "Personal Cash" }
    },
    "categories": {
      "1": { "name": "Equipment" },
      "2": { "name": "Food" }
    },
    "bills": {
      "1": {
        "description": "Space suits",
        "total_amount": 8000.00,
        "who_paid_id": "1",
        "timestamp": 348872400000,
        "repeat": "None",
        "payment_mode_id": "1",
        "category_id": "1",
        "comment": "Emergency suits for away mission",
        "file_link": "",
        "splits": {
          "1": {
            "user_id": "1",
            "amount": 4000.00
          },
          "2": {
            "user_id": "2",
            "amount": 4000.00
          }
        }
      },
      "2": {
        "description": "Coffee supplies",
        "total_amount": 25.00,
        "who_paid_id": "2",
        "timestamp": 348945300000,
        "repeat": "Weekly",
        "payment_mode_id": "2",
        "category_id": "2",
        "comment": "Keep the crew caffeinated",
        "file_link": "",
        "splits": {
          "3": {
            "user_id": "1",
            "amount": 12.50
          },
          "4": {
            "user_id": "2",
            "amount": 12.50
          }
        }
      }
    }
  }
}
```