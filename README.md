# 💰 Pare - Expense Tracking Web App

Pare is an expense tracking and bill splitting web extension built for OpenCloud.
It provides an interface for managing bills, with the ability to split them with different members.
It also keeps track of settlements, so you can see who owns the money and quickly settle the bills.


Think like baby Nextcloud Cospend. Like really simple.

**Please note**: This project was made with the help of AI. The code has been reviewed, but there's places it could be improved or refactored still. This will hopefully change in the future :).

## Screenshots


<img width="623" height="448" alt="image" src="https://github.com/user-attachments/assets/6be4535a-50a2-44da-9d58-67f4a0fe187d" />
<img width="2368" height="1342" alt="image" src="https://github.com/user-attachments/assets/389f1732-5d4c-44f1-becc-d3810c7c040c" />
<img width="2368" height="1342" alt="image" src="https://github.com/user-attachments/assets/80c407be-4fb4-45eb-a219-315bfc0af18c" />

## ✨ Features

### Expense Management
- **Bill Tracking**: Create and manage bills with detailed information including description, amount, date, time, and payment method
- **Bill Splitting**: Automatically split bills equally or customize split amounts between participants

### Member Management
- **User Profiles**: Manage group members with OpenCloud integration
- **Payment Tracking**: Track who paid for expenses and who owes money

### User Interface
- **Dark/Light Theme**: Automatic theme adaptation based on user preferences
- **Real-time Validation**: Instant feedback on form inputs and split calculations


## Development

### Prerequisites
- Node.js with (p)npm package manager
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
   Note: **it is advised to disable cache in network tab in developer tools in your browser, otherwise you won't see updates**

### Data Format
The application includes a JSON parser (`PSONParser`) that handles data validation and transformation for bills, users etc.
The format is better described in [PSON File Format specification](./pson_file_format.md).
