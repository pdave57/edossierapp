import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getReportCard,
  updateReportCardRemarks,
  publishReportCard,
  getStudent,
  getSchools,
  getSubjects,
  getSession,
  getTerm,
  getErrorMessage,
} from "../api/client";

const GRADING_SCALE = [
  { range: "A - (70 – 100%)", remark: "Excellent" },
  { range: "B - (60 – 69%)", remark: "Very Good" },
  { range: "C - (50 – 59%)", remark: "Credit" },
  { range: "D - (45 – 49%)", remark: "Fair" },
  { range: "E - (40 – 45%)", remark: "Pass" },
  { range: "F - (00 – 39%)", remark: "Fail" },
];

function gradeColor(grade) {
  switch (grade) {
    case "A": return "#14532D";
    case "B": return "#166534";
    case "C": return "#1e40af";
    case "D": return "#92400e";
    case "E": return "#7c3aed";
    case "F": return "#991b1b";
    default:  return "#374151";
  }
}

function ReportCardView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reportCard, setReportCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [remarkText, setRemarkText] = useState("");
  const [updatingRemark, setUpdatingRemark] = useState(false);
  const [schools, setSchools] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const fetchSchools = useCallback(async () => {
    try {
      const res = await getSchools();
      const list = Array.isArray(res.data) ? res.data : (res.data?.schools ?? res.data?.data ?? []);
      setSchools(list);
    } catch (err) {
      console.error("Schools fetch error:", err);
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await getSubjects(1, 200);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setSubjects(list);
    } catch (err) {
      console.error("Subjects fetch error:", err);
    }
  }, []);

  const fetchReportCard = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await getReportCard(id);
      const data = res.data?.data || res.data;
      setReportCard(data);
      if (data?.remarks) {
        setRemarkText(data.remarks);
      }
    } catch (err) {
      setError(`Failed to load report card (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReportCard();
  }, [fetchReportCard]);

  useEffect(() => {
    fetchSchools();
    fetchSubjects();
  }, [fetchSchools, fetchSubjects]);

  const handlePublish = async () => {
    if (!id) return;
    setPublishing(true);
    setError("");
    try {
      await publishReportCard(id);
      setSuccess("Report card published successfully!");
      await fetchReportCard();
    } catch (err) {
      setError(`Failed to publish report card (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    } finally {
      setPublishing(false);
    }
  };

  const handleUpdateRemarks = async () => {
    if (!id || !remarkText.trim()) return;
    setUpdatingRemark(true);
    setError("");
    try {
      await updateReportCardRemarks(id, { remarks: remarkText.trim() });
      setSuccess("Remarks updated successfully!");
      await fetchReportCard();
    } catch (err) {
      setError(`Failed to update remarks (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    } finally {
      setUpdatingRemark(false);
    }
  };

  const getSchoolName = (schoolId) => schools.find((s) => s.id === schoolId)?.name || "—";
  const getSubjectName = (subjectId) => subjects.find((s) => s.id === subjectId)?.name || "—";

  if (loading) {
    return (
      <div style={{ padding: "60px 40px", textAlign: "center" }}>
        <div className="loading-spinner">Loading report card...</div>
      </div>
    );
  }

  if (!reportCard) {
    return (
      <div style={{ padding: "60px 40px", textAlign: "center", color: "#5C5C54" }}>
        <div style={{ fontWeight: "600" }}>Report card not found.</div>
        <button onClick={() => navigate("/report-cards")} style={{ marginTop: "15px", padding: "10px 20px", background: "#3e7430", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>Back to Report Cards</button>
      </div>
    );
  }

  const subjectMap = {};
  (reportCard.scores || []).forEach((score) => {
    subjectMap[score.subject_id] = score;
  });

  return (
    <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <h1>Report Card</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => navigate("/report-cards")} style={{ padding: "10px 20px", background: "#6b7280", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>Back</button>
          {!reportCard.is_published && (
            <button onClick={handlePublish} disabled={publishing} style={{ padding: "10px 20px", background: "#3e7430", color: "white", border: "none", borderRadius: "8px", cursor: publishing ? "not-allowed" : "pointer", fontWeight: "600", opacity: publishing ? 0.6 : 1 }}>
              {publishing ? "Publishing..." : "Publish"}
            </button>
          )}
        </div>
      </div>

      {error && <div style={{ padding: "10px", backgroundColor: "#fee2e2", color: "#991b1b", marginBottom: "10px" }}>{error}</div>}
      {success && <div style={{ padding: "10px", backgroundColor: "#d4edda", color: "#15803d", marginBottom: "10px" }}>{success}</div>}

      <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "20px" }}>
          <div>
            <strong>Student:</strong> {reportCard.student_name || reportCard.student_id}
          </div>
          <div>
            <strong>School:</strong> {getSchoolName(reportCard.school_id)}
          </div>
          <div>
            <strong>Session:</strong> {reportCard.session?.name || reportCard.session_id || "—"}
          </div>
          <div>
            <strong>Term:</strong> {reportCard.term?.name || reportCard.term_id || "—"}
          </div>
          <div>
            <strong>Status:</strong> {reportCard.is_published ? "Published" : "Draft"}
          </div>
          <div>
            <strong>Generated:</strong> {reportCard.generated_at ? new Date(reportCard.generated_at).toLocaleString() : "—"}
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "0.9rem" }}>Remarks</label>
          <textarea
            value={remarkText}
            onChange={(e) => setRemarkText(e.target.value)}
            rows="3"
            style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "0.9rem" }}
            placeholder="Enter remarks..."
          />
          <button onClick={handleUpdateRemarks} disabled={updatingRemark} style={{ marginTop: "10px", padding: "8px 16px", background: "#f59e0b", color: "white", border: "none", borderRadius: "8px", cursor: updatingRemark ? "not-allowed" : "pointer", fontWeight: "600", opacity: updatingRemark ? 0.6 : 1 }}>
            {updatingRemark ? "Saving..." : "Save Remarks"}
          </button>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-light)", borderBottom: "2px solid var(--border)" }}>
              <th style={{ padding: "15px", textAlign: "left" }}>Subject</th>
              <th style={{ padding: "15px", textAlign: "center" }}>CA Score</th>
              <th style={{ padding: "15px", textAlign: "center" }}>Exam Score</th>
              <th style={{ padding: "15px", textAlign: "center" }}>Total</th>
              <th style={{ padding: "15px", textAlign: "center" }}>Grade</th>
              <th style={{ padding: "15px", textAlign: "center" }}>Position</th>
            </tr>
          </thead>
          <tbody>
            {(reportCard.scores || []).length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: "40px", textAlign: "center", color: "var(--gray)" }}>
                  No scores available for this report card.
                </td>
              </tr>
            ) : (
              (reportCard.scores || []).map((score, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "15px" }}>{getSubjectName(score.subject_id) || score.subject_name || "—"}</td>
                  <td style={{ padding: "15px", textAlign: "center" }}>{score.ca_score ?? "—"}</td>
                  <td style={{ padding: "15px", textAlign: "center" }}>{score.exam_score ?? "—"}</td>
                  <td style={{ padding: "15px", textAlign: "center", fontWeight: "600" }}>{score.total_score ?? "—"}</td>
                  <td style={{ padding: "15px", textAlign: "center" }}>
                    {score.grade ? (
                      <span style={{ background: gradeColor(score.grade), color: "white", padding: "4px 10px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "600" }}>{score.grade}</span>
                    ) : "—"}
                  </td>
                  <td style={{ padding: "15px", textAlign: "center" }}>{score.position ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ReportCardView;
