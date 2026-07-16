import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertBox from '../components/common/AlertBox';
import {
  getStates,
  getStatelgas,
  getStateZones,
  getSchools,
  createSchool,
  updateSchool,
  deleteSchool,
} from '../api/client';

const Schools = () => {
  const navigate = useNavigate();

  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalMode, setModalMode] = useState('view');
  const [showModal, setShowModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [zones, setZones] = useState([]);

  const [selectedStateId, setSelectedStateId] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [formData, setFormData] = useState({
    state_id: '',
    zone_id: '',
    lga_id: '',
    name: '',
    code: '',
    address: '',
    category: '',
    ownership: '',
    status: '',
    number_of_classrooms: '',
    total_students: '',
    headTeacher: '',
    founded: '',
  });

  // --- Data fetching helpers ---
  const fetchStates = useCallback(async () => {
    try {
      const res = await getStates();
      const list = Array.isArray(res.data) ? res.data : (res.data?.states ?? res.data?.data ?? []);
      setStates(list);
    } catch (err) {
      console.error('State fetch error:', err);
    }
  }, []);

  const fetchLgasByState = useCallback(async (stateId) => {
    if (!stateId) {
      setLgas([]);
      return;
    }
    try {
      const res = await getStatelgas(stateId);
      const list = Array.isArray(res.data) ? res.data : (res.data?.lgas ?? res.data?.data ?? []);
      setLgas(list);
    } catch (err) {
      console.error('LGA fetch error:', err);
      setLgas([]);
    }
  }, []);

  const fetchZonesByState = useCallback(async (stateId) => {
    if (!stateId) {
      setZones([]);
      return;
    }
    try {
      const res = await getStateZones(stateId);
      const list = Array.isArray(res.data) ? res.data : (res.data?.zones ?? res.data?.data ?? []);
      setZones(list);
    } catch (err) {
      console.error('Zone fetch error:', err);
      setZones([]);
    }
  }, []);

  const fetchSchools = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getSchools();
      const list = Array.isArray(res.data) ? res.data : (res.data?.schools ?? res.data?.data ?? []);
      setSchools(list);
    } catch (err) {
      console.error('School fetch error:', err);
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || 'Unknown error';
      setError(`Failed to fetch schools (${status ?? 'network error'}): ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStates();
    fetchSchools();
  }, [fetchStates, fetchSchools]);

  useEffect(() => {
    fetchLgasByState(selectedStateId);
    fetchZonesByState(selectedStateId);
  }, [selectedStateId, fetchLgasByState, fetchZonesByState]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Code generation ---
  // Build a candidate code from lga code + zone code + 5 random digits.
  // If it already exists among schools, increment the last digit (wrapping)
  // until a free code is found.
  const generateSchoolCode = useCallback(() => {
    const lgaCode = (formData.lga_id
      ? lgas.find((l) => l.id === formData.lga_id)?.code
      : '') || '';
    const zoneCode = (formData.zone_id
      ? zones.find((z) => z.id === formData.zone_id)?.code
      : '') || '';

    if (!lgaCode || !zoneCode) return '';

    const randDigits = Math.floor(10000 + Math.random() * 90000).toString(); // 5 random digits
    const base = `${lgaCode}${zoneCode}${randDigits}`;
    const existing = new Set(schools.map((s) => (s.code || '').toUpperCase()));

    let candidate = base;
    let suffix = randDigits;

    while (existing.has(candidate.toUpperCase())) {
      let last = parseInt(suffix[suffix.length - 1], 10);
      last = (last + 1) % 10;
      suffix = suffix.slice(0, -1) + last.toString();
      candidate = `${lgaCode}${zoneCode}${suffix}`;
    }

    return candidate;
  }, [formData.lga_id, formData.zone_id, lgas, zones, schools]);

  const handleGenerateCode = () => {
    const code = generateSchoolCode();
    if (!code) {
      setError('Select an LGA and a Zone before generating a code.');
      return;
    }
    setError('');
    setFormData((prev) => ({ ...prev, code }));
  };

  // --- Modal controls ---
  const openModal = (mode, school = null) => {
    setModalMode(mode);
    setSelectedSchool(school);
    setError('');
    if (mode === 'create' || mode === 'edit') {
      const stateId = school?.state_id || selectedStateId || '';
      setFormData({
        name: school?.name || '',
        code: school?.code || '',
        address: school?.address || '',
        state_id: stateId,
        zone_id: school?.zone_id || school?.zone?.id || '',
        lga_id: school?.lga_id || school?.lga?.id || '',
        category: school?.category || '',
        ownership: school?.ownership || '',
        status: school?.status || '',
        number_of_classrooms: school?.number_of_classrooms != null ? String(school.number_of_classrooms) : '',
        total_students: school?.total_students != null ? String(school.total_students) : '',
        headTeacher: school?.headTeacher || '',
        founded: school?.founded != null ? String(school.founded) : '',
      });
    }
    setShowModal(true);
    setOpenDropdownId(null);
  };

  const handleCreateSchool = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('School name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setError('School code is required. Click "Generate Code".');
      return;
    }
    if (!formData.state_id) {
      setError('Please select a state.');
      return;
    }
    if (!formData.lga_id) {
      setError('Please select an LGA.');
      return;
    }
    if (!formData.zone_id) {
      setError('Please select a zone.');
      return;
    }
    if (!formData.category) {
      setError('Please select a category.');
      return;
    }
    if (!formData.ownership) {
      setError('Please select an ownership type.');
      return;
    }
    setError('');
    try {
      const payload = {
        state_id: formData.state_id,
        zone_id: formData.zone_id,
        lga_id: formData.lga_id,
        name: formData.name.trim(),
        code: formData.code.trim(),
        category: formData.category,
        ownership: formData.ownership,
        status: formData.status || undefined,
        number_of_classrooms: formData.number_of_classrooms !== '' ? parseInt(formData.number_of_classrooms, 10) : undefined,
        total_students: formData.total_students !== '' ? parseInt(formData.total_students, 10) : undefined,
        address: formData.address.trim(),
        head_teacher: formData.headTeacher.trim(),
        founded: formData.founded ? parseInt(formData.founded, 10) : undefined,
      };
      await createSchool(payload);
      await fetchSchools();
      setShowModal(false);
    } catch (err) {
      console.error('Create school error:', err);
      const status = err?.response?.status;
      const backendMsg =
        typeof err?.response?.data?.message === 'string'
          ? err?.response?.data?.message
          : typeof err?.response?.data?.error === 'string'
          ? err?.response?.data?.error
          : typeof err?.message === 'string'
          ? err?.message
          : JSON.stringify(err?.response?.data || err?.message || 'Unknown error');
      const permissionHint =
        status === 401 || status === 403
          ? ' You do not have permission to create schools. Contact an administrator.'
          : '';
      setError(`Failed to create school (${status ?? 'network error'}): ${backendMsg}${permissionHint}`);
    }
  };

  const handleUpdateSchool = async (e) => {
    e.preventDefault();
    if (!selectedSchool) return;
    if (!formData.name.trim()) {
      setError('School name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setError('School code is required.');
      return;
    }
    if (!formData.lga_id) {
      setError('Please select an LGA.');
      return;
    }
    if (!formData.zone_id) {
      setError('Please select a zone.');
      return;
    }
    if (!formData.category) {
      setError('Please select a category.');
      return;
    }
    if (!formData.ownership) {
      setError('Please select an ownership type.');
      return;
    }
    setError('');
    try {
      const payload = {
        state_id: formData.state_id,
        zone_id: formData.zone_id,
        lga_id: formData.lga_id,
        name: formData.name.trim(),
        code: formData.code.trim(),
        category: formData.category,
        ownership: formData.ownership,
        status: formData.status || undefined,
        number_of_classrooms: formData.number_of_classrooms !== '' ? parseInt(formData.number_of_classrooms, 10) : undefined,
        total_students: formData.total_students !== '' ? parseInt(formData.total_students, 10) : undefined,
        address: formData.address.trim(),
        head_teacher: formData.headTeacher.trim(),
        founded: formData.founded ? parseInt(formData.founded, 10) : undefined,
      };
      await updateSchool(selectedSchool.id, payload);
      await fetchSchools();
      setShowModal(false);
    } catch (err) {
      console.error('Update school error:', err);
      const status = err?.response?.status;
      const backendMsg =
        typeof err?.response?.data?.message === 'string'
          ? err?.response?.data?.message
          : typeof err?.response?.data?.error === 'string'
          ? err?.response?.data?.error
          : typeof err?.message === 'string'
          ? err?.message
          : JSON.stringify(err?.response?.data || err?.message || 'Unknown error');
      setError(`Failed to update school (${status ?? 'network error'}): ${backendMsg}`);
    }
  };

  const handleDeleteSchool = async (school) => {
    if (!school?.id) return;
    if (!window.confirm(`Are you sure you want to delete school "${school.name}"?`)) {
      setOpenDropdownId(null);
      return;
    }
    try {
      await deleteSchool(school.id);
      await fetchSchools();
      setShowModal(false);
      setOpenDropdownId(null);
    } catch (err) {
      console.error('Delete school error:', err);
      const status = err?.response?.status;
      const backendMsg = typeof err?.response?.data?.message === 'string'
        ? err?.response?.data?.message
        : typeof err?.response?.data?.error === 'string'
        ? err?.response?.data?.error
        : typeof err?.message === 'string'
        ? err?.message
        : JSON.stringify(err?.response?.data || err?.message || 'Unknown error');
      setError(`Failed to delete school (${status ?? 'network error'}): ${backendMsg}`);
    }
  };

  const handleViewSchool = (school) => {
    if (!school?.id) return;
    setSelectedSchool(school);
    setFormData({
      name: school.name || '',
      code: school.code || '',
      address: school.address || '',
      state_id: school.state_id || '',
      zone_id: school.zone_id || school.zone?.id || '',
      lga_id: school.lga_id || school.lga?.id || '',
      category: school.category || '',
      ownership: school.ownership || '',
      status: school.status || '',
      number_of_classrooms: school?.number_of_classrooms != null ? String(school.number_of_classrooms) : '',
      total_students: school?.total_students != null ? String(school.total_students) : '',
      headTeacher: school.headTeacher || '',
      founded: school.founded != null ? String(school.founded) : '',
    });
    setModalMode('view');
    setShowModal(true);
    setOpenDropdownId(null);
  };

  const getStateName = (stateId) => states.find((s) => s.id === stateId)?.name || '';
  const getLgaName = (lgaId) => lgas.find((l) => l.id === lgaId)?.name || '';
  const getZoneName = (zoneId) => zones.find((z) => z.id === zoneId)?.name || '';

  const inputBaseStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    background: 'white',
  };

  const handleStateChange = (e) => {
    setSelectedStateId(e.target.value);
    setCurrentPage(1);
  };

  const handleNameFilterChange = (e) => {
    setNameFilter(e.target.value);
    setCurrentPage(1);
  };

  const filteredSchools = schools.filter((s) => (!selectedStateId || s.state_id === selectedStateId) && (!nameFilter || (s.name || '').toLowerCase().includes(nameFilter.toLowerCase())));
  const totalPages = Math.max(1, Math.ceil(filteredSchools.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedSchools = filteredSchools.slice((safeCurrentPage - 1) * rowsPerPage, safeCurrentPage * rowsPerPage);

  if (loading && schools.length === 0) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
      <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1>School Management</h1>
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
              fontSize: '0.95rem',
            }}
          >
            + Add New
          </button>
        </div>     

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Select State</label>
          <select
            value={selectedStateId}
            onChange={handleStateChange}
            style={{ ...inputBaseStyle, maxWidth: '400px' }}
          >
            <option value="">All states</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>{state.name}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Search by Name</label>
          <input
            type="text"
            placeholder="Enter school name..."
            value={nameFilter}
            onChange={handleNameFilterChange}
            style={{ ...inputBaseStyle, maxWidth: '400px' }}
          />
        </div>

        <AlertBox type="error" message={error} />

        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-light)', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '15px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Code</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>State</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>LGA</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Zone</th>
                <th style={{ padding: '15px', textAlign: 'left', width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSchools.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--gray)' }}>
                    No schools found. Click "+ Add New" to create one.
                  </td>
                </tr>
              ) : (
                paginatedSchools.map((school) => (
                    <tr key={school.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '15px' }}>{school.name}</td>
                      <td style={{ padding: '15px' }}>{school.code || '—'}</td>
                      <td style={{ padding: '15px' }}>{getStateName(school.state_id)}</td>
                      <td style={{ padding: '15px' }}>{getLgaName(school.lga_id)}</td>
                      <td style={{ padding: '15px' }}>{getZoneName(school.zone_id)}</td>
                      <td style={{ padding: '15px' }}>
                        <div className="dropdown-container" style={{ position: 'relative', display: 'inline-block' }}>
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === school.id ? null : school.id)}
                            style={{ padding: '6px 12px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            •••
                          </button>
                          {openDropdownId === school.id && (
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
                              minWidth: '140px',
                            }}>
                              <button
                                onClick={() => { setOpenDropdownId(null); handleViewSchool(school); }}
                                style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                              >
                                View
                              </button>
                              <button
                                onClick={() => openModal('edit', school)}
                                style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteSchool(school)}
                                style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', color: '#e74c3c' }}
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => { setOpenDropdownId(null); navigate(`/facilities?school_id=${school.id}`); }}
                                style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', color: '#3e7430' }}
                              >
                                 + Add Facility
                              </button>
                              <button
                                onClick={() => { setOpenDropdownId(null); navigate(`/academic-years?school_id=${school.id}`); }}
                                style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', color: '#3e7430' }}
                              >
                                 + Add Sessions
                              </button>
                              <button
                                onClick={() => { setOpenDropdownId(null); navigate(`/levels?school_id=${school.id}`); }}
                                style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', color: '#3e7430' }}
                              >
                                 + Add Classes
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
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', display: 'flex',
              justifyContent: 'center', alignItems: 'center', zIndex: 1000,
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <div style={{ background: 'white', padding: '30px', borderRadius: '12px', maxWidth: '500px', width: '90%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>
                  {modalMode === 'create' ? 'Create School' : modalMode === 'edit' ? 'Edit School' : 'View School'}
                </h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
              </div>

              {modalMode === 'view' ? (
                <div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Name</label>
                    <input type="text" value={formData.name} disabled style={{ ...inputBaseStyle, background: 'var(--bg-light)' }} />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Code</label>
                    <input type="text" value={formData.code} disabled style={{ ...inputBaseStyle, background: 'var(--bg-light)' }} />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Address</label>
                    <textarea value={formData.address} disabled rows="3" style={{ ...inputBaseStyle, background: 'var(--bg-light)', resize: 'vertical', fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>State</label>
                    <input type="text" value={getStateName(formData.state_id)} disabled style={{ ...inputBaseStyle, background: 'var(--bg-light)' }} />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>LGA</label>
                    <input type="text" value={getLgaName(formData.lga_id)} disabled style={{ ...inputBaseStyle, background: 'var(--bg-light)' }} />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Category</label>
                    <input type="text" value={formData.category} disabled style={{ ...inputBaseStyle, background: 'var(--bg-light)' }} />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Ownership</label>
                    <input type="text" value={formData.ownership} disabled style={{ ...inputBaseStyle, background: 'var(--bg-light)' }} />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Status</label>
                    <input type="text" value={formData.status} disabled style={{ ...inputBaseStyle, background: 'var(--bg-light)' }} />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Classrooms</label>
                    <input type="text" value={formData.number_of_classrooms} disabled style={{ ...inputBaseStyle, background: 'var(--bg-light)' }} />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Total Students</label>
                    <input type="text" value={formData.total_students} disabled style={{ ...inputBaseStyle, background: 'var(--bg-light)' }} />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Head Teacher</label>
                    <input type="text" value={formData.headTeacher} disabled style={{ ...inputBaseStyle, background: 'var(--bg-light)' }} />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Founded</label>
                    <input type="text" value={formData.founded} disabled style={{ ...inputBaseStyle, background: 'var(--bg-light)' }} />
                  </div>
                  <button type="button" onClick={() => setShowModal(false)} style={{ width: '100%', padding: '12px', marginTop: '20px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={modalMode === 'create' ? handleCreateSchool : handleUpdateSchool}>
                  <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px', marginRight: '-8px' }}>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>State</label>
                      <select
                        value={formData.state_id}
                      onChange={(e) => {
                        const stateId = e.target.value;
                        setFormData({ ...formData, state_id: stateId, lga_id: '', zone_id: '' });
                        setSelectedStateId(stateId);
                      }}
                      style={inputBaseStyle}
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
                      style={inputBaseStyle}
                      required
                      disabled={!formData.state_id}
                    >
                      <option value="">Select lga</option>
                      {lgas.map((lga) => (
                        <option key={lga.id} value={lga.id}>{lga.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Zone</label>
                    <select
                      value={formData.zone_id}
                      onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
                      style={inputBaseStyle}
                      required
                      disabled={!formData.state_id}
                    >
                      <option value="">Select zone</option>
                      {zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>{zone.name}</option>
                      ))}
                    </select>
                  </div>
                   <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={inputBaseStyle}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Code</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        style={{ ...inputBaseStyle, flex: 1 }}
                        required
                      />
                      <button
                        type="button"
                        onClick={handleGenerateCode}
                        disabled={!formData.lga_id || !formData.zone_id}
                        style={{
                          padding: '0 16px',
                          background: (formData.lga_id && formData.zone_id) ? '#3e7430' : 'var(--bg-light)',
                          color: (formData.lga_id && formData.zone_id) ? 'white' : 'var(--gray)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          cursor: (formData.lga_id && formData.zone_id) ? 'pointer' : 'not-allowed',
                          fontWeight: '600',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Generate Code
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows="3"
                      style={{ ...inputBaseStyle, resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={inputBaseStyle}
                      required
                    >
                      <option value="">Select category</option>
                      <option value="NURSERY">Nursery</option>
                      <option value="PRIMARY">Primary</option>
                      <option value="JUNIOR_SECONDARY">Junior Secondary</option>
                      <option value="SENIOR_SECONDARY">Senior Secondary</option>
                      <option value="COMBINED">Combined</option>
                      <option value="VOCATIONAL">Vocational</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Ownership</label>
                    <select
                      value={formData.ownership}
                      onChange={(e) => setFormData({ ...formData, ownership: e.target.value })}
                      style={inputBaseStyle}
                      required
                    >
                      <option value="">Select ownership</option>
                      <option value="GOVERNMENT">Government</option>
                      <option value="PRIVATE">Private</option>
                      <option value="MISSION">Mission</option>
                      <option value="COMMUNITY">Community</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      style={inputBaseStyle}
                    >
                      <option value="">Select status</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Number of Classrooms</label>
                    <input
                      type="number"
                      value={formData.number_of_classrooms}
                      onChange={(e) => setFormData({ ...formData, number_of_classrooms: e.target.value })}
                      style={inputBaseStyle}
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Total Students</label>
                    <input
                      type="number"
                      value={formData.total_students}
                      onChange={(e) => setFormData({ ...formData, total_students: e.target.value })}
                      style={inputBaseStyle}
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Head Teacher</label>
                    <input
                      type="text"
                      value={formData.headTeacher}
                      onChange={(e) => setFormData({ ...formData, headTeacher: e.target.value })}
                      style={inputBaseStyle}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Founded</label>
                    <input
                      type="number"
                      value={formData.founded}
                      onChange={(e) => setFormData({ ...formData, founded: e.target.value })}
                      style={inputBaseStyle}
                    />
                  </div>

                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                      type="submit"
                      style={{ flex: 1, padding: '12px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                    >
                      {modalMode === 'create' ? 'Create School' : 'Update School'}
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
      </div>
  );
};

export default Schools;
