import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import EmployeeModal from '../components/EmployeeModal';
import { formatCurrency } from '../utils/currency';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [message, setMessage] = useState(null);

  const { isConnected } = useWebSocket((msg) => {
    if (msg.type.startsWith('EMPLOYEE_')) {
      loadEmployees();
    }
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, statusFilter]);

  const loadEmployees = async () => {
    try {
      const response = await employeeAPI.getAll();
      setEmployees(response.data.data);
    } catch (error) {
      showMessage('Failed to load employees', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = employees;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(emp => emp.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.bank_account_number.includes(searchTerm)
      );
    }

    setFilteredEmployees(filtered);
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleAdd = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      await employeeAPI.delete(id);
      showMessage('Employee deleted successfully');
      loadEmployees();
    } catch (error) {
      showMessage('Failed to delete employee', 'danger');
    }
  };

  const handleSaveEmployee = async (employeeData) => {
    try {
      if (selectedEmployee) {
        await employeeAPI.update(selectedEmployee.id, employeeData);
        showMessage('Employee updated successfully');
      } else {
        await employeeAPI.create(employeeData);
        showMessage('Employee added successfully');
      }
      setIsModalOpen(false);
      loadEmployees();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Operation failed';
      showMessage(errorMsg, 'danger');
      throw error;
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Employees</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>
            Manage employee information and bank details
          </p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary">
          + Add Employee
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Search</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search by ID, name, or bank account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Status</label>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="table-container">
        {filteredEmployees.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Full Name</th>
                <th>Address</th>
                <th>Bank Account</th>
                <th>Bank Name</th>
                <th>Salary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.employee_id}</td>
                  <td>{emp.full_name}</td>
                  <td>{emp.address || '-'}</td>
                  <td style={{ fontFamily: 'monospace' }}>{emp.bank_account_number}</td>
                  <td>{emp.bank_name || '-'}</td>
                  <td>{formatCurrency(emp.salary, emp.currency || 'PKR')}</td>
                  <td>
                    <span className={`badge ${
                      emp.status === 'active' ? 'badge-success' :
                      emp.status === 'on_leave' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {emp.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEdit(emp)}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            {employees.length === 0 ? (
              <p>No employees found. Click "Add Employee" to get started.</p>
            ) : (
              <p>No employees match your search criteria.</p>
            )}
          </div>
        )}
      </div>

      {/* Employee Modal */}
      {isModalOpen && (
        <EmployeeModal
          employee={selectedEmployee}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveEmployee}
        />
      )}
    </div>
  );
};

export default Employees;
