import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPersonnel, getPersonnelById, uploadPersonnelAvatar, getSchools, getErrorMessage } from '../api/client';
import AlertBox from '../components/common/AlertBox';

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

const QUALIFICATIONS = [
  { label: 'PhD Holder', value: 'PHD' },
  { label: 'BSc / BA', value: 'BSC_BA' },
  { label: 'HND', value: 'HND' },
  { label: 'PgD Edu', value: 'PGD_EDU' },
  { label: 'NCE', value: 'NCE' },
  { label: 'SSCE', value: 'SSCE' },
  { label: 'Grade II', value: 'GRADE_II' },
  { label: 'Other', value: 'OTHER' },
];

const emptyForm = {
  school_id: '',
  staff_id: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  gender: '',
  date_of_birth: '',
  email: '',
  phone: '',
  address: '',
  role: '',
  qualification: '',
  specialization: '',
  date_of_employment: '',
  lga_id: '',
};

const AddPersonnel = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const schoolIdParam = searchParams.get('school_id');
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [schools, setSchools] = useState([]);

  const fetchSchools = useCallback(async () => {
    try {
      const res = await getSchools();
      const list = Array.isArray(res.data) ? res.data : (res.data?.schools ?? res.data?.data ?? []);
      setSchools(list);
    } catch (err) {
      console.error('Schools fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  useEffect(() => {
    if (schoolIdParam) {
      setFormData((prev) => ({ ...prev, school_id: schoolIdParam }));
    }
  }, [schoolIdParam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        school_id: formData.school_id,
        staff_id: formData.staff_id,
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth ? `${formData.date_of_birth}T00:00:00Z` : undefined,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        role: formData.role,
        qualification: formData.qualification,
        specialization: formData.specialization,
        date_of_employment: formData.date_of_employment ? `${formData.date_of_employment}T00:00:00Z` : undefined,
        lga_id: formData.lga_id,
      };
      const res = await createPersonnel(payload);
      const newPersonnel = res.data?.data || res.data;
      const personnelId = newPersonnel?.id;
      if (personnelId) {
        navigate(`/personnel/${personnelId}/avatar?school_id=${schoolIdParam || ''}`);
      } else {
        navigate('/personnel');
      }
    } catch (err) {
      console.error('Create personnel error:', err);
      setError(`Failed to create personnel (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>Add Personnel</h1>
      </div>

      <AlertBox type="error" message={error} />

      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>School</label>
            <select
              value={formData.school_id}
              onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
            >
              <option value="">Select school</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>{school.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Staff ID</label>
            <input
              type="text"
              value={formData.staff_id}
              onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>First Name</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Middle Name</label>
            <input
              type="text"
              value={formData.middle_name}
              onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
            >
              <option value="">Select gender</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
            >
              <option value="">Select role</option>
              {PERSONNEL_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Date of Birth</label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Employment Date</label>
              <input
                type="date"
                value={formData.date_of_employment}
                onChange={(e) => setFormData({ ...formData, date_of_employment: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows="3"
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Qualification</label>
            <select
              value={formData.qualification}
              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
            >
              <option value="">Select qualification</option>
              {QUALIFICATIONS.map((q) => (
                <option key={q.value} value={q.value}>{q.label}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Specialization</label>
            <input
              type="text"
              value={formData.specialization}
              placeholder="e.g., Mathematics, Physics, etc."
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 1, padding: '12px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Creating...' : 'Create Personnel'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/personnel?school_id=${schoolIdParam || ''}`)}
              style={{ flex: 1, padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPersonnel;
