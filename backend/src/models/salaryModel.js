const pool = require('../config/database');

class Salary {
  // Generate monthly salary for all active employees
  static async generateMonthlySalary(paymentMonth, processedBy) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get all active employees
      const employeesResult = await client.query(
        "SELECT * FROM employees WHERE status = 'active'"
      );

      const employees = employeesResult.rows;
      const payments = [];

      for (const employee of employees) {
        // Check if payment already exists for this month
        const existingPayment = await client.query(
          'SELECT * FROM salary_payments WHERE employee_id = $1 AND payment_month = $2',
          [employee.id, paymentMonth]
        );

        if (existingPayment.rows.length === 0) {
          // Create new payment record
          const payment = await client.query(
            `INSERT INTO salary_payments
            (employee_id, payment_month, amount, currency, status, processed_by)
            VALUES ($1, $2, $3, $4, 'pending', $5)
            RETURNING *`,
            [employee.id, paymentMonth, employee.salary, employee.currency || 'PKR', processedBy]
          );
          payments.push(payment.rows[0]);
        }
      }

      await client.query('COMMIT');
      return payments;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get salary payments by month
  static async getByMonth(paymentMonth) {
    try {
      const result = await pool.query(
        `SELECT
          sp.*,
          e.employee_id,
          e.full_name,
          e.bank_account_number,
          e.bank_name,
          e.bank_branch,
          e.ifsc_code,
          e.currency
        FROM salary_payments sp
        JOIN employees e ON sp.employee_id = e.id
        WHERE sp.payment_month = $1
        ORDER BY e.full_name`,
        [paymentMonth]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get payment history for an employee
  static async getEmployeeHistory(employeeId) {
    try {
      const result = await pool.query(
        `SELECT * FROM salary_payments
        WHERE employee_id = $1
        ORDER BY payment_month DESC`,
        [employeeId]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Update payment status
  static async updatePaymentStatus(id, status, processedBy) {
    try {
      const result = await pool.query(
        `UPDATE salary_payments
        SET status = $1, processed_at = CURRENT_TIMESTAMP, processed_by = $2
        WHERE id = $3
        RETURNING *`,
        [status, processedBy, id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Bulk update payment status
  static async bulkUpdateStatus(ids, status, processedBy) {
    try {
      const result = await pool.query(
        `UPDATE salary_payments
        SET status = $1, processed_at = CURRENT_TIMESTAMP, processed_by = $2
        WHERE id = ANY($3)
        RETURNING *`,
        [status, processedBy, ids]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get payment statistics
  static async getStatistics(paymentMonth) {
    try {
      const result = await pool.query(
        `SELECT
          COUNT(*) as total_payments,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN status = 'processed' THEN 1 END) as processed_count,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
          COALESCE(SUM(amount), 0) as total_amount,
          COALESCE(SUM(CASE WHEN status = 'processed' THEN amount ELSE 0 END), 0) as processed_amount,
          json_agg(json_build_object('currency', sp.currency, 'amount', amount)) as amounts_by_currency
        FROM salary_payments sp
        WHERE payment_month = $1`,
        [paymentMonth]
      );

      // Calculate totals by currency
      const stats = result.rows[0];
      const currencyTotals = {};

      if (stats.amounts_by_currency && stats.amounts_by_currency[0]) {
        stats.amounts_by_currency.forEach(item => {
          const currency = item.currency || 'PKR';
          if (!currencyTotals[currency]) {
            currencyTotals[currency] = 0;
          }
          currencyTotals[currency] += parseFloat(item.amount);
        });
      }

      stats.currency_totals = currencyTotals;
      delete stats.amounts_by_currency; // Remove raw data

      return stats;
    } catch (error) {
      throw error;
    }
  }

  // Get all unique payment months
  static async getPaymentMonths() {
    try {
      const result = await pool.query(
        `SELECT DISTINCT payment_month
        FROM salary_payments
        ORDER BY payment_month DESC`
      );
      return result.rows.map(row => row.payment_month);
    } catch (error) {
      throw error;
    }
  }

  // Delete payment
  static async delete(id) {
    try {
      const result = await pool.query(
        'DELETE FROM salary_payments WHERE id = $1 RETURNING *',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Salary;
