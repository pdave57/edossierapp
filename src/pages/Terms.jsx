import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTerms, createTerm, getTerm, updateTerm, deleteTerm } from '../api/client';
import AlertBox from '../components/common/AlertBox';

const Terms = () => {
  const { token } = useAuth();
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState('view');
  const [showModal, setShowModal] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({ name: '', code: '', description: '' });

  const fetchTerms = useCallback(async () => {
    if (!token) {
      setError('You must be logged in to view terms.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await getTerms();
      const list = Array.isArray(res.data) ? res.data : (res.data?.terms ?? res.data?.data ?? []);
      setTerms(list);
    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || 'Unknown error';
      setError(`Failed to fetch terms (${status ?? 'network error'}): ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openModal = (mode, term = null) => {
    setModalMode(mode);
    setSelectedTerm(term);
    if (mode === 'create' || mode === 'edit') {
      setFormData({ name: term?.name || '', code: term?.code || '', description: term?.description || '' });
    }
    setShowModal(true);
    setOpenDropdownId(null);
  };

  const handleCreateTerm = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: formData.name, code: formData.code, description: formData.description };
      await createTerm(payload);
      await fetchTerms();
      setShowModal(false);
    } catch (err) {
      console.error('Create term error:', err);
      const status = err?.response?.status;
      const backendMsg = typeof err?.response?.data?.message === 'string'
        ? err?.response?.data?.message
        : typeof err?.response?.data?.error === 'string'
        ? err?.response?.data?.error
        : typeof err?.message === 'string'
        ? err?.message
        : JSON.stringify(err?.response?.data || err?.message || 'Unknown error');
      setError(`Failed to create term (${status ?? 'network error'}): ${backendMsg}`);
    }
  };

  const handleUpdateTerm = async (e) => {
    e.preventDefault();
    if (!selectedTerm) return;
    try {
      const payload = { name: formData.name, code: formData.code, description: formData.description };
      await updateTerm(selectedTerm.id, payload);
      await fetchTerms();
      setShowModal(false);
    } catch (err) {
      console.error('Update term error:', err);
      const status = err?.response?.status;
      const backendMsg = typeof err?.response?.data?.message === 'string'
        ? err?.response?.data?.message
        : typeof err?.response?.data?.error === 'string'
        ? err?.response?.data?.error
        : typeof err?.message === 'string'
        ? err?.message
        : JSON.stringify(err?.response?.data || err?.message || 'Unknown error');
      setError(`Failed to update term (${status ?? 'network error'}): ${backendMsg}`);
    }
  };

  const handleDeleteTerm = async () => {
    if (!selectedTerm) return;
    if (!window.confirm(`Are you sure you want to delete term "${selectedTerm.name}"?`)) {
      setOpenDropdownId(null);
      return;
    }
    try {
      await deleteTerm(selectedTerm.id);
      await fetchTerms();
      setShowModal(false);
      setOpenDropdownId(null);
    } catch (err) {
      console.error('Delete term error:', err);
      const status = err?.response?.status;
      const backendMsg = typeof err?.response?.data?.message === 'string'
        ? err?.response?.data?.message
        : typeof err?.response?.data?.error === 'string'
        ? err?.response?.data?.error
        : typeof err?.message === 'string'
        ? err?.message
        : JSON.stringify(err?.response?.data || err?.message || 'Unknown error');
      setError(`Failed to delete term (${status ?? 'network error'}): ${backendMsg}`);
    }
  };

  const handleViewTerm = async () => {
    if (!selectedTerm?.id) return;
    try {
      const res = await getTerm(selectedTerm.id);
      const termData = res.data?.data || res.data;
      setSelectedTerm(termData);
      setFormData({ name: termData.name || '', code: termData.code || '', description: termData.description || '' });
      setModalMode('view');
      setShowModal(true);
      setOpenDropdownId(null);
    } catch (err) {
      console.error('View term error:', err);
      const status = err?.response?.status;
      const backendMsg = typeof err?.response?.data?.message === 'string'
        ? err?.response?.data?.message
        : typeof err?.response?.data?.error === 'string'
        ? err?.response?.data?.error
        : typeof err?.message === 'string'
        ? err?.message
        : JSON.stringify(err?.response?.data || err?.message || 'Unknown error');
      setError(`Failed to fetch term details (${status ?? 'network error'}): ${backendMsg}`);
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
        <h1>Term Management</h1>
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
              <th style={{ padding: '15px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Code</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Description</th>
              <th style={{ padding: '15px', textAlign: 'left', width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {terms.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: 'var(--gray)' }}>
                  No terms found. Click "+ Add New" to create one.
                </td>
              </tr>
            ) : (
              terms.map((term) => (
                <tr key={term.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '15px' }}>{term.name}</td>
                  <td style={{ padding: '15px' }}>{term.code || '—'}</td>
                  <td style={{ padding: '15px' }}>{term.description || '—'}</td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === term.id ? null : term.id)}
                        style={{ padding: '6px 12px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        •••
                      </button>
                      {openDropdownId === term.id && (
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
                            onClick={() => { setSelectedTerm(term); handleViewTerm(); }}
                            style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => openModal('edit', term)}
                            style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { setSelectedTerm(term); handleDeleteTerm(); }}
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
                {modalMode === 'create' ? 'Create Term' : modalMode === 'edit' ? 'Edit Term' : 'View Term'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            <form onSubmit={modalMode === 'create' ? handleCreateTerm : handleUpdateTerm}>
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
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={modalMode === 'view'}
                  rows="3"
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
                    {modalMode === 'create' ? 'Create Term' : 'Update Term'}
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

export default Terms;