const pool = require('./database');

const createTables = async () => {
  const client = await pool.connect();

  try {
    console.log('Starting database migration...');

    // Create employees table
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        employee_id VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        address TEXT,
        bank_account_number VARCHAR(50) NOT NULL,
        bank_name VARCHAR(255),
        bank_branch VARCHAR(255),
        ifsc_code VARCHAR(20),
        salary DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100),
        updated_by VARCHAR(100)
      );
    `);
    console.log('✓ Employees table created');

    // Create salary_payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS salary_payments (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        payment_month VARCHAR(7) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
        processed_at TIMESTAMP,
        processed_by VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, payment_month)
      );
    `);
    console.log('✓ Salary payments table created');

    // Create users table for authentication
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      );
    `);
    console.log('✓ Users table created');

    // Create audit log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER,
        old_values JSONB,
        new_values JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Audit logs table created');

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
      CREATE INDEX IF NOT EXISTS idx_employees_bank_account ON employees(bank_account_number);
      CREATE INDEX IF NOT EXISTS idx_salary_payments_month ON salary_payments(payment_month);
      CREATE INDEX IF NOT EXISTS idx_salary_payments_status ON salary_payments(status);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
    `);
    console.log('✓ Database indexes created');

    // Create a default admin user (password: admin123 - should be changed)
    const bcrypt = require('bcrypt');
    const defaultPassword = await bcrypt.hash('admin123', 10);

    await client.query(`
      INSERT INTO users (username, password_hash, full_name, role)
      VALUES ('admin', $1, 'Administrator', 'admin')
      ON CONFLICT (username) DO NOTHING;
    `, [defaultPassword]);
    console.log('✓ Default admin user created (username: admin, password: admin123)');

    console.log('\n✅ Database migration completed successfully!');
    console.log('\nIMPORTANT: Please change the default admin password after first login.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Run migration
createTables()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
