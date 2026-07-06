import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSessions, createSession, getSession, updateSession, deleteSession, activateSession } from '../api/client';
import AlertBox from '../components/common/AlertBox';

const AcademicYears = () => {
  const { token } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState('view');
  const [showModal, setShowModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({ name: '', start_date: '', end_date: '' });

  const fetchSessions = useCallback(async () => {
    if (!token) {
      setError('You must be logged in to view academic sessions.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await getSessions();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setSessions(list);
    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || 'Unknown error';
      setError(`Failed to fetch academic sessions (${status ?? 'network error'}): ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openModal = (mode, session = null) => {
    setModalMode(mode);
    setSelectedSession(session);
    if (mode === 'create' || mode === 'edit') {
      setFormData({ 
        name: session?.name || '', 
        start_date: session?.start_date ? session.start_date.split('T')[0] : '', 
        end_date: session?.end_date ? session.end_date.split('T')[0] : '' 
      });
    }
    setShowModal(true);
    setOpenDropdownId(null);
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: formData.name, start_date: formData.start_date, end_date: formData.end_date };
      await createSession(payload);
      await fetchSessions();
      setShowModal(false);
    } catch (err) {
      console.error('Create session error:', err);
      const status = err?.response?.status;
      const backendMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Unknown error';
      setError(`Failed to create academic session (${status ?? 'network error'}): ${backendMsg}`);
    }
  };

  const handleUpdateSession = async (e) => {
    e.preventDefault();
    if (!selectedSession) return;
    try {
      const payload = { name: formData.name, start_date: formData.start_date, end_date: formData.end_date };
      await updateSession(selectedSession.id, payload);
      await fetchSessions();
      setShowModal(false);
    } catch (err) {
      console.error('Update session error:', err);
      const status = err?.response?.status;
      const backendMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Unknown error';
      setError(`Failed to update academic session (${status ?? 'network error'}): ${backendMsg}`);
    }
  };

  const handleDeleteSession = async () => {
    if (!selectedSession) return;
    if (!window.confirm(`Are you sure you want to delete session "${selectedSession.name}"?`)) {
      setOpenDropdownId(null);
      return;
    }
    try {
      await deleteSession(selectedSession.id);
      await fetchSessions();
      setShowModal(false);
      setOpenDropdownId(null);
    } catch (err) {
      console.error('Delete session error:', err);
      const status = err?.response?.status;
      const backendMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Unknown error';
      setError(`Failed to delete academic session (${status ?? 'network error'}): ${backendMsg}`);
    }
  };

  const handleActivateSession = async () => {
    if (!selectedSession) return;
    if (!window.confirm(`Are you sure you want to activate session "${selectedSession.name}"?`)) {
      setOpenDropdownId(null);
      return;
    }
    try {
      await activateSession(selectedSession.id);
      await fetchSessions();
      setOpenDropdownId(null);
    } catch (err) {
      console.error('Activate session error:', err);
      const status = err?.response?.status;
      const backendMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Unknown error';
      setError(`Failed to activate academic session (${status ?? 'network error'}): ${backendMsg}`);
    }
  };

  const handleViewSession = async () => {
    if (!selectedSession?.id) return;
    try {
      const res = await getSession(selectedSession.id);
      const data = res.data?.data || res.data;
      setSelectedSession(data);
      setFormData({ 
        name: data.name || '', 
        start_date: data.start_date ? data.start_date.split('T')[0] : '', 
        end_date: data.end_date ? data.end_date.split('T')[0] : '' 
      });
      setModalMode('view');
      setShowModal(true);
      setOpenDropdownId(null);
    } catch (err) {
      console.error('View session error:', err);
      const status = err?.response?.status;
      const backendMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Unknown error';
      setError(`Failed to fetch academic session details (${status ?? 'network error'}): ${backendMsg}`);
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
        <h1>Academic Sessions</h1>
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
              <th style={{ padding: '15px', textAlign: 'left' }}>Start Date</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>End Date</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '15px', textAlign: 'left', width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--gray)' }}>
                  No academic sessions found. Click "+ Add New" to create one.
                </td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr key={session.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '15px' }}>{session.name}</td>
                  <td style={{ padding: '15px' }}>{session.start_date ? new Date(session.start_date).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '15px' }}>{session.end_date ? new Date(session.end_date).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    {session.is_active ? (
                      <span style={{ background: '#d4edda', color: '#155724', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>Active</span>
                    ) : (
                      <span style={{ background: '#e2e3e5', color: '#383d41', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>Inactive</span>
                    )}
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === session.id ? null : session.id); }}
                        style={{ padding: '6px 12px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
                        ref={openDropdownId === session.id ? dropdownRef : null}
                      >
                        •••
                      </button>
                      {openDropdownId === session.id && (
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
                            onClick={() => { setSelectedSession(session); handleViewSession(); }}
                            style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => openModal('edit', session)}
                            style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                          >
                            Edit
                          </button>
                          {!session.is_active && (
                            <button
                              onClick={() => { setSelectedSession(session); handleActivateSession(); }}
                              style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', color: '#27ae60' }}
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => { setSelectedSession(session); handleDeleteSession(); }}
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
                {modalMode === 'create' ? 'Create Session' : modalMode === 'edit' ? 'Edit Session' : 'View Session'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            <form onSubmit={modalMode === 'create' ? handleCreateSession : handleUpdateSession}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Name (e.g., 2023/2024)</label>
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
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  disabled={modalMode === 'view'}
                  style={{
                    width: '100%', padding: '10px', border: '1px solid var(--border)',
                    borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white'
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  disabled={modalMode === 'view'}
                  style={{
                    width: '100%', padding: '10px', border: '1px solid var(--border)',
                    borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white'
                  }}
                  required
                />
              </div>

              {modalMode !== 'view' && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="submit"
                    style={{ flex: 1, padding: '12px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    {modalMode === 'create' ? 'Create Session' : 'Update Session'}
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

export default AcademicYears;