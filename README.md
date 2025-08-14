# 💰 Pare - Expense Tracking Web App

Pare is a backendless expense tracking and bill splitting web application built for OpenCloud. It provides an intuitive interface for managing shared expenses, tracking bills, and splitting costs between group members.


Think like baby Nextcloud Cospend. Like really simple.

**Please note**: This project was made heavily relying on AI, code is not perfect and there's many places it could be improved. This will hopefully change in the future :).

## Screenshots


<img width="623" height="448" alt="image" src="https://github.com/user-attachments/assets/6be4535a-50a2-44da-9d58-67f4a0fe187d" />
<img width="2368" height="1342" alt="image" src="https://github.com/user-attachments/assets/389f1732-5d4c-44f1-becc-d3810c7c040c" />
<img width="2368" height="1342" alt="image" src="https://github.com/user-attachments/assets/80c407be-4fb4-45eb-a219-315bfc0af18c" />

## ✨ Features

### 📊 Expense Management
- **Bill Tracking**: Create and manage bills with detailed information including description, amount, date, time, and payment method
- **Bill Splitting**: Automatically split bills equally or customize split amounts between participants

### 👥 Member Management
- **User Profiles**: Manage group members with OpenCloud integration
- **Payment Tracking**: Track who paid for expenses and who owes money
- **Member Statistics**: View spending patterns and balances (todo)

### 🗂️ Organization
- **Categories**: Organize expenses by category (Food, Transportation, Entertainment, etc.)
- **Payment Modes**: Track different payment methods (Cash, Credit Card, Bank Transfer, Digital Wallet)
- **Date/Time Tracking**: Precise timestamp recording for all transactions

### 🎨 User Interface
- **Dark/Light Theme**: Automatic theme adaptation based on user preferences
- **Real-time Validation**: Instant feedback on form inputs and split calculations

## 🏗️ Architecture

### 🚀 Backendless Design
Pare operates without a traditional backend server. Instead, it uses JSON files with a custom extension (.pson) as the data storage format. Description of the format can be found at [pson_file_format.md](./pson_file_format.md).

### 📋 Data Structure
The application parses and manages JSON data containing:
- **Bills**: Expense records with metadata
- **Bill Splits**: Individual user portions of each bill
- **Users**: Group member information
- **Categories**: Expense categorization data
- **Payment Modes**: Available payment methods

## 🚀 Getting Started

### 📋 Prerequisites
- Node.js (version specified in package.json)
- pnpm package manager
- Docker and Docker Compose (for OpenCloud development environment)

### ⚙️ Development Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd web-app-pare
   pnpm install
   ```

2. **Development Build**
   ```bash
   pnpm build:w
   ```

3. **OpenCloud Environment**
   ```bash
   # Add to /etc/hosts
   echo "127.0.0.1 cloud.opencloud.test" >> /etc/hosts
   
   # Start development server
   docker compose up
   ```

4. **Access Application**
   Navigate to `https://cloud.opencloud.test`
   Default credentials: `admin` / `admin`

### 📄 Data Format

CSV files should follow the expected schema for:
- Bills with split information
- User profiles and balances  
- Category and payment mode definitions

The application includes a JSON parser (`PSONParser`) that handles data validation and transformation.

## 📖 Usage

### ➕ Creating Bills
1. Navigate to the Bills section
2. Click "Create Bill" 
3. Fill in bill details (description, amount, date, payment method)
4. Select participating members in the split sidebar
5. Choose equal split or customize amounts
6. Save the bill

### ⚖️ Managing Splits
- **Equal Split**: Automatically divides amount evenly between selected members
- **Custom Split**: Manually specify individual amounts
- **Real-time Validation**: Ensures split amounts match bill total
- **Visual Feedback**: Clear indication of split discrepancies

### 👀 Viewing Data
- **Pagination**: Navigate through large lists of bills/members
- **Selection States**: Visual highlighting of selected items
- **Detail Panels**: Comprehensive editing interface
- **Statistics**: Overview of spending patterns and balances

## 💻 Development

### 📁 Project Structure
```
src/
├── components/          # Vue components
│   ├── forms/          # Form controls and inputs
│   ├── panels/         # Main UI panels
│   └── ...
├── composables/        # Vue composition functions
├── styles/            # SCSS stylesheets and mixins
├── types/             # TypeScript type definitions
└── utils/             # Utility functions and CSV parser
```

### 🔧 Key Components
- **BillForm**: Comprehensive bill creation/editing interface
- **SplitUserControls**: Interactive bill splitting interface
- **ContentPanel**: Reusable data display with pagination
- **DetailPanelHeader**: Consistent header for all detail views

### 🔨 Building
```bash
# Development build with watching
pnpm build:w

# Production build
pnpm build

# Run tests
pnpm test:unit
```
