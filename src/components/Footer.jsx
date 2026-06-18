function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="fb-brand">
          <h3>State Ministry of Education</h3>
          <p>Dedicated to delivering quality, equitable, and inclusive education for every child in the state. Committed to digital transformation and transparent governance.</p>
          <div className="live-badge on-dark" style={{ marginTop: "18px" }}><div className="l-dot"></div>Portal Status: Online</div>
        </div>
        <div className="footer-col"><div className="fc-head">Quick Links</div><a href="#">Home</a><a href="#">About Ministry</a><a href="#">Key Officers</a><a href="#">Dashboard</a><a href="#">Publications</a></div>
        <div className="footer-col"><div className="fc-head">Systems</div><a href="#">E-Dossier Portal</a><a href="#">School Census</a><a href="#">Personnel Mgmt</a></div>
        <div className="footer-col"><div className="fc-head">Contact</div><a href="#">📍 Ministry Headquarters</a><a href="#">📞 +234 800 000 0000</a><a href="#">✉️ info@moe.state.gov.ng</a><a href="#">🌐 www.moe.state.gov.ng</a></div>
      </div>
      <div className="footer-bottom">
        <span>© 2025 State Ministry of Education. All Rights Reserved.</span>
        <span><a href="#">Privacy Policy</a> · <a href="#">Terms of Use</a></span>
      </div>
    </footer>
  );
}

export default Footer;