# PayVault 💰

**Employee Salary Management System**

PayVault is a secure, cloud-synced application designed to manage employee information and monthly salary processing. Built to eliminate manual errors in payroll management, it provides real-time synchronization across multiple devices and robust bank account validation.

## 🌟 Key Features

### Employee Management
- ✅ Add, edit, and delete employee records
- ✅ Store employee ID, name, address, and bank details
- ✅ Track employee status (Active/Inactive/On Leave)
- ✅ Search and filter employees
- ✅ Real-time duplicate bank account detection

### Bank Account Validation
- ✅ Automatic validation of bank account format
- ✅ Duplicate account detection across all employees
- ✅ Support for IFSC codes and bank branch information
- ✅ Alerts before saving duplicate accounts

### Salary Processing
- ✅ Generate monthly salary for all active employees
- ✅ Track payment status (Pending/Processed/Failed)
- ✅ Bulk status updates for multiple payments
- ✅ Export salary data to CSV for bank processing
- ✅ Monthly statistics and reporting

### Real-Time Sync
- ✅ WebSocket-based live updates
- ✅ Changes sync instantly across all connected devices
- ✅ Connection status indicator

### Security & Audit
- ✅ User authentication with JWT tokens
- ✅ Role-based access control
- ✅ Audit trail for all changes
- ✅ Secure password handling with bcrypt

## 🏗️ Technology Stack

**Backend:**
- Node.js + Express.js
- PostgreSQL (AWS RDS compatible)
- WebSocket for real-time sync
- JWT authentication
- bcrypt for password security

**Frontend:**
- React 18
- Vite (fast build tool)
- React Router for navigation
- Axios for API calls
- CSS3 with custom styling

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database (AWS RDS or local)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/abi765/payvault_app.git
cd payvault_app
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your database credentials
# DB_HOST=your-rds-endpoint.rds.amazonaws.com
# DB_PORT=5432
# DB_NAME=payvault
# DB_USER=your-db-username
# DB_PASSWORD=your-db-password
# JWT_SECRET=your-random-secret-key
```

### 3. Database Setup

First, create a database on your AWS RDS instance:

```sql
CREATE DATABASE payvault;
```

Then run the migration to create tables:

```bash
npm run migrate
```

This will create all necessary tables and a default admin user.

### 4. Start Backend Server

```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### 5. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

## 🔐 Default Login Credentials

```
Username: admin
Password: admin123
```

**⚠️ IMPORTANT:** Change the default password immediately after first login!

## 📱 Usage Guide

### Adding Employees

1. Navigate to **Employees** page
2. Click **"+ Add Employee"**
3. Fill in employee details:
   - Employee ID (unique)
   - Full Name
   - Address (optional)
   - Bank Account Number (validated)
   - Bank Details (optional)
   - Monthly Salary
   - Status
4. System will warn if bank account is duplicated
5. Click **"Save Employee"**

### Processing Monthly Salary

1. Navigate to **Salary Processing** page
2. Select the month using date picker
3. Click **"Generate Salary"** to create payment records for all active employees
4. Review the payment list
5. Select payments and update status:
   - Mark as **Processed** after bank transfer
   - Mark as **Failed** if payment fails
6. Export to CSV for bank processing

### Exporting Salary Data

1. Go to Salary Processing page
2. Select the month
3. Click **"Export to CSV"**
4. File downloads with format: `salary_YYYY-MM.csv`
5. Use this file for bank upload

## 💰 Cost Analysis

### Free Option (Development/Testing)
- **Supabase Free Tier**: PostgreSQL + Auth + Real-time
- **Vercel/Netlify Free**: Frontend hosting
- **Render Free Tier**: Backend hosting
- **Total: $0/month**

### Production Option (Recommended)
- **AWS RDS db.t3.micro**: ~$15-20/month
- **AWS EC2 t2.micro or Railway**: ~$5-10/month
- **Total: ~$20-30/month**

### Your Setup (Using Existing AWS RDS)
- **Additional Cost**: ~$0-5/month (minimal additional storage)
- You're already paying for RDS, just add a new database

## 🖥️ Cross-Platform Compatibility

✅ **Windows** - Fully supported
✅ **macOS** - Fully supported
✅ **Linux** - Fully supported

Runs in any modern web browser (Chrome, Firefox, Safari, Edge)

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
PORT=5000
NODE_ENV=development
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=5432
DB_NAME=payvault
DB_USER=your-db-username
DB_PASSWORD=your-db-password
JWT_SECRET=your-jwt-secret-key-change-this
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

## 📦 Production Deployment

### Backend Deployment

1. **AWS EC2 / Railway / Render:**
```bash
# Build and start
npm install --production
npm start
```

2. **Environment Variables:**
   - Set all environment variables in hosting platform
   - Change `NODE_ENV=production`
   - Update `FRONTEND_URL` to production domain

### Frontend Deployment

1. **Build for production:**
```bash
cd frontend
npm run build
```

2. **Deploy to Vercel/Netlify:**
```bash
# Vercel
vercel deploy

# Netlify
netlify deploy --prod
```

3. **Update API URL:**
   - Set `VITE_API_URL` to production backend URL
   - Set `VITE_WS_URL` to production WebSocket URL

## 🛡️ Security Best Practices

1. **Change default admin password immediately**
2. **Use strong JWT_SECRET (at least 32 characters)**
3. **Enable SSL/HTTPS in production**
4. **Restrict database access to application servers only**
5. **Regular database backups**
6. **Keep dependencies updated**

## 📊 Database Schema

### Tables:
- **employees** - Employee information and bank details
- **salary_payments** - Monthly salary payment records
- **users** - System users and authentication
- **audit_logs** - Track all changes for compliance

## 🤝 Support

For issues, questions, or feature requests:
- Create an issue on GitHub
- Email: support@payvault.com (replace with actual email)

## 📄 License

MIT License - See LICENSE file for details

## 🎯 Roadmap

- [ ] Email notifications for salary processing
- [ ] Multi-currency support
- [ ] Advanced reporting and analytics
- [ ] Mobile application (iOS/Android)
- [ ] Integration with accounting software
- [ ] Biometric authentication
- [ ] Automated bank file generation

## 👨‍💻 Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Code Structure

```
payvault/
├── backend/
│   ├── src/
│   │   ├── config/        # Database and app config
│   │   ├── controllers/   # Request handlers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth and validation
│   │   └── server.js      # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   └── App.jsx        # Main app
│   └── package.json
└── README.md
```

---

**Built with ❤️ for efficient payroll management**
