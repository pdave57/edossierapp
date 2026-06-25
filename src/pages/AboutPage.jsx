// src/pages/AboutPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  const history = [
    { year: '1954', icon: '🏛️', title: 'Ministry Established', desc: 'Formally constituted following the Macpherson Constitution, charged with overseeing primary and secondary education across the region.' },
    { year: '1976', icon: '📚', title: 'Universal Primary Education (UPE) Launch', desc: 'Spearheaded the UPE programme, dramatically expanding enrolment and constructing hundreds of new primary schools across all local government areas.' },
    { year: '1999', icon: '🏫', title: 'Post-Military Democratic Reforms', desc: 'Implemented sweeping reforms including new curriculum standards, teacher training programmes, and a landmark infrastructure renewal initiative across the state.' },
    { year: '2015', icon: '💻', title: 'ICT Integration Initiative', desc: 'Introduced computer-based learning in secondary schools, ICT laboratories, and the first electronic personnel records management system for the Ministry.' },
    { year: '2023', icon: '🌐', title: 'Integrated Education Portal Launch', desc: 'A landmark achievement — unified E-Dossier, School Census, and Personnel Management into a single secure digital platform accessible to all authorised staff.' },
  ];

  const leadership = [
    { icon: '🧑‍💼', role: 'State Governor', name: 'H.E. Gov. Emmanuel A. Bello', title: 'Executive Governor', details: 'Political Science, M.Sc. Columbia University', status: 'In Office: 2019' },
    { icon: '👩‍💼', role: 'Commissioner', name: 'Hon. Dr. Ngozi Okafor-Williams', title: 'Commissioner for Education', details: 'Ph.D. Education Policy, University of Lagos', status: 'Appointed: Jan 2023' },
    { icon: '👨‍💼', role: 'Permanent Secretary', name: 'Mr. Adeola S. Akinwande (mni)', title: 'Permanent Secretary', details: 'M.P.A., University of Ibadan', status: 'In Post: March 2022' },
    { icon: '👩‍🏫', role: 'Director', name: 'Prof. Amaka Chibueze-Eze', title: 'Director, Basic & Secondary Edu.', details: 'Professor of Education, Curriculum Development', status: 'In Post: Sept 2021' },
    { icon: '👨‍💻', role: 'Director', name: 'Engr. Chukwuemeka Balogun', title: 'Director, ICT & Digital Systems', details: 'B.Eng. Computer Engineering, COREN Registered', status: 'In Post: Jan 2022' },
    { icon: '👩‍⚕️', role: 'Director', name: 'Mrs. Funke Adewale-Osei', title: 'Director, Finance & Accounts', details: 'ACA, ICAN Fellow — Budget & Planning', status: 'In Post: April 2020' },
  ];

  const values = [
    { icon: '🏆', title: 'Excellence', desc: 'We pursue the highest standards in education delivery, policy formulation, and administrative service.' },
    { icon: '⚖️', title: 'Integrity', desc: 'Honesty, transparency and accountability guide every action, decision and resource allocation.' },
    { icon: '🤝', title: 'Inclusivity', desc: 'Every child — regardless of gender, geography or background — deserves access to quality education.' },
    { icon: '💡', title: 'Innovation', desc: 'We embrace technology and creative thinking to solve challenges and improve learning outcomes.' },
    { icon: '🌱', title: 'Sustainability', desc: 'Our programmes and investments are designed for long-term impact, resilience, and growth.' },
    { icon: '🤲', title: 'Service', desc: 'We exist to serve the students, teachers, schools and communities that depend on us daily.' },
  ];

  const departments = [
    { icon: '📖', title: 'Basic & Secondary Education', desc: 'Oversees curriculum, examinations, and quality assurance for primary and secondary schools statewide.' },
    { icon: '👩‍🏫', title: 'Human Resources & Personnel', desc: 'Manages recruitment, deployment, promotions, welfare, and disciplinary matters for all education staff.' },
    { icon: '💻', title: 'ICT & Digital Systems', desc: 'Operates and maintains all digital platforms including E-Dossier, Census, and Personnel portals.' },
    { icon: '💰', title: 'Finance & Accounts', desc: 'Manages ministry budget, expenditure, capital project financing, and financial reporting to the State.' },
    { icon: '🏗️', title: 'School Infrastructure', desc: 'Coordinates construction, renovation, maintenance and inspection of school buildings across all LGAs.' },
    { icon: '📊', title: 'Planning, Research & Statistics', desc: 'Conducts school census, education surveys, and provides data analytics for evidence-based decisions.' },
    { icon: '🎓', title: 'Scholarship & Bursaries', desc: 'Administers state scholarship schemes, bursary awards, and student loan programmes for eligible citizens.' },
    { icon: '🔍', title: 'Inspectorate & Quality Assurance', desc: 'Conducts regular school inspections and accreditation exercises to enforce standards and compliance.' },
  ];

  return (
    <>
      {/* ── PAGE HERO ── */}
      <section className="page-hero">
        <div className="breadcrumb">
          <Link to="/">Home</Link> › <span>About Us</span>
        </div>
        <div className="page-hero-text">
          <div className="sec-eyebrow light">Ministry of Education</div>
          <h1>About the <span className="hl">Ministry</span></h1>
          <p>
            Established to provide quality, accessible and equitable education across the state.
            The Ministry is the principal government body responsible for formulating, implementing,
            monitoring and evaluating all education policies.
          </p>
        </div>
      </section>

      {/* ── STAT BAND ── */}
      <div className="stat-band">
        <div className="sb-item">
          <div className="sb-num">1954</div>
          <div className="sb-lbl">Year Established</div>
        </div>
        <div className="sb-div" />
        <div className="sb-item">
          <div className="sb-num">3,847</div>
          <div className="sb-lbl">Registered Schools</div>
        </div>
        <div className="sb-div" />
        <div className="sb-item">
          <div className="sb-num">48,210</div>
          <div className="sb-lbl">Teaching Staff</div>
        </div>
        <div className="sb-div" />
        <div className="sb-item">
          <div className="sb-num">1.24M</div>
          <div className="sb-lbl">Students Enrolled</div>
        </div>
        <div className="sb-div" />
        <div className="sb-item">
          <div className="sb-num">37</div>
          <div className="sb-lbl">LGAs Covered</div>
        </div>
      </div>

      {/* ── OUR PURPOSE ── */}
      <section className="sec white">
        <div className="sec-eyebrow">Our Purpose</div>
        <h2 className="sec-title">Mission, Vision &amp; Mandate</h2>
        <p className="sec-sub">The strategic pillars that guide every policy decision, programme and initiative of the Ministry.</p>

        <div className="mv-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div className="mv-card navy-card">
            <div className="mv-icon">🎯</div>
            <h3>Our Mission</h3>
            <p>To provide quality, accessible and equitable education at all levels for the holistic development of every child — fostering critical thinking, innovation, and civic responsibility through a robust, inclusive education system.</p>
          </div>
          <div className="mv-card green-card">
            <div className="mv-icon">🌟</div>
            <h3>Our Vision</h3>
            <p>A state renowned for excellence in education, producing globally competitive graduates, ethical leaders, and lifelong learners who contribute meaningfully to the development of Nigeria and the world at large.</p>
          </div>
          <div className="mv-card white-card">
            <div className="mv-icon">📜</div>
            <h3>Our Mandate</h3>
            <p>Formulate, implement and monitor education policies; regulate all schools; manage teaching and non-teaching personnel; coordinate curriculum development; and ensure accountability in all resource deployment.</p>
          </div>
          <div className="mv-card tint-card">
            <div className="mv-icon">💻</div>
            <h3>Digital Transformation</h3>
            <p>Committed to modernising governance through ICT — deploying the E-Dossier, School Census, and Personnel Management platforms for real-time data-driven decision making across the state.</p>
          </div>
        </div>
      </section>

      {/* ── OUR HISTORY ── */}
      <section className="sec off">
        <div className="sec-eyebrow">Our History</div>
        <h2 className="sec-title">A Legacy of Educational Leadership</h2>
        <p className="sec-sub">Seven decades of building the foundations of knowledge and opportunity for every child.</p>

        <div className="timeline">
          {history.map((item, i) => (
            <div className="tl-item" key={i}>
              <div className="tl-dot">{item.icon}</div>
              <div>
                <span className="tl-year">{item.year}</span>
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LEADERSHIP ── */}
      <section className="sec white">
        <div className="sec-eyebrow">Leadership</div>
        <h2 className="sec-title">Ministry Leadership Team</h2>
        <p className="sec-sub">Experienced professionals steering the course of education policy and administration.</p>

        <div className="leaders-grid">
          {leadership.map((person, i) => (
            <div className="l-card" key={i}>
              <div className="l-av">{person.icon}</div>
              <span className="l-badge">{person.role}</span>
              <div className="l-name">{person.name}</div>
              <div className="l-role">{person.title}</div>
              <div className="l-div" />
              <div className="l-info">
                {person.details}<br />
                <span style={{ color: 'var(--gd)', fontWeight: 600 }}>{person.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CORE VALUES ── */}
      <section className="sec navy">
        <div className="sec-eyebrow light">Core Values</div>
        <h2 className="sec-title light">What We Stand For</h2>
        <p className="sec-sub light">Principles shaping our culture, driving our decisions, and defining our commitment to education.</p>

        <div className="values-grid">
          {values.map((v, i) => (
            <div className="v-card" key={i}>
              <div className="v-icon">{v.icon}</div>
              <h4>{v.title}</h4>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DEPARTMENTS ── */}
      <section className="sec gbg">
        <div className="sec-eyebrow">Structure</div>
        <h2 className="sec-title">Departments &amp; Directorates</h2>
        <p className="sec-sub">Our organisational units responsible for delivering the Ministry's mandate across the state.</p>

        <div className="dept-grid">
          {departments.map((dept, i) => (
            <div className="d-card" key={i}>
              <div className="d-ico">{dept.icon}</div>
              <div>
                <h4>{dept.title}</h4>
                <p>{dept.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-band">
        <h2>Join the Ministry Digital Portal</h2>
        <p>Staff, school heads and administrators — create your account today to access all integrated systems.</p>
        <div className="cta-btns">
          <Link to="/register" className="btn-navy">Create Account →</Link>
          <Link to="/login" className="btn-outline-green">Sign In</Link>
        </div>
      </section>
    </>
  );
};

export default AboutPage;