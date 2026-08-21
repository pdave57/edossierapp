import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getReportCards,
  generateReportCards,
  updateReportCardRemarks,
  publishReportCard,
  getStudent,
  getSessions,
  getActiveTerm,
  getTerms,
  getLevels,
  getSchoolSubLevels,
  getSchools,
  getErrorMessage,
} from "../api/client";

const emptyForm = {
  school_id: "",
  session_id: "",
  term_id: "",
  level_id: "",
  sub_level_id: "",
};

function ReportCards() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  // The backend lists sessions/levels keyed by school_id, so fall back to the
  // authenticated user's school when no explicit filter is selected. The user
  // object may be the raw claims (school_id) or an envelope (data.school_id).
  const authSchoolId = user?.school_id || user?.data?.school_id || null;
  const [reportCards, setReportCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [schools, setSchools] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [levels, setLevels] = useState([]);
  const [sublevels, setSublevels] = useState([]);
  const [remarkId, setRemarkId] = useState(null);
  const [principalRemarkText, setPrincipalRemarkText] = useState("");
  const [teacherRemarkText, setTeacherRemarkText] = useState("");
  const [publishingId, setPublishingId] = useState(null);
  const [bulkPublishing, setBulkPublishing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [generateForm, setGenerateForm] = useState(emptyForm);

  // Filter state (separate from generate form)
  const [filterSchool, setFilterSchool] = useState(searchParams.get("school_id") || "");
  const [filterSession, setFilterSession] = useState(searchParams.get("session_id") || "");
  const [filterTerm, setFilterTerm] = useState(searchParams.get("term_id") || "");
  const [filterSublevel, setFilterSublevel] = useState(searchParams.get("sub_level_id") || "");
  const [filterStatus, setFilterStatus] = useState("all");
  const [studentNameById, setStudentNameById] = useState({});

  // Sessions, levels and sublevels are all school-scoped on the backend. Resolve
  // the school once — an explicit pick wins, then the filter, then the token.
  const resolvedSchoolId = generateForm.school_id || filterSchool || authSchoolId || "";

  const fetchSchools = useCallback(async () => {
    try {
      const res = await getSchools();
      const list = Array.isArray(res.data) ? res.data : (res.data?.schools ?? res.data?.data ?? []);
      setSchools(list);
    } catch (err) {
      console.error("Schools fetch error:", err);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    // GET /sessions rejects a request with no school_id (400), so wait for one.
    if (!resolvedSchoolId) {
      setSessions([]);
      return;
    }
    try {
      const res = await getSessions(1, 200, resolvedSchoolId);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setSessions(list);
    } catch (err) {
      console.error("Sessions fetch error:", err);
      setSessions([]);
    }
  }, [resolvedSchoolId]);

  const fetchTerms = useCallback(async () => {
    const sessionId = generateForm.session_id || filterSession || null;
    try {
      let list = [];
      if (sessionId) {
        // Active term for a specific session; falls back to all terms on failure.
        const res = await getActiveTerm(sessionId, resolvedSchoolId || null);
        const raw = Array.isArray(res.data) ? res.data : (res.data?.data ?? res.data ?? []);
        list = Array.isArray(raw) ? raw : [raw];
      } else {
        const res = await getTerms();
        list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      }
      setTerms(list);
    } catch (err) {
      console.error("Terms fetch error:", err);
      try {
        const res = await getTerms();
        const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        setTerms(list);
      } catch (fallbackErr) {
        console.error("Terms fallback fetch error:", fallbackErr);
        setTerms([]);
      }
    }
  }, [generateForm.session_id, filterSession, resolvedSchoolId]);

  const fetchLevels = useCallback(async () => {
    try {
      const res = await getLevels(1, 200, resolvedSchoolId || undefined);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setLevels(list);
    } catch (err) {
      console.error("Levels fetch error:", err);
      setLevels([]);
    }
  }, [resolvedSchoolId]);

  useEffect(() => {
    let cancelled = false;
    const fetchSublevels = async () => {
      try {
        let list = [];
        if (resolvedSchoolId) {
          const res = await getSchoolSubLevels(resolvedSchoolId);
          list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        }
        if (!cancelled) {
          const levelId = generateForm.level_id;
          const filtered = levelId
            ? list.filter((sl) => sl.level_id === levelId)
            : list;
          setSublevels(filtered);
        }
      } catch (err) {
        console.error("Sublevels fetch error:", err);
      }
    };
    fetchSublevels();
    return () => { cancelled = true; };
  }, [resolvedSchoolId, generateForm.level_id]);

  const fetchReportCards = useCallback(async () => {
    const schoolFilter = resolvedSchoolId;
    const sessionFilter = filterSession || generateForm.session_id;
    const termFilter = filterTerm || generateForm.term_id;
    const sublevelFilter = filterSublevel || generateForm.sub_level_id;

    if (!schoolFilter && !sessionFilter && !termFilter && !sublevelFilter) {
      setReportCards([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = {
        ...(schoolFilter ? { school_id: schoolFilter } : {}),
        ...(sessionFilter ? { session_id: sessionFilter } : {}),
        ...(termFilter ? { term_id: termFilter } : {}),
        ...(sublevelFilter ? { sub_level_id: sublevelFilter } : {}),
      };
      const res = await getReportCards(1, 1000, params);
      let list = Array.isArray(res.data) ? res.data : (res.data?.data ?? res.data?.report_cards ?? []);

      list = list.map((rc) => ({
        ...rc,
        is_published: rc.is_published ?? !!rc.published_at,
        remarks: rc.remarks || rc.principal_remark || rc.teacher_remark || "",
        principal_remark: rc.principal_remark || "",
        teacher_remark: rc.teacher_remark || "",
        generated_at: rc.generated_at || rc.created_at || null,
      }));

      if (sessionFilter) list = list.filter((rc) => rc.session_id === sessionFilter);
      if (sublevelFilter) list = list.filter((rc) => rc.sub_level_id === sublevelFilter);
      if (filterStatus === "published") list = list.filter((rc) => rc.is_published);
      else if (filterStatus === "draft") list = list.filter((rc) => !rc.is_published);

      const studentIds = [...new Set(list.map((rc) => rc.student_id).filter(Boolean))];
      if (studentIds.length > 0) {
        const fetched = await Promise.all(
          studentIds.map((id) =>
            getStudent(id).then((r) => r.data?.data || r.data).catch(() => null)
          )
        );
        const map = {};
        fetched.forEach((s) => {
          if (s && s.id) {
            map[s.id] = [s.first_name, s.middle_name, s.last_name]
              .filter(Boolean)
              .join(" ") || s.name || s.id;
          }
        });
        setStudentNameById((prev) => ({ ...prev, ...map }));
      }

      setReportCards(list);
    } catch (err) {
      console.error("Report cards fetch error:", err);
      setError(`Failed to load report cards (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
      setReportCards([]);
    } finally {
      setLoading(false);
    }
  }, [filterSession, filterTerm, filterSublevel, filterStatus, resolvedSchoolId, generateForm.session_id, generateForm.term_id, generateForm.sub_level_id]);

  useEffect(() => {
    fetchSchools();
    fetchSessions();
    fetchTerms();
    fetchLevels();
  }, [fetchSchools, fetchSessions, fetchTerms, fetchLevels]);

  useEffect(() => {
    fetchReportCards();
  }, [fetchReportCards]);

  useEffect(() => {
    if (showGenerateForm) {
      setGenerateForm((prev) => {
        const updated = { ...prev };
        if (!updated.session_id && sessions.length > 0) {
          updated.session_id = sessions[0].id;
        }
        if (!updated.term_id && terms.length > 0) {
          updated.term_id = terms[0].id;
        }
        if (!updated.school_id && schools.length > 0) {
          updated.school_id = schools[0].id;
        }
        if (!updated.level_id && levels.length > 0) {
          updated.level_id = levels[0].id;
        }
        if (!updated.sub_level_id && sublevels.length > 0) {
          updated.sub_level_id = sublevels[0].id;
        }
        return updated;
      });
    }
  }, [showGenerateForm, sessions, terms, schools, levels, sublevels]);

  // Sync filter state to URL params
  useEffect(() => {
    const params = {};
    const sId = filterSchool || generateForm.school_id;
    const slId = filterSublevel || generateForm.sub_level_id;
    const sessId = filterSession || generateForm.session_id;
    const tId = filterTerm || generateForm.term_id;
    if (sId) params.school_id = sId;
    if (slId) params.sub_level_id = slId;
    if (sessId) params.session_id = sessId;
    if (tId) params.term_id = tId;
    setSearchParams(params, { replace: true });
  }, [filterSchool, filterSublevel, filterSession, filterTerm, generateForm.school_id, generateForm.sub_level_id, generateForm.session_id, generateForm.term_id, setSearchParams]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError("");
    setSuccess("");

    const missing = [];
    if (!generateForm.school_id) missing.push("school");
    if (!generateForm.sub_level_id) missing.push("sublevel");
    if (!generateForm.session_id) missing.push("session");
    if (!generateForm.term_id) missing.push("term");

    if (missing.length > 0) {
      setError(`Please select: ${missing.join(", ")}`);
      setGenerating(false);
      return;
    }

    try {
      const payload = {
        school_id: generateForm.school_id,
        sub_level_id: generateForm.sub_level_id,
        session_id: generateForm.session_id,
        term_id: generateForm.term_id,
      };

      await generateReportCards(payload);
      setSuccess("Report cards generated successfully!");
      setShowGenerateForm(false);
      setGenerateForm(emptyForm);
      setFilterSchool(payload.school_id);
      setFilterSession(payload.session_id);
      setFilterTerm(payload.term_id);
      setFilterSublevel(payload.sub_level_id);
    } catch (err) {
      console.error("Generate report cards error:", err);
      const message = getErrorMessage(err, "Failed to generate report cards");
      setError(`Failed to generate report cards (${err?.response?.status ?? 'network error'}): ${message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateRemarks = async (id) => {
    if (!principalRemarkText.trim() && !teacherRemarkText.trim()) {
      setError("Enter a principal or teacher remark before saving.");
      return;
    }
    // The backend remarks payload also carries attendance / total_school_days,
    // so echo the current values back rather than letting them default to 0.
    const current = reportCards.find((rc) => rc.id === id) || {};
    setError("");
    try {
      await updateReportCardRemarks(id, {
        principal_remark: principalRemarkText.trim(),
        teacher_remark: teacherRemarkText.trim(),
        attendance: Number(current.attendance) || 0,
        total_school_days: Number(current.total_school_days) || 0,
      });
      setSuccess("Remarks updated successfully!");
      setRemarkId(null);
      setPrincipalRemarkText("");
      setTeacherRemarkText("");
      await fetchReportCards();
    } catch (err) {
      setError(`Failed to update remarks (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    }
  };

  const handlePublish = async (id) => {
    setPublishingId(id);
    try {
      await publishReportCard(id);
      setSuccess("Report card published successfully!");
      await fetchReportCards();
    } catch (err) {
      setError(`Failed to publish report card (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    } finally {
      setPublishingId(null);
    }
  };

  const handleBulkPublish = async () => {
    const drafts = reportCards.filter((rc) => !rc.is_published);
    if (drafts.length === 0) {
      setError("No draft report cards to publish.");
      return;
    }
    if (!window.confirm(`Publish all ${drafts.length} draft report card(s)? This will make them visible to students.`)) {
      return;
    }

    setBulkPublishing(true);
    setBulkProgress({ done: 0, total: drafts.length });
    setError("");
    setSuccess("");

    let successCount = 0;
    let failCount = 0;
    for (let i = 0; i < drafts.length; i++) {
      try {
        await publishReportCard(drafts[i].id);
        successCount++;
      } catch (err) {
        failCount++;
        console.error(`Failed to publish report card ${drafts[i].id}:`, err);
      }
      setBulkProgress({ done: i + 1, total: drafts.length });
    }

    setBulkPublishing(false);
    if (failCount === 0) {
      setSuccess(`All ${successCount} report card(s) published successfully!`);
    } else {
      setSuccess(`Published ${successCount} report card(s). ${failCount} failed.`);
    }
    await fetchReportCards();
  };

  const handleViewEdossier = (rc) => {
    // Navigate to the Edossier printable view with the report card ID
    navigate(`/e-dossier?report_card_id=${rc.id}`);
  };

  const totalPages = Math.max(1, Math.ceil(reportCards.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedReportCards = reportCards.slice((safeCurrentPage - 1) * rowsPerPage, safeCurrentPage * rowsPerPage);

  const draftCount = reportCards.filter((rc) => !rc.is_published).length;

  if (loading && reportCards.length === 0) {
    return (
      <div style={{ padding: "60px 40px", textAlign: "center" }}>
        <div className="loading-spinner">Loading report cards...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <h1>Report Cards</h1>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {draftCount > 0 && (
            <button
              onClick={handleBulkPublish}
              disabled={bulkPublishing}
              style={{
                padding: "10px 20px",
                background: bulkPublishing ? "#9ca3af" : "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: bulkPublishing ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: "0.9rem",
              }}
            >
              {bulkPublishing
                ? `Publishing ${bulkProgress.done}/${bulkProgress.total}...`
                : `Publish All (${draftCount})`}
            </button>
          )}
          <button
            onClick={() => setShowGenerateForm(!showGenerateForm)}
            style={{ padding: "10px 20px", background: "#3e7430", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
          >
            {showGenerateForm ? "Cancel" : "Generate Report Cards"}
          </button>
        </div>
      </div>

      {error && <div style={{ padding: "10px", backgroundColor: "#fee2e2", color: "#991b1b", marginBottom: "10px", borderRadius: "8px" }}>{error}</div>}
      {success && <div style={{ padding: "10px", backgroundColor: "#d4edda", color: "#15803d", marginBottom: "10px", borderRadius: "8px" }}>{success}</div>}

      {showGenerateForm && (
        <div style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
          <h3 style={{ marginBottom: "15px" }}>Generate Report Cards</h3>
          <form onSubmit={handleGenerate}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500", fontSize: "0.9rem" }}>School</label>
                <select
                  value={generateForm.school_id}
                  onChange={(e) => setGenerateForm({ ...generateForm, school_id: e.target.value, level_id: '', sub_level_id: '' })}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "8px", background: "white", fontSize: "0.9rem" }}
                  required
                >
                  <option value="">Select school</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500", fontSize: "0.9rem" }}>Session</label>
                <select
                  value={generateForm.session_id}
                  onChange={(e) => setGenerateForm({ ...generateForm, session_id: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "8px", background: "white", fontSize: "0.9rem" }}
                  required
                >
                  <option value="">Select session</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>{session.name || session.session_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500", fontSize: "0.9rem" }}>Term</label>
                <select
                  value={generateForm.term_id}
                  onChange={(e) => setGenerateForm({ ...generateForm, term_id: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "8px", background: "white", fontSize: "0.9rem" }}
                  required
                >
                  <option value="">Select term</option>
                  {(Array.isArray(terms) ? terms : []).map((term) => (
                    <option key={term.id} value={term.id}>{term.name || term.term_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500", fontSize: "0.9rem" }}>Level</label>
                <select
                  value={generateForm.level_id}
                  onChange={(e) => setGenerateForm({ ...generateForm, level_id: e.target.value, sub_level_id: '' })}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "8px", background: "white", fontSize: "0.9rem" }}
                  required
                >
                  <option value="">Select level</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>{level.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500", fontSize: "0.9rem" }}>Sublevel</label>
                <select
                  value={generateForm.sub_level_id}
                  onChange={(e) => setGenerateForm({ ...generateForm, sub_level_id: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "8px", background: "white", fontSize: "0.9rem" }}
                  required
                >
                  <option value="">Select sublevel</option>
                  {sublevels.map((sublevel) => (
                    <option key={sublevel.id} value={sublevel.id}>{sublevel.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "end" }}>
                <button
                  type="submit"
                  disabled={generating || !generateForm.school_id || !generateForm.sub_level_id || !generateForm.session_id || !generateForm.term_id}
                  style={{ padding: "10px 20px", background: "#3e7430", color: "white", border: "none", borderRadius: "8px", cursor: (generating || !generateForm.school_id || !generateForm.sub_level_id || !generateForm.session_id || !generateForm.term_id) ? "not-allowed" : "pointer", fontWeight: "600", opacity: (generating || !generateForm.school_id || !generateForm.sub_level_id || !generateForm.session_id || !generateForm.term_id) ? 0.6 : 1 }}
                >
                  {generating ? "Generating..." : "Generate"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div style={{ background: "white", padding: "16px 20px", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", alignItems: "end" }}>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "0.85rem", color: "#6b7280" }}>Filter by School</label>
            <select
              value={filterSchool}
              onChange={(e) => { setFilterSchool(e.target.value); setFilterSublevel(""); setCurrentPage(1); }}
              style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "6px", background: "white", fontSize: "0.85rem" }}
            >
              <option value="">All schools</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "0.85rem", color: "#6b7280" }}>Filter by Session</label>
            <select
              value={filterSession}
              onChange={(e) => { setFilterSession(e.target.value); setCurrentPage(1); }}
              disabled={!resolvedSchoolId}
              style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "6px", background: resolvedSchoolId ? "white" : "#f3f4f6", fontSize: "0.85rem", cursor: resolvedSchoolId ? "pointer" : "not-allowed" }}
            >
              <option value="">{resolvedSchoolId ? "All sessions" : "Select a school first"}</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>{s.name || s.session_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "0.85rem", color: "#6b7280" }}>Filter by Term</label>
            <select
              value={filterTerm}
              onChange={(e) => { setFilterTerm(e.target.value); setCurrentPage(1); }}
              style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "6px", background: "white", fontSize: "0.85rem" }}
            >
              <option value="">All terms</option>
              {(Array.isArray(terms) ? terms : []).map((t) => (
                <option key={t.id} value={t.id}>{t.name || t.term_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "0.85rem", color: "#6b7280" }}>Filter by Sublevel</label>
            <select
              value={filterSublevel}
              onChange={(e) => { setFilterSublevel(e.target.value); setCurrentPage(1); }}
              disabled={!resolvedSchoolId}
              style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "6px", background: resolvedSchoolId ? "white" : "#f3f4f6", fontSize: "0.85rem", cursor: resolvedSchoolId ? "pointer" : "not-allowed" }}
            >
              <option value="">{resolvedSchoolId ? "All sublevels" : "Select a school first"}</option>
              {sublevels.map((sl) => (
                <option key={sl.id} value={sl.id}>{sl.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "0.85rem", color: "#6b7280" }}>Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "6px", background: "white", fontSize: "0.85rem" }}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
        <p style={{ margin: "10px 0 0", fontSize: "0.78rem", color: "#6b7280" }}>
          Sessions and sublevels are school-scoped, so pick a school first. The API lists report cards by
          school + term — select both to populate the table; session and sublevel are then applied to the
          loaded results.
        </p>
      </div>

      <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-light)", borderBottom: "2px solid var(--border)" }}>
              <th style={{ padding: "15px", textAlign: "left" }}>Student</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Session</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Term</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Sublevel</th>
              <th style={{ padding: "15px", textAlign: "center" }}>Published</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Remarks</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Generated At</th>
              <th style={{ padding: "15px", textAlign: "left", width: "220px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedReportCards.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: "40px", textAlign: "center", color: "var(--gray)" }}>
                  No report cards found. Adjust filters or generate new report cards.
                </td>
              </tr>
            ) : (
              paginatedReportCards.map((rc) => (
                <tr key={rc.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "15px" }}>{studentNameById[rc.student_id] || rc.student_name || rc.student_id}</td>
                  <td style={{ padding: "15px" }}>{sessions.find((s) => s.id === rc.session_id)?.name || rc.session_id || "—"}</td>
                  <td style={{ padding: "15px" }}>{terms.find((t) => t.id === rc.term_id)?.name || rc.term_id || "—"}</td>
                  <td style={{ padding: "15px" }}>{sublevels.find((sl) => sl.id === rc.sub_level_id)?.name || rc.sub_level_id || "—"}</td>
                  <td style={{ padding: "15px", textAlign: "center" }}>
                    {rc.is_published ? (
                      <span style={{ background: "#d4edda", color: "#155724", padding: "4px 8px", borderRadius: "12px", fontSize: "0.85rem" }}>Published</span>
                    ) : (
                      <span style={{ background: "#e2e3e5", color: "#383d41", padding: "4px 8px", borderRadius: "12px", fontSize: "0.85rem" }}>Draft</span>
                    )}
                  </td>
                  <td style={{ padding: "15px" }}>
                    {remarkId === rc.id ? (
                      <div>
                        <input
                          type="text"
                          value={principalRemarkText}
                          onChange={(e) => setPrincipalRemarkText(e.target.value)}
                          placeholder="Principal remark..."
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid var(--border)", borderRadius: "4px", marginBottom: "6px" }}
                        />
                        <input
                          type="text"
                          value={teacherRemarkText}
                          onChange={(e) => setTeacherRemarkText(e.target.value)}
                          placeholder="Teacher remark..."
                          style={{ width: "100%", padding: "6px 8px", border: "1px solid var(--border)", borderRadius: "4px", marginBottom: "6px" }}
                        />
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => handleUpdateRemarks(rc.id)} style={{ fontSize: "0.8rem", padding: "4px 8px", background: "#3e7430", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Save</button>
                          <button onClick={() => { setRemarkId(null); setPrincipalRemarkText(""); setTeacherRemarkText(""); }} style={{ fontSize: "0.8rem", padding: "4px 8px", background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: "4px", cursor: "pointer" }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                        {rc.principal_remark && <div><span style={{ fontWeight: "600" }}>Principal:</span> {rc.principal_remark}</div>}
                        {rc.teacher_remark && <div><span style={{ fontWeight: "600" }}>Teacher:</span> {rc.teacher_remark}</div>}
                        {!rc.principal_remark && !rc.teacher_remark && (rc.remarks || "—")}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "15px", fontSize: "0.9rem" }}>{rc.generated_at ? new Date(rc.generated_at).toLocaleDateString() : "—"}</td>
                  <td style={{ padding: "15px" }}>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <button onClick={() => handleViewEdossier(rc)} style={{ fontSize: "0.8rem", padding: "6px 10px", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>View</button>
                      <button onClick={() => { setRemarkId(rc.id); setPrincipalRemarkText(rc.principal_remark || ""); setTeacherRemarkText(rc.teacher_remark || ""); }} style={{ fontSize: "0.8rem", padding: "6px 10px", background: "#f59e0b", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Remarks</button>
                      {!rc.is_published && (
                        <button onClick={() => handlePublish(rc.id)} disabled={publishingId === rc.id} style={{ fontSize: "0.8rem", padding: "6px 10px", background: "#3e7430", color: "white", border: "none", borderRadius: "4px", cursor: publishingId === rc.id ? "not-allowed" : "pointer", opacity: publishingId === rc.id ? 0.6 : 1 }}>
                          {publishingId === rc.id ? "Publishing..." : "Publish"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p style={{ margin: "10px 0 0", fontSize: "0.78rem", color: "#6b7280" }}>
        Note: report cards cannot be deleted here — the API exposes no delete endpoint for report cards.
      </p>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", marginTop: "20px", flexWrap: "wrap" }}>
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safeCurrentPage === 1} style={{ padding: "6px 12px", border: "1px solid var(--border)", borderRadius: "6px", background: "white", cursor: safeCurrentPage === 1 ? "not-allowed" : "pointer", opacity: safeCurrentPage === 1 ? 0.5 : 1 }}>Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button key={page} onClick={() => setCurrentPage(page)} style={{ padding: "6px 12px", border: "1px solid var(--border)", borderRadius: "6px", background: page === safeCurrentPage ? "#3e7430" : "white", color: page === safeCurrentPage ? "white" : "black", cursor: "pointer", fontWeight: page === safeCurrentPage ? "600" : "400" }}>{page}</button>
          ))}
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safeCurrentPage === totalPages} style={{ padding: "6px 12px", border: "1px solid var(--border)", borderRadius: "6px", background: "white", cursor: safeCurrentPage === totalPages ? "not-allowed" : "pointer", opacity: safeCurrentPage === totalPages ? 0.5 : 1 }}>Next</button>
        </div>
      )}
    </div>
  );
}

export default ReportCards;
