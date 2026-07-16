import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AlertBox from '../components/common/AlertBox';
import {
  getEnrollments,
  deleteStudent,
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

  // Student profile (A4 sheet) shown after a successful enrollment.

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
    setShowModal(true);
    setOpenDropdownId(null);
  };

  // When arriving from "Register Student", redirect to the add-enrollment page.
  useEffect(() => {
    const newStudentId = location.state?.newStudentId;
    if (newStudentId) {
      navigate('/add-enrollment', {
        state: {
          newStudentId: location.state?.newStudentId,
          newStudentName: location.state?.newStudentName,
          newStudentEnrollmentNo: location.state?.newStudentEnrollmentNo,
          newStudentSchoolId: location.state?.newStudentSchoolId || '',
        },
        replace: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleViewEnrollment = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setModalMode('view');
    setShowModal(true);
    setOpenDropdownId(null);
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
        <div>
          <h1 style={{ margin: 0 }}>Enrollment Management</h1>
        </div>
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
                         <div
                           onMouseDown={(e) => e.stopPropagation()}
                           onClick={(e) => e.stopPropagation()}
                           style={{
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
                            onClick={() => handleViewEnrollment(enrollment)}
                            style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                          >
                            View
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

      {showModal && selectedEnrollment && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>View Enrollment</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Enrollments;
