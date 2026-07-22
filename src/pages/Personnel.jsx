import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getPersonnel,
  getPersonnelById,
  updatePersonnel,
  deletePersonnel,
  transferPersonnel,
  getPersonnelTransfers,
  getSchools,
  getErrorMessage,
} from '../api/client';
import AlertBox from '../components/common/AlertBox';

const GENDERS = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other', value: 'OTHER' },
];

const PERSONNEL_ROLES = [
  { label: 'Teacher', value: 'TEACHER' },
  { label: 'Head Teacher', value: 'HEAD_TEACHER' },
  { label: 'Principal', value: 'PRINCIPAL' },
  { label: 'Vice Principal', value: 'VICE_PRINCIPAL' },
  { label: 'Admin Officer', value: 'ADMIN_OFFICER' },
  { label: 'Counselor', value: 'COUNSELOR' },
  { label: 'Librarian', value: 'LIBRARIAN' },
  { label: 'Lab Technician', value: 'LAB_TECHNICIAN' },
  { label: 'Other', value: 'OTHER' },
];

const PERSONNEL_STATUSES = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'Retired', value: 'RETIRED' },
  { label: 'Transferred', value: 'TRANSFERRED' },
];

const QUALIFICATIONS = [
  { label: 'PhD Holder', value: 'PHD' },
  { label: 'BSc / BA', value: 'BSC_BA' },
  { label: 'HND', value: 'HND' },
  { label: 'PgD Edu', value: 'PGD_EDU' },
  { label: 'NCE', value: 'NCE' },
  { label: 'SSCE', value: 'SSCE' },
  { label: 'Grade II', value: 'GRADE_II' },
  { label: 'Other', value: 'OTHER' },
];

const emptyForm = {
  school_id: '',
  staff_id: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  gender: '',
  date_of_birth: '',
  email: '',
  phone: '',
  address: '',
  role: '',
  status: 'ACTIVE',
  qualification: '',
  specialization: '',
  date_of_employment: '',
  lga_id: '',
};

