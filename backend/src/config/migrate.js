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

    // Create location logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS location_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action_type VARCHAR(100) NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        accuracy DECIMAL(10, 2),
        ip_address VARCHAR(45),
        device_info JSONB,
        action_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Location logs table created');

    // Create push subscriptions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL,
        p256dh_key TEXT NOT NULL,
        auth_key TEXT NOT NULL,
        device_info JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, endpoint)
      );
    `);
    console.log('✓ Push subscriptions table created');

    // Create notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        body TEXT,
        type VARCHAR(50),
        data JSONB,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP
      );
    `);
    console.log('✓ Notifications table created');

    // Create sync queue table (for offline sync)
    await client.query(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(20) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        synced BOOLEAN DEFAULT false,
        synced_at TIMESTAMP
      );
    `);
    console.log('✓ Sync queue table created');

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
      CREATE INDEX IF NOT EXISTS idx_employees_bank_account ON employees(bank_account_number);
      CREATE INDEX IF NOT EXISTS idx_salary_payments_month ON salary_payments(payment_month);
      CREATE INDEX IF NOT EXISTS idx_salary_payments_status ON salary_payments(status);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_location_logs_user ON location_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_location_logs_action ON location_logs(action_type);
      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read_at);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_user ON sync_queue(user_id, synced);
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
