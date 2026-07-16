import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSublevels, createSublevel, getSublevel, updateSublevel, deleteSublevel, getSchoolSubLevels, getLevelSubLevels, getErrorMessage } from '../api/client';
import AlertBox from '../components/common/AlertBox';

const Sublevels = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const schoolId = searchParams.get('school_id');
  const levelId = searchParams.get('level_id');
  const [sublevels, setSublevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState('view');
  const [showModal, setShowModal] = useState(false);
  const [selectedSublevel, setSelectedSublevel] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({ name: '', code: '', capacity: '' });

  const fetchSublevels = useCallback(async () => {
    if (!token) {
      setError('You must be logged in to view sublevels.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      let res;
      if (schoolId) {
        res = await getSchoolSubLevels(schoolId);
      } else if (levelId) {
        res = await getLevelSubLevels(levelId);
      } else {
        res = await getSublevels();
      }
      const list = Array.isArray(res.data) ? res.data : (res.data?.sublevels ?? res.data?.data ?? []);
      setSublevels(list);
    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || 'Unknown error';
      setError(`Failed to fetch sublevels (${status ?? 'network error'}): ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [token, schoolId, levelId]);

  useEffect(() => {
    fetchSublevels();
  }, [fetchSublevels]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openModal = (mode, sublevel = null) => {
    setModalMode(mode);
    setSelectedSublevel(sublevel);
    if (mode === 'create' || mode === 'edit') {
      setFormData({ name: sublevel?.name || '', code: sublevel?.code || '', capacity: sublevel?.capacity || '' });
    }
    setShowModal(true);
    setOpenDropdownId(null);
  };

  const handleCreateSublevel = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        ...(formData.capacity !== '' ? { capacity: Number(formData.capacity) } : {}),
      };
      await createSublevel(schoolId, levelId, payload);
      await fetchSublevels();
      setShowModal(false);
    } catch (err) {
      console.error('Create sublevel error:', err);
      const status = err?.response?.status;
      setError(`Failed to create sublevel (${status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    }
  };

  const handleUpdateSublevel = async (e) => {
    e.preventDefault();
    if (!selectedSublevel) return;
    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        ...(formData.capacity !== '' ? { capacity: Number(formData.capacity) } : {}),
      };
      await updateSublevel(selectedSublevel.id, payload);
      await fetchSublevels();
      setShowModal(false);
    } catch (err) {
      console.error('Update sublevel error:', err);
      const status = err?.response?.status;
      setError(`Failed to update sublevel (${status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    }
  };

  const handleDeleteSublevel = async () => {
    if (!selectedSublevel) return;
    if (!window.confirm(`Are you sure you want to delete sublevel "${selectedSublevel.name}"?`)) {
      setOpenDropdownId(null);
      return;
    }
    try {
      await deleteSublevel(selectedSublevel.id);
      await fetchSublevels();
      setShowModal(false);
      setOpenDropdownId(null);
    } catch (err) {
      console.error('Delete sublevel error:', err);
      const status = err?.response?.status;
      setError(`Failed to delete sublevel (${status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    }
  };

  const handleViewSublevel = async () => {
    if (!selectedSublevel?.id) return;
    try {
      const res = await getSublevel(selectedSublevel.id);
      const sublevelData = res.data?.data || res.data;
      setSelectedSublevel(sublevelData);
      setFormData({ name: sublevelData.name || '', code: sublevelData.code || '', capacity: sublevelData.capacity || '' });
      setModalMode('view');
      setShowModal(true);
      setOpenDropdownId(null);
    } catch (err) {
      console.error('View sublevel error:', err);
      const status = err?.response?.status;
      setError(`Failed to fetch sublevel details (${status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    }
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1>{levelId ? 'Sublevels' : 'Sublevel Management'}</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {schoolId && levelId && (
            <button
              onClick={() => navigate(`/levels?school_id=${schoolId}`)}
              style={{
                padding: '10px 24px',
                background: 'var(--bg-light)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '50px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem'
              }}
            >
              ← Back to Levels
            </button>
          )}
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
      </div>

      <AlertBox type="error" message={error} />

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-light)', borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '15px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Code</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Capacity</th>
              <th style={{ padding: '15px', textAlign: 'left', width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sublevels.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: 'var(--gray)' }}>
                  {schoolId && levelId ? 'No sublevels found for this level.' : 'No sublevels found.'}
                </td>
              </tr>
            ) : (
              sublevels.map((sublevel) => (
                <tr key={sublevel.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '15px' }}>{sublevel.name}</td>
                  <td style={{ padding: '15px' }}>{sublevel.code || '—'}</td>
                  <td style={{ padding: '15px' }}>{sublevel.capacity || '—'}</td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === sublevel.id ? null : sublevel.id)}
                        style={{ padding: '6px 12px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        •••
                      </button>
                      {openDropdownId === sublevel.id && (
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
                            onClick={() => { setSelectedSublevel(sublevel); handleViewSublevel(); }}
                            style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => openModal('edit', sublevel)}
                            style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { setSelectedSublevel(sublevel); handleDeleteSublevel(); }}
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
                {modalMode === 'create' ? 'Create Sublevel' : modalMode === 'edit' ? 'Edit Sublevel' : 'View Sublevel'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            <form onSubmit={modalMode === 'create' ? handleCreateSublevel : handleUpdateSublevel}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={modalMode === 'view'}
                  style={{
                    width: '100%', padding: '10px', border: '1px solid var(--border)',
                    borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white'
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
                    borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white'
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Capacity</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  disabled={modalMode === 'view'}
                  style={{
                    width: '100%', padding: '10px', border: '1px solid var(--border)',
                    borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white',
                    resize: 'vertical', fontFamily: 'inherit'
                  }}
                />
              </div>

              {modalMode !== 'view' && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="submit"
                    style={{ flex: 1, padding: '12px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    {modalMode === 'create' ? 'Create Sublevel' : 'Update Sublevel'}
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

export default Sublevels;