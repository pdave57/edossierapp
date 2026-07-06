import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { path: '/', label: 'Home', hash: false },
    { path: '/About', label: 'About', hash: false },
    { path: '#officers', label: 'Officers', hash: true },
    { path: '#systems', label: 'Systems', hash: true },
    { path: '/login', label: 'Login', hash: false, className: 'nav-login' },
  ];

  const isActive = (path) => {
    if (path.startsWith('#')) return false;
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-flag">
          🇳🇬 Official Government Portal — State Ministry of Education
        </div>

        <div className="topbar-links">
          <a href="#">Helpdesk</a>
          <a href="#">Careers</a>
          <a href="#">Tenders</a>
          <a href="#">Contact</a>
        </div>
      </div>

      <header>
        <div className="logo-wrap">
          <div className="logo-crest">
            <img
              src="/images/logomoe.jpg"
              alt="Ministry Logo"
              width="70"
              height="70"
            />
          </div>

          <div className="logo-text">
            <div className="l-title">
              Taraba State Ministry of Education
            </div>

            <span className="l-sub">
              Empowering Minds · Building Futures · Advancing Excellence
            </span>
          </div>
        </div>

        <button
          className={`hamburger ${menuOpen ? 'is-open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={menuOpen ? 'is-open' : ''}>
          {navItems.map((item) => {
            if (item.hash) {
              return (
                <a
                  key={item.path}
                  href={item.path}
                  className={item.className || ''}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              );
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive: linkActive }) =>
                  `nav-link ${linkActive ? 'active' : ''} ${item.className || ''}`
                }
                end={item.path === '/'}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </header>
    </>
  );
}

export default Header;
