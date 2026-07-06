import { useState, useEffect, useCallback } from 'react';
import { createLga, getStatelgas, updateLga, deleteLga, getStates, getStateZones } from '../api/client';
import AlertBox from '../components/common/AlertBox';

const Lgas = () => {
  const [lgas, setLgas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState('view');
  const [showModal, setShowModal] = useState(false);
  const [selectedLga, setSelectedLga] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [states, setStates] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState('');
  const [zones, setZones] = useState([]);

  const [formData, setFormData] = useState({ name: '', code: '', description: '', state_id: '', zone_id: '' });

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
    }
  }, []);

  const fetchStates = useCallback(async () => {
    try {
      const res = await getStates();
      const list = Array.isArray(res.data) ? res.data : (res.data?.states ?? res.data?.data ?? []);
      setStates(list);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchLgasByState = useCallback(async (stateId) => {
    if (!stateId) {
      setLgas([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await getStatelgas(stateId);
      const list = Array.isArray(res.data) ? res.data : (res.data?.lgas ?? res.data?.data ?? []);
      setLgas(list);
    } catch (err) {
      console.error('LGA fetch error:', err);
      console.error('Error response:', err?.response?.data);
      const status = err?.response?.status;
      const responseData = err?.response?.data;
      let msg;
      if (typeof responseData?.message === 'string') {
        msg = responseData.message;
      } else if (typeof responseData?.error === 'string') {
        msg = responseData.error;
      } else if (typeof err?.message === 'string') {
        msg = err.message;
      } else {
        msg = JSON.stringify(responseData || err?.message || 'Unknown error');
      }
      setError(`Failed to fetch lgas (${status ?? 'network error'}): ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  useEffect(() => {
    fetchLgasByState(selectedStateId);
  }, [selectedStateId, fetchLgasByState]);

  useEffect(() => {
    fetchZonesByState(formData.state_id || selectedStateId);
  }, [formData.state_id, selectedStateId, fetchZonesByState]);

  // Close dropdown on outside click using event delegation
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openModal = (mode, lga = null) => {
    setModalMode(mode);
    setSelectedLga(lga);
    setError(''); // clear stale errors
    if (mode === 'create' || mode === 'edit') {
      setFormData({ name: lga?.name || '', code: lga?.code || '', description: lga?.description || '', state_id: lga?.state_id || selectedStateId || '', zone_id: lga?.zone_id || lga?.zone?.id || '' });
    }
    setShowModal(true);
    setOpenDropdownId(null);
  };

  const handleCreateLga = async (e) => {
    e.preventDefault();
    // Client-side validation — backend requires name, code, and zone_id
    if (!formData.name.trim()) {
      setError('LGA name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setError('LGA code is required.');
      return;
    }
    const stateId = formData.state_id || selectedStateId;
    if (!stateId) {
      setError('Please select a state before creating an LGA.');
      return;
    }
    if (!formData.zone_id) {
      setError('Please select a zone for this LGA.');
      return;
    }
    setError('');
    try {
      const payload = { name: formData.name.trim(), code: formData.code.trim(), zone_id: formData.zone_id };
      await createLga(stateId, payload);
      await fetchLgasByState(stateId);
      setShowModal(false);
    } catch (err) {
      console.error('Create lga error:', err);
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
          ? ' You do not have permission to create LGAs. Contact an administrator.'
          : '';
      setError(`Failed to create lga (${status ?? 'network error'}): ${backendMsg}${permissionHint}`);
    }
  };

  const handleUpdateLga = async (e) => {
    e.preventDefault();
    if (!selectedLga) return;
    if (!formData.name.trim()) {
      setError('LGA name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setError('LGA code is required.');
      return;
    }
    if (!formData.zone_id) {
      setError('Please select a zone for this LGA.');
      return;
    }
    setError('');
    try {
      const payload = { name: formData.name.trim(), code: formData.code.trim(), zone_id: formData.zone_id };
      await updateLga(selectedLga.id, payload);
      await fetchLgasByState(formData.state_id || selectedStateId);
      setShowModal(false);
    } catch (err) {
      console.error('Update lga error:', err);
      const status = err?.response?.status;
      const backendMsg =
        typeof err?.response?.data?.message === 'string'
          ? err?.response?.data?.message
          : typeof err?.response?.data?.error === 'string'
          ? err?.response?.data?.error
          : typeof err?.message === 'string'
          ? err?.message
          : JSON.stringify(err?.response?.data || err?.message || 'Unknown error');
      setError(`Failed to update lga (${status ?? 'network error'}): ${backendMsg}`);
    }
  };

  const handleDeleteLga = async (lga) => {
    if (!lga?.id) return;
    if (!window.confirm(`Are you sure you want to delete lga "${lga.name}"?`)) {
      setOpenDropdownId(null);
      return;
    }
    try {
      await deleteLga(lga.id);
      await fetchLgasByState(selectedStateId);
      setShowModal(false);
      setOpenDropdownId(null);
    } catch (err) {
      console.error('Delete lga error:', err);
      const status = err?.response?.status;
      const backendMsg = typeof err?.response?.data?.message === 'string'
        ? err?.response?.data?.message
        : typeof err?.response?.data?.error === 'string'
        ? err?.response?.data?.error
        : typeof err?.message === 'string'
        ? err?.message
        : JSON.stringify(err?.response?.data || err?.message || 'Unknown error');
      setError(`Failed to delete lga (${status ?? 'network error'}): ${backendMsg}`);
    }
  };

  const handleViewLga = (lga) => {
    if (!lga?.id) return;
    setSelectedLga(lga);
    setFormData({ name: lga.name || '', code: lga.code || '', description: lga.description || '', state_id: lga.state_id || selectedStateId || '', zone_id: lga.zone_id || lga.zone?.id || '' });
    setModalMode('view');
    setShowModal(true);
    setOpenDropdownId(null);
  };

  const getStateName = (stateId) => {
    const state = states.find(s => s.id === stateId);
    return state?.name || '';
  };

  const getZoneName = (zoneId) => {
    const zone = zones.find(z => z.id === zoneId);
    return zone?.name || '';
  };

  if (loading && !selectedStateId) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>LGA Management</h1>
        <button
          onClick={() => openModal('create')}
          disabled={!selectedStateId}
          style={{
            padding: '10px 24px',
            background: selectedStateId ? '#3e7430' : 'var(--bg-light)',
            color: selectedStateId ? 'white' : 'var(--gray)',
            border: 'none',
            borderRadius: '50px',
            cursor: selectedStateId ? 'pointer' : 'not-allowed',
            fontWeight: '600',
            fontSize: '0.95rem'
          }}
        >
          + Add New
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Select State</label>
        <select
          value={selectedStateId}
          onChange={(e) => setSelectedStateId(e.target.value)}
          style={{
            width: '100%', maxWidth: '400px', padding: '10px', border: '1px solid var(--border)',
            borderRadius: '8px', background: 'white'
          }}
        >
          <option value="">Select state</option>
          {states.map((state) => (
            <option key={state.id} value={state.id}>{state.name}</option>
          ))}
        </select>
      </div>

      <AlertBox type="error" message={error} />

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '15px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Code</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Zone</th>
              <th style={{ padding: '15px', textAlign: 'left', width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!selectedStateId ? (
              <tr>
                <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--gray)' }}>
                  Please select a state to view its LGAs.
                </td>
              </tr>
            ) : lgas.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--gray)' }}>
                  No lgas found. Click "+ Add New" to create one.
                </td>
              </tr>
            ) : (
              lgas.map((lga) => (
                <tr key={lga.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '15px' }}>{lga.name}</td>
                  <td style={{ padding: '15px' }}>{lga.code || '—'}</td>
                  <td style={{ padding: '15px' }}>{lga.zone_name || '—'}</td>
                  <td style={{ padding: '15px' }}>
                    <div className="dropdown-container" style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === lga.id ? null : lga.id)}
                        style={{ padding: '6px 12px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        •••
                      </button>
                      {openDropdownId === lga.id && (
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
                            onClick={() => { setOpenDropdownId(null); handleViewLga(lga); }}
                            style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => openModal('edit', lga)}
                            style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteLga(lga)}
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
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', maxWidth: '500px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>
                {modalMode === 'create' ? 'Create LGA' : modalMode === 'edit' ? 'Edit LGA' : 'View LGA'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>x</button>
            </div>

            {modalMode === 'view' ? (
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Name</label>
                  <input type="text" value={formData.name} disabled style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Code</label>
                  <input type="text" value={formData.code} disabled style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>State</label>
                  <input type="text" value={getStateName(formData.state_id)} disabled style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Zone</label>
                  <input type="text" value={getZoneName(formData.zone_id)} disabled style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Description</label>
                  <textarea value={formData.description} disabled rows="3" style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)', resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
                <button type="button" onClick={() => setShowModal(false)} style={{ width: '100%', padding: '12px', marginTop: '20px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={modalMode === 'create' ? handleCreateLga : handleUpdateLga}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={modalMode === 'view'}
                    style={{
                      width: '100%', padding: '10px', border: '1px solid var(--border)',
                      borderRadius: '8px', background: 'white'
                    }}
                    required
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    disabled={modalMode === 'view'}
                    style={{
                      width: '100%', padding: '10px', border: '1px solid var(--border)',
                      borderRadius: '8px', background: 'white'
                    }}
                    required
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>State</label>
                  <select
                    value={formData.state_id}
                    onChange={(e) => setFormData({ ...formData, state_id: e.target.value })}
                    disabled={modalMode === 'view'}
                    required
                    style={{
                      width: '100%', padding: '10px', border: '1px solid var(--border)',
                      borderRadius: '8px', background: 'white'
                    }}
                  >
                    <option value="">Select state</option>
                    {states.map((state) => (
                      <option key={state.id} value={state.id}>{state.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Zone</label>
                  <select
                    value={formData.zone_id}
                    onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
                    disabled={modalMode === 'view'}
                    required
                    style={{
                      width: '100%', padding: '10px', border: '1px solid var(--border)',
                      borderRadius: '8px', background: 'white'
                    }}
                  >
                    <option value="">Select zone</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>{zone.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={modalMode === 'view'}
                    rows="3"
                    style={{
                      width: '100%', padding: '10px', border: '1px solid var(--border)',
                      borderRadius: '8px', background: 'white',
                      resize: 'vertical', fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="submit"
                    style={{ flex: 1, padding: '12px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    {modalMode === 'create' ? 'Create LGA' : 'Update LGA'}
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

export default Lgas;
