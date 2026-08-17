import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertBox from '../components/common/AlertBox';
import {
  getSchoolSubjects,
  getSubjects,
  assignSubjectToSchool,
  updateSchoolSubject,
  removeSchoolSubject,
  getSessions,
  getLevels,
  getPersonnel,
  getErrorMessage,
} from '../api/client';

const SchoolSubjects = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const schoolId = searchParams.get('school_id');
  const { token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [schoolName, setSchoolName] = useState('');
  const [schoolSubjects, setSchoolSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [levels, setLevels] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const fetchLookups = useCallback(async () => {
    if (!schoolId) return;
    try {
      const [subjectsRes, sessionsRes, levelsRes, teachersRes] = await Promise.all([
        getSubjects(1, 200),
        getSessions(1, 200, schoolId),
        getLevels(1, 200, schoolId),
        getPersonnel(1, 200, { school_id: schoolId, role: 'TEACHER' }),
      ]);
      setAllSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : (subjectsRes.data?.subjects ?? subjectsRes.data?.data ?? []));
      setSessions(Array.isArray(sessionsRes.data) ? sessionsRes.data : (sessionsRes.data?.data ?? []));
      setLevels(Array.isArray(levelsRes.data) ? levelsRes.data : (levelsRes.data?.data ?? []));
      setTeachers(Array.isArray(teachersRes.data) ? teachersRes.data : (teachersRes.data?.data ?? []));
    } catch (err) {
      console.error('Lookup fetch error:', err);
    }
  }, [schoolId]);

  const fetchSchoolSubjects = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError('');
    try {
      const res = await getSchoolSubjects(schoolId, selectedSessionId || undefined, selectedLevelId || undefined);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setSchoolSubjects(list);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load school subjects.'));
    } finally {
      setLoading(false);
    }
  }, [schoolId, selectedSessionId, selectedLevelId]);

  useEffect(() => {
    if (!schoolId) {
      setError('Missing school_id.');
      return;
    }
    fetchLookups();
    fetchSchoolSubjects();
  }, [schoolId, fetchLookups, fetchSchoolSubjects]);

  useEffect(() => {
    if (schoolSubjects[0]?.school?.name) {
      setSchoolName(schoolSubjects[0].school.name);
    }
  }, [schoolSubjects]);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!schoolId || !selectedSubjectId || !selectedSessionId || !selectedLevelId) {
      setError('Please select subject, session, and level.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await assignSubjectToSchool(schoolId, {
        subject_id: selectedSubjectId,
        level_id: selectedLevelId,
        session_id: selectedSessionId,
        teacher_id: selectedTeacherId || undefined,
      });
      setSuccess('Subject assigned to school.');
      setSelectedSubjectId('');
      setSelectedLevelId('');
      setSelectedTeacherId('');
      fetchSchoolSubjects();
    } catch (err) {
      setError(`Failed to assign subject (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id, data) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateSchoolSubject(id, data);
      setSuccess('Subject updated.');
      fetchSchoolSubjects();
    } catch (err) {
      setError(`Failed to update subject (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this subject from the school?')) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await removeSchoolSubject(id);
      setSuccess('Subject removed.');
      fetchSchoolSubjects();
    } catch (err) {
      setError(`Failed to remove subject (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    } finally {
      setSaving(false);
    }
  };

  const getSubjectName = (id) => allSubjects.find((s) => s.id === id)?.name || id;
  const getSessionName = (id) => sessions.find((s) => s.id === id)?.name || id;
  const getLevelName = (id) => levels.find((l) => l.id === id)?.name || id;
  const getTeacherName = (id) => {
    if (!id) return null;
    const t = teachers.find((x) => x.id === id);
    if (!t) return id;
    return `${t.last_name || ''}, ${t.first_name || ''} ${t.middle_name || ''}`.trim();
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0 }}>School Subjects</h1>
          {schoolName && <p style={{ color: 'var(--gray)', marginTop: '4px' }}>{schoolName}</p>}
        </div>
        <button onClick={() => navigate('/schools')} style={{ padding: '10px 16px', background: 'white', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
          Back to Schools
        </button>
      </div>

      <AlertBox type="error" message={error} />
      {success && <AlertBox type="success" message={success} />}

      <form onSubmit={handleAssign} style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '0.85rem' }}>Session</label>
            <select value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }} required>
              <option value="">Select session</option>
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '0.85rem' }}>Level</label>
            <select value={selectedLevelId} onChange={(e) => { setSelectedLevelId(e.target.value); setSelectedSubjectId(''); }} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }} required>
              <option value="">Select level</option>
              {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '0.85rem' }}>Subject</label>
            <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} disabled={!selectedLevelId} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', opacity: selectedLevelId ? 1 : 0.6 }} required>
              <option value="">{selectedLevelId ? 'Select subject' : 'Select a level first'}</option>
              {selectedLevelId && allSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '0.85rem' }}>Teacher (optional)</label>
            <select value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <option value="">Select teacher</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.last_name}, {t.first_name} {t.middle_name || ''} ({t.staff_id || t.id})</option>)}
            </select>
          </div>
          <button type="submit" disabled={saving} style={{ padding: '10px 18px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '600' }}>
            {saving ? 'Saving...' : 'Assign Subject'}
          </button>
        </div>
      </form>

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-light)', borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Subject</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Level</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Session</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Teacher</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', width: '180px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center' }}>Loading...</td></tr>
            ) : schoolSubjects.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--gray)' }}>No subjects assigned.</td></tr>
            ) : (
              schoolSubjects.map((ss) => (
                <tr key={ss.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px' }}>{getSubjectName(ss.subject?.id || ss.subject_id)}</td>
                  <td style={{ padding: '12px' }}>{getLevelName(ss.level?.id || ss.level_id)}</td>
                  <td style={{ padding: '12px' }}>{getSessionName(ss.session?.id || ss.session_id)}</td>
                  <td style={{ padding: '12px' }}>{getTeacherName(ss.teacher_id) || '—'}</td>
                  <td style={{ padding: '12px' }}>{ss.is_active ? 'Active' : 'Inactive'}</td>
                  <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleUpdate(ss.id, { is_active: !ss.is_active })} style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', background: 'white' }}>
                      {ss.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleRemove(ss.id)} style={{ padding: '6px 10px', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '6px', cursor: 'pointer', background: 'white' }}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SchoolSubjects;