import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../utils/theme';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import './DashboardLayout.css';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Tổng quan' },
    { path: '/appointments', icon: '📅', label: 'Quản lý lịch hẹn' },
    { path: '/services', icon: '🏥', label: 'Quản lý dịch vụ' },
    { path: '/customers', icon: '👥', label: 'Quản lý khách hàng' },
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon" style={{ backgroundColor: COLORS.primary }}>❤️</span>
            {sidebarOpen && <span className="logo-text">Healthcare</span>}
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              style={
                location.pathname === item.path
                  ? { backgroundColor: `${COLORS.primary}20`, color: COLORS.primary }
                  : {}
              }
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleSignOut}>
            <span className="nav-icon">🚪</span>
            {sidebarOpen && <span className="nav-label">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="top-header">
          <button 
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>

          <div className="header-right">
            <ThemeToggle />
            <div className="user-info">
              <div className="user-avatar" style={{ backgroundColor: COLORS.primary }}>
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <span className="user-email">{user?.email}</span>
                <span className="user-role">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
