import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertBox from '../components/common/AlertBox';
import {
  uploadStudentAvatar,
  getSchools,
  getErrorMessage,
} from '../api/client';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [school, setSchool] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const studentId = user?.id;

  const fetchSchool = useCallback(async (schoolId) => {
    if (!schoolId) return;
    try {
      const res = await getSchools();
      const list = Array.isArray(res.data) ? res.data : (res.data?.schools ?? res.data?.data ?? []);
      const found = list.find((s) => s.id === schoolId);
      setSchool(found || null);
    } catch (err) {
      console.error('School fetch error:', err);
    }
  }, []);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    if (user?.school_id) fetchSchool(user.school_id);
    setLoading(false);
  }, [studentId, fetchSchool, user?.school_id]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile || !studentId) return;
    setAvatarUploading(true);
    setError('');
    try {
      await uploadStudentAvatar(studentId, avatarFile);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      setError(`Failed to upload avatar (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    } finally {
      setAvatarUploading(false);
    }
  };

  const fullName = user ? `${user.last_name || ''}${user.first_name ? ', ' + user.first_name : ''}${user.middle_name ? ' ' + user.middle_name : ''}`.trim() : '—';

  if (loading) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px' }}>Student Dashboard</h1>
          <p style={{ color: 'var(--gray)', marginTop: 0, marginBottom: 0 }}>
            Welcome back, <strong>{fullName}</strong>
            {school && <span> — {school.name}</span>}
          </p>
        </div>
        <button
          onClick={logout}
          style={{ padding: '8px 16px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
        >
          Logout
        </button>
      </div>

      <AlertBox type="error" message={error} />

      {!studentId ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center', color: '#888' }}>
          No student session found. Please <a href="/student-login" style={{ color: '#3e7430' }}>login</a>.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>

          {/* Profile Link */}
          <div
            onClick={() => navigate(`/student-profile?id=${studentId}`)}
            style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#3e7430' }}>Profile</h3>
            <p style={{ color: '#666', margin: '0 0 16px', fontSize: '0.95rem' }}>View your personal details and enrollment information.</p>
            <span style={{ color: '#3e7430', fontWeight: '600', fontSize: '0.9rem' }}>Open Profile →</span>
          </div>

          {/* Terminal Exam Link */}
          <div
            onClick={() => navigate(`/student-profile?id=${studentId}`)}
            style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#3e7430' }}>Terminal Exam</h3>
            <p style={{ color: '#666', margin: '0 0 16px', fontSize: '0.95rem' }}>Access your terminal exam report card and results.</p>
            <span style={{ color: '#3e7430', fontWeight: '600', fontSize: '0.9rem' }}>View Report →</span>
          </div>

          {/* Attendance Result Link */}
          <div
            onClick={() => navigate(`/student-profile?id=${studentId}`)}
            style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#3e7430' }}>Attendance Result</h3>
            <p style={{ color: '#666', margin: '0 0 16px', fontSize: '0.95rem' }}>Check your attendance records and participation history.</p>
            <span style={{ color: '#3e7430', fontWeight: '600', fontSize: '0.9rem' }}>View Attendance →</span>
          </div>

          {/* Assessments Link */}
          <div
            onClick={() => navigate(`/student-profile?id=${studentId}`)}
            style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#3e7430' }}>Assessments</h3>
            <p style={{ color: '#666', margin: '0 0 16px', fontSize: '0.95rem' }}>View your continuous assessments, CA scores, and teacher remarks.</p>
            <span style={{ color: '#3e7430', fontWeight: '600', fontSize: '0.9rem' }}>View Assessments →</span>
          </div>

          {/* Performance Prediction Link */}
          <div
            onClick={() => navigate(`/student-profile?id=${studentId}`)}
            style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#3e7430' }}>Performance Prediction</h3>
            <p style={{ color: '#666', margin: '0 0 16px', fontSize: '0.95rem' }}>See predicted grades, class position, and academic standing.</p>
            <span style={{ color: '#3e7430', fontWeight: '600', fontSize: '0.9rem' }}>View Prediction →</span>
          </div>

          {/* Photo Avatar Upload Card */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#3e7430' }}>Photo Avatar</h3>
            <div style={{ marginBottom: '16px', textAlign: 'center' }}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #3e7430' }} />
              ) : user?.avatar_url ? (
                <img src={user.avatar_url} alt="Current avatar" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #3e7430' }} />
              ) : (
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: '#888', fontSize: '0.9rem' }}>No Photo</div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ marginBottom: '10px', width: '100%' }}
            />
            <button
              onClick={handleAvatarUpload}
              disabled={!avatarFile || avatarUploading}
              style={{ width: '100%', padding: '10px', background: avatarFile ? '#3e7430' : '#ccc', color: 'white', border: 'none', borderRadius: '6px', cursor: avatarFile ? 'pointer' : 'not-allowed', fontSize: '0.9rem', opacity: avatarUploading ? 0.6 : 1 }}
            >
              {avatarUploading ? 'Uploading...' : 'Upload Avatar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
