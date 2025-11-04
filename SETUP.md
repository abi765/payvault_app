# PayVault Setup Guide 🚀

Complete step-by-step guide to get PayVault running on your laptops.

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Node.js installed (v16 or higher) - [Download here](https://nodejs.org/)
- [ ] Git installed - [Download here](https://git-scm.com/)
- [ ] AWS RDS PostgreSQL database credentials
- [ ] Text editor (VS Code recommended)
- [ ] Terminal/Command Prompt access

## Step 1: Install Node.js

### Windows:
1. Download Node.js installer from https://nodejs.org/
2. Run the installer (select all default options)
3. Verify installation:
```bash
node --version
npm --version
```

### macOS:
1. Download Node.js installer from https://nodejs.org/
2. Run the .pkg installer
3. Verify installation:
```bash
node --version
npm --version
```

## Step 2: Clone the Repository

```bash
# Navigate to your desired folder
cd ~/Downloads

# Clone the repository
git clone https://github.com/abi765/payvault_app.git

# Enter the project folder
cd payvault_app
```

## Step 3: Setup AWS RDS Database

### Create Database

1. Log in to your AWS RDS PostgreSQL instance using a client like pgAdmin or psql
2. Create a new database:

```sql
CREATE DATABASE payvault;
```

3. Note down these credentials:
   - Database Host (endpoint)
   - Database Port (usually 5432)
   - Database Name (payvault)
   - Database Username
   - Database Password

## Step 4: Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies (this may take 2-3 minutes)
npm install
```

### Configure Environment Variables

1. Copy the example environment file:

**Windows (Command Prompt):**
```bash
copy .env.example .env
```

**macOS/Linux:**
```bash
cp .env.example .env
```

2. Open `.env` file in a text editor and update:

```env
PORT=5000
NODE_ENV=development

# Your AWS RDS credentials
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=5432
DB_NAME=payvault
DB_USER=your-db-username
DB_PASSWORD=your-db-password

# Generate a random secret (or use this one for now)
JWT_SECRET=PayVaultSecretKey2024!ChangeThisInProduction

FRONTEND_URL=http://localhost:3000
```

### Run Database Migration

This creates all necessary tables:

```bash
npm run migrate
```

You should see:
```
✓ Employees table created
✓ Salary payments table created
✓ Users table created
✓ Audit logs table created
✓ Database indexes created
✓ Default admin user created
✅ Database migration completed successfully!
```

### Start Backend Server

```bash
npm run dev
```

You should see:
```
🚀 PayVault Backend Server running on port 5000
📡 WebSocket server ready for real-time sync
🌍 Environment: development
```

**Keep this terminal window open!**

## Step 5: Frontend Setup

Open a **NEW** terminal window:

```bash
# Navigate to frontend folder
cd payvault_app/frontend

# Install dependencies (this may take 2-3 minutes)
npm install

# Start development server
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

**Keep this terminal window open too!**

## Step 6: Access the Application

1. Open your web browser
2. Navigate to: **http://localhost:3000**
3. Login with default credentials:
   - Username: `admin`
   - Password: `admin123`

## Step 7: Change Default Password

**IMPORTANT:** After first login:

1. Go to user settings (if implemented) or
2. Manually update in database, or
3. Add password change functionality

## Step 8: Setup on Additional Laptops

Repeat Steps 1-6 on each laptop. All laptops will sync in real-time!

## Common Issues & Solutions

### Issue 1: "Port 5000 already in use"

**Solution:** Change the port in backend `.env`:
```env
PORT=5001
```

Then update frontend API URL if needed.

### Issue 2: "Cannot connect to database"

**Solutions:**
1. Verify AWS RDS security group allows your IP
2. Check database credentials in `.env`
3. Ensure RDS instance is running
4. Test connection using pgAdmin or psql

### Issue 3: "npm install fails"

**Solutions:**
1. Delete `node_modules` folder
2. Delete `package-lock.json`
3. Run `npm install` again
4. Check internet connection

### Issue 4: "Module not found"

**Solution:**
```bash
# In the affected folder (backend or frontend)
rm -rf node_modules package-lock.json
npm install
```

### Issue 5: Backend starts but frontend can't connect

**Solution:**
1. Check backend is running on port 5000
2. Verify no CORS errors in browser console
3. Check `VITE_API_URL` in frontend if you created `.env`

### Issue 6: Real-time sync not working

**Solutions:**
1. Check WebSocket connection in browser console
2. Verify both laptops can reach the backend server
3. Check firewall settings

## Testing the Application

### Test 1: Add an Employee

1. Go to **Employees** page
2. Click **"+ Add Employee"**
3. Fill in details:
   - Employee ID: EMP001
   - Full Name: John Doe
   - Bank Account: 1234567890
   - Salary: 5000
4. Click Save
5. Verify employee appears in the list

### Test 2: Check Duplicate Bank Account

1. Try adding another employee with the same bank account
2. You should see a warning message
3. This prevents the manual error you mentioned!

### Test 3: Generate Salary

1. Go to **Salary Processing** page
2. Select current month
3. Click **"Generate Salary"**
4. Verify payment records are created
5. Export to CSV and check the file

### Test 4: Real-Time Sync

1. Open application on two laptops
2. Add/edit employee on laptop 1
3. Verify changes appear on laptop 2 automatically
4. Check connection status indicator (green dot)

## Production Deployment (Optional)

For production use:

1. Use a proper server (not localhost)
2. Enable HTTPS/SSL
3. Use strong JWT secret
4. Set `NODE_ENV=production`
5. Enable database backups
6. Restrict database access

## Maintenance

### Daily:
- Backup database
- Check application logs

### Weekly:
- Review audit logs
- Verify all employees updated

### Monthly:
- Update dependencies if needed
- Review security settings

## Support Contacts

- Technical Lead: [Your Email]
- Database Admin: [DB Admin Email]
- AWS Account: [AWS Contact]

## Quick Command Reference

### Start Application:

**Terminal 1 (Backend):**
```bash
cd payvault_app/backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd payvault_app/frontend
npm run dev
```

### Stop Application:

Press `Ctrl+C` in each terminal window

### Update Application:

```bash
# Pull latest changes
git pull

# Update backend
cd backend
npm install

# Update frontend
cd ../frontend
npm install
```

## Next Steps

1. ✅ Add all your employees
2. ✅ Verify bank account numbers
3. ✅ Test salary generation for next month
4. ✅ Train all users on the system
5. ✅ Setup regular backups

---

**Need Help?** Create an issue on GitHub or contact the development team.

**Success!** 🎉 You now have a secure, cloud-synced payroll system!
