function News() {
  return (
    <section className="news">
      <div className="sec-eyebrow">Updates</div>
      <h2 className="sec-title">News & Announcements</h2>
      <p className="sec-sub">Latest directives, circulars and ministry news for all staff and stakeholders.</p>
      <div className="news-grid">
        <div className="news-card">
          <h4>Annual School Census Data Collection Exercise</h4>
          <div className="news-tag">🔴 Urgent Circular</div>
          <h4>2024/2025 Annual School Census Data Collection Exercise</h4>
          <p>All public and private school heads must complete the online census form before the deadline. Defaulting schools will be flagged.</p>
          <div className="news-meta"><span>📅 March 5, 2025</span><span>📌 Circular No. 14</span></div>
        </div>

        <div className="news-card">
          <h4>Teachers Professional Development Programme</h4>
          <div className="news-tag">🔵 New Policy</div>
          <h4>Teachers' Professional Development Programme Q2 2025</h4>
          <p>Mandatory capacity building workshop for all secondary school teachers. 
            Registration is now open through the personnel management portal.</p>
          <div className="news-meta"><span>📅 Feb 28, 2025</span><span>📌 HR Directive</span></div>
        </div>

        <div className="news-card">
          <h4>E-Dossier System Upgrade Version 3.2</h4>
          <div className="news-tag">⚙️ ICT Update</div>
          <h4>E-Dossier System Upgrade: Version 3.2 Now Live</h4>
          <p>Enhanced document scanning, biometric verification, and faster record retrieval. 
            All users must re-login to activate new features.</p>
            <div className="news-meta"><span>📅 Feb 20, 2025</span><span>📌 ICT Directorate</span></div>
        </div>

        <div className="news-card">
          <h4>Scholarship Board Applications Open</h4>
          <div className="news-tag">🟡 Scholarship</div>
          <h4>State Scholarship Board: Application Window Now Open</h4>
          <p>Applications invited from eligible SS3 students for the state merit scholarship via school principals' portal login credentials.</p>
          <div className="news-meta"><span>📅 Feb 14, 2025</span><span>📌 Scholarship Board</span></div>
        </div>
      </div>
    </section>
  );
}

export default News;