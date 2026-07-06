import { useState, useEffect, useCallback } from 'react';
import { getStateZones, createStateZone, updateZone, deleteZone, getStates } from '../api/client';
import AlertBox from '../components/common/AlertBox';

const Zones = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState('view');
  const [showModal, setShowModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [states, setStates] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState('');

  const [formData, setFormData] = useState({ name: '', code: '', description: '', state_id: '' });

  const fetchZonesByState = useCallback(async (stateId) => {
    if (!stateId) {
      setZones([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await getStateZones(stateId);
      const list = Array.isArray(res.data) ? res.data : (res.data?.zones ?? res.data?.data ?? []);
      setZones(list);
    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || 'Unknown error';
      setError(`Failed to fetch zones (${status ?? 'network error'}): ${msg}`);
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchZonesByState(selectedStateId);
  }, [selectedStateId, fetchZonesByState]);

  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

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

  const openModal = (mode, zone = null) => {
    setModalMode(mode);
    setSelectedZone(zone);
    setError(''); // clear any stale error
    if (mode === 'create' || mode === 'edit') {
      setFormData({ name: zone?.name || '', code: zone?.code || '', description: zone?.description || '', state_id: zone?.state_id || selectedStateId || '' });
    }
    setShowModal(true);
    setOpenDropdownId(null);
  };

  const handleCreateZone = async (e) => {
    e.preventDefault();
    // Client-side validation — backend requires both name and code
    if (!formData.name.trim()) {
      setError('Zone name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setError('Zone code is required.');
      return;
    }
    const stateId = formData.state_id || selectedStateId;
    if (!stateId) {
      setError('Please select a state before creating a zone.');
      return;
    }
    setError('');
    try {
      const payload = { name: formData.name.trim(), code: formData.code.trim() };
      await createStateZone(stateId, payload);
      await fetchZonesByState(stateId);
      setShowModal(false);
    } catch (err) {
      console.error('Create zone error:', err);
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
          ? ' You do not have permission to create zones. Contact an administrator.'
          : '';
      setError(`Failed to create zone (${status ?? 'network error'}): ${backendMsg}${permissionHint}`);
    }
  };

  const handleUpdateZone = async (e) => {
    e.preventDefault();
    if (!selectedZone) return;
    if (!formData.name.trim()) {
      setError('Zone name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setError('Zone code is required.');
      return;
    }
    setError('');
    try {
      const payload = { name: formData.name.trim(), code: formData.code.trim() };
      await updateZone(selectedZone.id, payload);
      await fetchZonesByState(formData.state_id || selectedStateId);
      setShowModal(false);
    } catch (err) {
      console.error('Update zone error:', err);
      const status = err?.response?.status;
      const backendMsg =
        typeof err?.response?.data?.message === 'string'
          ? err?.response?.data?.message
          : typeof err?.response?.data?.error === 'string'
          ? err?.response?.data?.error
          : typeof err?.message === 'string'
          ? err?.message
          : JSON.stringify(err?.response?.data || err?.message || 'Unknown error');
      setError(`Failed to update zone (${status ?? 'network error'}): ${backendMsg}`);
    }
  };

  const handleDeleteZone = async (zone) => {
    if (!zone?.id) return;
    if (!window.confirm(`Are you sure you want to delete zone "${zone.name}"?`)) {
      setOpenDropdownId(null);
      return;
    }
    try {
      await deleteZone(zone.id);
      await fetchZonesByState(selectedStateId);
      setShowModal(false);
      setOpenDropdownId(null);
    } catch (err) {
      console.error('Delete zone error:', err);
      const status = err?.response?.status;
      const backendMsg = typeof err?.response?.data?.message === 'string'
        ? err?.response?.data?.message
        : typeof err?.response?.data?.error === 'string'
        ? err?.response?.data?.error
        : typeof err?.message === 'string'
        ? err?.message
        : JSON.stringify(err?.response?.data || err?.message || 'Unknown error');
      setError(`Failed to delete zone (${status ?? 'network error'}): ${backendMsg}`);
    }
  };

  const handleViewZone = (zone) => {
    if (!zone?.id) return;
    setSelectedZone(zone);
    setFormData({ name: zone.name || '', code: zone.code || '', description: zone.description || '', state_id: zone.state_id || selectedStateId || '' });
    setModalMode('view');
    setShowModal(true);
    setOpenDropdownId(null);
  };

  const getStateName = (stateId) => {
    const state = states.find(s => s.id === stateId);
    return state?.name || '';
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
        <h1>Zone Management</h1>
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
            <tr style={{ background: 'var(--bg-light)', borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '15px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Code</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Description</th>
              <th style={{ padding: '15px', textAlign: 'left', width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!selectedStateId ? (
              <tr>
                <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--gray)' }}>
                  Please select a state to view its zones.
                </td>
              </tr>
            ) : zones.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--gray)' }}>
                  No zones found. Click "+ Add New" to create one.
                </td>
              </tr>
            ) : (
              zones.map((zone) => (
                <tr key={zone.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '15px' }}>{zone.name}</td>
                  <td style={{ padding: '15px' }}>{zone.code || '—'}</td>
                  <td style={{ padding: '15px' }}>{zone.description || '—'}</td>
                  <td style={{ padding: '15px' }}>
                    <div className="dropdown-container" style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === zone.id ? null : zone.id)}
                        style={{ padding: '6px 12px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        •••
                      </button>
                      {openDropdownId === zone.id && (
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
                            onClick={() => { setOpenDropdownId(null); handleViewZone(zone); }}
                            style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => openModal('edit', zone)}
                            style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteZone(zone)}
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
                {modalMode === 'create' ? 'Create Zone' : modalMode === 'edit' ? 'Edit Zone' : 'View Zone'}
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
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Description</label>
                  <textarea value={formData.description} disabled rows="3" style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-light)', resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
                <button type="button" onClick={() => setShowModal(false)} style={{ width: '100%', padding: '12px', marginTop: '20px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={modalMode === 'create' ? handleCreateZone : handleUpdateZone}>
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
                    {modalMode === 'create' ? 'Create Zone' : 'Update Zone'}
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

export default Zones;