const Personnel = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const schoolIdParam = searchParams.get('school_id');
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState('view');
  const [showModal, setShowModal] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [schools, setSchools] = useState([]);

  const [formData, setFormData] = useState(emptyForm);

  const fetchSchools = useCallback(async () => {
    try {
      const res = await getSchools();
      const list = Array.isArray(res.data) ? res.data : (res.data?.schools ?? res.data?.data ?? []);
      setSchools(list);
    } catch (err) {
      console.error('Schools fetch error:', err);
    }
  }, []);

  const fetchPersonnel = useCallback(async () => {
    if (!token) {
      setError('You must be logged in to view personnel.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const params = { page: 1, limit: 1000 };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (schoolIdParam) {
        params.school_id = schoolIdParam;
      }
      const res = await getPersonnel(1, 1000, params);
      const list = Array.isArray(res.data) ? res.data : (res.data?.personnel ?? res.data?.data ?? []);
      setPersonnel(list);
    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || 'Unknown error';
      setError(`Failed to fetch personnel (${status ?? 'network error'}): ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [token, searchQuery, schoolIdParam]);

  useEffect(() => {
    fetchPersonnel();
  }, [fetchPersonnel]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  useEffect(() => {
    if (!openDropdownId) return;
    const handleClick = (e) => {
      if (e.target.closest('.student-action-menu')) return;
      setOpenDropdownId(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openDropdownId]);

  function openModal(mode, person = null) {
    setModalMode(mode);
    setSelectedPersonnel(person);
    if (mode === 'edit') {
      setFormData({
        school_id: person?.school_id || '',
        staff_id: person?.staff_id || '',
        first_name: person?.first_name || '',
        middle_name: person?.middle_name || '',
        last_name: person?.last_name || '',
        gender: person?.gender || '',
        date_of_birth: person?.date_of_birth ? String(person.date_of_birth).split('T')[0] : '',
        email: person?.email || '',
        phone: person?.phone || '',
        address: person?.address || '',
        role: person?.role || '',
        status: person?.status || 'ACTIVE',
        qualification: person?.qualification || '',
        specialization: person?.specialization || '',
        date_of_employment: person?.date_of_employment ? String(person.date_of_employment).split('T')[0] : '',
        lga_id: person?.lga_id || '',
      });
    }
    setShowModal(true);
    setOpenDropdownId(null);
  }

  useEffect(() => {
    const personnelId = searchParams.get('personnel_id');
    if (personnelId) {
      getPersonnelById(personnelId).then((res) => {
        const data = res.data?.data || res.data;
        if (data) {
          openModal('view', data);
        }
      });
    }
  }, [searchParams]);

  const handleUpdatePersonnel = async (e) => {
    e.preventDefault();
    if (!selectedPersonnel) return;
    try {
      const payload = {
        school_id: formData.school_id,
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth ? `${formData.date_of_birth}T00:00:00Z` : undefined,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        role: formData.role,
        status: formData.status,
        qualification: formData.qualification,
        specialization: formData.specialization,
        date_of_employment: formData.date_of_employment ? `${formData.date_of_employment}T00:00:00Z` : undefined,
      };
      await updatePersonnel(selectedPersonnel.id, payload);
      await fetchPersonnel();
      setShowModal(false);
    } catch (err) {
      console.error('Update personnel error:', err);
      setError(`Failed to update personnel (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    }
  };

  const handleDeletePersonnel = async () => {
    if (!selectedPersonnel) return;
    if (!window.confirm(`Are you sure you want to delete personnel "${selectedPersonnel.first_name} ${selectedPersonnel.last_name}"?`)) {
      setOpenDropdownId(null);
      return;
    }
    try {
      await deletePersonnel(selectedPersonnel.id);
      await fetchPersonnel();
      setShowModal(false);
      setOpenDropdownId(null);
    } catch (err) {
      console.error('Delete personnel error:', err);
      setError(`Failed to delete personnel (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    }
  };

  const handleTransfer = async () => {
    if (!selectedPersonnel) return;
    const toSchoolId = prompt('Enter target school ID:');
    if (!toSchoolId) return;
    try {
      await transferPersonnel(selectedPersonnel.id, { to_school_id: toSchoolId, transfer_date: new Date().toISOString() });
      await fetchPersonnel();
      setOpenDropdownId(null);
    } catch (err) {
      setError(`Failed to transfer personnel (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    }
  };

  const handleViewTransfers = async () => {
    if (!selectedPersonnel) return;
    try {
      const res = await getPersonnelTransfers(selectedPersonnel.id);
      const transfers = res.data?.data || res.data || [];
      alert(`Transfer History:\n${transfers.map(t => `- ${t.from_school_id} → ${t.to_school_id} (${new Date(t.transfer_date).toLocaleDateString()})`).join('\n') || 'No transfers found.'}`);
      setOpenDropdownId(null);
    } catch (err) {
      setError(`Failed to fetch transfers (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    }
  };

  const getSchoolName = (schoolId) => schools.find((s) => s.id === schoolId)?.name || '';

  const filteredPersonnel = personnel.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      (p.first_name && p.first_name.toLowerCase().includes(q)) ||
      (p.last_name && p.last_name.toLowerCase().includes(q)) ||
      (p.staff_id && p.staff_id.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredPersonnel.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedPersonnel = filteredPersonnel.slice((safeCurrentPage - 1) * rowsPerPage, safeCurrentPage * rowsPerPage);

  if (loading) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>Personnel Management</h1>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <input
          type="text"
          placeholder="Search personnel by name or staff ID..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          style={{
            flex: 1,
            maxWidth: '420px',
            padding: '10px 12px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            background: 'white',
            fontSize: '0.95rem',
          }}
        />
        <button
          onClick={() => navigate(`/add-personnel?school_id=${schoolIdParam || ''}`)}
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
          + Add Personnel
        </button>
      </div>

      <AlertBox type="error" message={error} />

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-light)', borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '15px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Staff ID</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Role</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>School</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Phone</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>Avatar</th>
              <th style={{ padding: '15px', textAlign: 'left', width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPersonnel.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--gray)' }}>
                  No personnel found. Click "+ Add Personnel" to create one.
                </td>
              </tr>
            ) : (
              paginatedPersonnel.map((person) => (
                <tr key={person.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '15px' }}>{person.last_name}, {person.first_name} {person.middle_name ? person.middle_name : ''}</td>
                  <td style={{ padding: '15px' }}>{person.staff_id || '—'}</td>
                  <td style={{ padding: '15px' }}>{person.role || '—'}</td>
                  <td style={{ padding: '15px' }}>{getSchoolName(person.school_id)}</td>
                  <td style={{ padding: '15px' }}>{person.phone || '—'}</td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    {person.status === 'ACTIVE' ? (
                      <span style={{ background: '#d4edda', color: '#155724', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>Active</span>
                    ) : (
                      <span style={{ background: '#e2e3e5', color: '#383d41', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>Inactive</span>
                    )}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    {person.avatar_url ? (
                      <img src={person.avatar_url} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#888' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === person.id ? null : person.id)}
                        style={{ padding: '6px 12px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        •••
                      </button>
                      {openDropdownId === person.id && (
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
                            minWidth: '160px'
                          }}>
                          <button
                            onClick={() => { setOpenDropdownId(null); setSelectedPersonnel(person); openModal('view', person); }}
                            style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => { setOpenDropdownId(null); openModal('edit', person); }}
                            style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { setOpenDropdownId(null); setSelectedPersonnel(person); handleTransfer(); }}
                            style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                          >
                            Transfer
                          </button>
                          <button
                            onClick={() => { setOpenDropdownId(null); setSelectedPersonnel(person); handleViewTransfers(); }}
                            style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                          >
                            Transfer History
                          </button>
                          <button
                            onClick={() => { setOpenDropdownId(null); setSelectedPersonnel(person); handleDeletePersonnel(); }}
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

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage === 1}
            style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: 'white', cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer', opacity: safeCurrentPage === 1 ? 0.5 : 1 }}
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: page === safeCurrentPage ? '#3e7430' : 'white', color: page === safeCurrentPage ? 'white' : 'black', cursor: 'pointer', fontWeight: page === safeCurrentPage ? '600' : '400' }}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage === totalPages}
            style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: 'white', cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer', opacity: safeCurrentPage === totalPages ? 0.5 : 1 }}
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
                {modalMode === 'edit' ? 'Edit Personnel' : 'View Personnel'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            {modalMode === 'view' && selectedPersonnel ? (
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Photo</label>
                  {selectedPersonnel.avatar_url ? (
                    <img src={selectedPersonnel.avatar_url} alt="Avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: '#888' }}>No avatar</span>
                  )}
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Full Name</label>
                  <div style={{ padding: '10px', background: 'var(--bg-light)', borderRadius: '8px' }}>
                    {selectedPersonnel.last_name}, {selectedPersonnel.first_name} {selectedPersonnel.middle_name || ''}
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Staff ID</label>
                  <div style={{ padding: '10px', background: 'var(--bg-light)', borderRadius: '8px' }}>{selectedPersonnel.staff_id || '—'}</div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Role</label>
                  <div style={{ padding: '10px', background: 'var(--bg-light)', borderRadius: '8px' }}>{selectedPersonnel.role || '—'}</div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>School</label>
                  <div style={{ padding: '10px', background: 'var(--bg-light)', borderRadius: '8px' }}>{getSchoolName(selectedPersonnel.school_id)}</div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email</label>
                  <div style={{ padding: '10px', background: 'var(--bg-light)', borderRadius: '8px' }}>{selectedPersonnel.email || '—'}</div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phone</label>
                  <div style={{ padding: '10px', background: 'var(--bg-light)', borderRadius: '8px' }}>{selectedPersonnel.phone || '—'}</div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Gender</label>
                  <div style={{ padding: '10px', background: 'var(--bg-light)', borderRadius: '8px' }}>{selectedPersonnel.gender || '—'}</div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Status</label>
                  <div style={{ padding: '10px', background: 'var(--bg-light)', borderRadius: '8px' }}>{selectedPersonnel.status || '—'}</div>
                </div>
                <button type="button" onClick={() => setShowModal(false)} style={{ width: '100%', padding: '12px', marginTop: '20px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdatePersonnel}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>School</label>
                  <select
                    value={formData.school_id}
                    onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                    disabled={modalMode === 'view'}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white' }}
                  >
                    <option value="">Select school</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>{school.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Staff ID</label>
                  <input
                    type="text"
                    value={formData.staff_id}
                    onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                    disabled={modalMode === 'view'}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>First Name</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      disabled={modalMode === 'view'}
                      required
                      style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      disabled={modalMode === 'view'}
                      required
                      style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white' }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Middle Name</label>
                  <input
                    type="text"
                    value={formData.middle_name}
                    onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                    disabled={modalMode === 'view'}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    disabled={modalMode === 'view'}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white' }}
                  >
                    <option value="">Select gender</option>
                    {GENDERS.map((g) => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    disabled={modalMode === 'view'}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white' }}
                  >
                    <option value="">Select role</option>
                    {PERSONNEL_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                {modalMode === 'edit' && (
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      disabled={modalMode === 'view'}
                      style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white' }}
                    >
                      {PERSONNEL_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Date of Birth</label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      disabled={modalMode === 'view'}
                      style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Employment Date</label>
                    <input
                      type="date"
                      value={formData.date_of_employment}
                      onChange={(e) => setFormData({ ...formData, date_of_employment: e.target.value })}
                      disabled={modalMode === 'view'}
                      style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white' }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={modalMode === 'view'}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={modalMode === 'view'}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={modalMode === 'view'}
                    rows="3"
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Qualification</label>
                  <select
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    disabled={modalMode === 'view'}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white' }}
                  >
                    <option value="">Select qualification</option>
                    {QUALIFICATIONS.map((q) => (
                      <option key={q.value} value={q.value}>{q.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Specialization</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    disabled={modalMode === 'view'}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white' }}
                  />
                </div>

                {modalMode !== 'view' && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                      type="submit"
                      style={{ flex: 1, padding: '12px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                    >
                      Update Personnel
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      style={{ flex: 1, padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {modalMode === 'view' && (
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ width: '100%', padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Close
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Personnel;
