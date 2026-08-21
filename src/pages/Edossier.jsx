import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getEnrollments,
  getStudent,
  getStudentScores,
  getSchools,
  getSchool,
  getSubjects,
  getSchoolSubLevels,
  getLevels,
  getActiveSession,
  getActiveTerm,
  getSession,
  getTerm,
  getReportCard,
  getGradeConfigs,
  getErrorMessage,
  computePositionsBulk,
  getClassSubjectStats,
} from "../api/client";

const DEFAULT_GRADING_SCALE = [
  { range: "A - (70 – 100%)", remark: "Excellent" },
  { range: "B - (60 – 69%)", remark: "Very Good" },
  { range: "C - (50 – 59%)", remark: "Credit" },
  { range: "D - (45 – 49%)", remark: "Fair" },
  { range: "E - (40 – 45%)", remark: "Pass" },
  { range: "F - (00 – 39%)", remark: "Fail" },
];

const BEHAVIOUR_GROUPS = [
  { title: "Group A", traits: ["Punctuality", "Attendance", "Assignment"] },
  { title: "Group B", traits: ["Neatness", "Politeness", "Honesty"] },
  { title: "Group C", traits: ["Self Control", "Responsibility", "Participation"] },
];

function gradeColor(grade) {
  switch (grade) {
    case "A": return "#14532D";
    case "B": return "#166534";
    case "C": return "#1e40af";
    case "D": return "#92400e";
    case "E": return "#7c3aed";
    case "F": return "#991b1b";
    default: return "#374151";
  }
}

/** Map grade configs to a grading scale display array */
function buildGradingScale(configs) {
  if (!configs || configs.length === 0) return DEFAULT_GRADING_SCALE;
  const sorted = [...configs].sort((a, b) => b.max_score - a.max_score);
  return sorted.map((c) => ({
    range: `${c.grade} - (${Math.round(c.min_score)} – ${Math.round(c.max_score)}%)`,
    remark: c.remark || "",
  }));
}

/** Compute grade from a total score using grade configs */
function computeGrade(total, configs) {
  if (!configs || configs.length === 0 || total == null || isNaN(total)) {
    return { grade: "", remark: "" };
  }
  const sorted = [...configs].sort((a, b) => b.max_score - a.max_score);
  for (const config of sorted) {
    if (total >= config.min_score && total <= config.max_score) {
      return { grade: config.grade, remark: config.remark };
    }
  }
  return { grade: "", remark: "" };
}

/**
 * Resolve a score record's total on the same basis as the subject rows: an
 * explicit total when the backend supplies one, otherwise the sum of the CA and
 * exam components. Returns null when the record carries no usable figures.
 */
function scoreTotal(score) {
  if (!score) return null;
  const direct = score.total_score ?? score.total;
  if (direct !== undefined && direct !== null && direct !== "") {
    const parsed = parseFloat(direct);
    return isNaN(parsed) ? null : parsed;
  }
  const parts = [
    score.ca1_score ?? score.ca_score ?? score.ca1,
    score.ca2_score ?? score.ca2,
    score.ca3_score ?? score.ca3,
    score.exam_score ?? score.exam,
  ];
  if (parts.every((p) => p === undefined || p === null || p === "")) return null;
  return parts.reduce((sum, p) => sum + (parseFloat(p) || 0), 0);
}

/**
 * Average each subject's total across a class roster, keyed by subject id.
 *
 * The API exposes no bulk class-scores endpoint, so scores are fetched per
 * student (the same fanout ScoreSheet.jsx uses) in small batches to avoid
 * firing one request per student simultaneously. Only positive totals count —
 * a zero/blank total means "not scored yet" elsewhere on this page, so
 * including them would drag every average down.
 */
async function computeSubjectAverages(studentIds, sessionId, termId) {
  if (!studentIds || studentIds.length === 0) return {};

  const params = {};
  if (sessionId) params.session_id = sessionId;
  if (termId) params.term_id = termId;

  const collected = [];
  const batchSize = 8;
  for (let i = 0; i < studentIds.length; i += batchSize) {
    const batch = await Promise.all(
      studentIds.slice(i, i + batchSize).map((id) =>
        getStudentScores(id, params)
          .then((res) => (Array.isArray(res.data) ? res.data : (res.data?.data ?? [])))
          .catch(() => [])
      )
    );
    batch.forEach((scores) => collected.push(...scores));
  }

  const tally = {};
  collected.forEach((score) => {
    // getStudentScores only scopes by session, so drop other terms here too.
    if (termId && score.term_id && score.term_id !== termId) return;
    const subjectId = score.subject_id || score.subject?.id;
    const total = scoreTotal(score);
    if (!subjectId || total == null || total <= 0) return;
    if (!tally[subjectId]) tally[subjectId] = { sum: 0, count: 0 };
    tally[subjectId].sum += total;
    tally[subjectId].count += 1;
  });

  return Object.fromEntries(
    Object.entries(tally).map(([subjectId, { sum, count }]) => [subjectId, sum / count])
  );
}

