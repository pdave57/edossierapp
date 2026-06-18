import React from 'react';

function Dashboard() {
  return (
    <section className="dashboard" id="dashboard">
      <div className="sec-eyebrow light">Analytics</div>
      <h2 className="sec-title light">Education Dashboard</h2>
      <p className="sec-sub light">Real-time metrics for the current academic year across all 37 Local Government Areas.</p>
      <div style={{marginTop: "14px"}}>
        <div className="live-badge on-dark">
          <div className="l-dot"></div>
          Live Data — Updated Today
        </div>
      </div>
      <div className="dash-grid">
        <div className="dc" data-icon="🏫">
          <div className="dc-label">Total Schools</div>
          <div className="dc-value">3,847<span className="unit">↑</span></div>
          <div className="dc-sub">Public 2,941 · Private 906</div>
          <div className="dc-trend">▲ 3.2% year-on-year</div>
          <div className="sparkbars">
            <div className="sp" style={{height: "40%"}}></div>
            <div className="sp" style={{height: "52%"}}></div>
            <div className="sp" style={{height: "48%"}}></div>
            <div className="sp" style={{height: "68%"}}></div>
            <div className="sp" style={{height: "62%"}}></div>
            <div className="sp hi" style={{height: "100%"}}></div>
          </div>
        </div>
        <div className="dc" data-icon="🎒">
          <div className="dc-label">Student Enrollment</div>
          <div className="dc-value">1.24M<span className="unit">↑</span></div>
          <div className="dc-sub">Male 612K · Female 628K</div>
          <div className="dc-trend">▲ 6.1% year-on-year</div>
          <div className="sparkbars">
            <div className="sp" style={{height: "54%"}}></div>
            <div className="sp" style={{height: "62%"}}></div>
            <div className="sp" style={{height: "70%"}}></div>
            <div className="sp" style={{height: "66%"}}></div>
            <div className="sp" style={{height: "84%"}}></div>
            <div className="sp hi" style={{height: "100%"}}></div>
          </div>
        </div>
        <div className="dc" data-icon="👩🏫">
          <div className="dc-label">Teaching Personnel</div>
          <div className="dc-value">48,210</div>
          <div className="dc-sub">Qualified 44,100 · Probation 4,110</div>
          <div className="dc-trend">▲ 1.8% verified Q1</div>
          <div className="sparkbars">
            <div className="sp" style={{height: "70%"}}></div>
            <div className="sp" style={{height: "65%"}}></div>
            <div className="sp" style={{height: "76%"}}></div>
            <div className="sp" style={{height: "80%"}}></div>
            <div className="sp" style={{height: "90%"}}></div>
            <div className="sp hi" style={{height: "100%"}}></div>
          </div>
        </div>
        <div className="dc" data-icon="📁">
          <div className="dc-label">E-Dossier Completion</div>
          <div className="dc-value">99.4<span className="unit">%</span></div>
          <div className="dc-sub">Pending 289 records</div>
          <div className="dc-trend">▲ 12% last quarter</div>
          <div className="sparkbars">
            <div className="sp" style={{height: "50%"}}></div>
            <div className="sp" style={{height: "62%"}}></div>
            <div className="sp" style={{height: "74%"}}></div>
            <div className="sp" style={{height: "82%"}}></div>
            <div className="sp" style={{height: "92%"}}></div>
            <div className="sp hi" style={{height: "99%"}}></div>
          </div>
        </div>
      </div>
      <div className="dash-grid">
        <div className="dc" data-icon="🏗️">
          <div className="dc-label">Schools Under Renovation</div>
          <div className="dc-value">142</div>
          <div className="dc-sub">Target completion: Q3 2025</div>
          <div className="dc-trend">23 completed this month</div>
        </div>
        <div className="dc" data-icon="💰">
          <div className="dc-label">Budget Utilisation</div>
          <div className="dc-value">74<span className="unit">%</span></div>
          <div className="dc-sub">₦18.4B of ₦24.8B disbursed</div>
          <div className="dc-trend">On track for FY target</div>
        </div>
        <div className="dc" data-icon="📊">
          <div className="dc-label">Census Submissions</div>
          <div className="dc-value">3,621</div>
          <div className="dc-sub">226 schools pending</div>
          <div className="dc-trend">94.1% completion rate</div>
        </div>
        <div className="dc" data-icon="🗺️">
          <div className="dc-label">LGA Coverage</div>
          <div className="dc-value">37<span className="unit">/37</span></div>
          <div className="dc-sub">All LGAs active on portal</div>
          <div className="dc-trend">100% system coverage</div>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;