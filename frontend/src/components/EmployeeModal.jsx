import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../services/api';

const EmployeeModal = ({ employee, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    employee_id: '',
    full_name: '',
    address: '',
    bank_account_number: '',
    bank_name: '',
    bank_branch: '',
    ifsc_code: '',
    salary: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  useEffect(() => {
    if (employee) {
      setFormData(employee);
    }
  }, [employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }

    // Check for duplicate bank account
    if (name === 'bank_account_number' && value.length >= 8) {
      checkDuplicateBank(value);
    }
  };

  const checkDuplicateBank = async (bankAccount) => {
    try {
      const response = await employeeAPI.checkDuplicate(bankAccount, employee?.id);
      if (response.data.isDuplicate) {
        setDuplicateWarning(response.data.duplicates);
      } else {
        setDuplicateWarning(null);
      }
    } catch (error) {
      console.error('Failed to check duplicate:', error);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.employee_id.trim()) {
      newErrors.employee_id = 'Employee ID is required';
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.bank_account_number.trim()) {
      newErrors.bank_account_number = 'Bank account number is required';
    } else if (formData.bank_account_number.length < 8) {
      newErrors.bank_account_number = 'Bank account must be at least 8 digits';
    } else if (!/^\d+$/.test(formData.bank_account_number)) {
      newErrors.bank_account_number = 'Bank account must contain only digits';
    }

    if (!formData.salary || parseFloat(formData.salary) <= 0) {
      newErrors.salary = 'Valid salary is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (duplicateWarning) {
      if (!confirm('This bank account is already used by another employee. Continue anyway?')) {
        return;
      }
    }

    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Failed to save employee:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{employee ? 'Edit Employee' : 'Add New Employee'}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {duplicateWarning && (
              <div className="alert alert-warning">
                <strong>Warning:</strong> This bank account is already used by:
                <ul style={{ margin: '0.5rem 0 0 1.5rem' }}>
                  {duplicateWarning.map(dup => (
                    <li key={dup.id}>{dup.full_name} (ID: {dup.employee_id})</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="employee_id">Employee ID *</label>
              <input
                type="text"
                id="employee_id"
                name="employee_id"
                className="form-control"
                value={formData.employee_id}
                onChange={handleChange}
                required
              />
              {errors.employee_id && <div className="form-error">{errors.employee_id}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="full_name">Full Name *</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                className="form-control"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
              {errors.full_name && <div className="form-error">{errors.full_name}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                className="form-control"
                value={formData.address}
                onChange={handleChange}
                rows="2"
              />
            </div>

            <div className="form-group">
              <label htmlFor="bank_account_number">Bank Account Number *</label>
              <input
                type="text"
                id="bank_account_number"
                name="bank_account_number"
                className="form-control"
                value={formData.bank_account_number}
                onChange={handleChange}
                required
              />
              {errors.bank_account_number && <div className="form-error">{errors.bank_account_number}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="bank_name">Bank Name</label>
                <input
                  type="text"
                  id="bank_name"
                  name="bank_name"
                  className="form-control"
                  value={formData.bank_name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bank_branch">Bank Branch</label>
                <input
                  type="text"
                  id="bank_branch"
                  name="bank_branch"
                  className="form-control"
                  value={formData.bank_branch}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="ifsc_code">IFSC Code</label>
                <input
                  type="text"
                  id="ifsc_code"
                  name="ifsc_code"
                  className="form-control"
                  value={formData.ifsc_code}
                  onChange={handleChange}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="salary">Monthly Salary *</label>
                <input
                  type="number"
                  id="salary"
                  name="salary"
                  className="form-control"
                  value={formData.salary}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                />
                {errors.salary && <div className="form-error">{errors.salary}</div>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                className="form-control"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;
