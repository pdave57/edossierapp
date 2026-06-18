function Officers() {
  const officers = [
    {
      badge: "State Governor",
      avatar: "🧑‍💼",
      name: "H.E. Gov. Emmanuel A. Bello",
      role: "Executive Governor",
      office: "Government House",
      tenureLabel: "In Office",
      tenureValue: "Since 2023",
      focus: "Education Reform & ICT",
      messageLink: "#",
      profileLink: "/about",
    },
    {
      badge: "Commissioner",
      avatar: "👩‍💼",
      name: "Hon. Dr. Ngozi Okafor-Williams",
      role: "Commissioner for Education",
      office: "Ministry HQ, Block A",
      tenureLabel: "Appointed",
      tenureValue: "January 2023",
      focus: "Curriculum & Quality",
      messageLink: "#",
      profileLink: "/about",
    },
    {
      badge: "Permanent Secretary",
      avatar: "👨‍💼",
      name: "Mr. Adeola S. Akinwande",
      role: "Permanent Secretary",
      office: "Ministry HQ, Block B",
      tenureLabel: "In Post",
      tenureValue: "March 2022",
      focus: "Administration & Budget",
      messageLink: "#",
      profileLink: "/about",
    },
    {
      badge: "Director",
      avatar: "👩‍🏫",
      name: "Prof. Amaka Chibueze-Eze",
      role: "Director, Basic & Secondary Edu.",
      office: "Ministry HQ, Block C",
      tenureLabel: "In Post",
      tenureValue: "February 2023",
      focus: "Curriculum & Quality",
      messageLink: "#",
      profileLink: "/about",
    },
  ];

  return (
    <section className="officers" id="officers">
      <div className="sec-eyebrow">Leadership</div>
      <h2 className="sec-title">Key Government Officers</h2>

      <div className="officers-grid">
        {officers.map((officer, index) => (
          <div key={index} className="o-card">
            <div className="o-top">
              <div className="o-avatar">{officer.avatar}</div>
              <div className="o-badge">{officer.badge}</div>
            </div>

            <div className="o-body">
              <div className="o-name">{officer.name}</div>
              <div className="o-role">{officer.role}</div>
              <div className="o-divider"></div>
              <div className="o-detail">
                <strong>Office:</strong> {officer.office}
                <br />
                <strong>{officer.tenureLabel}:</strong>{" "}
                {officer.tenureValue}
                <br />
                <strong>Focus:</strong> {officer.focus}
              </div>
              <div className="o-chips">
                <a href={officer.messageLink} className="o-chip">
                  📧 Message
                </a>

                <a
                  href={officer.profileLink}
                  className="o-chip"
                >
                  📄 Profile
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Officers;