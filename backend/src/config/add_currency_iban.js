const pool = require('./database');

const addCurrencyAndIban = async () => {
  const client = await pool.connect();

  try {
    console.log('Adding currency and IBAN fields...');

    // Add currency column to employees table
    await client.query(`
      ALTER TABLE employees
      ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'PKR' CHECK (currency IN ('PKR', 'GBP', 'USD'));
    `);
    console.log('✓ Currency column added to employees table');

    // Add IBAN column to employees table
    await client.query(`
      ALTER TABLE employees
      ADD COLUMN IF NOT EXISTS iban VARCHAR(34);
    `);
    console.log('✓ IBAN column added to employees table');

    // Add country column to employees table
    await client.query(`
      ALTER TABLE employees
      ADD COLUMN IF NOT EXISTS bank_country VARCHAR(50) DEFAULT 'Pakistan';
    `);
    console.log('✓ Bank country column added to employees table');

    // Add currency column to salary_payments table
    await client.query(`
      ALTER TABLE salary_payments
      ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'PKR' CHECK (currency IN ('PKR', 'GBP', 'USD'));
    `);
    console.log('✓ Currency column added to salary_payments table');

    // Create index on IBAN for faster searches
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_employees_iban ON employees(iban);
    `);
    console.log('✓ IBAN index created');

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNew fields added:');
    console.log('  - currency (PKR, GBP, USD)');
    console.log('  - iban (for Pakistani and international banks)');
    console.log('  - bank_country (default: Pakistan)\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Run migration
addCurrencyAndIban()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
