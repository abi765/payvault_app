const pool = require('./database');
const bcrypt = require('bcryptjs');

/**
 * Script to add a new admin user to the PayVault system
 * Usage: node src/config/add_user.js <username> <password>
 * Example: node src/config/add_user.js john password123
 */

const addUser = async (username, password) => {
  const client = await pool.connect();

  try {
    if (!username || !password) {
      console.error('❌ Error: Username and password are required');
      console.log('\nUsage: node src/config/add_user.js <username> <password>');
      console.log('Example: node src/config/add_user.js john password123\n');
      process.exit(1);
    }

    console.log(`Adding new admin user: ${username}...`);

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      console.error(`❌ Error: User '${username}' already exists`);
      process.exit(1);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert the new user
    const result = await client.query(
      `INSERT INTO users (username, password, role, created_at)
       VALUES ($1, $2, 'admin', CURRENT_TIMESTAMP)
       RETURNING id, username, role, created_at`,
      [username, hashedPassword]
    );

    const newUser = result.rows[0];

    console.log('\n✅ User created successfully!');
    console.log('\nUser Details:');
    console.log(`  - Username: ${newUser.username}`);
    console.log(`  - Role: ${newUser.role}`);
    console.log(`  - Created: ${newUser.created_at}`);
    console.log('\nYou can now login with:');
    console.log(`  Username: ${username}`);
    console.log(`  Password: ${password}\n`);

  } catch (error) {
    console.error('❌ Error adding user:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Get command line arguments
const username = process.argv[2];
const password = process.argv[3];

// Run the script
addUser(username, password)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
