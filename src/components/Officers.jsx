function Officers() {
  const officers = [
    {
      badge: "State Governor",
      avatar: "/images/gov-kefas-ogbu2.jpg",
      name: "H.E. Gov. Kefas Ogbu",
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
      avatar: "/images/commissioner1.jpg",
      name: "Hon. Dr. Augustina Godwin",
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
      avatar: "/images/permanentsec.jpg",
      name: "Mr. Idris A. Goje",
      role: "Permanent Secretary",
      office: "Ministry HQ, Block B",
      tenureLabel: "In Post",
      tenureValue: "May 2024",
      focus: "Administration & Budget",
      messageLink: "#",
      profileLink: "/about",
    },
    {
      badge: "Director",
      avatar: "/assets/images/avatar/male.png",
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

  const fallbackAvatar = "/assets/images/avatar/male.png";

  return (
    <section className="officers" id="officers">
      <div className="sec-eyebrow">Leadership</div>
      <h2 className="sec-title">Key Government Officers</h2>

      <div className="officers-grid">
        {officers.map((officer, index) => (
          <div key={index} className="o-card">
            <div className="o-top">
              <div className="o-avatar">
                <img
                  src={officer.avatar}
                  alt={officer.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = fallbackAvatar;
                  }}
                />
              </div>
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