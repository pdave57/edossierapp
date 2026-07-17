import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AlertBox from '../components/common/AlertBox';
import {
  enrollStudent,
  getStudent,
  getSchools,
  getSessions,
  getLevels,
  getLevelSubLevels,
  getErrorMessage,
} from '../api/client';

const AddEnrollment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [student, setStudent] = useState(null);
  const [school, setSchool] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [levels, setLevels] = useState([]);
  const [sublevels, setSublevels] = useState([]);

  const [formData, setFormData] = useState({
    session_id: '',
    level_id: '',
    sub_level_id: '',
    status: 'ACTIVE',
  });

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const newStudentId = location.state?.newStudentId;
  const newStudentName = location.state?.newStudentName;
  const newStudentSchoolId = location.state?.newStudentSchoolId;
  const newStudentEnrollmentNo = location.state?.newStudentEnrollmentNo;

  const fetchStudent = useCallback(async (id) => {
    if (!id) return;
    try {
      const res = await getStudent(id);
      setStudent(res.data?.data || res.data || null);
    } catch (err) {
      console.error('Fetch student error:', err);
    }
  }, []);

  const fetchSchool = useCallback(async (id) => {
    if (!id) return;
    try {
      const res = await getSchools();
      const list = Array.isArray(res.data) ? res.data : (res.data?.schools ?? res.data?.data ?? []);
      const found = list.find((s) => s.id === id);
      setSchool(found || null);
    } catch (err) {
      console.error('Fetch school error:', err);
    }
  }, []);

  const fetchSessions = useCallback(async (schoolId) => {
    try {
      const res = await getSessions(1, 100, schoolId || undefined);
      const list = Array.isArray(res.data) ? res.data : (res.data?.sessions ?? res.data?.data ?? []);
      setSessions(list);
    } catch (err) {
      console.error('Sessions fetch error:', err);
    }
  }, []);

  const fetchLevels = useCallback(async () => {
    try {
      const res = await getLevels();
      const list = Array.isArray(res.data) ? res.data : (res.data?.levels ?? res.data?.data ?? []);
      setLevels(list);
    } catch (err) {
      console.error('Levels fetch error:', err);
    }
  }, []);

  const fetchSublevelsByLevel = useCallback(async (levelId) => {
    if (!levelId) {
      setSublevels([]);
      return;
    }
    try {
      const res = await getLevelSubLevels(levelId);
      const list = Array.isArray(res.data) ? res.data : (res.data?.sub_levels ?? res.data?.data ?? []);
      setSublevels(list);
    } catch (err) {
      console.error('Sublevels fetch error:', err);
      setSublevels([]);
    }
  }, []);

  useEffect(() => {
    fetchStudent(newStudentId);
    fetchSchool(newStudentSchoolId);
    fetchSessions(newStudentSchoolId);
    fetchLevels();
  }, [fetchStudent, fetchSchool, fetchSessions, fetchLevels, newStudentId, newStudentSchoolId]);

  useEffect(() => {
    fetchSublevelsByLevel(formData.level_id);
  }, [formData.level_id, fetchSublevelsByLevel]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const enrollmentRes = await enrollStudent({
        student_id: newStudentId,
        school_id: newStudentSchoolId,
        session_id: formData.session_id,
        level_id: formData.level_id,
        sub_level_id: formData.sub_level_id,
      });
      const enrollment = enrollmentRes.data?.data || enrollmentRes.data || {};

      let studentData = student;
      if (!studentData) {
        try {
          const studentRes = await getStudent(newStudentId);
          studentData = studentRes.data?.data || studentRes.data || null;
        } catch {
          studentData = null;
        }
      }

      const subLevelName = sublevels.find((s) => s.id === formData.sub_level_id)?.name || '';
      setProfileData({ student: studentData, enrollment, enrollForm: { ...formData, student_id: newStudentId, school_id: newStudentSchoolId }, subLevelName });
      setShowProfileModal(true);
    } catch (err) {
      console.error('Create enrollment error:', err);
      setError(`Failed to create enrollment (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
      setSubmitting(false);
    }
  };

  const handleCloseProfile = () => {
    setShowProfileModal(false);
    setSubmitting(false);
    navigate('/enrollments');
  };

  if (!newStudentId) {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <AlertBox type="error" message="No student selected for enrollment." />
        <button onClick={() => navigate('/register-student')} style={{ marginTop: '16px', padding: '10px 20px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Register Student
        </button>
      </div>
    );
  }

  const getLevelName = (levelId) => levels.find((l) => l.id === levelId)?.name || '';
  const getSessionName = (sessionId) => sessions.find((s) => s.id === sessionId)?.name || '';

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <button
        type="button"
        onClick={() => navigate('/enrollments')}
        style={{ background: 'none', border: 'none', padding: 0, margin: '0 0 16px', cursor: 'pointer', color: '#3e7430', font: 'inherit', fontSize: '0.9rem' }}
      >
        ← Back to Enrollment Management
      </button>
      <h1 style={{ margin: '0 0 8px' }}>Add Enrollment</h1>
      <p style={{ color: 'var(--gray)', marginTop: 0, marginBottom: '24px' }}>
        Enroll the newly registered student into a session and level.
      </p>

      <AlertBox type="error" message={error} />

      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Student Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.85rem', color: '#888' }}>Student Name</label>
            <div style={{ padding: '10px', background: 'var(--bg-light)', borderRadius: '8px', fontWeight: '500' }}>{newStudentName || '—'}</div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.85rem', color: '#888' }}>Enrollment No</label>
            <div style={{ padding: '10px', background: 'var(--bg-light)', borderRadius: '8px', fontWeight: '500', fontFamily: 'monospace' }}>{newStudentEnrollmentNo || '—'}</div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.85rem', color: '#888' }}>School</label>
            <div style={{ padding: '10px', background: 'var(--bg-light)', borderRadius: '8px', fontWeight: '500' }}>{school?.name || '—'}</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Session</label>
          <select name="session_id" value={formData.session_id} onChange={handleChange} required
            style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
            <option value="">Select session</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>{session.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Level</label>
          <select name="level_id" value={formData.level_id} onChange={handleChange} required
            style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
            <option value="">Select level</option>
            {levels.map((level) => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Sub Level</label>
          <select name="sub_level_id" value={formData.sub_level_id} onChange={handleChange} required disabled={!formData.level_id}
            style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
            <option value="">Select sub level</option>
            {sublevels.map((sl) => (
              <option key={sl.id} value={sl.id}>{sl.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button type="submit" disabled={submitting}
            style={{ flex: 1, padding: '12px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '8px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Enrolling…' : 'Enroll Student'}
          </button>
          <button type="button" onClick={() => navigate('/enrollments')}
            style={{ flex: 1, padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </form>

      {showProfileModal && profileData && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex',
            justifyContent: 'center', alignItems: 'flex-start', zIndex: 1000,
            padding: '30px', overflowY: 'auto',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseProfile(); }}
        >
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              .student-profile-sheet, .student-profile-sheet * { visibility: visible !important; }
              .student-profile-sheet {
                position: absolute !important; left: 0; top: 0; margin: 0 !important;
                box-shadow: none !important; border: none !important;
              }
              .student-profile-no-print { display: none !important; }
              @page { size: A4; margin: 0; }
            }
          `}</style>

          <div
            className="student-profile-sheet"
            style={{
              background: 'white', width: '210mm', minHeight: '297mm',
              padding: '18mm 16mm', boxSizing: 'border-box',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)', fontFamily: 'inherit', color: '#1a1a1a',
            }}
          >
            {(() => {
              const stu = profileData.student || {};
              const enr = profileData.enrollment || {};
              const ef = profileData.enrollForm || {};
              const fullName = `${stu.last_name || ''}${stu.first_name ? ', ' + stu.first_name : ''}${stu.middle_name ? ' ' + stu.middle_name : ''}`.trim() || '—';
              const dob = stu.date_of_birth ? String(stu.date_of_birth).slice(0, 10) : '—';
              const sectionTitle = {
                fontFamily: 'Source Serif Pro, Georgia, serif',
                fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase',
                color: '#3e7430', borderBottom: '2px solid #3e7430', paddingBottom: '4px',
                margin: '0 0 12px',
              };
              const fieldLabel = { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', marginBottom: '2px' };
              const fieldValue = { fontSize: '13px', color: '#1a1a1a', marginBottom: '10px' };
              const cell = (label, value) => (
                <div>
                  <div style={fieldLabel}>{label}</div>
                  <div style={fieldValue}>{value || '—'}</div>
                </div>
              );
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #3e7430', paddingBottom: '12px', marginBottom: '18px' }}>
                    <div>
                      <div style={{ fontSize: '22px', fontWeight: '700', fontFamily: 'Source Serif Pro, Georgia, serif' }}>e-Dossier</div>
                      <div style={{ fontSize: '12px', color: '#555' }}>Student Profile</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>Enrollment No</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#3e7430' }}>{stu.enrollment_no || newStudentEnrollmentNo || '—'}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'Source Serif Pro, Georgia, serif', marginBottom: '4px' }}>{fullName}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>{(stu.status || ef.status || '—')}</div>

                  <h3 style={sectionTitle}>Bio Data</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', marginBottom: '22px' }}>
                    {cell('Gender', stu.gender)}
                    {cell('Date of Birth', dob)}
                    {cell('State', stu.state?.name || '—')}
                    {cell('LGA', stu.lga?.name || '—')}
                    {cell('State of Origin', stu.state_of_origin?.name || '—')}
                    {cell('Religion', stu.religion)}
                    {cell('Address', stu.address)}
                  </div>

                  <h3 style={sectionTitle}>School &amp; Enrollment Data</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', marginBottom: '22px' }}>
                    {cell('School', school?.name || '—')}
                    {cell('Session', getSessionName(ef.session_id))}
                    {cell('Level', getLevelName(ef.level_id))}
                    {cell('Sub Level', profileData.subLevelName || '—')}
                    {cell('Enrollment Year', stu.enrollment_year)}
                    {cell('Enrollment Status', ef.status || enr.status)}
                  </div>

                  <h3 style={sectionTitle}>Guardian Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                    {cell('Guardian Name', stu.guardian_name)}
                    {cell('Guardian Phone', stu.guardian_phone)}
                    {cell('Guardian Relation', stu.guardian_relation)}
                  </div>

                  <div style={{ marginTop: '40px', borderTop: '1px solid #ccc', paddingTop: '10px', fontSize: '10px', color: '#999' }}>
                    Generated by e-Dossier • {new Date().toLocaleDateString()}
                  </div>
                </>
              );
            })()}
          </div>

          <div className="student-profile-no-print" style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', gap: '10px', zIndex: 1001 }}>
            <button
              type="button"
              onClick={() => window.print()}
              style={{ padding: '12px 22px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            >
              Print / Download PDF
            </button>
            <button
              type="button"
              onClick={handleCloseProfile}
              style={{ padding: '12px 22px', background: 'white', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddEnrollment;
