# PayVault - Python Flask Backend

Simple, easy-to-deploy salary management system backend.

## ✨ Features

- 🐍 **Pure Python** - No Node.js required
- 💾 **SQLite Database** - No external database setup needed
- 🚀 **One Command Start** - `python app.py`
- 📱 **Mobile Ready** - Works with React PWA frontend
- ☁️ **Easy Deploy** - Free deployment to Render, PythonAnywhere, etc.

## 🚀 Quick Start (2 Minutes)

### Option 1: Simple Setup (Recommended)

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Run the app (database auto-created)
python app.py
```

That's it! The app will run on http://localhost:5000

### Option 2: Using Virtual Environment

```bash
# 1. Create virtual environment
python -m venv venv

# 2. Activate it
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the app
python app.py
```

## 📦 What You Get

- ✅ REST API on http://localhost:5000
- ✅ SQLite database (payvault.db file)
- ✅ Default admin user: `admin` / `admin123`
- ✅ Auto-creates all tables on first run

## 🔧 Configuration

Create `.env` file (optional):

```env
PORT=5000
DEBUG=True
DATABASE_URL=sqlite:///payvault.db
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Salary
- `POST /api/salary/generate` - Generate monthly salary
- `GET /api/salary` - List salary payments
- `PUT /api/salary/:id/status` - Update payment status
- `GET /api/salary/stats` - Get statistics

## 🌐 Deploy to Cloud (Free)

### Deploy to Render.com (Recommended)

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create new Web Service
4. Connect your GitHub repo
5. Set:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Environment**: Add `DATABASE_URL` for PostgreSQL

### Deploy to PythonAnywhere

1. Upload code to PythonAnywhere
2. Create new web app (Flask)
3. Point to `app.py`
4. Install requirements: `pip install -r requirements.txt`
5. Reload web app

## 💾 Database

### SQLite (Default - Development)
- File: `payvault.db`
- No setup required
- Perfect for testing

### PostgreSQL (Production)
Set environment variable:
```env
DATABASE_URL=postgresql://user:password@host:5432/payvault
```

## 🔐 Security

- ✅ JWT authentication
- ✅ Bcrypt password hashing
- ✅ CORS enabled
- ✅ SQL injection protected (SQLAlchemy)

**⚠️ Change default admin password in production!**

## 📱 Use with React Frontend

The frontend is already configured. Just:

1. Keep this backend running on port 5000
2. Frontend will auto-connect
3. Login with `admin` / `admin123`

## 🆘 Troubleshooting

**Port already in use?**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

**Database errors?**
```bash
# Delete and recreate database
rm payvault.db
python app.py
```

**Module not found?**
```bash
# Reinstall requirements
pip install -r requirements.txt --upgrade
```

## 📊 Database Schema

### Tables
- `users` - System users (admin, user, viewer)
- `employees` - Employee information
- `salary_payments` - Monthly salary records

## 🎯 Next Steps

1. ✅ App is running
2. 📝 Change admin password
3. 👥 Add employees
4. 💰 Generate salary
5. ☁️ Deploy to cloud (optional)

## 📄 License

MIT License - Free to use and modify

---

**Ready to use!** 🎉

Login: http://localhost:5000
Username: `admin`
Password: `admin123`
