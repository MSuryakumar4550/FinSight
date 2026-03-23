import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import './Navbar.css';

const pageTitles = {
  '/':          'dashboard',
  '/expenses':  'expenses',
  '/analytics': 'analytics',
  '/reports':   'reports',
  '/aicoach':   'aiCoach',
  '/settings':  'settings',
};

function Navbar({ onHamburger }) {
  const { t } = useTranslation();
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'dashboard';

  return (
    <div className="navbar">
      <div className="navbar-left">
        <button className="hamburger" onClick={onHamburger}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <span className="page-title">{t(title)}</span>
      </div>
    </div>
  );
}

export default Navbar;