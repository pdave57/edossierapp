import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertBox from '../components/common/AlertBox';
import {
  createStudent,
  getSchools,
  getStates,
  getStatelgas,
  getStudents,
  getErrorMessage,
} from '../api/client';

const GENDERS = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other', value: 'OTHER' },
];

const RegisterStudent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [schools, setSchools] = useState([]);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [students, setStudents] = useState([]);

  const [formData, setFormData] = useState({
    school_id: '',
    state_id: '',
    lga_id: '',
    enrollment_year: new Date().getFullYear(),
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: '',
    date_of_birth: '',
    state_of_origin: '',
    religion: '',
    address: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_relation: '',
  });

  // Schools within the selected LGA.
  const schoolsInLga = formData.lga_id
    ? schools.filter((s) => s.lga_id === formData.lga_id)
    : [];

  // Preview of the enrollment number the backend will assign:
  //   {StateCode}-{LGACode}-{YY}-{serial}
  const generateEnrollmentNo = () => {
    const stateCode = (formData.state_id ? states.find((s) => s.id === formData.state_id)?.code : '') || '';
    const lgaCode = (formData.lga_id ? lgas.find((l) => l.id === formData.lga_id)?.code : '') || '';
    if (!stateCode || !lgaCode) return '';
    const yy = String(new Date().getFullYear()).slice(-2);
    const prefix = `${stateCode}-${lgaCode}-${yy}-`;
    const existingSerials = students
      .map((stu) => {
        const no = stu.enrollment_no || '';
        if (no.toUpperCase().startsWith(prefix.toUpperCase())) {
          return parseInt(no.slice(prefix.length), 10);
        }
        return NaN;
      })
      .filter((n) => !isNaN(n));
    const nextSerial = existingSerials.length > 0 ? Math.max(...existingSerials) + 1 : 1;
    return `${prefix}${String(nextSerial).padStart(4, '0')}`;
  };

  const enrollmentNoPreview = generateEnrollmentNo();

  const fetchSchools = useCallback(async () => {
    try {
      const res = await getSchools();
      const list = Array.isArray(res.data) ? res.data : (res.data?.schools ?? res.data?.data ?? []);
      setSchools(list);
    } catch (err) {
      console.error('Schools fetch error:', err);
    }
  }, []);

  const fetchStates = useCallback(async () => {
    try {
      const res = await getStates();
      const list = Array.isArray(res.data) ? res.data : (res.data?.states ?? res.data?.data ?? []);
      setStates(list);
    } catch (err) {
      console.error('States fetch error:', err);
    }
  }, []);

  const fetchLgasByState = useCallback(async (stateId) => {
    if (!stateId) {
      setLgas([]);
      return;
    }
    try {
      const res = await getStatelgas(stateId);
      const list = Array.isArray(res.data) ? res.data : (res.data?.lgas ?? res.data?.data ?? []);
      setLgas(list);
    } catch (err) {
      console.error('LGAs fetch error:', err);
      setLgas([]);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await getStudents(1, 1000);
      const list = Array.isArray(res.data) ? res.data : (res.data?.students ?? res.data?.data ?? []);
      setStudents(list);
    } catch (err) {
      console.error('Students fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchSchools();
    fetchStates();
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchSchools, fetchStates, fetchStudents]);

  // Default the state to Taraba (or the first available) once the list loads.
  useEffect(() => {
    if (formData.state_id || states.length === 0) return;
    const taraba = states.find((s) => s.name?.toLowerCase() === 'taraba');
    const def = taraba || states[0];
    setFormData((prev) => ({ ...prev, state_id: def.id }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [states]);

  // Fetch LGAs whenever the selected state changes.
  useEffect(() => {
    fetchLgasByState(formData.state_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.state_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStateChange = (e) => {
    const stateId = e.target.value;
    setFormData((prev) => ({ ...prev, state_id: stateId, lga_id: '', school_id: '' }));
    fetchLgasByState(stateId);
  };

  const handleLgaChange = (e) => {
    const lgaId = e.target.value;
    setFormData((prev) => ({ ...prev, lga_id: lgaId, school_id: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        school_id: formData.school_id,
        enrollment_year: formData.enrollment_year ? Number(formData.enrollment_year) : undefined,
        first_name: formData.first_name.trim(),
        middle_name: formData.middle_name.trim(),
        last_name: formData.last_name.trim(),
        gender: formData.gender,
        date_of_birth: formData.date_of_birth ? `${formData.date_of_birth}T00:00:00Z` : undefined,
        state_of_origin: formData.state_of_origin.trim(),
        lga_id: formData.lga_id.trim(),
        religion: formData.religion.trim(),
        address: formData.address.trim(),
        guardian_name: formData.guardian_name.trim(),
        guardian_phone: formData.guardian_phone.trim(),
        guardian_relation: formData.guardian_relation.trim(),
      };
      const res = await createStudent(payload);
      const createdStudent = res.data?.data || res.data;
      // Navigate to enrollments, pre-selecting the newly created student.
      navigate('/enrollments', {
        state: {
          newStudentId: createdStudent?.id,
          newStudentName: `${createdStudent?.first_name || ''} ${createdStudent?.last_name || ''}`.trim(),
        },
      });
    } catch (err) {
      console.error('Create student error:', err);
      setError(`Failed to register student (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <button
        type="button"
        onClick={() => navigate('/students')}
        style={{ background: 'none', border: 'none', padding: 0, margin: '0 0 16px', cursor: 'pointer', color: '#3e7430', font: 'inherit', fontSize: '0.9rem' }}
      >
        ← Back to Student Management
      </button>
      <h1 style={{ margin: '0 0 8px' }}>Register Student</h1>
      <p style={{ color: 'var(--gray)', marginTop: 0, marginBottom: '24px' }}>
        After registering, you will be taken to Enrollment to enroll the student.
      </p>

      <AlertBox type="error" message={error} />

      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>State</label>
          <select name="state_id" value={formData.state_id} onChange={handleStateChange} required
            style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
            <option value="">Select state</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>{state.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>LGA</label>
          <select name="lga_id" value={formData.lga_id} onChange={handleLgaChange} required disabled={!formData.state_id}
            style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
            <option value="">Select lga</option>
            {lgas.map((lga) => (
              <option key={lga.id} value={lga.id}>{lga.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>School (in LGA)</label>
          <select name="school_id" value={formData.school_id} onChange={handleChange} required disabled={!formData.lga_id}
            style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
            <option value="">Select school</option>
            {schoolsInLga.map((school) => (
              <option key={school.id} value={school.id}>{school.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
            Enrollment No
            <span style={{ marginLeft: '8px', fontSize: '0.78rem', color: enrollmentNoPreview ? '#3e7430' : '#e07b00', fontWeight: '400' }}>
              {enrollmentNoPreview ? '(auto-generated)' : '— select State & LGA to generate'}
            </span>
          </label>
          <input type="text" value={enrollmentNoPreview} readOnly
            style={{
              width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px',
              background: enrollmentNoPreview ? '#f0f7ed' : 'var(--bg-light)',
              color: enrollmentNoPreview ? '#3e7430' : '#aaa',
              fontWeight: enrollmentNoPreview ? '600' : '400',
              fontFamily: 'monospace', letterSpacing: '0.05em', cursor: 'default',
            }} placeholder="—" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Last Name</label>
            <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>First Name</label>
            <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }} />
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Middle Name</label>
          <input type="text" name="middle_name" value={formData.middle_name} onChange={handleChange}
            style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Enrollment Year</label>
          <input type="number" name="enrollment_year" value={formData.enrollment_year} onChange={handleChange} required
            style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Gender</label>
          <select name="gender" value={formData.gender} onChange={handleChange} required
            style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
            <option value="">Select gender</option>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Date of Birth</label>
          <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required
            style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>State of Origin</label>
          <input type="text" name="state_of_origin" value={formData.state_of_origin} onChange={handleChange}
            style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Religion</label>
          <input type="text" name="religion" value={formData.religion} onChange={handleChange}
            style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Guardian Name</label>
          <input type="text" name="guardian_name" value={formData.guardian_name} onChange={handleChange} required
            style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Guardian Phone</label>
          <input type="text" name="guardian_phone" value={formData.guardian_phone} onChange={handleChange} required
            style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Guardian Relation</label>
          <input type="text" name="guardian_relation" value={formData.guardian_relation} onChange={handleChange}
            style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Address</label>
          <textarea name="address" value={formData.address} onChange={handleChange} rows="3"
            style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white', resize: 'vertical', fontFamily: 'inherit' }} />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button type="submit" disabled={loading}
            style={{ flex: 1, padding: '12px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Registering…' : 'Register Student'}
          </button>
          <button type="button" onClick={() => navigate('/students')}
            style={{ flex: 1, padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterStudent;
