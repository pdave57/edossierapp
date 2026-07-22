import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getEnrollments,
  getStudentScores,
  getStudent,
  bulkUpsertScores,
  getSessions,
  getTerms,
  getLevels,
  getSubjects,
  getSchools,
  getGradeConfigs,
  getSchoolSubLevels,
  getErrorMessage,
} from '../api/client';
import AlertBox from '../components/common/AlertBox';

const emptyForm = {
  school_id: '',
  session_id: '',
  term_id: '',
  level_id: '',
  sub_level_id: '',
  subject_id: '',
};

const ScoreSheet = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [schools, setSchools] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [levels, setLevels] = useState([]);
  const [sublevels, setSublevels] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [gradeConfigs, setGradeConfigs] = useState([]);

  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({});
  const [editingExam, setEditingExam] = useState({});
  const [focusTarget, setFocusTarget] = useState(null);
  const allSublevelsRef = useRef([]);

  useEffect(() => {
    if (!focusTarget) return;
    const el = document.getElementById(focusTarget);
    if (el) {
      el.focus();
      el.select();
    }
    setFocusTarget(null);
  }, [focusTarget]);

  const fetchSchools = useCallback(async () => {
    try {
      const res = await getSchools();
      const list = Array.isArray(res.data) ? res.data : (res.data?.schools ?? res.data?.data ?? []);
      setSchools(list);
    } catch (err) {
      console.error('Schools fetch error:', err);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await getSessions(1, 200, formData.school_id || null);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setSessions(list);
    } catch (err) {
      console.error('Sessions fetch error:', err);
    }
  }, [formData.school_id]);

  const fetchTerms = useCallback(async () => {
    try {
      const res = await getTerms();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setTerms(list);
    } catch (err) {
      console.error('Terms fetch error:', err);
    }
  }, []);

  const fetchLevels = useCallback(async () => {
    try {
      const res = await getLevels(1, 200, formData.school_id || undefined);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setLevels(list);
    } catch (err) {
      console.error('Levels fetch error:', err);
    }
  }, [formData.school_id]);

  useEffect(() => {
    let cancelled = false;
    const fetchSublevels = async () => {
      try {
        let list = [];
        if (formData.school_id) {
          const res = await getSchoolSubLevels(formData.school_id);
          list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
          allSublevelsRef.current = list;
        } else {
          allSublevelsRef.current = [];
        }
        if (!cancelled) {
          const filtered = formData.level_id
            ? list.filter((sl) => sl.level_id === formData.level_id)
            : list;
          setSublevels(filtered);
        }
      } catch (err) {
        console.error('Sublevels fetch error:', err);
      }
    };
    fetchSublevels();
    return () => { cancelled = true; };
  }, [formData.school_id, formData.level_id]);

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await getSubjects(1, 200);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setSubjects(list);
    } catch (err) {
      console.error('Subjects fetch error:', err);
    }
  }, []);

  const fetchGradeConfigs = useCallback(async () => {
    try {
      const res = await getGradeConfigs(formData.school_id || undefined);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setGradeConfigs(list);
    } catch (err) {
      console.error('Grade configs fetch error:', err);
    }
  }, [formData.school_id]);

  useEffect(() => {
    fetchSchools();
    fetchSessions();
    fetchTerms();
    fetchLevels();
    fetchSubjects();
    fetchGradeConfigs();
  }, [fetchSchools, fetchSessions, fetchTerms, fetchLevels, fetchSubjects, fetchGradeConfigs]);

  const computeGrade = useCallback((total) => {
    if (gradeConfigs.length === 0) return { grade: '', remark: '' };
    const sorted = [...gradeConfigs].sort((a, b) => b.max_score - a.max_score);
    for (const config of sorted) {
      if (total >= config.min_score && total <= config.max_score) {
        return { grade: config.grade, remark: config.remark };
      }
    }
    return { grade: '', remark: '' };
  }, [gradeConfigs]);

  const fetchStudentsAndScores = useCallback(async () => {
    if (!formData.sub_level_id || !formData.session_id || !formData.term_id || !formData.subject_id) {
      setStudents([]);
      setScores({});
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await getEnrollments(1, 1000, {
        school_id: formData.school_id,
        sub_level_id: formData.sub_level_id,
        session_id: formData.session_id,
        status: 'ACTIVE',
      });
      const enrollmentList = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      const studentIds = enrollmentList.map((e) => e.student_id).filter(Boolean);
      const studentList = await Promise.all(
        studentIds.map((id) =>
          getStudent(id)
            .then((r) => r.data?.data || r.data)
            .catch(() => null)
        )
      );
      const validStudents = studentList.filter(Boolean);
      setStudents(validStudents);

      const scoresMap = {};
      for (const student of validStudents) {
        try {
          const scoreRes = await getStudentScores(student.id, { session_id: formData.session_id });
          const scoreList = Array.isArray(scoreRes.data) ? scoreRes.data : (scoreRes.data?.data ?? []);
          const subjectScore = scoreList.find((s) => s.subject_id === formData.subject_id && s.term_id === formData.term_id);
          if (subjectScore) {
            scoresMap[student.id] = {
              ca1_score: subjectScore.ca1_score ?? '',
              ca2_score: subjectScore.ca2_score ?? '',
              ca3_score: subjectScore.ca3_score ?? '',
              exam_score: subjectScore.exam_score ?? '',
              total_score: subjectScore.total_score ?? 0,
              grade: subjectScore.grade ?? '',
              remark: subjectScore.remark ?? '',
            };
          } else {
            scoresMap[student.id] = {
              ca1_score: '',
              ca2_score: '',
              ca3_score: '',
              exam_score: '',
              total_score: 0,
              grade: '',
              remark: '',
            };
          }
        } catch (err) {
          scoresMap[student.id] = {
            ca1_score: '',
            ca2_score: '',
            ca3_score: '',
            exam_score: '',
            total_score: 0,
            grade: '',
            remark: '',
          };
        }
      }
      setScores(scoresMap);
    } catch (err) {
      console.error(err);
      setError(`Failed to fetch students (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    } finally {
      setLoading(false);
    }
  }, [formData.sub_level_id, formData.session_id, formData.term_id, formData.subject_id, getErrorMessage]);

  useEffect(() => {
    fetchStudentsAndScores();
  }, [fetchStudentsAndScores]);

  const handleScoreChange = (studentId, field, value) => {
    const numValue = value === '' ? '' : parseFloat(value);
    setScores((prev) => {
      const updated = { ...prev, [studentId]: { ...prev[studentId], [field]: numValue } };
      if (field === 'exam_score' || field === 'ca1_score' || field === 'ca2_score' || field === 'ca3_score') {
        const ca1 = updated[studentId].ca1_score === '' ? 0 : updated[studentId].ca1_score;
        const ca2 = updated[studentId].ca2_score === '' ? 0 : updated[studentId].ca2_score;
        const ca3 = updated[studentId].ca3_score === '' ? 0 : updated[studentId].ca3_score;
        const exam = updated[studentId].exam_score === '' ? 0 : updated[studentId].exam_score;
        const total = ca1 + ca2 + ca3 + exam;
        const { grade, remark } = computeGrade(total);
        updated[studentId] = { ...updated[studentId], total_score: total, grade, remark };
      }
      return updated;
    });
  };

  const advanceScoreFocus = (studentId, field, value) => {
    if (!value || value === '') return;
    if (field === 'exam_score') {
      const idx = students.findIndex((s) => s.id === studentId);
      if (idx >= 0 && idx + 1 < students.length) {
        const nextStudentId = students[idx + 1].id;
        setFocusTarget(`score-${nextStudentId}-ca1_score`);
      }
      return;
    }
    const fields = ['ca1_score', 'ca2_score', 'ca3_score', 'exam_score'];
    const idx = fields.indexOf(field);
    if (idx >= 0 && idx < fields.length - 1) {
      setFocusTarget(`score-${studentId}-${fields[idx + 1]}`);
    }
  };

  const handleSave = async () => {
    if (!formData.school_id || !formData.session_id || !formData.term_id || !formData.level_id || !formData.sub_level_id || !formData.subject_id) {
      setError('Please select all filters before saving.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const scoreEntries = students.map((student) => {
        const s = scores[student.id] || {};
        return {
          student_id: student.id,
          level_id: formData.level_id,
          sub_level_id: formData.sub_level_id,
          subject_id: formData.subject_id,
          term_id: formData.term_id,
          ca1_score: s.ca1_score === '' ? 0 : s.ca1_score,
          ca2_score: s.ca2_score === '' ? 0 : s.ca2_score,
          ca3_score: s.ca3_score === '' ? 0 : s.ca3_score,
          exam_score: s.exam_score === '' ? 0 : s.exam_score,
        };
      });
      await bulkUpsertScores({ scores: scoreEntries });
      setSuccess('Scores saved successfully.');
      fetchStudentsAndScores();
    } catch (err) {
      console.error('Bulk upsert scores error:', err);
      setError(`Failed to save scores (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    } finally {
      setSaving(false);
    }
  };

  const getSchoolName = (schoolId) => schools.find((s) => s.id === schoolId)?.name || '';
  const getSessionName = (sessionId) => sessions.find((s) => s.id === sessionId)?.name || '';
  const getTermName = (termId) => terms.find((t) => t.id === termId)?.name || '';
  const getLevelName = (levelId) => levels.find((l) => l.id === levelId)?.name || '';
  const getSublevelName = (sublevelId) => sublevels.find((sl) => sl.id === sublevelId)?.name || '';
  const getSubjectName = (subjectId) => subjects.find((s) => s.id === subjectId)?.name || '';

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>Score Sheet</h1>
      </div>

      <AlertBox type="error" message={error} />
      {success && <AlertBox type="success" message={success} />}

      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>School</label>
            <select
              value={formData.school_id}
              onChange={(e) => setFormData({ ...formData, school_id: e.target.value, level_id: '', sub_level_id: '' })}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white', fontSize: '0.9rem' }}
            >
              <option value="">Select school</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>{school.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>Session</label>
            <select
              value={formData.session_id}
              onChange={(e) => setFormData({ ...formData, session_id: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white', fontSize: '0.9rem' }}
            >
              <option value="">Select session</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>{session.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>Term</label>
            <select
              value={formData.term_id}
              onChange={(e) => setFormData({ ...formData, term_id: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white', fontSize: '0.9rem' }}
            >
              <option value="">Select term</option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>{term.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>Level</label>
            <select
              value={formData.level_id}
              onChange={(e) => setFormData({ ...formData, level_id: e.target.value, sub_level_id: '' })}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white', fontSize: '0.9rem' }}
            >
              <option value="">Select level</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>{level.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>Sublevel</label>
            <select
              value={formData.sub_level_id}
              onChange={(e) => setFormData({ ...formData, sub_level_id: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white', fontSize: '0.9rem' }}
            >
              <option value="">Select sublevel</option>
              {sublevels.map((sublevel) => (
                <option key={sublevel.id} value={sublevel.id}>{sublevel.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>Subject</label>
            <select
              value={formData.subject_id}
              onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white', fontSize: '0.9rem' }}
            >
              <option value="">Select subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && students.length === 0 ? (
        <div style={{ padding: '60px 40px', textAlign: 'center' }}>
          <div className="loading-spinner">Loading students...</div>
        </div>
      ) : students.length === 0 && formData.sub_level_id ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center', color: 'var(--gray)' }}>
          No students found in this sublevel.
        </div>
      ) : students.length > 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'auto' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <strong>{getSchoolName(formData.school_id)}</strong>
              <span style={{ marginLeft: '10px', color: 'var(--gray)' }}>{getSessionName(formData.session_id)}</span>
              <span style={{ marginLeft: '10px', color: 'var(--gray)' }}>{getTermName(formData.term_id)}</span>
              <span style={{ marginLeft: '10px', color: 'var(--gray)' }}>{getLevelName(formData.level_id)} - {getSublevelName(formData.sub_level_id)}</span>
              <span style={{ marginLeft: '10px', color: 'var(--gray)' }}>{getSubjectName(formData.subject_id)}</span>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: '8px 20px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Saving...' : 'Save Scores'}
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-light)', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', minWidth: '200px' }}>Student Name</th>
                <th style={{ padding: '12px', textAlign: 'center', width: '90px' }}>CA1</th>
                <th style={{ padding: '12px', textAlign: 'center', width: '90px' }}>CA2</th>
                <th style={{ padding: '12px', textAlign: 'center', width: '90px' }}>CA3</th>
                <th style={{ padding: '12px', textAlign: 'center', width: '100px' }}>Exam Score</th>
                <th style={{ padding: '12px', textAlign: 'center', width: '90px' }}>Total</th>
                <th style={{ padding: '12px', textAlign: 'left', minWidth: '120px' }}>Grade</th>
                <th style={{ padding: '12px', textAlign: 'left', minWidth: '150px' }}>Remark</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const score = scores[student.id] || {};
                return (
                  <tr key={student.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '500' }}>
                      {student.last_name}, {student.first_name} {student.middle_name || ''}
                      <input type="hidden" value={student.id} />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <input
                        id={`score-${student.id}-ca1_score`}
                        type="number"
                        min="0"
                        step="any"
                        value={score.ca1_score}
                        onChange={(e) => handleScoreChange(student.id, 'ca1_score', e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') advanceScoreFocus(student.id, 'ca1_score', e.target.value); }}
                        style={{ width: '70px', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '4px', textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <input
                        id={`score-${student.id}-ca2_score`}
                        type="number"
                        min="0"
                        step="any"
                        value={score.ca2_score}
                        onChange={(e) => handleScoreChange(student.id, 'ca2_score', e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') advanceScoreFocus(student.id, 'ca2_score', e.target.value); }}
                        style={{ width: '70px', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '4px', textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <input
                        id={`score-${student.id}-ca3_score`}
                        type="number"
                        min="0"
                        step="any"
                        value={score.ca3_score}
                        onChange={(e) => handleScoreChange(student.id, 'ca3_score', e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') advanceScoreFocus(student.id, 'ca3_score', e.target.value); }}
                        style={{ width: '70px', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '4px', textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <input
                        id={`score-${student.id}-exam_score`}
                        type="number"
                        min="0"
                        step="any"
                        value={score.exam_score}
                        onChange={(e) => handleScoreChange(student.id, 'exam_score', e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') advanceScoreFocus(student.id, 'exam_score', e.target.value); }}
                        style={{ width: '80px', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '4px', textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600' }}>
                      {score.total_score || 0}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontWeight: '600', color: score.grade ? '#3e7430' : 'inherit' }}>{score.grade || '—'}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--gray)' }}>
                      {score.remark || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : formData.sub_level_id ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center', color: 'var(--gray)' }}>
          Loading...
        </div>
      ) : null}
    </div>
  );
};

export default ScoreSheet;
