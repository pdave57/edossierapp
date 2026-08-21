import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  getSchools,
  getLevels,
  getSublevelsByLevel,
  getTerms,
  getStudents,
  getStudentScores,
  getStudentAllReportCards,
  getReportCards,
  updateStudent,
} from '../api/client';
import { TrendingUp, GraduationCap, CheckSquare, Square, RefreshCw } from 'lucide-react';

const COLORS = {
  primary: '#82C46C',
  primaryText: '#3F7A2F',
  primaryLight: '#9ED389',
  gold: '#B8860B',
  paper: '#FAF7F0',
  sage: '#E8EDE7',
  ink: '#1A1A1A',
  inkSoft: '#5C5C54',
  alert: '#B33A3A',
  line: '#D8D2C2',
};

function colourFlag(avg) {
  if (avg >= 50) return { colour: 'green', label: 'Excellent' };
  if (avg >= 45) return { colour: 'orange', label: 'Borderline' };
  return { colour: 'red', label: 'Needs Improvement' };
}

export default function LevelUpgrade() {
  const [schools, setSchools] = useState([]);
  const [levels, setLevels] = useState([]);
  const [sublevels, setSublevels] = useState([]);
  const [terms, setTerms] = useState([
    { id: '1', name: '1st Term', termIds: [] },
    { id: '2', name: '2nd Term', termIds: [] },
    { id: '3', name: '3rd Term', termIds: [] },
  ]);

  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedSubLevel, setSelectedSubLevel] = useState('');
  const [selectedTerms, setSelectedTerms] = useState(['1', '2', '3']); // default all 3 selected

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);

  // Load static dropdown data and terms
  useEffect(() => {
    getSchools().then((res) => setSchools(res?.data?.data || res?.data || []));
    getTerms().then((res) => {
      const rawList = Array.isArray(res?.data) ? res.data : (res?.data?.data ?? []);
      
      const termMap = [
        { key: '1', name: '1st Term', ids: [] },
        { key: '2', name: '2nd Term', ids: [] },
        { key: '3', name: '3rd Term', ids: [] },
      ];

      rawList.forEach((t) => {
        let num = t.term_number;
        if (!num && t.name) {
          const lower = String(t.name).toLowerCase();
          if (lower.includes('1st') || lower.includes('first')) num = 1;
          else if (lower.includes('2nd') || lower.includes('second')) num = 2;
          else if (lower.includes('3rd') || lower.includes('third')) num = 3;
        }
        if (num >= 1 && num <= 3) {
          termMap[num - 1].ids.push(String(t.id));
        }
      });

      setTerms(
        termMap.map((tm) => ({
          id: tm.key,
          name: tm.name,
          termIds: tm.ids,
        }))
      );
    }).catch((err) => {
      console.warn("Failed to fetch terms, fallback to default 3 terms", err);
    });
  }, []);

  // Load levels when school changes
  useEffect(() => {
    if (!selectedSchool) {
      setLevels([]);
      setSelectedLevel('');
      return;
    }
    getLevels(1, 200, selectedSchool).then((res) => setLevels(res?.data?.data || res?.data || []));
  }, [selectedSchool]);

  // Load sub‑levels when level changes
  useEffect(() => {
    if (!selectedSchool || !selectedLevel) {
      setSublevels([]);
      setSelectedSubLevel('');
      return;
    }
    getSublevelsByLevel(selectedSchool, selectedLevel).then((res) => setSublevels(res?.data?.data || res?.data || []));
  }, [selectedSchool, selectedLevel]);

  // Helper to check if score or report card matches selected terms
  const isScoreInSelectedTerms = useCallback((item, selectedTermKeys) => {
    if (!selectedTermKeys || selectedTermKeys.length === 0) return true;

    const termId = String(item.term_id || '');
    const termNum = Number(item.term_number || item.Term?.term_number || 0);
    const termName = String(item.term_name || item.Term?.name || '').toLowerCase();

    return selectedTermKeys.some((termKey) => {
      const termObj = terms.find((t) => t.id === termKey);
      if (termObj && termObj.termIds && termObj.termIds.includes(termId)) return true;
      if (termId === String(termKey)) return true;
      if (termNum === Number(termKey)) return true;

      if (termKey === '1' && (termName.includes('1st') || termName.includes('first'))) return true;
      if (termKey === '2' && (termName.includes('2nd') || termName.includes('second'))) return true;
      if (termKey === '3' && (termName.includes('3rd') || termName.includes('third'))) return true;

      return false;
    });
  }, [terms]);

  // Load students and compute average score
  const loadStudents = useCallback(() => {
    if (!selectedSchool || !selectedLevel || !selectedSubLevel) {
      setStudents([]);
      return;
    }
    setLoading(true);
    getStudents(1, 500, {
      school_id: selectedSchool,
      level_id: selectedLevel,
      sub_level_id: selectedSubLevel,
    })
      .then(async (res) => {
        const list = Array.isArray(res?.data) ? res.data : (res?.data?.data ?? []);
        
        const enriched = await Promise.all(
          list.map(async (student) => {
            let avg = 0;

            // 1. Try to obtain avgScore from reportCardMeta / report cards first
            let reportCards = [];
            try {
              const rcRes = await getStudentAllReportCards(student.id).catch(() => null) ||
                            await getReportCards(1, 100, { student_id: student.id }).catch(() => null);
              reportCards = Array.isArray(rcRes?.data) ? rcRes.data : (rcRes?.data?.data ?? []);
            } catch (err) {
              console.warn(`Could not load report cards for student ${student.id}:`, err);
            }

            const validRcs = reportCards.filter((rc) => isScoreInSelectedTerms(rc, selectedTerms));

            const rcAvgs = validRcs
              .map((rc) => {
                if (rc && rc.average_score != null && !isNaN(Number(rc.average_score)) && Number(rc.average_score) > 0) {
                  return Number(rc.average_score);
                }
                if (rc && rc.avg_score != null && !isNaN(Number(rc.avg_score)) && Number(rc.avg_score) > 0) {
                  return Number(rc.avg_score);
                }
                return null;
              })
              .filter((val) => val !== null);

            if (rcAvgs.length > 0) {
              avg = rcAvgs.reduce((a, b) => a + b, 0) / rcAvgs.length;
            } else {
              // 2. Fallback to score sheet calculation if reportCardMeta average_score is unavailable
              let scoreList = [];
              try {
                const scoreRes = await getStudentScores(student.id);
                scoreList = Array.isArray(scoreRes?.data)
                  ? scoreRes.data
                  : (scoreRes?.data?.data ?? []);
              } catch (err) {
                console.warn(`Could not load scores for student ${student.id}:`, err);
              }

              const validScores = scoreList.filter((s) => isScoreInSelectedTerms(s, selectedTerms));

              const totalScores = validScores.map((s) => {
                if (s.total_score != null && !isNaN(Number(s.total_score)) && Number(s.total_score) > 0) {
                  return Number(s.total_score);
                }
                const ca1 = Number(s.ca1_score || 0);
                const ca2 = Number(s.ca2_score || 0);
                const ca3 = Number(s.ca3_score || 0);
                const exam = Number(s.exam_score || 0);
                return ca1 + ca2 + ca3 + exam;
              });

              avg = totalScores.length > 0
                ? totalScores.reduce((a, b) => a + b, 0) / totalScores.length
                : 0;
            }

            const flag = colourFlag(avg);
            return { student, avg, flag, checked: false };
          })
        );
        setStudents(enriched);
      })
      .catch((err) => {
        console.error("Error loading students:", err);
        setStudents([]);
      })
      .finally(() => setLoading(false));
  }, [selectedSchool, selectedLevel, selectedSubLevel, selectedTerms, isScoreInSelectedTerms]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const toggleStudent = (id) => {
    setStudents((prev) =>
      prev.map((s) => (s.student.id === id ? { ...s, checked: !s.checked } : s))
    );
  };

  const allChecked = useMemo(() => students.length > 0 && students.every((s) => s.checked), [students]);

  const toggleSelectAll = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, checked: !allChecked })));
  };

  const anyChecked = useMemo(() => students.some((s) => s.checked), [students]);

  // Helper to get human readable current level name
  const getCurrentLevelLabel = (student) => {
    const lvlId = student.level_id || selectedLevel;
    const subLvlId = student.sub_level_id || selectedSubLevel;

    const lvlObj = levels.find((l) => String(l.id) === String(lvlId));
    const subLvlObj = sublevels.find((sl) => String(sl.id) === String(subLvlId));

    const lvlName = lvlObj ? lvlObj.name : (student.level_name || student.Level?.name || lvlId || '—');
    const subLvlName = subLvlObj ? subLvlObj.name : (student.sub_level_name || student.SubLevel?.name || '');

    return subLvlName ? `${lvlName} (${subLvlName})` : lvlName;
  };

  const computeNextLevel = (currentLevelId) => {
    const idx = levels.findIndex((lvl) => String(lvl.id) === String(currentLevelId));
    if (idx >= 0 && idx < levels.length - 1) {
      return levels[idx + 1];
    }
    return null;
  };

  const handleBulkPromote = async () => {
    const toPromote = students.filter((s) => s.checked);
    if (toPromote.length === 0) return;

    if (!window.confirm(`Are you sure you want to promote ${toPromote.length} student(s) to the next level?`)) {
      return;
    }

    setPromoting(true);
    try {
      await Promise.all(
        toPromote.map(async ({ student }) => {
          const next = computeNextLevel(student.level_id || selectedLevel);
          if (next) {
            await updateStudent(student.id, { level_id: next.id, sub_level_id: selectedSubLevel });
          } else {
            await updateStudent(student.id, { status: 'GRADUATED' });
          }
        })
      );
      alert('Student promotion completed successfully!');
      loadStudents();
    } catch (err) {
      console.error(err);
      alert('An error occurred during promotion');
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="level-upgrade" style={{ padding: '24px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`
        .level-upgrade { background: ${COLORS.paper}; color: ${COLORS.ink}; border-radius: 12px; min-height: 80vh; }
        .lvl-header { margin-bottom: 24px; }
        .lvl-header h2 { font-size: 24px; font-weight: 700; color: ${COLORS.primaryText}; margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px; }
        .lvl-header p { font-size: 14px; color: ${COLORS.inkSoft}; margin: 0; }
        .filter-card { background: white; padding: 20px; border-radius: 10px; border: 1px solid ${COLORS.line}; margin-bottom: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; align-items: end; }
        .lvl-select { display: flex; flex-direction: column; gap: 6px; }
        .lvl-select label { font-size: 13px; font-weight: 600; color: ${COLORS.inkSoft}; }
        .lvl-select select { padding: 9px 12px; border-radius: 6px; border: 1px solid ${COLORS.line}; font-size: 14px; background-color: white; color: ${COLORS.ink}; outline: none; }
        .lvl-select select:focus { border-color: ${COLORS.primary}; }
        .terms-group { grid-column: 1 / -1; margin-top: 4px; padding-top: 12px; border-top: 1px dashed ${COLORS.sage}; }
        .terms-options { display: flex; gap: 20px; margin-top: 6px; flex-wrap: wrap; }
        .term-checkbox { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; cursor: pointer; user-select: none; }
        .term-checkbox input { accent-color: ${COLORS.primaryText}; width: 16px; height: 16px; cursor: pointer; }
        .table-container { background: white; border-radius: 10px; border: 1px solid ${COLORS.line}; overflow: hidden; }
        .students-table { width: 100%; border-collapse: collapse; text-align: left; }
        .students-table th { background: ${COLORS.sage}; padding: 12px 16px; font-size: 13px; font-weight: 600; color: ${COLORS.inkSoft}; border-bottom: 1px solid ${COLORS.line}; }
        .students-table td { padding: 12px 16px; border-bottom: 1px solid ${COLORS.sage}; font-size: 14px; color: ${COLORS.ink}; }
        .students-table tr:last-child td { border-bottom: none; }
        .students-table tr:hover { background: #F4F7F4; }
        .flag-badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .flag-badge.green { background: #E8F5E9; color: #2E7D32; }
        .flag-badge.orange { background: #FFF3E0; color: #EF6C00; }
        .flag-badge.red { background: #FFEBEE; color: #C62828; }
        .action-bar { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: white; border-top: 1px solid ${COLORS.line}; }
        .bulk-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: ${COLORS.primaryText}; color: white; border: none; border-radius: 6px; font-weight: 600; font-size: 14px; cursor: pointer; transition: opacity 0.2s; }
        .bulk-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .bulk-btn:not(:disabled):hover { opacity: 0.9; }
        .empty-state { padding: 40px; text-align: center; color: ${COLORS.inkSoft}; font-size: 14px; }
      `}</style>

      <div className="lvl-header">
        <h2>
          <TrendingUp size={24} color={COLORS.primaryText} /> Level Upgrade – Bulk Student Promotion
        </h2>
        <p>Filter students by school, level, and sublevel. View average scores across term(s) and promote eligible students.</p>
      </div>

      <div className="filter-card">
        <div className="lvl-select">
          <label>School</label>
          <select value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)}>
            <option value="">Select school</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lvl-select">
          <label>Level</label>
          <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} disabled={!selectedSchool}>
            <option value="">Select level</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lvl-select">
          <label>Sub‑level</label>
          <select value={selectedSubLevel} onChange={(e) => setSelectedSubLevel(e.target.value)} disabled={!selectedLevel}>
            <option value="">Select sub‑level</option>
            {sublevels.map((sl) => (
              <option key={sl.id} value={sl.id}>
                {sl.name}
              </option>
            ))}
          </select>
        </div>

        <div className="terms-group">
          <label className="lvl-select" style={{ fontSize: '13px', fontWeight: 600, color: COLORS.inkSoft }}>Terms for Avg Score Calculation:</label>
          <div className="terms-options">
            {terms.map((t) => (
              <label key={t.id} className="term-checkbox">
                <input
                  type="checkbox"
                  value={t.id}
                  checked={selectedTerms.includes(t.id)}
                  onChange={(e) => {
                    const id = t.id;
                    setSelectedTerms((prev) =>
                      e.target.checked ? [...prev, id] : prev.filter((v) => v !== id)
                    );
                  }}
                />
                {t.name}
              </label>
            ))}
          </div>
        </div>
      </div>

      {!selectedSchool || !selectedLevel || !selectedSubLevel ? (
        <div className="table-container empty-state">
          <GraduationCap size={48} style={{ opacity: 0.4, marginBottom: '12px' }} />
          <p>Please select a School, Level, and Sub-level above to view students for promotion.</p>
        </div>
      ) : loading ? (
        <div className="table-container empty-state">
          <RefreshCw size={32} className="animate-spin" style={{ opacity: 0.6, marginBottom: '12px' }} />
          <p>Loading students and calculating average scores…</p>
        </div>
      ) : students.length === 0 ? (
        <div className="table-container empty-state">
          <p>No students found for the selected level and sub-level.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="students-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleSelectAll}
                    title="Select All"
                    style={{ cursor: 'pointer', accentColor: COLORS.primaryText }}
                  />
                </th>
                <th>Student Name</th>
                <th>Current Level</th>
                <th>Avg Score (%)</th>
                <th>Performance Flag</th>
              </tr>
            </thead>
            <tbody>
              {students.map((row) => (
                <tr key={row.student.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={row.checked}
                      onChange={() => toggleStudent(row.student.id)}
                      style={{ cursor: 'pointer', accentColor: COLORS.primaryText }}
                    />
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {row.student.first_name} {row.student.last_name}
                  </td>
                  <td>{getCurrentLevelLabel(row.student)}</td>
                  <td style={{ fontWeight: 600 }}>
                    {row.avg > 0 ? `${row.avg.toFixed(1)}%` : 'N/A'}
                  </td>
                  <td>
                    <span className={`flag-badge ${row.flag.colour}`}>{row.flag.label}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="action-bar">
            <span style={{ fontSize: '14px', color: COLORS.inkSoft }}>
              {students.filter((s) => s.checked).length} of {students.length} student(s) selected
            </span>
            <button
              className="bulk-btn"
              disabled={!anyChecked || promoting}
              onClick={handleBulkPromote}
            >
              <TrendingUp size={16} />
              {promoting ? 'Promoting…' : 'Bulk Promote Selected'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

