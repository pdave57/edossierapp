import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertBox from '../components/common/AlertBox';
import { QUALIFICATIONS } from '../constants/qualifications';
import {
  getPersonnelById,
  getSchools,
  getErrorMessage,
} from '../api/client';

const PersonnelProfile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const personnelId = searchParams.get('id');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [personnel, setPersonnel] = useState(null);
  const [schools, setSchools] = useState([]);

  const fetchSchools = useCallback(async () => {
    try {
      const res = await getSchools();
      const list = Array.isArray(res.data) ? res.data : (res.data?.schools ?? res.data?.data ?? []);
      setSchools(list);
    } catch (err) {
      console.error('Fetch schools error:', err);
    }
  }, []);

  const fetchPersonnel = useCallback(async (id) => {
    if (!id) return;
    try {
      const res = await getPersonnelById(id);
      const data = res.data?.data || res.data;
      setPersonnel(data || null);
    } catch (err) {
      console.error('Fetch personnel error:', err);
      setError(getErrorMessage(err, 'Failed to load personnel profile.'));
    }
  }, []);

  useEffect(() => {
    if (!personnelId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    fetchSchools();
    fetchPersonnel(personnelId);
    setLoading(false);
  }, [personnelId, fetchPersonnel, fetchSchools]);

  const getSchoolName = (schoolId) => schools.find((s) => s.id === schoolId)?.name || '—';

  const GENDERS = [
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
    { label: 'Other', value: 'OTHER' },
  ];
  const PERSONNEL_ROLES = [
    { label: 'Teacher', value: 'TEACHER' },
    { label: 'Head Teacher', value: 'HEAD_TEACHER' },
    { label: 'Principal', value: 'PRINCIPAL' },
    { label: 'Vice Principal', value: 'VICE_PRINCIPAL' },
    { label: 'Admin Officer', value: 'ADMIN_OFFICER' },
    { label: 'Counselor', value: 'COUNSELOR' },
    { label: 'Librarian', value: 'LIBRARIAN' },
    { label: 'Lab Technician', value: 'LAB_TECHNICIAN' },
    { label: 'Other', value: 'OTHER' },
  ];
  const PERSONNEL_STATUSES = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
    { label: 'Suspended', value: 'SUSPENDED' },
    { label: 'Retired', value: 'RETIRED' },
    { label: 'Transferred', value: 'TRANSFERRED' },
  ];
  const qualLabel = QUALIFICATIONS.find((q) => q.value === personnel?.qualification)?.label || personnel?.qualification || '—';
  const genderLabel = GENDERS.find((g) => g.value === personnel?.gender)?.label || personnel?.gender || '—';
  const statusLabel = PERSONNEL_STATUSES.find((s) => s.value === personnel?.status)?.label || personnel?.status || '—';
  const roleLabel = PERSONNEL_ROLES.find((r) => r.value === personnel?.role)?.label || personnel?.role || '—';
  const dob = personnel?.date_of_birth ? new Date(personnel.date_of_birth).toLocaleDateString('en-GB') : '—';
  const doe = personnel?.date_of_employment ? new Date(personnel.date_of_employment).toLocaleDateString('en-GB') : '—';

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

  if (!personnelId) {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <AlertBox type="error" message="No personnel selected." />
        <button onClick={() => navigate('/personnel')} style={{ marginTop: '16px', padding: '10px 20px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Go to Personnel
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <AlertBox type="error" message={error} />
        <button onClick={() => navigate('/personnel')} style={{ marginTop: '16px', padding: '10px 20px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Go to Personnel
        </button>
      </div>
    );
  }

  if (!personnel) {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <AlertBox type="error" message="Personnel not found." />
        <button onClick={() => navigate('/personnel')} style={{ marginTop: '16px', padding: '10px 20px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Go to Personnel
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <button
        type="button"
        onClick={() => navigate('/personnel')}
        style={{ background: 'none', border: 'none', padding: 0, margin: '0 0 16px', cursor: 'pointer', color: '#3e7430', font: 'inherit', fontSize: '0.9rem' }}
      >
        ← Back to Personnel
      </button>

      <h1 style={{ margin: '0 0 8px' }}>Personnel Profile</h1>
      <p style={{ color: 'var(--gray)', marginTop: 0, marginBottom: '24px' }}>
        Official personnel profile sheet.
      </p>

      <AlertBox type="error" message={error} />

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .personnel-profile-sheet, .personnel-profile-sheet * { visibility: visible !important; }
          .personnel-profile-sheet {
            position: absolute !important; left: 0; top: 0; margin: 0 !important;
            box-shadow: none !important; border: none !important;
          }
          .personnel-profile-no-print { display: none !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      <div
        className="personnel-profile-sheet"
        style={{
          background: 'white', width: '210mm', minHeight: '297mm',
          padding: '18mm 16mm', boxSizing: 'border-box',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', fontFamily: 'inherit', color: '#1a1a1a',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #3e7430', paddingBottom: '12px', marginBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '700', fontFamily: 'Source Serif Pro, Georgia, serif' }}>e-Dossier</div>
            <div style={{ fontSize: '12px', color: '#555' }}>Personnel Profile</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>Staff ID</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#3e7430' }}>{personnel.staff_id || '—'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'flex-start' }}>
          {personnel.avatar_url ? (
            <img src={personnel.avatar_url} alt="Profile" style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ddd' }} />
          ) : (
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', color: '#999', border: '2px solid #ddd' }}>
              👤
            </div>
          )}
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'Source Serif Pro, Georgia, serif', marginBottom: '4px' }}>
              {personnel.last_name}, {personnel.first_name} {personnel.middle_name || ''}
            </div>
            <div style={{ fontSize: '13px', color: '#555' }}>{roleLabel}</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              <span style={{
                display: 'inline-block', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                background: personnel.status === 'ACTIVE' ? '#d4edda' : personnel.status === 'INACTIVE' ? '#e2e3e5' : personnel.status === 'SUSPENDED' ? '#fff3cd' : personnel.status === 'RETIRED' ? '#d1ecf1' : '#f8d7da',
                color: personnel.status === 'ACTIVE' ? '#155724' : personnel.status === 'INACTIVE' ? '#383d41' : personnel.status === 'SUSPENDED' ? '#856404' : personnel.status === 'RETIRED' ? '#0c5460' : '#721c24',
              }}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        <h3 style={sectionTitle}>Personal Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', marginBottom: '22px' }}>
          {cell('Gender', genderLabel)}
          {cell('Date of Birth', dob)}
          {cell('Email', personnel.email)}
          {cell('Phone', personnel.phone)}
          {cell('Address', personnel.address)}
          {cell('Qualification', qualLabel)}
          {cell('Specialization', personnel.specialization)}
        </div>

        <h3 style={sectionTitle}>Employment Data</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', marginBottom: '22px' }}>
          {cell('School', getSchoolName(personnel.school_id))}
          {cell('Date of Employment', doe)}
          {cell('State ID', personnel.state_id)}
          {cell('LGA ID', personnel.lga_id)}
          {cell('Personnel ID', personnel.id)}
        </div>

        <div style={{ marginTop: '40px', borderTop: '1px solid #ccc', paddingTop: '10px', fontSize: '10px', color: '#999' }}>
          Generated by e-Dossier • {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="personnel-profile-no-print" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => window.print()}
          style={{ padding: '12px 22px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
        >
          Print / Download PDF
        </button>
        <button
          type="button"
          onClick={() => navigate('/personnel')}
          style={{ padding: '12px 22px', background: 'white', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PersonnelProfile;