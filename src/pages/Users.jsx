import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUsers, deleteUser, updateUser, assignUserRole } from '../api/client';
import AlertBox from '../components/common/AlertBox';

const Users = () => {
  const { user: _user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view');

  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    school: '',
    gradeLevel: '',
  });

  const [roleForm, setRoleForm] = useState({
    roleId: '',
  });

  const fetchUsers = async () => {
    if (!token) {
      setError('You must be logged in to view users.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await getUsers();
      // Backend may return the array directly or wrapped in a `data` / `users` field
      const list = Array.isArray(res.data) ? res.data : (res.data?.users ?? res.data?.data ?? []);
      setUsers(list);
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || 'Unknown error';
      setError(`Failed to fetch users (${status ?? 'network error'}): ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      school: user.school || '',
      gradeLevel: user.gradeLevel || '',
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleAssignRole = (user) => {
    setSelectedUser(user);
    setRoleForm({ roleId: '' });
    setModalMode('assignRole');
    setShowModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        await fetchUsers();
      } catch (_err) {
        setError('Failed to delete user');
      }
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await updateUser(selectedUser.id, editForm);
      await fetchUsers();
      setShowModal(false);
    } catch (_err) {
      setError('Failed to update user');
    }
  };

  const handleAssignRoleSubmit = async (e) => {
    e.preventDefault();
    try {
      await assignUserRole(selectedUser.id, { roleId: roleForm.roleId });
      await fetchUsers();
      setShowModal(false);
    } catch (err) {
      const status = err?.response?.status;
      const backendMsg = typeof err?.response?.data?.message === 'string'
        ? err?.response?.data?.message
        : typeof err?.response?.data?.error === 'string'
        ? err?.response?.data?.error
        : typeof err?.message === 'string'
        ? err?.message
        : JSON.stringify(err?.response?.data || err?.message || 'Unknown error');
      setError(`Failed to assign role (${status ?? 'network error'}): ${backendMsg}`);
    }
  };

  if (loading) {
    return (
      <>
        <div style={{ padding: '60px 40px', textAlign: 'center' }}>
          <div className="loading-spinner">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-content" style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1>User Management</h1>
          <span style={{ color: 'var(--gray)' }}>Total: {users.length} users</span>
        </div>

        <AlertBox type="error" message={error} />

        <div className="table-container" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-light)', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '15px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>School</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Role</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '15px' }}>{u.first_name} {u.last_name}</td>
                  <td style={{ padding: '15px' }}>{u.email}</td>
                  <td style={{ padding: '15px' }}>{u.school || 'N/A'}</td>
                  <td style={{ padding: '15px' }}>
                    <span className="role-badge" style={{ background: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>
                      {u.role || 'User'}
                    </span>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <button onClick={() => handleEditUser(u)} style={{ marginRight: '8px', padding: '6px 12px', background: '#1e3d6b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Edit
                    </button>
                    <button onClick={() => handleAssignRole(u)} style={{ marginRight: '8px', padding: '6px 12px', background: '#6c5ce7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Assign Role
                    </button>
                    <button onClick={() => handleDeleteUser(u.id)} style={{ padding: '6px 12px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: 'white', padding: '30px', borderRadius: '12px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>{modalMode === 'edit' ? 'Edit User' : 'Assign Role'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            {modalMode === 'edit' && (
              <form onSubmit={handleUpdateUser}>
                <div className="form-field">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}
                  />
                </div>
                <div className="form-field">
                  <label>School</label>
                  <input
                    type="text"
                    value={editForm.school}
                    onChange={(e) => setEditForm({...editForm, school: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button type="submit" style={{ flex: 1, padding: '12px', background: '#1e3d6b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    Update User
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {modalMode === 'assignRole' && (
              <form onSubmit={handleAssignRoleSubmit}>
                <div className="form-field">
                  <label>Select Role</label>
                  <select
                    value={roleForm.roleId}
                    onChange={(e) => setRoleForm({...roleForm, roleId: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}
                    required
                  >
                    <option value="">Select a role...</option>
                    <option value="1">Admin</option>
                    <option value="2">School Head</option>
                    <option value="3">Teaching Staff</option>
                    <option value="4">Default User</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button type="button" onClick={handleAssignRoleSubmit} style={{ flex: 1, padding: '12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    Assign Role
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Users;