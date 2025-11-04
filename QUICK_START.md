# PayVault - Quick Start Guide ⚡

Get PayVault running in **10 minutes**!

## 📥 Step 1: Download (2 min)

```bash
git clone https://github.com/abi765/payvault_app.git
cd payvault_app
```

## 🗄️ Step 2: Database Setup (2 min)

Connect to your AWS RDS and create database:

```sql
CREATE DATABASE payvault;
```

## ⚙️ Step 3: Backend Setup (3 min)

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
DB_HOST=your-rds-endpoint.amazonaws.com
DB_NAME=payvault
DB_USER=your-username
DB_PASSWORD=your-password
JWT_SECRET=change-this-secret-key
```

Run migration and start:
```bash
npm run migrate
npm run dev
```

## 🎨 Step 4: Frontend Setup (3 min)

Open **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

## 🚀 Step 5: Login & Use

1. Open browser: **http://localhost:3000**
2. Login: `admin` / `admin123`
3. Start adding employees!

## ✅ Success Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can login to application
- [ ] Can add an employee
- [ ] Can generate salary

## 🆘 Problems?

**Backend won't start?**
- Check database credentials in `.env`
- Verify RDS security group allows your IP

**Frontend can't connect?**
- Ensure backend is running
- Check no firewall blocking port 5000

**Need detailed help?**
- Read [SETUP.md](SETUP.md) for comprehensive guide
- Read [README.md](README.md) for full documentation

---

**That's it!** You now have a working PayVault installation. 🎉

**Recommended pricing:** $800-$1,200 one-time or $49-$79/month SaaS
