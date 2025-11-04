const pool = require('./database');

const addSortCode = async () => {
  const client = await pool.connect();

  try {
    console.log('Adding sort code field for UK banks...');

    // Add sort_code column to employees table
    await client.query(`
      ALTER TABLE employees
      ADD COLUMN IF NOT EXISTS sort_code VARCHAR(10);
    `);
    console.log('✓ Sort code column added to employees table');

    // Create index on sort_code for faster searches
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_employees_sort_code ON employees(sort_code);
    `);
    console.log('✓ Sort code index created');

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNew field added:');
    console.log('  - sort_code (for UK bank sort codes)\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Run migration
addSortCode()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
