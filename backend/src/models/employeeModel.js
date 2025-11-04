const pool = require('../config/database');

class Employee {
  // Get all employees
  static async getAll(status = null) {
    try {
      let query = 'SELECT * FROM employees';
      const params = [];

      if (status) {
        query += ' WHERE status = $1';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get employee by ID
  static async getById(id) {
    try {
      const result = await pool.query(
        'SELECT * FROM employees WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get employee by employee_id
  static async getByEmployeeId(employeeId) {
    try {
      const result = await pool.query(
        'SELECT * FROM employees WHERE employee_id = $1',
        [employeeId]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Check for duplicate bank account
  static async checkDuplicateBankAccount(bankAccountNumber, excludeId = null) {
    try {
      let query = 'SELECT id, employee_id, full_name, bank_account_number FROM employees WHERE bank_account_number = $1';
      const params = [bankAccountNumber];

      if (excludeId) {
        query += ' AND id != $2';
        params.push(excludeId);
      }

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Create new employee
  static async create(employeeData) {
    const {
      employee_id,
      full_name,
      address,
      bank_account_number,
      bank_name,
      bank_branch,
      ifsc_code,
      iban,
      sort_code,
      bank_country = 'Pakistan',
      currency = 'PKR',
      salary,
      status = 'active',
      created_by
    } = employeeData;

    try {
      const result = await pool.query(
        `INSERT INTO employees
        (employee_id, full_name, address, bank_account_number, bank_name, bank_branch, ifsc_code, iban, sort_code, bank_country, currency, salary, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [employee_id, full_name, address, bank_account_number, bank_name, bank_branch, ifsc_code, iban, sort_code, bank_country, currency, salary, status, created_by]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update employee
  static async update(id, employeeData) {
    const {
      employee_id,
      full_name,
      address,
      bank_account_number,
      bank_name,
      bank_branch,
      ifsc_code,
      iban,
      sort_code,
      bank_country,
      currency,
      salary,
      status,
      updated_by
    } = employeeData;

    try {
      const result = await pool.query(
        `UPDATE employees
        SET employee_id = $1, full_name = $2, address = $3, bank_account_number = $4,
            bank_name = $5, bank_branch = $6, ifsc_code = $7, iban = $8, sort_code = $9,
            bank_country = $10, currency = $11, salary = $12, status = $13,
            updated_by = $14, updated_at = CURRENT_TIMESTAMP
        WHERE id = $15
        RETURNING *`,
        [employee_id, full_name, address, bank_account_number, bank_name, bank_branch, ifsc_code, iban, sort_code, bank_country, currency, salary, status, updated_by, id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete employee (soft delete by changing status)
  static async delete(id, deletedBy) {
    try {
      const result = await pool.query(
        `UPDATE employees
        SET status = 'inactive', updated_by = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *`,
        [deletedBy, id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Hard delete employee (permanent removal)
  static async hardDelete(id) {
    try {
      const result = await pool.query(
        'DELETE FROM employees WHERE id = $1 RETURNING *',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get active employees count
  static async getActiveCount() {
    try {
      const result = await pool.query(
        "SELECT COUNT(*) as count FROM employees WHERE status = 'active'"
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Employee;
