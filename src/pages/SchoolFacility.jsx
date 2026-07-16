import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getSchools, listFacilities, createFacility, updateFacility, deleteFacility, getErrorMessage } from '../api/client';
import AlertBox from '../components/common/AlertBox';

const FACILITY_TYPES = [
  { label: 'Library', value: 'LIBRARY' },
  { label: 'Laboratory', value: 'LABORATORY' },
  { label: 'Sport Field', value: 'SPORT_FIELD' },
  { label: 'ICT Center', value: 'ICT_CENTER' },
  { label: 'Toilet', value: 'TOILET' },
  { label: 'Borehole', value: 'BOREHOLE' },
  { label: 'Generator', value: 'GENERATOR' },
  { label: 'Canteen', value: 'CANTEEN' },
];

const FACILITY_CONDITIONS = [
  { label: 'Good', value: 'GOOD' },
  { label: 'Fair', value: 'FAIR' },
  { label: 'Poor', value: 'POOR' },
  { label: 'Defunct', value: 'DEFUNCT' },
];

const SchoolFacility = () => {
  const [searchParams] = useSearchParams();
  const initialSchoolId = searchParams.get('school_id') || '';

  const [schools, setSchools] = useState([]);
  const [selectedSchoolId] = useState(initialSchoolId);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState('view');
  const [showModal, setShowModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({ type: '', name: '', quantity: '', condition: '', notes: '' });

  const selectedSchoolName = schools.find((s) => s.id === selectedSchoolId)?.name || '';

  // Load schools for display.
  useEffect(() => {
    const loadSchools = async () => {
      try {
        const res = await getSchools();
        const list = Array.isArray(res.data) ? res.data : (res.data?.schools ?? res.data?.data ?? []);
        setSchools(list);
      } catch (err) {
        console.error('Schools fetch error:', err);
      }
    };
    loadSchools();
  }, []);

  const fetchFacilities = useCallback(async () => {
    if (!selectedSchoolId) {
      setFacilities([]);
      setLoading(false);
      return;
    }
    let active = true;
    try {
      setLoading(true);
      setError('');
      const res = await listFacilities(selectedSchoolId);
      const list = Array.isArray(res.data) ? res.data : (res.data?.facilities ?? res.data?.data ?? []);
      if (active) setFacilities(list);
    } catch (err) {
      if (!active) return;
      const status = err?.response?.status;
      setError(`Failed to fetch facilities (${status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    } finally {
      if (active) setLoading(false);
    }
    return () => { active = false; };
  }, [selectedSchoolId]);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openModal = (mode, facility = null) => {
    setModalMode(mode);
    setSelectedFacility(facility);
    if (mode === 'create' || mode === 'edit') {
      setFormData({
        type: facility?.type || '',
        name: facility?.name || '',
        quantity: facility?.quantity ?? '',
        condition: facility?.condition || '',
        notes: facility?.notes || '',
      });
    }
    setShowModal(true);
    setOpenDropdownId(null);
  };

  const handleCreateFacility = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        type: formData.type,
        name: formData.name,
        quantity: formData.quantity !== '' ? Number(formData.quantity) : 0,
        condition: formData.condition,
        notes: formData.notes,
      };
      await createFacility(selectedSchoolId, payload);
      await fetchFacilities();
      setShowModal(false);
    } catch (err) {
      console.error('Create facility error:', err);
      const status = err?.response?.status;
      setError(`Failed to create facility (${status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    }
  };

  const handleUpdateFacility = async (e) => {
    e.preventDefault();
    if (!selectedFacility) return;
    try {
      const payload = {
        type: formData.type,
        name: formData.name,
        quantity: formData.quantity !== '' ? Number(formData.quantity) : 0,
        condition: formData.condition,
        notes: formData.notes,
      };
      await updateFacility(selectedSchoolId, selectedFacility.id, payload);
      await fetchFacilities();
      setShowModal(false);
    } catch (err) {
      console.error('Update facility error:', err);
      const status = err?.response?.status;
      setError(`Failed to update facility (${status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    }
  };

  const handleDeleteFacility = async () => {
    if (!selectedFacility) return;
    if (!window.confirm(`Are you sure you want to delete facility "${selectedFacility.name}"?`)) {
      setOpenDropdownId(null);
      return;
    }
    try {
      await deleteFacility(selectedSchoolId, selectedFacility.id);
      await fetchFacilities();
      setShowModal(false);
      setOpenDropdownId(null);
    } catch (err) {
      console.error('Delete facility error:', err);
      const status = err?.response?.status;
      setError(`Failed to delete facility (${status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    }
  };

  if (loading && !selectedSchoolId) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <h1>School Facilities {selectedSchoolName ? `- ${selectedSchoolName}` : ''}</h1>
        <button
          onClick={() => openModal('create')}
          disabled={!selectedSchoolId}
          style={{
            padding: '10px 24px',
            background: '#3e7430',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            cursor: selectedSchoolId ? 'pointer' : 'not-allowed',
            fontWeight: '600',
            fontSize: '0.95rem',
            opacity: selectedSchoolId ? 1 : 0.6,
          }}
        >
          + Add Facility
        </button>
      </div>

      <AlertBox type="error" message={error} />

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-light)', borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '15px', textAlign: 'left' }}>Type</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Quantity</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Condition</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Notes</th>
              <th style={{ padding: '15px', textAlign: 'left', width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--gray)' }}>Loading...</td>
              </tr>
            ) : facilities.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--gray)' }}>
                  {selectedSchoolId ? 'No facilities found for this school.' : 'Select a school to view its facilities.'}
                </td>
              </tr>
            ) : (
              facilities.map((facility) => (
                <tr key={facility.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '15px' }}>{facility.type || '—'}</td>
                  <td style={{ padding: '15px' }}>{facility.name}</td>
                  <td style={{ padding: '15px' }}>{facility.quantity ?? '—'}</td>
                  <td style={{ padding: '15px' }}>{facility.condition || '—'}</td>
                  <td style={{ padding: '15px' }}>{facility.notes || '—'}</td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === facility.id ? null : facility.id)}
                        style={{ padding: '6px 12px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        •••
                      </button>
                      {openDropdownId === facility.id && (
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
                            onClick={() => { setSelectedFacility(facility); openModal('edit', facility); }}
                            style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { setSelectedFacility(facility); handleDeleteFacility(); }}
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

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', maxWidth: '500px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>
                {modalMode === 'create' ? 'Add Facility' : modalMode === 'edit' ? 'Edit Facility' : 'View Facility'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            <form onSubmit={modalMode === 'create' ? handleCreateFacility : handleUpdateFacility}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  disabled={modalMode === 'view'}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white' }}
                >
                  <option value="">Select type</option>
                  {FACILITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={modalMode === 'view'}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Quantity</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  disabled={modalMode === 'view'}
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Condition</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  disabled={modalMode === 'view'}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white' }}
                >
                  <option value="">Select condition</option>
                  {FACILITY_CONDITIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={modalMode === 'view'}
                  rows={3}
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              {modalMode !== 'view' && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="submit"
                    style={{ flex: 1, padding: '12px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    {modalMode === 'create' ? 'Add Facility' : 'Update Facility'}
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
                  style={{ width: '100%', padding: '12px', marginTop: '20px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Close
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolFacility;
