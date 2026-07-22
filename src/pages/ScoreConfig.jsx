import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { upsertScoreConfig, getSchools, getLevels, getErrorMessage } from '../api/client';
import AlertBox from '../components/common/AlertBox';

const emptyForm = {
  school_id: '',
  level_id: '',
  ca1_max: '',
  ca2_max: '',
  ca3_max: '',
  exam_max: '',
  total_max: '',
};

const ScoreConfig = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [schools, setSchools] = useState([]);
  const [levels, setLevels] = useState([]);

  const fetchSchools = useCallback(async () => {
    try {
      const res = await getSchools();
      const list = Array.isArray(res.data) ? res.data : (res.data?.schools ?? res.data?.data ?? []);
      setSchools(list);
    } catch (err) {
      console.error('Schools fetch error:', err);
    }
  }, []);

  const fetchLevels = useCallback(async () => {
    try {
      const res = await getLevels(1, 200, formData.school_id || undefined);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setLevels(list);
    } catch (err) {
      console.error('Levels fetch error:', err);
    }
  }, [formData.school_id]);

  useEffect(() => {
    fetchSchools();
    fetchLevels();
  }, [fetchSchools, fetchLevels]);

  const calculateTotal = () => {
    const ca1 = parseFloat(formData.ca1_max) || 0;
    const ca2 = parseFloat(formData.ca2_max) || 0;
    const ca3 = parseFloat(formData.ca3_max) || 0;
    const exam = parseFloat(formData.exam_max) || 0;
    return ca1 + ca2 + ca3 + exam;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const ca1 = parseFloat(formData.ca1_max);
    const ca2 = parseFloat(formData.ca2_max);
    const ca3 = parseFloat(formData.ca3_max);
    const exam = parseFloat(formData.exam_max);
    const total = parseFloat(formData.total_max);

    if (!ca1 || !ca2 || !ca3 || !exam || !total) {
      setError('All score fields must be greater than 0.');
      setLoading(false);
      return;
    }

    if (ca1 + ca2 + ca3 + exam !== total) {
      setError(`Validation failed: CA1 (${ca1}) + CA2 (${ca2}) + CA3 (${ca3}) + Exam (${exam}) = ${ca1 + ca2 + ca3 + exam}, but total is ${total}. Total must equal the sum.`);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        school_id: formData.school_id || undefined,
        level_id: formData.level_id || undefined,
        ca1_max: ca1,
        ca2_max: ca2,
        ca3_max: ca3,
        exam_max: exam,
        total_max: total,
      };
      await upsertScoreConfig(payload);
      setSuccess('Score configuration saved successfully.');
      setFormData(emptyForm);
    } catch (err) {
      console.error('Upsert score config error:', err);
      setError(`Failed to save score configuration (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>Score Configuration</h1>
      </div>

      <AlertBox type="error" message={error} />
      {success && <AlertBox type="success" message={success} />}

      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>School</label>
            <select
              value={formData.school_id}
              onChange={(e) => setFormData({ ...formData, school_id: e.target.value, level_id: '' })}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
            >
              <option value="">State Default (apply to all schools)</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>{school.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Level</label>
            <select
              value={formData.level_id}
              onChange={(e) => setFormData({ ...formData, level_id: e.target.value })}
              disabled={!formData.school_id}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
            >
              <option value="">All Levels (school default)</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>{level.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>CA1 Max</label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.ca1_max}
                onChange={(e) => setFormData({ ...formData, ca1_max: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>CA2 Max</label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.ca2_max}
                onChange={(e) => setFormData({ ...formData, ca2_max: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>CA3 Max</label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.ca3_max}
                onChange={(e) => setFormData({ ...formData, ca3_max: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Exam Max</label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.exam_max}
                onChange={(e) => setFormData({ ...formData, exam_max: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Total Max</label>
            <input
              type="number"
              min="0"
              step="any"
              value={formData.total_max}
              onChange={(e) => setFormData({ ...formData, total_max: e.target.value })}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
            />
            <p style={{ marginTop: '6px', fontSize: '0.85rem', color: 'var(--gray)' }}>
              Calculated total: {calculateTotal()}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 1, padding: '12px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Saving...' : 'Save Score Configuration'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
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

export default ScoreConfig;
