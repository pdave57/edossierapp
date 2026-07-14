import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AlertBox from '../components/common/AlertBox';
import {
  getEnrollments,
  enrollStudent,
  updateEnrollment,
  deleteStudent,
  getStudents,
  getStudent,
  getSchools,
  getSessions,
  getLevels,
  getLevelSubLevels,
  getStates,
  getLgas,
  getErrorMessage,
} from '../api/client';

const ENROLLMENT_STATUSES = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Repeated', value: 'REPEATED' },
  { label: 'Transferred', value: 'TRANSFERRED' },
  { label: 'Withdrawn', value: 'WITHDRAWN' },
];

const Enrollments = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState('view');
  const [showModal, setShowModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [students, setStudents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [levels, setLevels] = useState([]);
  const [sublevels, setSublevels] = useState([]);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);

  const [formData, setFormData] = useState({
    student_id: '',
    school_id: '',
    session_id: '',
    level_id: '',
    sub_level_id: '',
    status: 'ACTIVE',
  });

  // Student profile (A4 sheet) shown after a successful enrollment.
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await getStudents();
      const list = Array.isArray(res.data) ? res.data : (res.data?.students ?? res.data?.data ?? []);
      setStudents(list);
    } catch (err) {
      console.error('Students fetch error:', err);
    }
  }, []);

  const fetchSchools = useCallback(async () => {
    try {
      const res = await getSchools();
      const list = Array.isArray(res.data) ? res.data : (res.data?.schools ?? res.data?.data ?? []);
      setSchools(list);
    } catch (err) {
      console.error('Schools fetch error:', err);
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

  const fetchStates = useCallback(async () => {
    try {
      const res = await getStates();
      const list = Array.isArray(res.data) ? res.data : (res.data?.states ?? res.data?.data ?? []);
      setStates(list);
    } catch (err) {
      console.error('States fetch error:', err);
    }
  }, []);

  const fetchLgas = useCallback(async () => {
    try {
      const res = await getLgas();
      const list = Array.isArray(res.data) ? res.data : (res.data?.lgas ?? res.data?.data ?? []);
      setLgas(list);
    } catch (err) {
      console.error('LGAs fetch error:', err);
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

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getEnrollments();
      const list = Array.isArray(res.data) ? res.data : (res.data?.enrollments ?? res.data?.data ?? []);
      setEnrollments(list);
    } catch (err) {
      console.error('Enrollments fetch error:', err);
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || 'Unknown error';
      setError(`Failed to fetch enrollments (${status ?? 'network error'}): ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
    fetchStudents();
    fetchSchools();
    fetchLevels();
    fetchStates();
    fetchLgas();
  }, [fetchEnrollments, fetchStudents, fetchSchools, fetchLevels, fetchStates, fetchLgas]);

  // Populate sessions for the selected school (state-wide when no school is chosen).
  useEffect(() => {
    fetchSessions(formData.school_id || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.school_id]);

  useEffect(() => {
    fetchSublevelsByLevel(formData.level_id);
  }, [formData.level_id, fetchSublevelsByLevel]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openModal = (mode, enrollment = null) => {
    setModalMode(mode);
    setSelectedEnrollment(enrollment);
    if (mode === 'create' || mode === 'edit') {
      setFormData({
        student_id: enrollment?.student_id || '',
        school_id: enrollment?.school_id || '',
        session_id: enrollment?.session_id || '',
        level_id: enrollment?.level_id || '',
        sub_level_id: enrollment?.sub_level_id || '',
        status: enrollment?.status || 'ACTIVE',
      });
    }
    setShowModal(true);
    setOpenDropdownId(null);
  };

  // When arriving from "Register Student", pre-select the new student and open the enroll modal.
  useEffect(() => {
    const newStudentId = location.state?.newStudentId;
    if (newStudentId) {
      setFormData((prev) => ({ ...prev, student_id: newStudentId }));
      openModal('create');
      // Clear the location state so the modal doesn't reopen on refresh.
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateEnrollment = async (e) => {
    e.preventDefault();
    try {
      const enrollmentRes = await enrollStudent({
        student_id: formData.student_id,
        school_id: formData.school_id,
        session_id: formData.session_id,
        level_id: formData.level_id,
        sub_level_id: formData.sub_level_id,
      });
      const enrollment = enrollmentRes.data?.data || enrollmentRes.data || {};
      await fetchEnrollments();

      // Build the student profile (A4) for printable/download.
      let student = null;
      try {
        const studentRes = await getStudent(formData.student_id);
        student = studentRes.data?.data || studentRes.data || null;
      } catch {
        student = null;
      }
      const subLevelName = sublevels.find((s) => s.id === formData.sub_level_id)?.name || '';
      setProfileData({ student, enrollment, enrollForm: { ...formData }, subLevelName });
      setShowModal(false);
      setShowProfileModal(true);
    } catch (err) {
      console.error('Create enrollment error:', err);
      setError(`Failed to create enrollment (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    }
  };

  const handleUpdateEnrollment = async (e) => {
    e.preventDefault();
    if (!selectedEnrollment) return;
    try {
      await updateEnrollment(selectedEnrollment.id, {
        sub_level_id: formData.sub_level_id,
        status: formData.status,
      });
      await fetchEnrollments();
      setShowModal(false);
    } catch (err) {
      console.error('Update enrollment error:', err);
      setError(`Failed to update enrollment (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    }
  };

  const handleDeleteEnrollment = async () => {
    if (!selectedEnrollment) return;
    if (!window.confirm('Are you sure you want to delete this enrollment?')) {
      setOpenDropdownId(null);
      return;
    }
    try {
      await deleteStudent(selectedEnrollment.id);
      await fetchEnrollments();
      setShowModal(false);
      setOpenDropdownId(null);
    } catch (err) {
      console.error('Delete enrollment error:', err);
      setError(`Failed to delete enrollment (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    }
  };

  const handleViewEnrollment = async () => {
    if (!selectedEnrollment?.id) return;
    try {
      const res = await getStudent(selectedEnrollment.id);
      const enrollmentData = res.data?.data || res.data;
      setSelectedEnrollment(enrollmentData);
      setFormData({
        student_id: enrollmentData.student_id || '',
        school_id: enrollmentData.school_id || '',
        session_id: enrollmentData.session_id || '',
        level_id: enrollmentData.level_id || '',
        sub_level_id: enrollmentData.sub_level_id || '',
        status: enrollmentData.status || 'ACTIVE',
      });
      setModalMode('view');
      setShowModal(true);
      setOpenDropdownId(null);
    } catch (err) {
      console.error('View enrollment error:', err);
      setError(`Failed to fetch enrollment details (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    }
  };

  const getStudentName = (studentId) => {
    const s = students.find((st) => st.id === studentId);
    return s ? `${s.first_name} ${s.last_name}` : '';
  };
  const getSchoolName = (schoolId) => schools.find((s) => s.id === schoolId)?.name || '';
  const getSessionName = (sessionId) => sessions.find((s) => s.id === sessionId)?.name || '';
  const getLevelName = (levelId) => levels.find((l) => l.id === levelId)?.name || '';
  const getStateName = (stateId) => states.find((s) => s.id === stateId)?.name || '';
  const getLgaName = (lgaId) => lgas.find((l) => l.id === lgaId)?.name || '';

  if (loading) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <button
          type="button"
          onClick={() => navigate('/enrollments')}
          style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', color: 'inherit', font: 'inherit' }}
          title="Go to Enrollment Management"
        >
          <h1 style={{ margin: 0 }}>Enrollment Management</h1>
        </button>
        <button
          onClick={() => openModal('create')}
          style={{
            padding: '10px 24px',
            background: '#3e7430',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.95rem'
          }}
        >
          + Add New
        </button>
      </div>

      <AlertBox type="error" message={error} />

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-light)', borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '15px', textAlign: 'left' }}>Student</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>School</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Session</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Level</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '15px', textAlign: 'left', width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--gray)' }}>
                  No enrollments found. Click "+ Add New" to create one.
                </td>
              </tr>
            ) : (
              enrollments.map((enrollment) => (
                <tr key={enrollment.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '15px' }}>{getStudentName(enrollment.student_id)}</td>
                  <td style={{ padding: '15px' }}>{getSchoolName(enrollment.school_id)}</td>
                  <td style={{ padding: '15px' }}>{getSessionName(enrollment.session_id)}</td>
                  <td style={{ padding: '15px' }}>{getLevelName(enrollment.level_id)}</td>
                  <td style={{ padding: '15px' }}>{enrollment.status || '—'}</td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === enrollment.id ? null : enrollment.id)}
                        style={{ padding: '6px 12px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        •••
                      </button>
                      {openDropdownId === enrollment.id && (
                        <div style={{
                          position: 'absolute',
                          right: '0',
                          top: '38px',
                          background: 'white',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          zIndex: 9999,
                          minWidth: '140px'
                        }}>
                          <button
                            onClick={() => { setSelectedEnrollment(enrollment); handleViewEnrollment(); }}
                            style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => openModal('edit', enrollment)}
                            style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { setSelectedEnrollment(enrollment); handleDeleteEnrollment(); }}
                            style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', color: '#e74c3c' }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {enrollments.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
          >
            Prev
          </button>
          {Array.from({ length: Math.ceil(enrollments.length / rowsPerPage) }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: page === currentPage ? '#3e7430' : 'white', color: page === currentPage ? 'white' : 'black', cursor: 'pointer', fontWeight: page === currentPage ? '600' : '400' }}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(Math.ceil(enrollments.length / rowsPerPage), p + 1))}
            disabled={currentPage === Math.ceil(enrollments.length / rowsPerPage)}
            style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: 'white', cursor: currentPage === Math.ceil(enrollments.length / rowsPerPage) ? 'not-allowed' : 'pointer', opacity: currentPage === Math.ceil(enrollments.length / rowsPerPage) ? 0.5 : 1 }}
          >
            Next
          </button>
        </div>
      )}

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>
                {modalMode === 'create' ? 'Create Enrollment' : modalMode === 'edit' ? 'Edit Enrollment' : 'View Enrollment'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            {modalMode === 'view' ? (
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Student</label>
                  <input type="text" value={getStudentName(selectedEnrollment?.student_id)} disabled style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>School</label>
                  <input type="text" value={getSchoolName(selectedEnrollment?.school_id)} disabled style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Session</label>
                  <input type="text" value={getSessionName(selectedEnrollment?.session_id)} disabled style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Level</label>
                  <input type="text" value={getLevelName(selectedEnrollment?.level_id)} disabled style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Status</label>
                  <input type="text" value={selectedEnrollment?.status || ''} disabled style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)' }} />
                </div>
                <button type="button" onClick={() => setShowModal(false)} style={{ width: '100%', padding: '12px', marginTop: '20px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={modalMode === 'create' ? handleCreateEnrollment : handleUpdateEnrollment}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Student</label>
                  <select
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
                    required
                    disabled={modalMode === 'edit'}
                  >
                    <option value="">Select student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>{student.first_name} {student.last_name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>School</label>
                  <select
                    value={formData.school_id}
                    onChange={(e) => setFormData({ ...formData, school_id: e.target.value, session_id: '', sub_level_id: '' })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
                    required
                    disabled={modalMode === 'edit'}
                  >
                    <option value="">Select school</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>{school.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Session</label>
                  <select
                    value={formData.session_id}
                    onChange={(e) => setFormData({ ...formData, session_id: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
                    required
                    disabled={modalMode === 'edit'}
                  >
                    <option value="">Select session</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>{session.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Level</label>
                  <select
                    value={formData.level_id}
                    onChange={(e) => setFormData({ ...formData, level_id: e.target.value, sub_level_id: '' })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
                    required
                    disabled={modalMode === 'edit'}
                  >
                    <option value="">Select level</option>
                    {levels.map((level) => (
                      <option key={level.id} value={level.id}>{level.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Sub Level</label>
                  <select
                    value={formData.sub_level_id}
                    onChange={(e) => setFormData({ ...formData, sub_level_id: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
                    required
                    disabled={modalMode === 'edit' || !formData.level_id}
                  >
                    <option value="">Select sub level</option>
                    {sublevels.map((sl) => (
                      <option key={sl.id} value={sl.id}>{sl.name}</option>
                    ))}
                  </select>
                </div>

                {modalMode === 'edit' && (
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
                    >
                      {ENROLLMENT_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="submit"
                    style={{ flex: 1, padding: '12px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    {modalMode === 'create' ? 'Create Enrollment' : 'Update Enrollment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ flex: 1, padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showProfileModal && profileData && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex',
            justifyContent: 'center', alignItems: 'flex-start', zIndex: 1000,
            padding: '30px', overflowY: 'auto',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowProfileModal(false); }}
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
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#3e7430' }}>{stu.enrollment_no || enr.enrollment_no || '—'}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'Source Serif Pro, Georgia, serif', marginBottom: '4px' }}>{fullName}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>{(stu.status || ef.status || '—')}</div>

                  <h3 style={sectionTitle}>Bio Data</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', marginBottom: '22px' }}>
                    {cell('Gender', stu.gender)}
                    {cell('Date of Birth', dob)}
                    {cell('State', getStateName(stu.state_id))}
                    {cell('LGA', getLgaName(stu.lga_id))}
                    {cell('State of Origin', stu.state_of_origin)}
                    {cell('Religion', stu.religion)}
                    {cell('Address', stu.address)}
                  </div>

                  <h3 style={sectionTitle}>School &amp; Enrollment Data</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', marginBottom: '22px' }}>
                    {cell('School', getSchoolName(ef.school_id || enr.school_id))}
                    {cell('Session', getSessionName(ef.session_id || enr.session_id))}
                    {cell('Level', getLevelName(ef.level_id || enr.level_id))}
                    {cell('Sub Level', profileData.subLevelName || (sublevels.find((s) => s.id === (ef.sub_level_id || enr.sub_level_id))?.name) || '—')}
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
              onClick={() => navigate('/register-student')}
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

export default Enrollments;
