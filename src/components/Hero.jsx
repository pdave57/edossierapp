function Hero() {
  return (
    <section className="hero">
      <div className="hero-texture"></div>

      <div className="hero-content">
        <div className="hero-eyebrow">
          <div className="l-dot"></div>
          Live Education Management System
        </div>

        <h2>
          Transforming <span>Education</span>
          <br />
          Through Digital Governance
        </h2>

        <p>
          A unified, secure platform managing state education data —
          from school census, personnel records to e-dossier administration.
        </p>

        <div className="hero-btns">
          <a href="#" className="btn-green">
            Student Login →
          </a>

          <a href="/login" className="btn-ghost-white">
            Login
          </a>
        </div>
      </div>

      <div className="hero-card">
        <div className="hc-label">📊 Live State Snapshot</div>

        <div className="hc-stat">
          <div className="hc-ico">🏫</div>
          <div>
            <div className="hc-num">3,847</div>
            <div className="hc-txt">Registered Schools</div>
          </div>
        </div>

        <div className="hc-stat">
          <div className="hc-ico">👩‍🏫</div>
          <div>
            <div className="hc-num">48,210</div>
            <div className="hc-txt">Teaching Staff</div>
          </div>
        </div>

        <div className="hc-stat">
          <div className="hc-ico">🎒</div>
          <div>
            <div className="hc-num">1.24M</div>
            <div className="hc-txt">Enrolled Students</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;