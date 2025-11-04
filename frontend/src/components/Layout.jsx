import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
        color: 'white',
        padding: '0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 2rem'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '700' }}>
              💰 PayVault
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>
              Employee Salary Management System
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ fontSize: '0.875rem' }}>
              👤 {user?.full_name} ({user?.role})
            </span>
            <button
              onClick={handleLogout}
              className="btn"
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{
          background: 'rgba(0,0,0,0.1)',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            padding: '0 2rem'
          }}>
            <Link
              to="/"
              className={isActive('/')}
              style={{
                padding: '1rem 1.5rem',
                color: 'white',
                textDecoration: 'none',
                borderBottom: location.pathname === '/' ? '3px solid white' : '3px solid transparent',
                fontWeight: location.pathname === '/' ? '600' : '400',
                transition: 'all 0.2s'
              }}
            >
              Dashboard
            </Link>
            <Link
              to="/employees"
              className={isActive('/employees')}
              style={{
                padding: '1rem 1.5rem',
                color: 'white',
                textDecoration: 'none',
                borderBottom: location.pathname === '/employees' ? '3px solid white' : '3px solid transparent',
                fontWeight: location.pathname === '/employees' ? '600' : '400',
                transition: 'all 0.2s'
              }}
            >
              Employees
            </Link>
            <Link
              to="/salary"
              className={isActive('/salary')}
              style={{
                padding: '1rem 1.5rem',
                color: 'white',
                textDecoration: 'none',
                borderBottom: location.pathname === '/salary' ? '3px solid white' : '3px solid transparent',
                fontWeight: location.pathname === '/salary' ? '600' : '400',
                transition: 'all 0.2s'
              }}
            >
              Salary Processing
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto',
        padding: '2rem'
      }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{
        background: 'white',
        padding: '1.5rem',
        textAlign: 'center',
        borderTop: '1px solid #e5e7eb',
        color: '#6b7280',
        fontSize: '0.875rem'
      }}>
        <p style={{ margin: 0 }}>
          PayVault © {new Date().getFullYear()} - Secure Employee Salary Management
        </p>
      </footer>
    </div>
  );
};

export default Layout;
