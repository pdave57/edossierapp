import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertBox from '../components/common/AlertBox';
import {
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  getSchools,
  getStates,
  getStatelgas,
  getErrorMessage,
} from '../api/client';

const GENDERS = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other', value: 'OTHER' },
];

const STUDENT_STATUSES = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Graduated', value: 'GRADUATED' },
  { label: 'Transferred', value: 'TRANSFERRED' },
  { label: 'Withdrawn', value: 'WITHDRAWN' },
];

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState('view');
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileStudent, setProfileStudent] = useState(null);

  const [schools, setSchools] = useState([]);

  const [formData, setFormData] = useState({
    state_id: '',
    lga_id: '',
    enrollment_year: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: '',
    date_of_birth: '',
    state_of_origin: '',
    religion: '',
    address: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_relation: '',
    status: 'ACTIVE',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSchoolId, setFilterSchoolId] = useState('');
  const [allStudents, setAllStudents] = useState([]);

  const fetchSchools = useCallback(async () => {
    try {
      const res = await getSchools();
      const list = Array.isArray(res.data) ? res.data : (res.data?.schools ?? res.data?.data ?? []);
      setSchools(list);
    } catch (err) {
      console.error('Schools fetch error:', err);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (filterSchoolId) {
        params.school_id = filterSchoolId;
      }
      const res = await getStudents(1, 1000, params);
      const list = Array.isArray(res.data) ? res.data : (res.data?.students ?? res.data?.data ?? []);
      setAllStudents(list);
    } catch (err) {
      console.error('Students fetch error:', err);
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || 'Unknown error';
      setError(`Failed to fetch students (${status ?? 'network error'}): ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [filterSchoolId]);

  useEffect(() => {
    fetchStudents();
    fetchSchools();
  }, [fetchStudents, fetchSchools]);

  useEffect(() => {
    if (!allStudents.length) return;
    const q = searchQuery.trim().toLowerCase();
    const filtered = allStudents.filter((s) => {
      const matchesName = !q || [
        s.first_name, s.middle_name, s.last_name, s.enrollment_no,
      ].some((val) => String(val || '').toLowerCase().includes(q));
      const matchesSchool = !filterSchoolId || s.school_id === filterSchoolId;
      return matchesName && matchesSchool;
    });
    setStudents(filtered);
    setCurrentPage(1);
  }, [allStudents, searchQuery, filterSchoolId]);

  useEffect(() => {
    if (!openDropdownId) return;
    const handleClick = (e) => {
      if (e.target.closest('.student-action-menu')) return;
      setOpenDropdownId(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openDropdownId]);

  const openModal = (mode, student = null) => {
    setModalMode(mode);
    setSelectedStudent(student);
    if (mode === 'edit') {
      setFormData({
        state_id: student?.state_id || '',
        lga_id: student?.lga_id || '',
        enrollment_year: student?.enrollment_year ?? '',
        first_name: student?.first_name || '',
        middle_name: student?.middle_name || '',
        last_name: student?.last_name || '',
        gender: student?.gender || '',
        date_of_birth: student?.date_of_birth ? String(student.date_of_birth).slice(0, 10) : '',
        state_of_origin: student?.state_of_origin || '',
        religion: student?.religion || '',
        address: student?.address || '',
        guardian_name: student?.guardian_name || '',
        guardian_phone: student?.guardian_phone || '',
        guardian_relation: student?.guardian_relation || '',
        status: student?.status || 'ACTIVE',
      });
      if (student?.state_id) {
        fetchLgasByState(student.state_id);
      }
    }
    setShowModal(true);
    setOpenDropdownId(null);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const payload = {
        first_name: formData.first_name.trim(),
        middle_name: formData.middle_name.trim(),
        last_name: formData.last_name.trim(),
        gender: formData.gender,
        date_of_birth: formData.date_of_birth ? `${formData.date_of_birth}T00:00:00Z` : undefined,
        state_of_origin: formData.state_of_origin.trim(),
        lga_id: formData.lga_id.trim(),
        religion: formData.religion.trim(),
        address: formData.address.trim(),
        guardian_name: formData.guardian_name.trim(),
        guardian_phone: formData.guardian_phone.trim(),
        guardian_relation: formData.guardian_relation.trim(),
        status: formData.status,
      };
      await updateStudent(selectedStudent.id, payload);
      await fetchStudents();
      setShowModal(false);
    } catch (err) {
      console.error('Update student error:', err);
      setError(`Failed to update student (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    if (!window.confirm(`Are you sure you want to delete student "${selectedStudent.first_name} ${selectedStudent.last_name}"?`)) {
      setOpenDropdownId(null);
      return;
    }
    try {
      await deleteStudent(selectedStudent.id);
      await fetchStudents();
      setShowModal(false);
      setOpenDropdownId(null);
    } catch (err) {
      console.error('Delete student error:', err);
      setError(`Failed to delete student (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    }
  };

  const handleViewStudent = async () => {
    if (!selectedStudent?.id) return;
    try {
      const res = await getStudent(selectedStudent.id);
      const studentData = res.data?.data || res.data;
      setSelectedStudent(studentData);
      setFormData({
        state_id: studentData.state_id || '',
        lga_id: studentData.lga_id || '',
        enrollment_year: studentData.enrollment_year ?? '',
        first_name: studentData.first_name || '',
        middle_name: studentData.middle_name || '',
        last_name: studentData.last_name || '',
        gender: studentData.gender || '',
        date_of_birth: studentData.date_of_birth ? String(studentData.date_of_birth).slice(0, 10) : '',
        state_of_origin: studentData.state_of_origin || '',
        religion: studentData.religion || '',
        address: studentData.address || '',
        guardian_name: studentData.guardian_name || '',
        guardian_phone: studentData.guardian_phone || '',
        guardian_relation: studentData.guardian_relation || '',
        status: studentData.status || 'ACTIVE',
      });
      setModalMode('view');
      setShowModal(true);
      setOpenDropdownId(null);
    } catch (err) {
      console.error('View student error:', err);
      setError(`Failed to fetch student details (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    }
  };

  const getSchoolName = (schoolId) => schools.find((s) => s.id === schoolId)?.name || '';
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
          onClick={() => navigate('/students')}
          style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', color: 'inherit', font: 'inherit' }}
          title="Go to Student Management"
        >
          <h1 style={{ margin: 0 }}>Student Management</h1>
        </button>
      </div>

      <AlertBox type="error" message={error} />

      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>Search Name</label>
          <input
            type="text"
            placeholder="Search by student name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white', fontSize: '0.95rem' }}
          />
        </div>
        <div style={{ flex: '1 1 260px', minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>School</label>
          <select
            value={filterSchoolId}
            onChange={(e) => setFilterSchoolId(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white', fontSize: '0.95rem' }}
          >
            <option value="">All Schools</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>{school.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-light)', borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '15px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Gender</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>School</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Enrollment No</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '15px', textAlign: 'left', width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--gray)' }}>
                  No students found.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '15px' }}>{student.first_name} {student.middle_name ? student.middle_name + ' ' : ''}{student.last_name}</td>
                  <td style={{ padding: '15px' }}>{student.gender || '—'}</td>
                  <td style={{ padding: '15px' }}>{getSchoolName(student.school_id)}</td>
                  <td style={{ padding: '15px' }}>{student.enrollment_no || '—'}</td>
                  <td style={{ padding: '15px' }}>{student.status || '—'}</td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === student.id ? null : student.id)}
                        style={{ padding: '6px 12px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        •••
                      </button>
                      {openDropdownId === student.id && (
                        <div
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          className="student-action-menu"
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
                            onClick={() => { setOpenDropdownId(null); setProfileStudent(student); setShowProfileModal(true); }}
                            style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => navigate(`/register-student/${student.id}`)}
                            style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { setOpenDropdownId(null); setSelectedStudent(student); handleDeleteStudent(); }}
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

      {students.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
          >
            Prev
          </button>
          {Array.from({ length: Math.ceil(students.length / rowsPerPage) }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: page === currentPage ? '#3e7430' : 'white', color: page === currentPage ? 'white' : 'black', cursor: 'pointer', fontWeight: page === currentPage ? '600' : '400' }}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(Math.ceil(students.length / rowsPerPage), p + 1))}
            disabled={currentPage === Math.ceil(students.length / rowsPerPage)}
            style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: 'white', cursor: currentPage === Math.ceil(students.length / rowsPerPage) ? 'not-allowed' : 'pointer', opacity: currentPage === Math.ceil(students.length / rowsPerPage) ? 0.5 : 1 }}
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
                {modalMode === 'edit' ? 'Edit Student' : 'View Student'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            {modalMode === 'view' ? (
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Full Name</label>
                  <input type="text" value={`${selectedStudent?.first_name || ''} ${selectedStudent?.middle_name || ''} ${selectedStudent?.last_name || ''}`} disabled style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Gender</label>
                  <input type="text" value={selectedStudent?.gender || ''} disabled style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Date of Birth</label>
                  <input type="text" value={selectedStudent?.date_of_birth ? String(selectedStudent.date_of_birth).slice(0, 10) : ''} disabled style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>School</label>
                  <input type="text" value={getSchoolName(selectedStudent?.school_id)} disabled style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>State</label>
                  <input type="text" value={getStateName(selectedStudent?.state_id)} disabled style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>LGA</label>
                  <input type="text" value={getLgaName(selectedStudent?.lga_id)} disabled style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Enrollment No</label>
                  <input type="text" value={selectedStudent?.enrollment_no || ''} disabled style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Guardian Name</label>
                  <input type="text" value={selectedStudent?.guardian_name || ''} disabled style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Guardian Phone</label>
                  <input type="text" value={selectedStudent?.guardian_phone || ''} disabled style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Status</label>
                  <input type="text" value={selectedStudent?.status || ''} disabled style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)' }} />
                </div>
                <button type="button" onClick={() => setShowModal(false)} style={{ width: '100%', padding: '12px', marginTop: '20px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdateStudent}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>State</label>
                  <select
                    value={formData.state_id}
                    onChange={(e) => setFormData({ ...formData, state_id: e.target.value, lga_id: '' })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
                    required
                  >
                    <option value="">Select state</option>
                    {states.map((state) => (
                      <option key={state.id} value={state.id}>{state.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>LGA</label>
                  <select
                    value={formData.lga_id}
                    onChange={(e) => setFormData({ ...formData, lga_id: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
                    required
                    disabled={!formData.state_id}
                  >
                    <option value="">Select lga</option>
                    {lgas.map((lga) => (
                      <option key={lga.id} value={lga.id}>{lga.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>First Name</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Middle Name</label>
                  <input
                    type="text"
                    value={formData.middle_name}
                    onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Enrollment Year</label>
                  <input
                    type="number"
                    value={formData.enrollment_year}
                    onChange={(e) => setFormData({ ...formData, enrollment_year: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
                    required
                  >
                    <option value="">Select gender</option>
                    {GENDERS.map((g) => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Date of Birth</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>State of Origin</label>
                  <input
                    type="text"
                    value={formData.state_of_origin}
                    onChange={(e) => setFormData({ ...formData, state_of_origin: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Religion</label>
                  <input
                    type="text"
                    value={formData.religion}
                    onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Guardian Name</label>
                  <input
                    type="text"
                    value={formData.guardian_name}
                    onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Guardian Phone</label>
                  <input
                    type="text"
                    value={formData.guardian_phone}
                    onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Guardian Relation</label>
                  <input
                    type="text"
                    value={formData.guardian_relation}
                    onChange={(e) => setFormData({ ...formData, guardian_relation: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows="3"
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
                  >
                    {STUDENT_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="submit"
                    style={{ flex: 1, padding: '12px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Update Student
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
      
      {showProfileModal && profileStudent && (
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
              const stu = profileStudent || {};
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
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#3e7430' }}>{stu.enrollment_no || '—'}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'Source Serif Pro, Georgia, serif', marginBottom: '4px' }}>{fullName}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>{stu.status || '—'}</div>

                  <h3 style={sectionTitle}>Bio Data</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', marginBottom: '22px' }}>
                      {cell('Date of Birth', dob)}
                    {cell('State of Origin', stu.state_of_origin)}
                    {cell('Religion', stu.religion)}
                    {cell('Address', stu.address)}
                    {cell('Guardian Name', stu.guardian_name)}
                    {cell('Guardian Phone', stu.guardian_phone)}
                    {cell('Guardian Relation', stu.guardian_relation)}
                  </div>

                  <h3 style={sectionTitle}>School &amp; Enrollment Data</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', marginBottom: '22px' }}>
                    {cell('School', getSchoolName(stu.school_id))}
                    {cell('Enrollment Year', stu.enrollment_year)}
                    {cell('Enrollment Status', stu.status)}
                  </div>

                  <h3 style={sectionTitle}>Academic Summary</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', marginBottom: '22px' }}>
                    {cell('Student ID', stu.id)}
                    {cell('State ID', stu.state_id)}
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
              onClick={() => setShowProfileModal(false)}
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

export default Students;
