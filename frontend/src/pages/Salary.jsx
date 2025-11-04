import React, { useState, useEffect } from 'react';
import { salaryAPI } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

const Salary = () => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [payments, setPayments] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedPayments, setSelectedPayments] = useState([]);

  const { isConnected } = useWebSocket((msg) => {
    if (msg.type.startsWith('SALARY_') || msg.type.startsWith('PAYMENT_')) {
      loadPayments();
    }
  });

  useEffect(() => {
    loadPayments();
  }, [selectedMonth]);

  function getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  const loadPayments = async () => {
    setLoading(true);
    try {
      const [paymentsRes, statsRes] = await Promise.all([
        salaryAPI.getByMonth(selectedMonth),
        salaryAPI.getStatistics(selectedMonth)
      ]);
      setPayments(paymentsRes.data.data);
      setStatistics(statsRes.data.data);
      setSelectedPayments([]);
    } catch (error) {
      if (error.response?.status === 404) {
        setPayments([]);
        setStatistics(null);
      } else {
        showMessage('Failed to load salary data', 'danger');
      }
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleGenerateSalary = async () => {
    if (!confirm(`Generate salary for ${selectedMonth}? This will create payment records for all active employees.`)) {
      return;
    }

    try {
      const response = await salaryAPI.generateMonthly(selectedMonth);
      showMessage(response.data.message);
      loadPayments();
    } catch (error) {
      showMessage(error.response?.data?.error || 'Failed to generate salary', 'danger');
    }
  };

  const handleExport = async () => {
    try {
      const response = await salaryAPI.exportPayments(selectedMonth);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salary_${selectedMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showMessage('Salary data exported successfully');
    } catch (error) {
      showMessage('Failed to export salary data', 'danger');
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    if (selectedPayments.length === 0) {
      showMessage('Please select payments to update', 'warning');
      return;
    }

    if (!confirm(`Mark ${selectedPayments.length} payment(s) as ${status}?`)) {
      return;
    }

    try {
      await salaryAPI.bulkUpdateStatus(selectedPayments, status);
      showMessage(`${selectedPayments.length} payment(s) marked as ${status}`);
      loadPayments();
    } catch (error) {
      showMessage('Failed to update payment status', 'danger');
    }
  };

  const togglePaymentSelection = (id) => {
    setSelectedPayments(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPayments.length === payments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(payments.map(p => p.id));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Salary Processing</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>
            Generate and manage monthly salary payments
          </p>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Controls */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: '0 0 200px' }}>
            <label>Select Month</label>
            <input
              type="month"
              className="form-control"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>

          <button onClick={handleGenerateSalary} className="btn btn-primary">
            Generate Salary
          </button>

          {payments.length > 0 && (
            <button onClick={handleExport} className="btn btn-success">
              Export to CSV
            </button>
          )}
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div className="card" style={{ background: '#f3f4f6' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>Total Payments</h3>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>{statistics.total_payments}</p>
          </div>
          <div className="card" style={{ background: '#fef3c7' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#92400e' }}>Pending</h3>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>{statistics.pending_count}</p>
          </div>
          <div className="card" style={{ background: '#d1fae5' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#065f46' }}>Processed</h3>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>{statistics.processed_count}</p>
          </div>
          <div className="card" style={{ background: '#fee2e2' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#991b1b' }}>Failed</h3>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>{statistics.failed_count}</p>
          </div>
          <div className="card" style={{ background: '#dbeafe' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#1e40af' }}>Total Amount</h3>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>${parseFloat(statistics.total_amount).toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {payments.length > 0 && selectedPayments.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem', background: '#f3f4f6' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontWeight: '600' }}>{selectedPayments.length} selected</span>
            <button onClick={() => handleBulkStatusUpdate('processed')} className="btn btn-success" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
              Mark as Processed
            </button>
            <button onClick={() => handleBulkStatusUpdate('failed')} className="btn btn-danger" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
              Mark as Failed
            </button>
            <button onClick={() => setSelectedPayments([])} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Payments Table */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading...</p>
        </div>
      ) : payments.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedPayments.length === payments.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Employee ID</th>
                <th>Full Name</th>
                <th>Bank Account</th>
                <th>Bank Name</th>
                <th>IFSC Code</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Processed Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedPayments.includes(payment.id)}
                      onChange={() => togglePaymentSelection(payment.id)}
                    />
                  </td>
                  <td>{payment.employee_id}</td>
                  <td>{payment.full_name}</td>
                  <td style={{ fontFamily: 'monospace' }}>{payment.bank_account_number}</td>
                  <td>{payment.bank_name || '-'}</td>
                  <td>{payment.ifsc_code || '-'}</td>
                  <td style={{ fontWeight: '600' }}>${parseFloat(payment.amount).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${
                      payment.status === 'processed' ? 'badge-success' :
                      payment.status === 'failed' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {payment.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {payment.processed_at
                      ? new Date(payment.processed_at).toLocaleDateString()
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <p style={{ margin: '0 0 1rem 0', fontSize: '1.125rem' }}>
            No salary data found for {selectedMonth}
          </p>
          <button onClick={handleGenerateSalary} className="btn btn-primary">
            Generate Salary for This Month
          </button>
        </div>
      )}
    </div>
  );
};

export default Salary;
