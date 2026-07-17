import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertBox from '../components/common/AlertBox';
import {
  getSchools,
  getErrorMessage,
} from '../api/client';

const StudentProfile = () => {
  const navigate = useNavigate();
  const useSearch = useSearchParams();
  const [searchParams] = useSearch;
  const studentId = searchParams.get('id');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [school, setSchool] = useState(null);

  const fetchSchool = useCallback(async (schoolId) => {
    if (!schoolId) return;
    try {
      const res = await getSchools();
      const list = Array.isArray(res.data) ? res.data : (res.data?.schools ?? res.data?.data ?? []);
      const found = list.find((s) => s.id === schoolId);
      setSchool(found || null);
    } catch (err) {
      console.error('Fetch school error:', err);
    }
  }, []);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    if (user?.school_id) fetchSchool(user.school_id);
    setLoading(false);
  }, [studentId, fetchSchool, user?.school_id]);

  const fullName = user ? `${user.last_name || ''}${user.first_name ? ', ' + user.first_name : ''}${user.middle_name ? ' ' + user.middle_name : ''}`.trim() : '—';

  const sectionTitle = {
    fontFamily: 'Source Serif Pro, Georgia, serif',
    fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase',
    color: '#3e7430', borderBottom: '2px solid #3e7430', paddingBottom: '4px',
    margin: '0 0 12px',
  };
  const fieldLabel = { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', marginBottom: '2px' };
  const fieldValue = { fontSize: '13px', color: '#1a1a1a', marginBottom: '10px' };
  const cell = (label, value) => (
    <div>
      <div style={fieldLabel}>{label}</div>
      <div style={fieldValue}>{value || '—'}</div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!studentId) {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <AlertBox type="error" message="No student selected." />
        <button onClick={() => navigate('/student-dashboard')} style={{ marginTop: '16px', padding: '10px 20px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <button
        type="button"
        onClick={() => navigate('/student-dashboard')}
        style={{ background: 'none', border: 'none', padding: 0, margin: '0 0 16px', cursor: 'pointer', color: '#3e7430', font: 'inherit', fontSize: '0.9rem' }}
      >
        ← Back to Dashboard
      </button>

      <h1 style={{ margin: '0 0 8px' }}>Student Profile</h1>
      <p style={{ color: 'var(--gray)', marginTop: 0, marginBottom: '24px' }}>
        Official student profile sheet.
      </p>

      <AlertBox type="error" message={error} />

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .student-profile-sheet, .student-profile-sheet * { visibility: visible !important; }
          .student-profile-sheet {
            position: absolute !important; left: 0; top: 0; margin: 0 !important;
            box-shadow: none !important; border: none !important;
          }
          .student-profile-no-print { display: none !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      <div
        className="student-profile-sheet"
        style={{
          background: 'white', width: '210mm', minHeight: '297mm',
          padding: '18mm 16mm', boxSizing: 'border-box',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', fontFamily: 'inherit', color: '#1a1a1a',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #3e7430', paddingBottom: '12px', marginBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '700', fontFamily: 'Source Serif Pro, Georgia, serif' }}>e-Dossier</div>
            <div style={{ fontSize: '12px', color: '#555' }}>Student Profile</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>Enrollment No</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#3e7430' }}>{user?.enrollment_no || '—'}</div>
          </div>
        </div>

        <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'Source Serif Pro, Georgia, serif', marginBottom: '4px' }}>{fullName}</div>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>{user?.status || '—'}</div>

        <h3 style={sectionTitle}>Bio Data</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', marginBottom: '22px' }}>
          {cell('Gender', user?.gender)}
          {cell('Date of Birth', user?.date_of_birth ? String(user.date_of_birth).slice(0, 10) : '—')}
          {cell('State of Origin', user?.state_of_origin)}
          {cell('Religion', user?.religion)}
          {cell('Address', user?.address)}
          {cell('Guardian Name', user?.guardian_name)}
          {cell('Guardian Phone', user?.guardian_phone)}
          {cell('Guardian Relation', user?.guardian_relation)}
        </div>

        <h3 style={sectionTitle}>School &amp; Enrollment Data</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', marginBottom: '22px' }}>
          {cell('School', school?.name)}
          {cell('Enrollment Year', user?.enrollment_year)}
          {cell('Enrollment Status', user?.status)}
        </div>

        <h3 style={sectionTitle}>Academic Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', marginBottom: '22px' }}>
          {cell('Student ID', user?.id)}
          {cell('State ID', user?.state_id)}
        </div>

        <div style={{ marginTop: '40px', borderTop: '1px solid #ccc', paddingTop: '10px', fontSize: '10px', color: '#999' }}>
          Generated by e-Dossier • {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="student-profile-no-print" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => window.print()}
          style={{ padding: '12px 22px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
        >
          Print / Download PDF
        </button>
        <button
          type="button"
          onClick={() => navigate('/student-dashboard')}
          style={{ padding: '12px 22px', background: 'white', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default StudentProfile;
