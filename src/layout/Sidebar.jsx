import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Sidebar.css';

const navItems = [
  { path: '/',          icon: '⊞', key: 'dashboard'  },
  { path: '/expenses',  icon: '₹', key: 'expenses'   },
  { path: '/analytics', icon: '◎', key: 'analytics'  },
  { path: '/reports',   icon: '📋', key: 'reports'    },
  { path: '/aicoach',   icon: '✦', key: 'aiCoach'    },
  { path: '/settings',  icon: '⚙', key: 'settings'   },
];

function Sidebar({ collapsed, onCollapse, mobileOpen, onMobileClose }) {
  const { t }    = useTranslation();
  const navigate = useNavigate();

  const userName  = localStorage.getItem('name')  || 'User';
  const userEmail = localStorage.getItem('email') || '';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <>
      <div
        className={`mobile-overlay ${mobileOpen ? 'visible' : ''}`}
        onClick={onMobileClose}
      />
      <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">S</div>
          <span className="logo-text">{t('smartExpenseTracker')}</span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`}
              onClick={onMobileClose}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{t(item.key)}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">

          {/* User info */}
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {userName[0].toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{userName}</p>
              <p className="sidebar-user-email">{userEmail}</p>
            </div>
          </div>

          {/* Logout */}
          <button className="logout-btn" onClick={handleLogout}>
            <span className="nav-icon">⬡</span>
            <span className="nav-label">Logout</span>
          </button>

          {/* Collapse */}
          <button className="collapse-btn" onClick={onCollapse}>
            <span className="nav-icon">{collapsed ? '→' : '←'}</span>
            <span className="nav-label">Collapse</span>
          </button>

          {/* Credit */}
          <a
            href="https://www.linkedin.com/in/suryakumarm/"
            target="_blank"
            rel="noreferrer"
            className="sidebar-credit"
          >
            <span className="nav-icon">🔗</span>
            <span className="nav-label">Built by M.Suryakumar</span>
          </a>

        </div>
      </div>
    </>
  );
}

export default Sidebar;