import { useState, useEffect, useCallback } from 'react';
import {
  getRoles,
  getRole,
  getPermissions,
  addPermissionToRole,
  removePermissionFromRole,
} from '../api/client';
import AlertBox from '../components/common/AlertBox';

const Permission = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getRoles();
      const list = Array.isArray(res.data) ? res.data : (res.data?.roles ?? res.data?.data ?? []);
      setRoles(list);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Unknown error';
      setError(`Failed to fetch roles: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await getPermissions();
      const list = Array.isArray(res.data) ? res.data : (res.data?.permissions ?? res.data?.data ?? []);
      setPermissions(list);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
    }
  }, []);

  const fetchRoleWithPermissions = useCallback(async (roleId) => {
    try {
      const res = await getRole(roleId);
      const role = res.data?.data || res.data;
      setSelectedRole(role);
    } catch (err) {
      console.error('Failed to fetch role permissions:', err);
      setSelectedRole(null);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  useEffect(() => {
    if (selectedRoleId) {
      fetchRoleWithPermissions(selectedRoleId);
    } else {
      setSelectedRole(null);
    }
  }, [selectedRoleId, fetchRoleWithPermissions]);

  const selectedPermissions = new Set(
    (selectedRole?.permissions || []).map((p) => p.id)
  );

  const groupedPermissions = permissions.reduce((acc, perm) => {
    const key = perm.resource || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(perm);
    return acc;
  }, {});

  const handleTogglePermission = async (permissionId, isChecked) => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      if (isChecked) {
        await addPermissionToRole(selectedRoleId, permissionId);
      } else {
        await removePermissionFromRole(selectedRoleId, permissionId);
      }
      await fetchRoleWithPermissions(selectedRoleId);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Unknown error';
      setError(`Failed to update permission: ${msg}`);
    } finally {
      setSaving(false);
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
      <div style={{ marginBottom: '30px' }}>
        <h1>Permission Management</h1>
        <p style={{ color: 'var(--gray)', marginTop: '8px' }}>
          Select a role from the left to assign or remove permissions.
        </p>
      </div>

      <AlertBox type="error" message={error} />

      <div
        style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'flex-start',
          minHeight: '500px',
        }}
      >
        <div
          style={{
            width: '280px',
            flexShrink: 0,
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            maxHeight: '600px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-light)',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Roles</h3>
          </div>
          {roles.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--gray)' }}>
              No roles found.
            </div>
          ) : (
            roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  background: selectedRoleId === role.id ? 'rgba(130, 196, 108, 0.15)' : 'white',
                  color: selectedRoleId === role.id ? 'var(--primaryText)' : 'inherit',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{role.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: '2px' }}>
                    {role.code}
                  </div>
                </div>
                {selectedRoleId === role.id && (
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>
            ))
          )}
        </div>

        <div
          style={{
            flex: 1,
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            maxHeight: '600px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem' }}>
              {selectedRole ? `Permissions for ${selectedRole.name}` : 'Permissions'}
            </h3>
            {saving && (
              <span style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Saving...</span>
            )}
          </div>

          {!selectedRoleId ? (
            <div
              style={{
                padding: '60px 40px',
                textAlign: 'center',
                color: 'var(--gray)',
              }}
            >
              Select a role from the left panel to view and edit its permissions.
            </div>
          ) : permissions.length === 0 ? (
            <div
              style={{
                padding: '60px 40px',
                textAlign: 'center',
                color: 'var(--gray)',
              }}
            >
              No permissions available.
            </div>
          ) : (
            <div style={{ padding: '20px' }}>
              {Object.entries(groupedPermissions).map(([resource, perms]) => (
                <div key={resource} style={{ marginBottom: '24px' }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--gray)',
                      marginBottom: '10px',
                      paddingBottom: '6px',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {resource}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {perms.map((perm) => {
                      const isChecked = selectedPermissions.has(perm.id);
                      return (
                        <label
                          key={perm.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'background 0.12s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-light)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={saving}
                            onChange={(e) =>
                              handleTogglePermission(perm.id, e.target.checked)
                            }
                            style={{
                              marginTop: '2px',
                              width: '16px',
                              height: '16px',
                              accentColor: 'var(--primary)',
                              cursor: 'pointer',
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                color: '#1a1a1a',
                              }}
                            >
                              {perm.action}
                            </div>
                            {perm.description && (
                              <div
                                style={{
                                  fontSize: '0.8rem',
                                  color: 'var(--gray)',
                                  marginTop: '2px',
                                }}
                              >
                                {perm.description}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Permission;
