import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTerms, createTerm, getTerm, updateTerm, deleteTerm, getSessions, getErrorMessage, createSessionTerm, getSessionTerms, activateSessionTerm } from '../api/client';
import AlertBox from '../components/common/AlertBox';

// Backend time.Time fields expect RFC3339; <input type="date"> gives YYYY-MM-DD.
const toISODate = (dateStr) => (dateStr ? new Date(`${dateStr}T00:00:00Z`).toISOString() : '');

const emptyForm = { session_id: '', term_number: 1, name: '', start_date: '', end_date: '' };

const Terms = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const sessionParam = searchParams.get('session_id');
  const [terms, setTerms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionMap, setSessionMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState('view');
  const [showModal, setShowModal] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState(emptyForm);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await getSessions(1, 200, user?.school_id || null);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setSessions(list);
      const map = {};
      list.forEach((s) => { map[s.id] = s.name; });
      setSessionMap(map);
    } catch (err) {
      console.error(err);
    }
  }, [user?.school_id]);

  const fetchTerms = useCallback(async (sessionId) => {
    try {
      setError('');
      let res;
      if (sessionId) {
        res = await getSessionTerms(sessionId);
      } else {
        res = await getTerms();
      }
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setTerms(list);
    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      setError(`Failed to fetch terms (${status ?? 'network error'}): ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchTerms(sessionParam);
  }, [fetchSessions, fetchTerms, sessionParam]);

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
      setFormData({
        session_id: term?.session_id || sessionParam || '',
        term_number: term?.term_number ?? 1,
        name: term?.name || '',
        start_date: term?.start_date ? term.start_date.split('T')[0] : '',
        end_date: term?.end_date ? term.end_date.split('T')[0] : '',
      });
    }
    setShowModal(true);
    setOpenDropdownId(null);
  };

  const handleCreateTerm = async (e) => {
    e.preventDefault();
    if (!formData.session_id) {
      setError('Please select a session for the term.');
      return;
    }
    try {
      const payload = {
        term_number: Number(formData.term_number),
        name: formData.name,
        start_date: toISODate(formData.start_date),
        end_date: toISODate(formData.end_date),
      };
      await createSessionTerm(formData.session_id, payload);
      await fetchTerms(sessionParam);
      setShowModal(false);
    } catch (err) {
      console.error('Create term error:', err);
      console.error('Response data:', err?.response?.data);
      const status = err?.response?.status;
      setError(`Failed to create term (${status ?? 'network error'}): ${getErrorMessage(err)}`);
    }
  };

  const handleUpdateTerm = async (e) => {
    e.preventDefault();
    if (!selectedTerm) return;
    try {
      const payload = {
        name: formData.name,
        start_date: toISODate(formData.start_date),
        end_date: toISODate(formData.end_date),
      };
      await updateTerm(selectedTerm.id, payload);
      await fetchTerms(sessionParam);
      setShowModal(false);
    } catch (err) {
      console.error('Update term error:', err);
      const status = err?.response?.status;
      setError(`Failed to update term (${status ?? 'network error'}): ${getErrorMessage(err)}`);
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
      await fetchTerms(sessionParam);
      setShowModal(false);
      setOpenDropdownId(null);
    } catch (err) {
      console.error('Delete term error:', err);
      const status = err?.response?.status;
      setError(`Failed to delete term (${status ?? 'network error'}): ${getErrorMessage(err)}`);
    }
  };

  const handleActivateTerm = async (term) => {
    if (!term) return;
    if (!window.confirm(`Are you sure you want to activate term "${term.name}"?`)) {
      setOpenDropdownId(null);
      return;
    }
    try {
      await activateSessionTerm(term.session_id, term.id);
      await fetchTerms(sessionParam);
      setOpenDropdownId(null);
    } catch (err) {
      console.error('Activate term error:', err);
      const status = err?.response?.status;
      setError(`Failed to activate term (${status ?? 'network error'}): ${getErrorMessage(err)}`);
    }
  };

  const handleViewTerm = async () => {
    if (!selectedTerm?.id) return;
    try {
      const res = await getTerm(selectedTerm.id);
      const termData = res.data?.data || res.data;
      setSelectedTerm(termData);
      setFormData({
        session_id: termData.session_id || '',
        term_number: termData.term_number ?? 1,
        name: termData.name || '',
        start_date: termData.start_date ? termData.start_date.split('T')[0] : '',
        end_date: termData.end_date ? termData.end_date.split('T')[0] : '',
      });
      setModalMode('view');
      setShowModal(true);
      setOpenDropdownId(null);
    } catch (err) {
      console.error('View term error:', err);
      const status = err?.response?.status;
      setError(`Failed to fetch term details (${status ?? 'network error'}): ${getErrorMessage(err)}`);
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
              <th style={{ padding: '15px', textAlign: 'left' }}>Session</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>#</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Start Date</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>End Date</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '15px', textAlign: 'left', width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
              {terms.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--gray)' }}>
                    No terms found. Click "+ Add New" to create one.
                  </td>
                </tr>
              ) : (
                terms.map((term) => (
                <tr key={term.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '15px' }}>{sessionMap[term.session_id] || term.session_id || '—'}</td>
                  <td style={{ padding: '15px' }}>{term.term_number}</td>
                  <td style={{ padding: '15px' }}>{term.name}</td>
                  <td style={{ padding: '15px' }}>{term.start_date ? new Date(term.start_date).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '15px' }}>{term.end_date ? new Date(term.end_date).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    {term.is_active ? (
                      <span style={{ background: '#d4edda', color: '#155724', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>Active</span>
                    ) : (
                      <span style={{ background: '#e2e3e5', color: '#383d41', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>Inactive</span>
                    )}
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === term.id ? null : term.id); }}
                        style={{ padding: '6px 12px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
                        ref={openDropdownId === term.id ? dropdownRef : null}
                      >
                        •••
                      </button>
                      {openDropdownId === term.id && (
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
                          {!term.is_active && (
                            <button
                              onClick={() => handleActivateTerm(term)}
                              style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', color: '#27ae60' }}
                            >
                              Activate
                            </button>
                          )}
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
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Term Number</label>
                <select
                  value={formData.term_number}
                  onChange={(e) => setFormData({ ...formData, term_number: Number(e.target.value) })}
                  disabled={modalMode === 'view' || modalMode === 'edit'}
                  required
                  style={{
                    width: '100%', padding: '10px', border: '1px solid var(--border)',
                    borderRadius: '8px', background: modalMode === 'view' ? 'var(--bg-light)' : 'white'
                  }}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </div>
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
