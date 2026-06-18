function Header() {
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

        <nav>
          <a href="/" className="active">Home</a>
          <a href="#">About</a>
          <a href="#officers">Officers</a>
          <a href="#systems">Systems</a>
          <a href="/login" className="nav-login">Login</a>
          <a href="/register" className="nav-register">Register</a>
        </nav>
      </header>
    </>
  );
}

export default Header;