/** Generate a general remark based on average score */
function generateGeneralRemark(avgScore) {
  if (avgScore == null || isNaN(avgScore)) return "—";
  if (avgScore >= 70) return "An excellent performance. Keep it up!";
  if (avgScore >= 60) return "A very good performance. Well done!";
  if (avgScore >= 50) return "A good performance. Keep striving for excellence.";
  if (avgScore >= 45) return "A fair performance. More effort is needed.";
  if (avgScore >= 40) return "Needs improvement. Work harder next term.";
  return "Below average. Serious improvement needed.";
}

function BehaviourGrid({ group }) {
  return (
    <div className="rc-behaviour-group">
      <table className="rc-beh-table">
        <thead>
          <tr>
            <th className="rc-beh-trait-head">Behaviour</th>
            {[5, 4, 3, 2, 1].map((n) => (
              <th key={n} className="rc-beh-score-head">{n}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {group.traits.map((trait) => (
            <tr key={trait}>
              <td className="rc-beh-trait">{trait}</td>
              {[5, 4, 3, 2, 1].map((n) => (
                <td key={n} className="rc-beh-cell" />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Edossier() {
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("student_id");
  const sessionId = searchParams.get("session_id");
  const termId = searchParams.get("term_id");
  const reportCardId = searchParams.get("report_card_id");

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReport = useCallback(async () => {
    // Determine how to load — either from report_card_id or from student_id + session/term
    const hasReportCardId = reportCardId && reportCardId !== "undefined" && reportCardId !== "null";
    const rawStudentId = studentId || "";
    const trimmedStudentId = String(rawStudentId).trim();
    const hasStudentId = trimmedStudentId && trimmedStudentId !== "undefined" && trimmedStudentId !== "null";

    if (!hasReportCardId && !hasStudentId) {
      setReport(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      let student = {};
      let school = {};
      let sessionName = "—";
      let termName = "—";
      let className = "—";
      let numInClass = "—";
      let sublevelId = null;
      let subjectScores = [];
      let gradeConfigs = [];
      let subjectsMap = {};
      let classStatsMap = {};
      let subjectAverages = {};
      let classStudentIds = [];
      let remarks = "";
      let nextTermDate = "—";
      let principal = "—";
      let schoolLogoUrl = null;
      let reportCardMeta = null;

      // ── Step 1: Load subjects map ──
      try {
        const subjectsRes = await getSubjects(1, 500);
        const subjectsList = Array.isArray(subjectsRes.data) ? subjectsRes.data : (subjectsRes.data?.data ?? []);
        subjectsList.forEach((s) => { subjectsMap[s.id] = s.name; });
      } catch (e) {
        console.warn("Failed to load subjects:", e);
      }

      if (hasReportCardId) {
        // ── Load from pre-generated report card ──
        const rcRes = await getReportCard(reportCardId);
        const rc = rcRes.data?.data || rcRes.data;
        if (!rc) throw new Error("Report card not found");
        reportCardMeta = rc;

        // Extract student info
        const effectiveStudentId = rc.student_id;
        if (effectiveStudentId) {
          try {
            const studentRes = await getStudent(effectiveStudentId);
            student = studentRes?.data?.data || studentRes?.data || {};
          } catch (e) {
            console.warn("Failed to load student:", e);
            student = { first_name: rc.student_name || "—" };
          }
        } else {
          student = { first_name: rc.student_name || "—" };
        }

        // School
        const schoolId = rc.school_id || student.school_id;
        if (schoolId) {
          try {
            const schoolRes = await getSchool(schoolId);
            school = schoolRes?.data?.data || schoolRes?.data || {};
          } catch (e) {
            try {
              const schoolsRes = await getSchools();
              const schoolsList = schoolsRes?.data?.data || schoolsRes?.data || [];
              school = schoolsList.find((s) => s.id === schoolId) || {};
            } catch (e2) {
              console.warn("Failed to load school:", e2);
            }
          }
          schoolLogoUrl = school.logo_url || school.logo || null;

          // Grade configs
          try {
            const gcRes = await getGradeConfigs(schoolId);
            gradeConfigs = Array.isArray(gcRes.data) ? gcRes.data : (gcRes.data?.data ?? []);
          } catch (e) {
            console.warn("Failed to load grade configs:", e);
          }
        }

        // Session & Term
        sessionName = rc.session?.name || rc.session_name || "—";
        termName = rc.term?.name || rc.term_name || "—";
        if (sessionName === "—" && rc.session_id) {
          try {
            const sessRes = await getSession(rc.session_id);
            const sess = sessRes?.data?.data || sessRes?.data || {};
            sessionName = sess.name || sess.session_name || "—";
          } catch (e) { /* ignore */ }
        }
        if (termName === "—" && rc.term_id) {
          try {
            const termRes = await getTerm(rc.term_id);
            const t = termRes?.data?.data || termRes?.data || {};
            termName = t.name || t.term_name || "—";
          } catch (e) { /* ignore */ }
        }

        // Class name from sublevel
        const sublevelId = rc.sub_level_id || student.sub_level_id;
        if (sublevelId && schoolId) {
          try {
            const slRes = await getSchoolSubLevels(schoolId);
            const slList = Array.isArray(slRes.data) ? slRes.data : (slRes.data?.data ?? []);
            const sl = slList.find((s) => s.id === sublevelId);
            if (sl) className = sl.name || "—";
          } catch (e) { /* ignore */ }
        }
        className = rc.sub_level?.name || className;

        // Number in class from enrollment count
        if (sublevelId && rc.session_id) {
          try {
            const enrollRes = await getEnrollments(1, 1000, {
              sub_level_id: sublevelId,
              session_id: rc.session_id,
              status: "ACTIVE",
            });
            const enrollList = Array.isArray(enrollRes.data) ? enrollRes.data : (enrollRes.data?.data ?? []);
            numInClass = enrollList.length || "—";
            classStudentIds = enrollList.map((en) => en.student_id || en.student?.id).filter(Boolean);
          } catch (e) { /* ignore */ }
        }

        // Compute class positions and fetch per-subject class stats (highest/lowest).
        const reportCardSubLevelId = rc.sub_level_id || student.sub_level_id;
        if (rc.term_id && reportCardSubLevelId) {
          try {
            await computePositionsBulk(rc.term_id, reportCardSubLevelId);
          } catch (e) {
            console.warn("Failed to compute positions:", e);
          }
          try {
            const statsRes = await getClassSubjectStats(rc.term_id, reportCardSubLevelId);
            const statsList = Array.isArray(statsRes.data) ? statsRes.data : (statsRes.data?.data ?? []);
            classStatsMap = Object.fromEntries(
              statsList.map((s) => [s.subject_id, {
                highest: s.highest_score,
                lowest: s.lowest_score,
                // The stats endpoint may already carry a class average; accept
                // whichever key it uses rather than recomputing it client-side.
                average: s.average_score ?? s.avg_score ?? s.average ?? s.mean_score ?? null,
              }])
            );
          } catch (e) {
            console.warn("Failed to load class stats:", e);
          }

          // Fall back to computing the per-subject class average locally when
          // the stats endpoint did not return one.
          if (!Object.values(classStatsMap).some((s) => s.average != null)) {
            try {
              subjectAverages = await computeSubjectAverages(classStudentIds, rc.session_id, rc.term_id);
            } catch (e) {
              console.warn("Failed to compute subject averages:", e);
            }
          }
        }

        // Load score sheet subject results for this student/session/term.
        // Combine scores directly attached to the report card (if any) with score sheet records from getStudentScores.
        let rcScores = rc.scores || rc.subject_scores || rc.results || rc.scores_sheet || rc.score_details || [];
        if (!Array.isArray(rcScores)) rcScores = [];

        try {
          const scoreParams = {};
          if (rc.session_id) scoreParams.session_id = rc.session_id;
          const scoresRes = await getStudentScores(rc.student_id, scoreParams);
          let scoreList = Array.isArray(scoresRes.data)
            ? scoresRes.data
            : (scoresRes.data?.data ?? []);
          if (rc.term_id) {
            scoreList = scoreList.filter((s) => s.term_id === rc.term_id);
          }

          const mergedScoresMap = {};
          const addOrMerge = (s) => {
            const subjectId = s.subject_id || s.subject?.id || s.id;
            if (!subjectId) return;
            if (!mergedScoresMap[subjectId]) {
              mergedScoresMap[subjectId] = { ...s };
            } else {
              Object.keys(s).forEach((k) => {
                if (s[k] !== undefined && s[k] !== null && s[k] !== "" && s[k] !== "—") {
                  mergedScoresMap[subjectId][k] = s[k];
                }
              });
            }
          };

          rcScores.forEach(addOrMerge);
          scoreList.forEach(addOrMerge);
          subjectScores = Object.values(mergedScoresMap);
        } catch (e) {
          console.warn("Failed to load student scores:", e);
          subjectScores = rcScores;
        }

        // Remarks & metadata (backend uses principal/teacher remarks)
        remarks =
          rc.principal_remark || rc.teacher_remark || rc.remarks || rc.general_remark || "";
        nextTermDate = rc.next_term_date || rc.next_term_begins || "—";
        principal = rc.principal_name || rc.principal || "—";

      } else {
        // ── Load from student_id + session/term ──
        const studentRes = await getStudent(trimmedStudentId);
        student = studentRes?.data?.data || {};
        if (!student || Object.keys(student).length === 0) {
          throw new Error(`Student ${trimmedStudentId} not found`);
        }

        const schoolId = student.school_id;

        // School
        if (schoolId) {
          try {
            const schoolRes = await getSchool(schoolId);
            school = schoolRes?.data?.data || schoolRes?.data || {};
          } catch (e) {
            try {
              const schoolsRes = await getSchools();
              const schoolsList = schoolsRes?.data?.data || schoolsRes?.data || [];
              school = schoolsList.find((s) => s.id === schoolId) || {};
            } catch (e2) {
              console.warn("Failed to load school:", e2);
            }
          }
          schoolLogoUrl = school.logo_url || school.logo || null;

          // Grade configs
          try {
            const gcRes = await getGradeConfigs(schoolId);
            gradeConfigs = Array.isArray(gcRes.data) ? gcRes.data : (gcRes.data?.data ?? []);
          } catch (e) {
            console.warn("Failed to load grade configs:", e);
          }
        }

        // Resolve session
        let effectiveSessionId = sessionId;
        if (!effectiveSessionId || effectiveSessionId === "undefined" || effectiveSessionId === "null") {
          try {
            const activeRes = await getActiveSession(schoolId || null);
            const activeSess = activeRes?.data?.data || activeRes?.data;
            effectiveSessionId = activeSess?.id || null;
            sessionName = activeSess?.name || activeSess?.session_name || "—";
          } catch (e) {
            console.warn("Failed to load active session:", e);
          }
        } else {
          try {
            const sessRes = await getSession(effectiveSessionId);
            const sess = sessRes?.data?.data || sessRes?.data || {};
            sessionName = sess.name || sess.session_name || "—";
          } catch (e) { /* ignore */ }
        }

        // Resolve term
        let effectiveTermId = termId;
        if (!effectiveTermId || effectiveTermId === "undefined" || effectiveTermId === "null") {
          try {
            const activeTermRes = await getActiveTerm(effectiveSessionId, schoolId || null);
            const activeT = activeTermRes?.data?.data || activeTermRes?.data;
            effectiveTermId = activeT?.id || null;
            termName = activeT?.name || activeT?.term_name || "—";
          } catch (e) {
            console.warn("Failed to load active term:", e);
          }
        } else {
          try {
            const termRes = await getTerm(effectiveTermId);
            const t = termRes?.data?.data || termRes?.data || {};
            termName = t.name || t.term_name || "—";
          } catch (e) { /* ignore */ }
        }

        // Enrollment → class name
        if (effectiveSessionId) {
          try {
            const enrollRes = await getEnrollments(1, 10, {
              student_id: trimmedStudentId,
              session_id: effectiveSessionId,
              status: "ACTIVE",
            });
            const enrollList = Array.isArray(enrollRes.data) ? enrollRes.data : (enrollRes.data?.data ?? []);
            const enrollment = enrollList[0];
            if (enrollment) {
              sublevelId = enrollment.sub_level_id;
              if (sublevelId && schoolId) {
                try {
                  const slRes = await getSchoolSubLevels(schoolId);
                  const slList = Array.isArray(slRes.data) ? slRes.data : (slRes.data?.data ?? []);
                  const sl = slList.find((s) => s.id === sublevelId);
                  if (sl) className = sl.name || "—";
                } catch (e) { /* ignore */ }

                // Number in class
                try {
                  const classEnrollRes = await getEnrollments(1, 1000, {
                    sub_level_id: sublevelId,
                    session_id: effectiveSessionId,
                    status: "ACTIVE",
                  });
                  const classEnrollList = Array.isArray(classEnrollRes.data) ? classEnrollRes.data : (classEnrollRes.data?.data ?? []);
                  numInClass = classEnrollList.length || "—";
                  classStudentIds = classEnrollList.map((en) => en.student_id || en.student?.id).filter(Boolean);
                } catch (e) { /* ignore */ }
              }
            }
          } catch (e) {
            console.warn("Failed to load enrollment:", e);
          }
        }

        // Compute class positions and fetch per-subject class stats (highest/lowest).
        if (effectiveTermId && sublevelId) {
          try {
            await computePositionsBulk(effectiveTermId, sublevelId);
          } catch (e) {
            console.warn("Failed to compute positions:", e);
          }
          try {
            const statsRes = await getClassSubjectStats(effectiveTermId, sublevelId);
            const statsList = Array.isArray(statsRes.data) ? statsRes.data : (statsRes.data?.data ?? []);
            classStatsMap = Object.fromEntries(
              statsList.map((s) => [s.subject_id, {
                highest: s.highest_score,
                lowest: s.lowest_score,
                // The stats endpoint may already carry a class average; accept
                // whichever key it uses rather than recomputing it client-side.
                average: s.average_score ?? s.avg_score ?? s.average ?? s.mean_score ?? null,
              }])
            );
          } catch (e) {
            console.warn("Failed to load class stats:", e);
          }

          // Fall back to computing the per-subject class average locally when
          // the stats endpoint did not return one.
          if (!Object.values(classStatsMap).some((s) => s.average != null)) {
            try {
              subjectAverages = await computeSubjectAverages(classStudentIds, effectiveSessionId, effectiveTermId);
            } catch (e) {
              console.warn("Failed to compute subject averages:", e);
            }
          }
        }

        // Student scores — fetched from the score sheet by student id.
        // The backend getStudentScores only scopes by session_id, so filter to
        // the requested term client-side (matching the report_card_id path).
        try {
          const params = {};
          if (effectiveSessionId) params.session_id = effectiveSessionId;
          if (effectiveTermId) params.term_id = effectiveTermId;
          const scoresRes = await getStudentScores(trimmedStudentId, params);
          let fetchedScores = Array.isArray(scoresRes.data)
            ? scoresRes.data
            : (scoresRes.data?.data ?? []);
          if (effectiveTermId) {
            fetchedScores = fetchedScores.filter((s) => s.term_id === effectiveTermId);
          }
          subjectScores = fetchedScores;
        } catch (e) {
          console.warn("Failed to load student scores:", e);
        }
      }

      // ── Build subject rows ──
      const subjectRows = subjectScores.map((score, idx) => {
        const subjectName =
          score.subject_name ||
          score.subject?.name ||
          score.subject_title ||
          score.name ||
          subjectsMap[score.subject_id] ||
          score.subject_id ||
          "—";
        const ca1 = score.ca1_score ?? score.ca_score ?? score.ca1 ?? "";
        const ca2 = score.ca2_score ?? score.ca2 ?? "";
        const ca3 = score.ca3_score ?? score.ca3 ?? "";
        const exam = score.exam_score ?? score.exam ?? "";
        const total = score.total_score ?? score.total ?? (scoreTotal(score) ?? 0);
        const subjectId = score.subject_id || score.subject?.id || score.id;

        // Grade — use score data first, then compute from grade configs
        let grade = score.grade || "";
        let remark = score.remark || "";
        if (!grade && gradeConfigs.length > 0 && total > 0) {
          const computed = computeGrade(total, gradeConfigs);
          grade = computed.grade;
          remark = computed.remark;
        }

        // Class average for this subject: an explicit backend figure wins, then
        // the stats endpoint, then the roster average computed above.
        const rawAverage =
          score.class_average ??
          score.subject_average ??
          classStatsMap[subjectId]?.average ??
          subjectAverages[subjectId];
        const parsedAverage = rawAverage === "" || rawAverage == null ? NaN : parseFloat(rawAverage);

        return {
          sn: idx + 1,
          name: subjectName,
          ca1: ca1 !== "" ? ca1 : "—",
          ca2: ca2 !== "" ? ca2 : "—",
          ca3: ca3 !== "" ? ca3 : "—",
          exam: exam !== "" ? exam : "—",
          total: total || 0,
          position: score.position ?? score.class_position ?? "—",
          grade,
          remark,
          highest: score.highest_in_class ?? score.class_highest ?? classStatsMap[subjectId]?.highest ?? "—",
          lowest: score.lowest_in_class ?? score.class_lowest ?? classStatsMap[subjectId]?.lowest ?? "—",
          average: isNaN(parsedAverage) ? "—" : parsedAverage.toFixed(1),
        };
      });

      // ── Compute aggregates ──
      const validTotals = subjectRows.filter((r) => r.total > 0).map((r) => r.total);
      const computedAggregate = validTotals.reduce((a, b) => a + b, 0);
      const computedAvg = validTotals.length > 0 ? (computedAggregate / validTotals.length).toFixed(1) : "—";
      // Prefer the backend report card's authoritative figures when present.
      const aggregate =
        reportCardMeta && reportCardMeta.total_score > 0
          ? reportCardMeta.total_score
          : (computedAggregate > 0 ? computedAggregate : "—");
      const avgScore =
        reportCardMeta && reportCardMeta.average_score
          ? reportCardMeta.average_score.toFixed(1)
          : computedAvg;

      // General remark
      const finalRemark = remarks || generateGeneralRemark(parseFloat(avgScore));

      // Grading scale from configs
      const gradingScale = buildGradingScale(gradeConfigs);

      // Student full name
      const studentName = [student.first_name, student.middle_name, student.last_name]
        .filter(Boolean)
        .join(" ") || student.name || "—";

      const regNo = student.enrollment_no || student.registration_number || student.reg_no || "—";

      setReport({
        school: school.name || "—",
        schoolLogo: schoolLogoUrl,
        system: "e-Dossier System",
        student: {
          name: studentName,
          regNo,
          className,
          numInClass,
        },
        session: sessionName,
        term: termName,
        subjects: subjectRows,
        aggregate: aggregate > 0 ? aggregate : "—",
        avgScore,
        generalRemark: finalRemark,
        nextTermDate,
        principal,
        gradingScale,
      });
    } catch (err) {
      console.error("Edossier fetch error:", err);
      setError(getErrorMessage(err, "Failed to load report card"));
    } finally {
      setLoading(false);
    }
  }, [studentId, sessionId, termId, reportCardId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReport();
  }, [fetchReport]);

  if (loading) {
    return (
      <div style={{ padding: "60px", textAlign: "center", color: "#5C5C54" }}>
        <div style={{ fontWeight: "600" }}>Loading report card...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "60px", textAlign: "center", color: "#991b1b" }}>
        <div style={{ fontWeight: "600", marginBottom: "8px" }}>
          Error loading report card
        </div>
        <div>{error}</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ padding: "60px", textAlign: "center", color: "#5C5C54" }}>
        <div style={{ fontWeight: "600" }}>No report data available.</div>
        <div style={{ marginTop: "8px", fontSize: "13px" }}>
          Provide a <code>report_card_id</code> or <code>student_id</code> query parameter to load a report card.
        </div>
      </div>
    );
  }

  const { school, schoolLogo, system, student, session, term, subjects, aggregate, avgScore, generalRemark, nextTermDate, principal, gradingScale } =
    report;

  return (
    <div className="rc-root">
      <style>{`
        /* ── Reset ── */
        .rc-root *, .rc-root *::before, .rc-root *::after {
          box-sizing: border-box; margin: 0; padding: 0;
        }

        /* ── Root wrapper ── */
        .rc-root {
          font-family: 'Times New Roman', Times, serif;
          font-size: 13px;
          color: #111;
          background: #fff;
          padding: 20px;
          max-width: 900px;
          margin: 0 auto;
        }

        /* ── Print button (hidden when printing) ── */
        .rc-print-btn {
          display: block;
          margin: 0 auto 18px;
          padding: 9px 28px;
          background: #1e3a5f;
          color: #fff;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          font-family: inherit;
          cursor: pointer;
          letter-spacing: .03em;
        }
        .rc-print-btn:hover { background: #162d4a; }

        /* ── Outer border ── */
        .rc-card {
          border: 2px solid #222;
          padding: 0;
        }

        /* ── Header ── */
        .rc-header {
          display: grid;
          grid-template-columns: 64px 1fr 64px;
          align-items: center;
          gap: 8px;
          padding: 10px 14px 8px;
          border-bottom: 2px solid #222;
          text-align: center;
        }
        .rc-header-logo {
          width: 60px; height: 60px;
          object-fit: contain;
          display: block;
        }
        .rc-header-logo-placeholder {
          width: 60px; height: 60px;
          border: 1px dashed #aaa;
          border-radius: 50%;
          display: flex; align-items: center;
          justify-content: center;
          font-size: 9px; color: #aaa;
        }
        .rc-header-system {
          font-size: 13px;
          font-weight: 700;
          line-height: 1.5;
          text-transform: uppercase;
          letter-spacing: .02em;
        }
        .rc-header-school {
          font-size: 15px;
          font-weight: 900;
          text-transform: uppercase;
          margin-top: 6px;
          letter-spacing: .03em;
          text-decoration: underline;
        }

        /* ── Bio row ── */
        .rc-bio {
          display: grid;
          grid-template-columns: 56px 1fr 1fr;
          gap: 0;
          border-bottom: 2px solid #222;
        }
        .rc-bio-avatar {
          border-right: 1px solid #aaa;
          display: flex; align-items: center;
          justify-content: center; padding: 8px;
        }
        .rc-bio-avatar-icon {
          width: 44px; height: 44px;
          border-radius: 50%;
          background: #e5e7eb;
          display: flex; align-items: center;
          justify-content: center;
          font-size: 22px;
        }
        .rc-bio-left, .rc-bio-right {
          padding: 8px 12px;
        }
        .rc-bio-left { border-right: 1px solid #aaa; }
        .rc-bio-row {
          display: flex; gap: 6px;
          margin-bottom: 4px;
          font-size: 12.5px;
          align-items: baseline;
        }
        .rc-bio-label {
          font-weight: 700;
          white-space: nowrap;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: .04em;
        }
        .rc-bio-value { flex: 1; }

        /* ── QR placeholder ── */
        .rc-qr {
          position: relative;
        }
        .rc-qr-box {
          position: absolute; top: 6px; right: 8px;
          width: 48px; height: 48px;
          border: 1px solid #aaa;
          display: flex; align-items: center;
          justify-content: center;
          font-size: 8px; color: #aaa; text-align: center;
        }

        /* ── Subject table ── */
        .rc-table-wrap {
          overflow-x: auto;
          border-bottom: 2px solid #222;
        }
        .rc-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .rc-table th {
          background: #f3f4f6;
          border: 1px solid #9ca3af;
          padding: 5px 4px;
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .03em;
          white-space: nowrap;
        }
        .rc-table td {
          border: 1px solid #9ca3af;
          padding: 5px 4px;
          text-align: center;
        }
        .rc-table td.rc-subject-name {
          text-align: left;
          padding-left: 8px;
          font-weight: 600;
          white-space: nowrap;
        }
        .rc-table tbody tr:nth-child(even) { background: #f9fafb; }
        .rc-table tbody tr:hover { background: #eff6ff; }

        .rc-grade-cell {
          font-weight: 800;
          font-size: 13px;
        }
        .rc-remark-fail { color: #991b1b; font-weight: 700; }
        .rc-remark-good { color: #14532d; }

        /* ── Grading scale ── */
        .rc-grading {
          border-bottom: 2px solid #222;
          padding: 8px 12px;
        }
        .rc-grading-title {
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: .04em;
          margin-bottom: 6px;
        }
        .rc-grading-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 3px 16px;
        }
        .rc-grading-item {
          font-size: 12px;
          display: flex; gap: 4px;
        }
        .rc-grading-range { font-weight: 700; }

        /* ── Remark row ── */
        .rc-remark-row {
          padding: 7px 12px;
          font-size: 12.5px;
          border-bottom: 1px solid #d1d5db;
          display: flex; gap: 8px;
        }
        .rc-remark-row strong { font-weight: 700; }
        .rc-next-term-row {
          padding: 5px 12px 8px;
          font-size: 12.5px;
          border-bottom: 2px solid #222;
          display: flex; gap: 8px;
        }

        /* ── Behaviour + stamp ── */
        .rc-bottom {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto;
          gap: 0;
          align-items: start;
          border-bottom: 1px solid #222;
          overflow: hidden;
        }
        .rc-behaviour-group {
          border-right: 1px solid #aaa;
          padding: 6px 0;
          min-width: 0;
          overflow: hidden;
        }
        .rc-behaviour-group:last-of-type { border-right: none; }
        .rc-beh-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          table-layout: fixed;
        }
        .rc-beh-table th, .rc-beh-table td {
          border: 1px solid #d1d5db;
          padding: 3px 2px;
          text-align: center;
        }
        .rc-beh-trait-head {
          text-align: left;
          padding-left: 6px !important;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          background: #f3f4f6;
        }
        .rc-beh-score-head {
          font-weight: 700;
          background: #f3f4f6;
        }
        .rc-beh-trait {
          text-align: left !important;
          padding-left: 6px !important;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .rc-beh-cell { height: 20px; }

        /* ── Stamp area ── */
        .rc-stamp {
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-width: 0;
        }
        .rc-stamp-circle {
          width: 72px; height: 72px;
          border-radius: 50%;
          border: 2px dashed #1e3a5f;
          display: flex; align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 8px; color: #1e3a5f;
          font-weight: 700; line-height: 1.3;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .rc-stamp-label {
          font-size: 10px; font-weight: 700;
          text-align: center; color: #374151;
          text-transform: uppercase;
        }
        .rc-stamp-name {
          font-size: 10px; text-align: center;
          color: #111; font-style: italic;
        }
        .rc-stamp-sig-line {
          width: 80px; border-top: 1px solid #111;
          margin-top: 4px;
          font-size: 9px; text-align: center;
          padding-top: 2px; color: #374151;
        }

        /* ── Footer ── */
        .rc-footer {
          text-align: center;
          padding: 7px;
          font-size: 11px;
          color: #6b7280;
          font-style: italic;
        }

        /* ── Print styles ── */
        @media print {
          .rc-print-btn { display: none !important; }
          .rc-root { padding: 0; max-width: 100%; }
          .rc-card { border: 1.5px solid #000; }
          body { margin: 0; }
        }

        /* ── Responsive ── */
        @media (max-width: 680px) {
          .rc-grading-grid { grid-template-columns: 1fr 1fr; }
          .rc-bottom { grid-template-columns: 1fr 1fr; }
          .rc-stamp { grid-column: 1 / -1; border-top: 1px solid #aaa; }
          .rc-header { grid-template-columns: 48px 1fr 48px; }
          .rc-header-logo, .rc-header-logo-placeholder { width: 48px; height: 48px; }
        }
        @media (max-width: 480px) {
          .rc-bio { grid-template-columns: 1fr; }
          .rc-bio-left { border-right: none; border-bottom: 1px solid #aaa; }
          .rc-bio-avatar { display: none; }
          .rc-bottom { grid-template-columns: 1fr; }
          .rc-behaviour-group { border-right: none; border-bottom: 1px solid #aaa; }
        }
      `}</style>
      <button className="rc-print-btn" onClick={() => window.print()}>
        🖨 Print Report Card
      </button>

      <div className="rc-card">
        <div className="rc-header">
          {schoolLogo ? (
            <img src={schoolLogo} alt="School Logo" className="rc-header-logo" />
          ) : (
            <div className="rc-header-logo-placeholder">LOGO</div>
          )}
          <div>
            <div className="rc-header-system">{system}</div>
            <div className="rc-header-school">{school}</div>
          </div>
          <div className="rc-header-logo-placeholder">
            <img src="/images/logomoe.jpg" alt="Ministry of Education" className="rc-header-logo" />
          </div>
        </div>

        <div className="rc-bio">
          <div className="rc-bio-avatar">
            <div className="rc-bio-avatar-icon">🎓</div>
          </div>

          <div className="rc-bio-left">
            <div className="rc-bio-row">
              <span className="rc-bio-label">Name:</span>
              <span className="rc-bio-value">{student.name}</span>
            </div>
            <div className="rc-bio-row">
              <span className="rc-bio-label">Reg. No:</span>
              <span className="rc-bio-value">{student.regNo}</span>
            </div>
            <div className="rc-bio-row">
              <span className="rc-bio-label">Class:</span>
              <span className="rc-bio-value">{student.className}</span>
            </div>
            <div className="rc-bio-row">
              <span className="rc-bio-label">No. in Class:</span>
              <span className="rc-bio-value">{student.numInClass}</span>
            </div>
          </div>

          <div className="rc-bio-right rc-qr">
            <div className="rc-bio-row">
              <span className="rc-bio-label">Session:</span>
              <span className="rc-bio-value">{session}</span>
            </div>
            <div className="rc-bio-row">
              <span className="rc-bio-label">Term:</span>
              <span className="rc-bio-value">{term}</span>
            </div>
            <div className="rc-bio-row">
              <span className="rc-bio-label">Aggregate:</span>
              <span className="rc-bio-value">{aggregate}</span>
            </div>
            <div className="rc-bio-row">
              <span className="rc-bio-label">Avg Score:</span>
              <span className="rc-bio-value">{avgScore}</span>
            </div>
            <div className="rc-qr-box">QR</div>
          </div>
        </div>

        <div className="rc-table-wrap">
          <table className="rc-table">
            <thead>
              <tr>
                <th>S/N</th>
                <th style={{ textAlign: "left", paddingLeft: 8 }}>Subject</th>
                <th>1.CA (10)</th>
                <th>2.CA (10)</th>
                <th>3.CA (10)</th>
                <th>Exam (70)</th>
                <th>Total (100)</th>
                <th>P/Class</th>
                <th>Grade</th>
                <th>Remark</th>
                <th>H/Class</th>
                <th>L/Class</th>
                <th>Avg</th>
              </tr>
            </thead>
            <tbody>
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan="13" style={{ padding: "20px", textAlign: "center", color: "#9ca3af" }}>
                    No subject scores available.
                  </td>
                </tr>
              ) : (
                subjects.map((row) => (
                  <tr key={row.sn}>
                    <td>{row.sn}</td>
                    <td className="rc-subject-name">{row.name}</td>
                    <td>{row.ca1}</td>
                    <td>{row.ca2}</td>
                    <td>{row.ca3}</td>
                    <td>{row.exam}</td>
                    <td style={{ fontWeight: 700 }}>{row.total || "—"}</td>
                    <td>{row.position}</td>
                    <td
                      className="rc-grade-cell"
                      style={{ color: gradeColor(row.grade) }}
                    >
                      {row.grade || "—"}
                    </td>
                    <td className={row.grade === "F" ? "rc-remark-fail" : "rc-remark-good"}>
                      {row.remark || "—"}
                    </td>
                    <td>{row.highest}</td>
                    <td>{row.lowest}</td>
                    <td>{row.average}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="rc-grading">
          <div className="rc-grading-title">Grading Scale</div>
          <div className="rc-grading-grid">
            {gradingScale.map((g) => (
              <div key={g.range} className="rc-grading-item">
                <span className="rc-grading-range">{g.range} :</span>
                <span>{g.remark}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rc-remark-row">
          <strong>General Remark:</strong>
          <span>{generalRemark}</span>
        </div>
        <div className="rc-next-term-row">
          <strong>Next Term Begins:</strong>
          <span>{nextTermDate}</span>
        </div>

        <div className="rc-bottom">
          {BEHAVIOUR_GROUPS.map((g) => (
            <BehaviourGrid key={g.title} group={g} />
          ))}

          <div className="rc-stamp">
            <div className="rc-stamp-circle">
              Principal<br />Stamp
            </div>
            <div className="rc-stamp-label">Principal</div>
            <div className="rc-stamp-name">{principal}</div>
            <div className="rc-stamp-sig-line">Signature</div>
          </div>
        </div>

        <div className="rc-footer">
          Copyright © {new Date().getFullYear()} e-Dossier System. All rights reserved.
        </div>
      </div>
    </div>
  );
}