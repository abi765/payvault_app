# Changelog

All notable changes to PayVault will be documented in this file.

## [0.0.1] - 2025-11-04

### Added - Multi-Currency & International Banking Support

#### Core Features
- **Multi-Currency Support**: Full support for PKR (Pakistani Rupee), GBP (British Pound), and USD (US Dollar)
- **International Banking**: Support for both Pakistani and UK banking systems
- **IBAN Support**: Required field for Pakistani bank accounts with validation (PK + 24 characters)
- **Sort Code Support**: Required field for UK bank accounts with validation (6 digits)
- **Bank Country Selection**: Choose between Pakistan and United Kingdom with country-specific bank lists
- **Auto-Currency Detection**: Currency automatically set based on selected bank country

#### Database Enhancements
- Added `currency` column to employees table (PKR, GBP, USD)
- Added `iban` column for international banking (varchar 34)
- Added `sort_code` column for UK banks (varchar 10)
- Added `bank_country` column (default: Pakistan)
- Added `currency` column to salary_payments table
- Created indexes on IBAN and sort_code for faster searches

#### Frontend Improvements
- **Employee Modal**: Enhanced with conditional fields based on bank country
  - Pakistani banks: Show IBAN field (required)
  - UK banks: Show Sort Code field (required)
  - Country-specific bank dropdown lists
  - Real-time currency auto-update based on country
  - Improved field grouping and layout

- **Currency Display**: Consistent currency formatting across all pages
  - Dashboard: Shows salary in employee's currency
  - Employees Page: Displays salary with correct currency symbol
  - Salary Page: Individual payments show in their respective currencies
  - Statistics: Separate totals for each currency (e.g., Rs 202,000 + £ 5,000)

- **Validation Enhancements**:
  - Pakistani IBAN: Validates PK prefix and 24-character format
  - UK Sort Code: Validates 6-digit format (accepts XX-XX-XX or XXXXXX)
  - UK Account Numbers: 7-11 digits (8 is standard)
  - Pakistani Account Numbers: 10-20 digits
  - Bank-specific validation messages

#### Backend Updates
- **Employee Model**: Updated to handle currency, IBAN, sort_code, and bank_country
- **Salary Model**:
  - Copies employee currency when generating salary
  - Returns currency-separated totals in statistics
  - Includes currency field in all salary queries
- **Validation Middleware**: Added validation for IBAN, sort_code, bank_country, and currency
- **Migration Scripts**:
  - `add_currency_iban.js`: Adds currency, IBAN, and bank_country fields
  - `add_sort_code.js`: Adds sort_code field for UK banks
  - `add_user.js`: Script to add new admin users

#### Configuration
- Updated backend port to 5001 (to avoid macOS ControlCenter conflict)
- Updated frontend API and WebSocket URLs to use port 5001

### Bank Lists
#### Pakistani Banks
- Allied Bank Limited
- Askari Bank
- Bank Alfalah
- Bank Al-Habib
- Faysal Bank
- Habib Bank Limited (HBL)
- Habib Metropolitan Bank
- JS Bank
- MCB Bank
- Meezan Bank
- National Bank of Pakistan (NBP)
- Silk Bank
- Soneri Bank
- Standard Chartered Bank
- Summit Bank
- United Bank Limited (UBL)

#### UK Banks
- Barclays
- HSBC UK
- Lloyds Bank
- NatWest
- Royal Bank of Scotland (RBS)
- Santander UK
- Halifax
- TSB Bank
- Co-operative Bank
- Nationwide Building Society
- Metro Bank
- Monzo
- Revolut
- Starling Bank
- Virgin Money
- Yorkshire Bank
- Clydesdale Bank
- First Direct
- Bank of Scotland

### Technical Details
- Currency symbols: Rs (PKR), £ (GBP), $ (USD)
- Number formatting: Comma-separated with 2 decimal places
- Separate currency totals prevent incorrect addition of different currencies
- Real-time WebSocket updates for multi-currency data

### Documentation
- Added QUICK_START.md for rapid setup
- Database migration scripts included
- User creation script for adding admin users

---

## Previous Releases

See individual commit history for changes prior to version 0.0.1.
