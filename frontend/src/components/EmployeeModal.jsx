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
    bank_country: 'Pakistan',
    ifsc_code: '',
    iban: '',
    sort_code: '',
    salary: '',
    currency: 'PKR',
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

    // Auto-set currency based on bank country
    if (name === 'bank_country') {
      const currency = value === 'Pakistan' ? 'PKR' : value === 'United Kingdom' ? 'GBP' : 'PKR';
      setFormData(prev => ({ ...prev, [name]: value, currency: currency }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

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
    } else if (!/^\d+$/.test(formData.bank_account_number)) {
      newErrors.bank_account_number = 'Bank account must contain only digits';
    } else if (formData.bank_country === 'United Kingdom') {
      // UK: 7-11 digits (8 is standard, but some older/building society accounts vary)
      if (formData.bank_account_number.length < 7 || formData.bank_account_number.length > 11) {
        newErrors.bank_account_number = 'UK bank account number must be 7-11 digits (8 is standard)';
      }
    } else if (formData.bank_country === 'Pakistan') {
      // Pakistan: 10-20 digits
      if (formData.bank_account_number.length < 10 || formData.bank_account_number.length > 20) {
        newErrors.bank_account_number = 'Pakistani bank account number must be 10-20 digits';
      }
    }

    // IBAN validation for Pakistani banks
    if (formData.bank_country === 'Pakistan' && !formData.iban?.trim()) {
      newErrors.iban = 'IBAN is required for Pakistani banks';
    } else if (formData.iban && formData.bank_country === 'Pakistan') {
      if (!/^PK[0-9]{2}[A-Z0-9]{20}$/.test(formData.iban)) {
        newErrors.iban = 'Invalid Pakistani IBAN format (e.g., PK36SCBL0000001123456702)';
      }
    }

    // Sort Code validation for UK banks
    if (formData.bank_country === 'United Kingdom' && !formData.sort_code?.trim()) {
      newErrors.sort_code = 'Sort Code is required for UK banks';
    } else if (formData.sort_code && formData.bank_country === 'United Kingdom') {
      // UK sort code: 6 digits, can be formatted as XX-XX-XX or XXXXXX
      const cleanSortCode = formData.sort_code.replace(/-/g, '');
      if (!/^[0-9]{6}$/.test(cleanSortCode)) {
        newErrors.sort_code = 'Invalid UK Sort Code (e.g., 12-34-56 or 123456)';
      }
    }

    // UK account number validation
    if (formData.bank_country === 'United Kingdom' && formData.bank_account_number) {
      if (formData.bank_account_number.length < 7 || formData.bank_account_number.length > 11) {
        newErrors.bank_account_number = 'UK bank account number must be 7-11 digits (8 is standard)';
      }
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="bank_country">Bank Country *</label>
                <select
                  id="bank_country"
                  name="bank_country"
                  className="form-control"
                  value={formData.bank_country}
                  onChange={handleChange}
                  required
                >
                  <option value="Pakistan">Pakistan</option>
                  <option value="United Kingdom">United Kingdom</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="bank_name">Bank Name *</label>
                {formData.bank_country === 'Pakistan' ? (
                  <select
                    id="bank_name"
                    name="bank_name"
                    className="form-control"
                    value={formData.bank_name}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Bank</option>
                    <option value="Allied Bank Limited">Allied Bank Limited</option>
                    <option value="Askari Bank">Askari Bank</option>
                    <option value="Bank Alfalah">Bank Alfalah</option>
                    <option value="Bank Al-Habib">Bank Al-Habib</option>
                    <option value="Faysal Bank">Faysal Bank</option>
                    <option value="Habib Bank Limited (HBL)">Habib Bank Limited (HBL)</option>
                    <option value="Habib Metropolitan Bank">Habib Metropolitan Bank</option>
                    <option value="JS Bank">JS Bank</option>
                    <option value="MCB Bank">MCB Bank</option>
                    <option value="Meezan Bank">Meezan Bank</option>
                    <option value="National Bank of Pakistan (NBP)">National Bank of Pakistan (NBP)</option>
                    <option value="Silk Bank">Silk Bank</option>
                    <option value="Soneri Bank">Soneri Bank</option>
                    <option value="Standard Chartered Bank">Standard Chartered Bank</option>
                    <option value="Summit Bank">Summit Bank</option>
                    <option value="United Bank Limited (UBL)">United Bank Limited (UBL)</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <select
                    id="bank_name"
                    name="bank_name"
                    className="form-control"
                    value={formData.bank_name}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Bank</option>
                    <option value="Barclays">Barclays</option>
                    <option value="HSBC UK">HSBC UK</option>
                    <option value="Lloyds Bank">Lloyds Bank</option>
                    <option value="NatWest">NatWest</option>
                    <option value="Royal Bank of Scotland (RBS)">Royal Bank of Scotland (RBS)</option>
                    <option value="Santander UK">Santander UK</option>
                    <option value="Halifax">Halifax</option>
                    <option value="TSB Bank">TSB Bank</option>
                    <option value="Co-operative Bank">Co-operative Bank</option>
                    <option value="Nationwide Building Society">Nationwide Building Society</option>
                    <option value="Metro Bank">Metro Bank</option>
                    <option value="Monzo">Monzo</option>
                    <option value="Revolut">Revolut</option>
                    <option value="Starling Bank">Starling Bank</option>
                    <option value="Virgin Money">Virgin Money</option>
                    <option value="Yorkshire Bank">Yorkshire Bank</option>
                    <option value="Clydesdale Bank">Clydesdale Bank</option>
                    <option value="First Direct">First Direct</option>
                    <option value="Bank of Scotland">Bank of Scotland</option>
                    <option value="Other">Other</option>
                  </select>
                )}
              </div>
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
                placeholder={formData.bank_country === 'United Kingdom' ? '7-11 digits, usually 8 (e.g., 12345678)' : '10-20 digits (e.g., 1234567890123)'}
                required
              />
              {errors.bank_account_number && <div className="form-error">{errors.bank_account_number}</div>}
            </div>

            {formData.bank_country === 'United Kingdom' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="sort_code">Sort Code *</label>
                  <input
                    type="text"
                    id="sort_code"
                    name="sort_code"
                    className="form-control"
                    value={formData.sort_code}
                    onChange={handleChange}
                    placeholder="12-34-56 or 123456"
                    maxLength="8"
                    required
                  />
                  {errors.sort_code && <div className="form-error">{errors.sort_code}</div>}
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
                    placeholder="Branch name/city"
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="iban">IBAN *</label>
                  <input
                    type="text"
                    id="iban"
                    name="iban"
                    className="form-control"
                    value={formData.iban}
                    onChange={handleChange}
                    placeholder="PK36SCBL0000001123456702"
                    style={{ textTransform: 'uppercase' }}
                    required
                  />
                  {errors.iban && <div className="form-error">{errors.iban}</div>}
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
                    placeholder="Branch name/city"
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="currency">Currency</label>
                <input
                  type="text"
                  id="currency"
                  name="currency"
                  className="form-control"
                  value={formData.currency === 'PKR' ? 'PKR (Rs)' : formData.currency === 'GBP' ? 'GBP (£)' : 'USD ($)'}
                  readOnly
                  style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>Auto-set based on country</small>
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

              <div className="form-group">
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  name="status"
                  className="form-control"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
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
