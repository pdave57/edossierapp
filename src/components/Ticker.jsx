function Ticker() {
  const items = [
    "📢 School Census 2025 Now Open",
    "🏫 New Accreditation Portal Launched",
    "📋 E-Dossier Deadline: 31 March 2025",
    "🎓 Scholarship Applications Open",
    "👩‍🏫 Personnel Verification Exercise in Progress",
  ];

  return (
    <div className="ticker">
      <div className="ticker-inner">
        {[...items, ...items].map((item, index) => (
          <span key={index} className="ticker-item">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default Ticker;