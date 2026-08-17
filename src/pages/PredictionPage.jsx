// src/pages/PredictionPage.jsx
//
// Student Performance Prediction dashboard.
// Drop this into your router as:   <Route path="/predictions" element={<PredictionPage />} />
//
// Layout: no <Header> or <Footer> — those come from your app's layout wrapper.
// Consumes: GET /api/v1/predictions/schools/{schoolId}/full
//
// Sections:
//   1. School selector + session selector
//   2. School-level summary card (rating, composite, predicted pass rate)
//   3. Signal breakdown: Facility / Personnel / Historical gauges
//   4. Risk distribution bar + counts
//   5. Contributing factor cards (from the engine)
//   6. Student table with risk chip, composite score, predicted range
//   7. Student detail drawer (click a row)

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { getFullPredictionReport, getSchools, getSessions, getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const RISK_COLORS = {
  LOW:    { bg: "#f0f9eb", text: "#3e7430", border: "#b7dba0" },
  MEDIUM: { bg: "#fff8e6", text: "#a06000", border: "#f0d080" },
  HIGH:   { bg: "#fff0f0", text: "#c0392b", border: "#f5b8b8" },
};

const RATING_COLORS = {
  EXCELLENT: "#3e7430",
  GOOD:      "#2980b9",
  AVERAGE:   "#e07b00",
  POOR:      "#c0392b",
};

const RATING_LABELS = {
  EXCELLENT: "Excellent",
  GOOD:      "Good",
  AVERAGE:   "Average",
  POOR:      "Needs Improvement",
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function PredictionPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [schools, setSchools] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [schoolId, setSchoolId] = useState(() => searchParams.get("school_id") || "");
  const [sessionId, setSessionId] = useState(() => searchParams.get("session_id") || "");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const drawerRef = useRef(null);

  const getList = (res) => {
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.data)) return res.data.data;
    if (Array.isArray(res.data?.schools)) return res.data.schools;
    return [];
  };

  // Fetch school list on mount.
  useEffect(() => {
    async function load() {
      try {
        const sRes = await getSchools();
        const schoolList = getList(sRes);
        setSchools(schoolList);
      } catch {
        // Non-fatal — dropdown will remain empty.
      }
    }
    load();
  }, []);

  // Fetch sessions whenever the selected school changes.
  useEffect(() => {
    if (!schoolId) {
      setSessions([]);
      return;
    }
    let active = true;
    async function load() {
      try {
        const ssRes = await getSessions(1, 100, schoolId);
        if (!active) return;
        const sessionList = getList(ssRes);
        setSessions(sessionList);
      } catch {
        if (active) setSessions([]);
      }
    }
    load();
    return () => { active = false; };
  }, [schoolId]);

  const fetchReport = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError("");
    setReport(null);
    setSelectedStudent(null);
    try {
      const res = await getFullPredictionReport(schoolId, sessionId);
      const payload = res.data?.data || res.data || {};
      setReport(payload);
    } catch (e) {
      setError(getErrorMessage(e, "Failed to generate prediction report."));
    } finally {
      setLoading(false);
    }
  }, [schoolId, sessionId]);

  // Close drawer on outside click.
  useEffect(() => {
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setSelectedStudent(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredStudents = (report?.students || []).filter((s) => {
    const matchRisk   = riskFilter === "ALL" || s.risk_level === riskFilter;
    const matchSearch = !search ||
      s.student_name.toLowerCase().includes(search.toLowerCase());
    return matchRisk && matchSearch;
  });

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1300, margin: "0 auto" }}>

      {/* ── PAGE HEADER ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.12em", color: "#3e7430", background: "#f0f9eb",
          padding: "4px 12px", borderRadius: 20, border: "1px solid #b7dba0" }}>
          AI-Assisted
        </span>
        <h1 style={{ margin: "10px 0 4px", fontSize: 28, fontWeight: 800,
          color: "#0e1f38", letterSpacing: "-0.02em" }}>
          Student Performance Prediction
        </h1>
        <p style={{ margin: 0, color: "#666", fontSize: 14 }}>
          Weighted model combining facility infrastructure, teaching personnel quality,
          and historical academic records to predict student outcomes.
        </p>
      </div>

      {/* ── SELECTORS ────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap",
        background: "white", padding: "20px 24px", borderRadius: 14,
        border: "1.5px solid #e8edf3", marginBottom: 28 }}>
        <div style={{ flex: "1 1 260px" }}>
          <label style={labelStyle}>School</label>
          <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)}
            style={selectStyle}>
            <option value="">— Select a school —</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: "1 1 220px" }}>
          <label style={labelStyle}>Academic Session (optional)</label>
          <select value={sessionId} onChange={(e) => setSessionId(e.target.value)}
            style={selectStyle}>
            <option value="">All sessions</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button onClick={fetchReport} disabled={!schoolId || loading}
            style={{
              padding: "10px 28px", background: schoolId ? "#3e7430" : "#ccc",
              color: "white", border: "none", borderRadius: 10, fontWeight: 700,
              fontSize: 14, cursor: schoolId ? "pointer" : "not-allowed",
              transition: "background 0.2s",
            }}>
            {loading ? "Generating…" : "Generate Prediction"}
          </button>
        </div>
      </div>

      {/* ── STATES ───────────────────────────────────────────────────── */}
      {error && (
        <div style={{ background: "#fff0f0", border: "1.5px solid #f5b8b8",
          borderRadius: 12, padding: "14px 20px", color: "#c0392b",
          marginBottom: 24, fontSize: 14 }}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div style={{ background: "white", border: "1.5px solid #e8edf3",
          borderRadius: 14, padding: "60px 40px", textAlign: "center",
          color: "#666", fontSize: 15, marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚙️</div>
          Analysing facility records, personnel data, and score history…
        </div>
      )}

      {/* ── REPORT ───────────────────────────────────────────────────── */}
      {report && !loading && (
        <>
          {/* ── 1. SCHOOL SUMMARY CARD ─────────────────────────────── */}
          <SchoolSummaryCard school={report.school} />

          {/* ── 2. SIGNAL GAUGES ───────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)",
            gap: 16, marginBottom: 24 }}>
            <SignalGauge
              label="Facility Score"
              value={report.school.facility_score}
              icon="🏫"
              description="Condition, diversity and key asset types"
            />
            <SignalGauge
              label="Personnel Score"
              value={report.school.personnel_score}
              icon="👩‍🏫"
              description="Qualifications, ratio and staff activity"
            />
            <SignalGauge
              label="Historical Score"
              value={report.school.historical_score}
              icon="📊"
              description="Past average, pass rate and distinction rate"
            />
          </div>

          {/* ── 3. RISK DISTRIBUTION ───────────────────────────────── */}
          <RiskDistribution school={report.school} />

          {/* ── 4. FACTOR CARDS ────────────────────────────────────── */}
          <FactorCards factors={report.school.contributing_factors || []} />

          {/* ── 5. STUDENT TABLE ───────────────────────────────────── */}
          <div style={{ background: "white", border: "1.5px solid #e8edf3",
            borderRadius: 14, overflow: "hidden", marginBottom: 28 }}>
            <div style={{ padding: "20px 24px 16px",
              borderBottom: "1.5px solid #e8edf3",
              display: "flex", alignItems: "center",
              justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700,
                color: "#0e1f38" }}>
                Student Predictions
                <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 400,
                  color: "#888" }}>
                  ({filteredStudents.length} students)
                </span>
              </h2>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  placeholder="Search by name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ ...selectStyle, width: 200, padding: "8px 12px" }}
                />
                <select value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  style={{ ...selectStyle, width: 160 }}>
                  <option value="ALL">All risk levels</option>
                  <option value="HIGH">High risk only</option>
                  <option value="MEDIUM">Medium risk</option>
                  <option value="LOW">Low risk</option>
                </select>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse",
                fontSize: 13.5 }}>
                <thead>
                  <tr style={{ background: "#f7f9fc" }}>
                    {["Student", "Risk Level", "Predicted Range",
                      "Composite Score", "Historical Avg", "Confidence", ""].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left",
                        fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.08em", color: "#888",
                        borderBottom: "1.5px solid #e8edf3" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "40px", textAlign: "center",
                        color: "#999" }}>
                        No students match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <StudentRow
                        key={s.student_id}
                        student={s}
                        onSelect={setSelectedStudent}
                        isSelected={selectedStudent?.student_id === s.student_id}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── STUDENT DETAIL DRAWER ──────────────────────────────────── */}
      {selectedStudent && (
        <StudentDrawer
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          drawerRef={drawerRef}
        />
      )}

      {/* ── MODEL EXPLAINER FOOTER ─────────────────────────────────── */}
      <ModelExplainer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHOOL SUMMARY CARD
