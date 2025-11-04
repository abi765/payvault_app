const Salary = require('../models/salaryModel');
const Employee = require('../models/employeeModel');

// Generate monthly salary
exports.generateMonthlySalary = async (req, res) => {
  try {
    const { payment_month } = req.body;

    if (!payment_month) {
      return res.status(400).json({
        success: false,
        error: 'Payment month is required (format: YYYY-MM)'
      });
    }

    // Validate format
    if (!/^\d{4}-\d{2}$/.test(payment_month)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment month format. Use YYYY-MM'
      });
    }

    const payments = await Salary.generateMonthlySalary(
      payment_month,
      req.user?.username || 'system'
    );

    // Broadcast change
    if (global.broadcastChange) {
      global.broadcastChange({
        type: 'SALARY_GENERATED',
        data: { payment_month, count: payments.length }
      });
    }

    res.json({
      success: true,
      message: `Generated salary for ${payments.length} employees`,
      data: payments
    });
  } catch (error) {
    console.error('Error generating monthly salary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate monthly salary'
    });
  }
};

// Get salary payments by month
exports.getPaymentsByMonth = async (req, res) => {
  try {
    const { month } = req.params;

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid month format. Use YYYY-MM'
      });
    }

    const payments = await Salary.getByMonth(month);

    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments'
    });
  }
};

// Get employee payment history
exports.getEmployeeHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const history = await Salary.getEmployeeHistory(employeeId);

    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Error fetching employee history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employee history'
    });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'processed', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be pending, processed, or failed'
      });
    }

    const updatedPayment = await Salary.updatePaymentStatus(
      id,
      status,
      req.user?.username || 'system'
    );

    if (!updatedPayment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Broadcast change
    if (global.broadcastChange) {
      global.broadcastChange({
        type: 'PAYMENT_STATUS_UPDATED',
        data: updatedPayment
      });
    }

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: updatedPayment
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payment status'
    });
  }
};

// Bulk update payment status
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { payment_ids, status } = req.body;

    if (!payment_ids || !Array.isArray(payment_ids) || payment_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Payment IDs array is required'
      });
    }

    if (!['pending', 'processed', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be pending, processed, or failed'
      });
    }

    const updatedPayments = await Salary.bulkUpdateStatus(
      payment_ids,
      status,
      req.user?.username || 'system'
    );

    // Broadcast change
    if (global.broadcastChange) {
      global.broadcastChange({
        type: 'PAYMENTS_BULK_UPDATED',
        data: { count: updatedPayments.length, status }
      });
    }

    res.json({
      success: true,
      message: `Updated ${updatedPayments.length} payments to ${status}`,
      data: updatedPayments
    });
  } catch (error) {
    console.error('Error bulk updating payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk update payments'
    });
  }
};

// Get payment statistics
exports.getStatistics = async (req, res) => {
  try {
    const { month } = req.params;

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid month format. Use YYYY-MM'
      });
    }

    const stats = await Salary.getStatistics(month);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
};

// Get all payment months
exports.getPaymentMonths = async (req, res) => {
  try {
    const months = await Salary.getPaymentMonths();

    res.json({
      success: true,
      data: months
    });
  } catch (error) {
    console.error('Error fetching payment months:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment months'
    });
  }
};

// Export payments to CSV format
exports.exportPayments = async (req, res) => {
  try {
    const { month } = req.params;

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid month format. Use YYYY-MM'
      });
    }

    const payments = await Salary.getByMonth(month);

    // Create CSV data
    const csvRows = [];
    csvRows.push([
      'Employee ID',
      'Full Name',
      'Bank Account Number',
      'Bank Name',
      'Bank Branch',
      'IFSC Code',
      'Amount',
      'Status',
      'Payment Month'
    ].join(','));

    payments.forEach(payment => {
      csvRows.push([
        payment.employee_id,
        `"${payment.full_name}"`,
        payment.bank_account_number,
        `"${payment.bank_name || ''}"`,
        `"${payment.bank_branch || ''}"`,
        payment.ifsc_code || '',
        payment.amount,
        payment.status,
        payment.payment_month
      ].join(','));
    });

    const csvContent = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=salary_${month}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export payments'
    });
  }
};
