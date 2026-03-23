import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import './Layout.css';

function Layout() {
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleHamburger = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen(prev => !prev);
      setCollapsed(false);
    } else {
      setCollapsed(prev => !prev);
      setMobileOpen(false);
    }
  };

  return (
    <div className={`layout ${localStorage.getItem('theme') || 'dark'}`}>
      <Sidebar
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Navbar onHamburger={handleHamburger} />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Layout;