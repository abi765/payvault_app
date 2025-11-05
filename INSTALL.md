# PayVault Installation Guide

## macOS Installation

### Download
Download `PayVault-0.0.1-arm64.dmg` from the [latest release](https://github.com/abi765/payvault_app/releases/latest)

### Installation Steps

1. **Open the .dmg file**
   - Double-click the downloaded `PayVault-0.0.1-arm64.dmg` file

2. **Drag PayVault to Applications**
   - Drag the PayVault icon to the Applications folder

3. **First Launch - Bypass Gatekeeper**

   Since PayVault is not signed with an Apple Developer certificate, macOS will block it on first launch. Follow these steps:

   **Option A: Using Right-Click (Recommended)**
   - Go to Applications folder
   - **Right-click** (or Control-click) on PayVault.app
   - Select **"Open"** from the menu
   - Click **"Open"** in the security dialog
   - PayVault will now launch and you won't need to do this again

   **Option B: Using System Settings**
   - Try to open PayVault normally (it will be blocked)
   - Go to **System Settings > Privacy & Security**
   - Scroll down to the "Security" section
   - Click **"Open Anyway"** next to the PayVault message
   - Click **"Open"** in the confirmation dialog

   **Option C: Using Terminal (Advanced)**
   ```bash
   xattr -d com.apple.quarantine /Applications/PayVault.app
   ```

   Or if that doesn't work, try:
   ```bash
   xattr -c /Applications/PayVault.app
   ```

4. **Future Launches**
   - After the first successful launch, you can open PayVault normally from Applications

### Troubleshooting

**"PayVault is damaged and can't be opened"**
- This happens because the app is unsigned
- Use Option C from above (Terminal command) to remove the quarantine flag
- Or download the latest version from GitHub releases

**Backend server won't start**
- Make sure you have Node.js installed on your system
- Check that no other application is using port 5001

## Windows Installation

### Download
Download `PayVault Setup 0.0.1.exe` from the [latest release](https://github.com/abi765/payvault_app/releases/latest)

### Installation Steps

1. **Run the Installer**
   - Double-click `PayVault Setup 0.0.1.exe`

2. **Windows SmartScreen Warning**
   - If you see "Windows protected your PC", click **"More info"**
   - Click **"Run anyway"**

3. **Follow the Setup Wizard**
   - Choose installation directory
   - Select desktop shortcut option
   - Click "Install"

4. **Launch PayVault**
   - Launch from Start Menu or Desktop shortcut

### Troubleshooting

**"Windows Defender blocked this app"**
- Click "More info"
- Click "Run anyway"
- This happens because the app is not signed with a Windows code signing certificate

## Database Setup

Before using PayVault, you need to set up a PostgreSQL database:

1. **Create PostgreSQL Database**
   ```sql
   -- Run the create_database.sql script
   psql -U postgres < create_database.sql
   ```

2. **Update Configuration**
   - PayVault will prompt for database credentials on first launch
   - Or manually configure the backend/.env file:
   ```
   DB_HOST=your-database-host
   DB_PORT=5432
   DB_NAME=payvault
   DB_USER=postgres
   DB_PASSWORD=your-password
   PORT=5001
   JWT_SECRET=your-jwt-secret
   ```

3. **Run Migrations**
   - Backend migrations run automatically on first start
   - Or run manually: `node backend/src/config/add_currency_iban.js`

## First Time Setup

1. **Default Admin User**
   - Username: `admin`
   - Password: `admin123`
   - **IMPORTANT**: Change this password immediately after first login

2. **Add Additional Users**
   ```bash
   cd backend
   node src/config/add_user.js <username> <password>
   ```

## Support

For issues or questions:
- GitHub Issues: https://github.com/abi765/payvault_app/issues
- Check CHANGELOG.md for version details
