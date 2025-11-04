import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { employeeAPI } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    onLeave: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentEmployees, setRecentEmployees] = useState([]);

  const { isConnected } = useWebSocket((message) => {
    console.log('Real-time update:', message);
    // Refresh data when changes are detected
    if (message.type.startsWith('EMPLOYEE_') || message.type.startsWith('SALARY_')) {
      loadStats();
    }
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await employeeAPI.getAll();
      const employees = response.data.data;

      setStats({
        total: employees.length,
        active: employees.filter(e => e.status === 'active').length,
        inactive: employees.filter(e => e.status === 'inactive').length,
        onLeave: employees.filter(e => e.status === 'on_leave').length
      });

      // Get 5 most recent employees
      setRecentEmployees(employees.slice(0, 5));
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Dashboard</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>
            Overview of employee and salary information
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isConnected ? '#10b981' : '#ef4444'
          }}></span>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', opacity: 0.9 }}>Total Employees</h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700' }}>{stats.total}</p>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', opacity: 0.9 }}>Active Employees</h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700' }}>{stats.active}</p>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', opacity: 0.9 }}>On Leave</h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700' }}>{stats.onLeave}</p>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', opacity: 0.9 }}>Inactive</h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700' }}>{stats.inactive}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 1rem 0' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/employees" className="btn btn-primary">
            Manage Employees
          </Link>
          <Link to="/salary" className="btn btn-success">
            Process Salary
          </Link>
        </div>
      </div>

      {/* Recent Employees */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Recent Employees</h2>
          <Link to="/employees" style={{ fontSize: '0.875rem', color: '#2563eb', textDecoration: 'none' }}>
            View All →
          </Link>
        </div>

        {recentEmployees.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Full Name</th>
                  <th>Bank Account</th>
                  <th>Salary</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.employee_id}</td>
                    <td>{emp.full_name}</td>
                    <td>{emp.bank_account_number}</td>
                    <td>${parseFloat(emp.salary).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${
                        emp.status === 'active' ? 'badge-success' :
                        emp.status === 'on_leave' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {emp.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            No employees found. <Link to="/employees">Add your first employee</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