// ─────────────────────────────────────────────────────────────────────────────

function SchoolSummaryCard({ school }) {
  const ratingColor = RATING_COLORS[school.rating] || "#666";
  return (
    <div style={{ background: "white", border: `2px solid ${ratingColor}30`,
      borderRadius: 14, padding: "24px 28px", marginBottom: 24,
      display: "grid", gridTemplateColumns: "1fr auto",
      gap: 20, alignItems: "center" }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.1em", color: "#888", marginBottom: 4 }}>
          School Performance Rating
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#0e1f38",
          marginBottom: 6 }}>
          {school.school_name}
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 12 }}>
          <Metric label="Composite Score" value={`${school.composite_score}%`} />
          <Metric label="Predicted Pass Rate" value={`${school.predicted_pass_rate}%`} />
          <Metric label="High Risk Students" value={school.high_risk_student_count}
            warn={school.high_risk_student_count > 0} />
          <Metric label="Low Risk Students" value={school.low_risk_student_count} />
        </div>
      </div>
      <div style={{ textAlign: "center", minWidth: 120 }}>
        <div style={{ width: 90, height: 90, borderRadius: "50%",
          background: `${ratingColor}15`, border: `3px solid ${ratingColor}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 8px", flexDirection: "column" }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: ratingColor,
            lineHeight: 1 }}>
            {school.composite_score}
          </span>
          <span style={{ fontSize: 10, color: ratingColor, fontWeight: 600 }}>
            / 100
          </span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: ratingColor,
          textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {RATING_LABELS[school.rating]}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, warn }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#888", fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800,
        color: warn ? "#c0392b" : "#0e1f38" }}>{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGNAL GAUGE
// ─────────────────────────────────────────────────────────────────────────────

function SignalGauge({ label, value, icon, description }) {
  const pct = Math.min(Math.max(value, 0), 100);
  const color = pct >= 65 ? "#3e7430" : pct >= 45 ? "#e07b00" : "#c0392b";
  const trackColor = pct >= 65 ? "#f0f9eb" : pct >= 45 ? "#fff8e6" : "#fff0f0";

  return (
    <div style={{ background: "white", border: "1.5px solid #e8edf3",
      borderRadius: 14, padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0e1f38" }}>{label}</div>
          <div style={{ fontSize: 11, color: "#888" }}>{description}</div>
        </div>
      </div>
      {/* Arc-style gauge using two nested divs */}
      <div style={{ background: "#f0f2f5", borderRadius: 6, height: 10,
        overflow: "hidden", marginBottom: 8 }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 6,
          background: color, transition: "width 0.6s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "center" }}>
        <span style={{ fontSize: 22, fontWeight: 900, color }}>{pct}</span>
        <span style={{ fontSize: 11, color, background: trackColor,
          padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>
          {pct >= 65 ? "Strong" : pct >= 45 ? "Moderate" : "Weak"}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RISK DISTRIBUTION
// ─────────────────────────────────────────────────────────────────────────────

function RiskDistribution({ school }) {
  const total = (school.high_risk_student_count +
    school.medium_risk_student_count +
    school.low_risk_student_count) || 1;

  const highPct   = (school.high_risk_student_count   / total * 100).toFixed(1);
  const medPct    = (school.medium_risk_student_count  / total * 100).toFixed(1);
  const lowPct    = (school.low_risk_student_count     / total * 100).toFixed(1);

  return (
    <div style={{ background: "white", border: "1.5px solid #e8edf3",
      borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700,
        color: "#0e1f38" }}>Risk Distribution</h3>
      <div style={{ display: "flex", height: 18, borderRadius: 9, overflow: "hidden",
        marginBottom: 16, background: "#f0f2f5" }}>
        {school.high_risk_student_count > 0 && (
          <div style={{ width: `${highPct}%`, background: "#e74c3c",
            transition: "width 0.6s" }} title={`High: ${highPct}%`} />
        )}
        {school.medium_risk_student_count > 0 && (
          <div style={{ width: `${medPct}%`, background: "#e07b00",
            transition: "width 0.6s" }} title={`Medium: ${medPct}%`} />
        )}
        {school.low_risk_student_count > 0 && (
          <div style={{ width: `${lowPct}%`, background: "#3e7430",
            transition: "width 0.6s" }} title={`Low: ${lowPct}%`} />
        )}
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {[
          { label: "High Risk", count: school.high_risk_student_count,
            pct: highPct, color: "#c0392b", bg: "#fff0f0" },
          { label: "Medium Risk", count: school.medium_risk_student_count,
            pct: medPct, color: "#a06000", bg: "#fff8e6" },
          { label: "Low Risk",  count: school.low_risk_student_count,
            pct: lowPct, color: "#3e7430", bg: "#f0f9eb" },
        ].map((r) => (
          <div key={r.label} style={{ display: "flex", alignItems: "center",
            gap: 10, background: r.bg, borderRadius: 10, padding: "8px 16px" }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: r.color }}>
              {r.count}
            </span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: r.color }}>
                {r.label}
              </div>
              <div style={{ fontSize: 11, color: "#888" }}>{r.pct}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FACTOR CARDS
// ─────────────────────────────────────────────────────────────────────────────

function FactorCards({ factors }) {
  if (!factors?.length) return null;
  // Show only top-level named factors (avoid duplicates from sub-factors).
  const unique = factors.filter((f, i, arr) =>
    arr.findIndex((x) => x.name === f.name) === i
  ).slice(0, 6);

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#0e1f38" }}>
        Contributing Factors
      </h3>
      <div style={{ display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {unique.map((f) => {
          const color = f.score >= 65 ? "#3e7430" : f.score >= 45 ? "#e07b00" : "#c0392b";
          return (
            <div key={f.name} style={{ background: "white",
              border: "1.5px solid #e8edf3", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0e1f38",
                  lineHeight: 1.3, maxWidth: "70%" }}>{f.name}</div>
                <span style={{ fontSize: 16, fontWeight: 900, color }}>{f.score.toFixed(0)}</span>
              </div>
              <div style={{ background: "#f0f2f5", borderRadius: 4, height: 6,
                overflow: "hidden", marginBottom: 8 }}>
                <div style={{ width: `${Math.min(f.score, 100)}%`, height: "100%",
                  background: color, borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 11, color: "#888", lineHeight: 1.4 }}>
                {f.detail}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT ROW
// ─────────────────────────────────────────────────────────────────────────────

function StudentRow({ student, onSelect, isSelected }) {
  const risk = RISK_COLORS[student.risk_level] || RISK_COLORS.MEDIUM;
  return (
    <tr
      onClick={() => onSelect(student)}
      style={{ borderBottom: "1px solid #e8edf3", cursor: "pointer",
        background: isSelected ? "#f0f9eb" : "white",
        transition: "background 0.15s" }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#f7f9fc"; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "white"; }}
    >
      <td style={{ padding: "13px 16px", fontWeight: 600, color: "#0e1f38" }}>
        {student.student_name}
      </td>
      <td style={{ padding: "13px 16px" }}>
        <span style={{ display: "inline-block", padding: "4px 12px",
          borderRadius: 20, fontSize: 11, fontWeight: 700,
          background: risk.bg, color: risk.text, border: `1px solid ${risk.border}`,
          letterSpacing: "0.05em", textTransform: "uppercase" }}>
          {student.risk_level}
        </span>
      </td>
      <td style={{ padding: "13px 16px", fontFamily: "monospace",
        color: "#0e1f38", fontWeight: 600 }}>
        {student.predicted_score_range?.label || "—"}
      </td>
      <td style={{ padding: "13px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, background: "#f0f2f5", borderRadius: 4, height: 6 }}>
            <div style={{ width: `${student.composite_score}%`, height: "100%",
              borderRadius: 4,
              background: student.composite_score >= 65 ? "#3e7430"
                : student.composite_score >= 45 ? "#e07b00" : "#c0392b" }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, minWidth: 32, color: "#0e1f38" }}>
            {student.composite_score}
          </span>
        </div>
      </td>
      <td style={{ padding: "13px 16px", color: "#444" }}>
        {student.historical_avg > 0 ? `${student.historical_avg}%` : "—"}
      </td>
      <td style={{ padding: "13px 16px" }}>
        <ConfidencePip value={student.confidence} />
      </td>
      <td style={{ padding: "13px 16px" }}>
        <span style={{ fontSize: 11, color: "#3e7430", fontWeight: 600 }}>
          View →
        </span>
      </td>
    </tr>
  );
}

function ConfidencePip({ value }) {
  const pct = Math.round((value || 0) * 100);
  const color = pct >= 70 ? "#3e7430" : pct >= 40 ? "#e07b00" : "#c0392b";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      <span style={{ fontSize: 12, color, fontWeight: 600 }}>{pct}%</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT DETAIL DRAWER
// ─────────────────────────────────────────────────────────────────────────────

function StudentDrawer({ student, onClose, drawerRef }) {
  const risk = RISK_COLORS[student.risk_level] || RISK_COLORS.MEDIUM;
  return (
    <>
      {/* Backdrop */}
      <div style={{ position: "fixed", inset: 0, background: "rgba(14,31,56,0.35)",
        zIndex: 900 }} onClick={onClose} />
      {/* Panel */}
      <div ref={drawerRef} style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 420,
        background: "white", zIndex: 901, overflowY: "auto",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.18)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "24px 24px 20px",
          borderBottom: "1.5px solid #e8edf3",
          background: risk.bg, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: risk.text,
                textTransform: "uppercase", letterSpacing: "0.1em",
                marginBottom: 4 }}>
                {student.risk_level} RISK
              </div>
              <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800,
                color: "#0e1f38" }}>
                {student.student_name}
              </h2>
              <div style={{ fontSize: 13, color: "#666" }}>
                Predicted: <strong style={{ color: "#0e1f38" }}>
                  {student.predicted_score_range?.label}
                </strong>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none",
              fontSize: 22, color: "#888", cursor: "pointer", padding: 4 }}>
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "24px", flex: 1 }}>
          {/* Score summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: 12, marginBottom: 24 }}>
            {[
              { label: "Composite Score", value: `${student.composite_score} / 100` },
              { label: "Historical Average", value: student.historical_avg > 0
                ? `${student.historical_avg}%` : "No data" },
              { label: "Facility Score", value: `${student.facility_score}` },
              { label: "Personnel Score", value: `${student.personnel_score}` },
              { label: "Model Confidence", value: `${Math.round(student.confidence * 100)}%` },
            ].map((m) => (
              <div key={m.label} style={{ background: "#f7f9fc",
                borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "#888", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  marginBottom: 4 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0e1f38" }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          {/* Composite score bar */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between",
              marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#444" }}>
              <span>Performance Composite</span>
              <span>{student.composite_score} / 100</span>
            </div>
            <div style={{ background: "#f0f2f5", borderRadius: 8, height: 14,
              overflow: "hidden" }}>
              <div style={{
                width: `${student.composite_score}%`, height: "100%",
                borderRadius: 8, transition: "width 0.6s ease",
                background: student.composite_score >= 65 ? "#3e7430"
                  : student.composite_score >= 45 ? "#e07b00" : "#c0392b",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between",
              fontSize: 10, color: "#aaa", marginTop: 4 }}>
              <span>0</span><span>Poor</span><span>Average</span>
              <span>Good</span><span>100</span>
            </div>
          </div>

          {/* Factor breakdown */}
          {(student.contributing_factors?.length > 0) && (
            <div>
              <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700,
                color: "#0e1f38", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Contributing Factors
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {student.contributing_factors
                  .filter((f, i, arr) => arr.findIndex((x) => x.name === f.name) === i)
                  .slice(0, 8)
                  .map((f) => {
                    const c = f.score >= 65 ? "#3e7430" : f.score >= 45 ? "#e07b00" : "#c0392b";
                    return (
                      <div key={f.name} style={{ background: "#f7f9fc",
                        borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between",
                          marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#0e1f38" }}>
                            {f.name}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 900, color: c }}>
                            {f.score.toFixed(0)}
                          </span>
                        </div>
                        <div style={{ background: "#e8edf3", borderRadius: 4, height: 5,
                          overflow: "hidden", marginBottom: 6 }}>
                          <div style={{ width: `${Math.min(f.score, 100)}%`,
                            height: "100%", background: c, borderRadius: 4 }} />
                        </div>
                        <div style={{ fontSize: 11, color: "#888", lineHeight: 1.4 }}>
                          {f.detail}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODEL EXPLAINER
// ─────────────────────────────────────────────────────────────────────────────

function ModelExplainer() {
  return (
    <div style={{ background: "#f7f9fc", border: "1.5px solid #e8edf3",
      borderRadius: 14, padding: "20px 24px" }}>
      <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700,
        color: "#0e1f38" }}>
        How the prediction model works
      </h4>
      <div style={{ display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        {[
          { label: "Facility (25%)", detail: "Condition rating, key assets (library, lab, ICT), diversity of infrastructure." },
          { label: "Personnel (35%)", detail: "Qualifications, teacher-to-student ratio, proportion of active staff." },
          { label: "Historical (40%)", detail: "Average score, pass rate, and distinction rate from past score sheets." },
          { label: "Confidence", detail: "Confidence scales with terms of data: 3+ terms = full confidence. No history = 0%." },
        ].map((m) => (
          <div key={m.label}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#3e7430",
              marginBottom: 3 }}>{m.label}</div>
            <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5 }}>{m.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontSize: 12,
  fontWeight: 700,
  color: "#555",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
};

const selectStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1.5px solid #d8e0eb",
  borderRadius: 9,
  fontSize: 14,
  color: "#0e1f38",
  background: "white",
  outline: "none",
  fontFamily: "inherit",
};

// authHeader() removed — authentication is now handled centrally by the
// shared Axios instance in src/api/client.js (getSchools / getSessions / etc.).