import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { upsertGradeConfig, getGradeConfigs, deleteGradeConfig, getSchools, getLevels, getErrorMessage } from '../api/client';
import AlertBox from '../components/common/AlertBox';

const emptyForm = {
  school_id: '',
  level_id: '',
  grade: '',
  min_score: '',
  max_score: '',
  remark: '',
  points: '',
};

const GradeConfig = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [schools, setSchools] = useState([]);
  const [levels, setLevels] = useState([]);
  const [gradeConfigs, setGradeConfigs] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [editingId, setEditingId] = useState(null);

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
      const res = await getLevels(1, 200, selectedSchoolId || undefined);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setLevels(list);
    } catch (err) {
      console.error('Levels fetch error:', err);
    }
  }, [selectedSchoolId]);

  const fetchGradeConfigs = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getGradeConfigs(selectedSchoolId || undefined, selectedLevelId || undefined);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setGradeConfigs(list);
    } catch (err) {
      console.error('Grade configs fetch error:', err);
    }
  }, [token, selectedSchoolId, selectedLevelId]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  useEffect(() => {
    fetchGradeConfigs();
  }, [fetchGradeConfigs]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const minScore = parseFloat(formData.min_score);
    const maxScore = parseFloat(formData.max_score);
    const points = formData.points ? parseFloat(formData.points) : undefined;

    if (!formData.grade || !formData.remark || isNaN(maxScore) || maxScore <= 0) {
      setError('Grade, remark, and max score (> 0) are required.');
      setLoading(false);
      return;
    }

    if (!isNaN(minScore) && !isNaN(maxScore) && minScore >= maxScore) {
      setError('Min score must be less than max score.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        school_id: formData.school_id || undefined,
        level_id: formData.level_id || undefined,
        grade: formData.grade,
        min_score: isNaN(minScore) ? 0 : minScore,
        max_score: maxScore,
        remark: formData.remark,
        points: isNaN(points) ? undefined : points,
      };
      await upsertGradeConfig(payload);
      setSuccess(editingId ? 'Grade configuration updated successfully.' : 'Grade configuration saved successfully.');
      setFormData(emptyForm);
      setEditingId(null);
      setSelectedSchoolId(formData.school_id || '');
      setSelectedLevelId(formData.level_id || '');
      fetchGradeConfigs();
    } catch (err) {
      console.error('Upsert grade config error:', err);
      setError(`Failed to save grade configuration (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config) => {
    setEditingId(config.id);
    setFormData({
      school_id: config.school_id || '',
      level_id: config.level_id || '',
      grade: config.grade,
      min_score: config.min_score ?? '',
      max_score: config.max_score ?? '',
      remark: config.remark,
      points: config.points ?? '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this grade configuration?')) return;
    try {
      await deleteGradeConfig(id);
      setSuccess('Grade configuration deleted successfully.');
      if (editingId === id) {
        setFormData(emptyForm);
        setEditingId(null);
      }
      fetchGradeConfigs();
    } catch (err) {
      console.error('Delete grade config error:', err);
      setError(`Failed to delete grade configuration (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    }
  };

  const handleCancel = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>Grade Configuration</h1>
      </div>

      <AlertBox type="error" message={error} />
      {success && <AlertBox type="success" message={success} />}

      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>{editingId ? 'Edit Grade' : 'Add Grade'}</h2>
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
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Grade</label>
              <input
                type="text"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                placeholder="e.g., A, B, C, F"
                required
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Remark</label>
              <input
                type="text"
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                placeholder="e.g., Excellent, Good, Pass, Fail"
                required
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Min Score</label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.min_score}
                onChange={(e) => setFormData({ ...formData, min_score: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Max Score</label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.max_score}
                onChange={(e) => setFormData({ ...formData, max_score: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Points</label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 1, padding: '12px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Saving...' : editingId ? 'Update Grade' : 'Save Grade'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                style={{ flex: 1, padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 30px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.2rem' }}>Grade List</h2>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select
                value={selectedSchoolId}
                onChange={(e) => { setSelectedSchoolId(e.target.value); setSelectedLevelId(''); }}
                style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white', minWidth: '200px' }}
              >
                <option value="">State Default</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
              <select
                value={selectedLevelId}
                onChange={(e) => setSelectedLevelId(e.target.value)}
                disabled={!selectedSchoolId}
                style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white', minWidth: '180px' }}
              >
                <option value="">All Levels</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>{level.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-light)', borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '15px', textAlign: 'left' }}>Grade</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Remark</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Min Score</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Max Score</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Points</th>
              {/* <th style={{ padding: '15px', textAlign: 'left' }}>Level</th> */}
              <th style={{ padding: '15px', textAlign: 'left', width: '140px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {gradeConfigs.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--gray)' }}>
                  No grade configurations found.
                </td>
              </tr>
            ) : (
              gradeConfigs.map((config) => (
                <tr key={config.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '15px', fontWeight: '600' }}>{config.grade}</td>
                  <td style={{ padding: '15px' }}>{config.remark}</td>
                  <td style={{ padding: '15px' }}>{config.min_score}</td>
                  <td style={{ padding: '15px' }}>{config.max_score}</td>
                  <td style={{ padding: '15px' }}>{config.points ?? '—'}</td>
                  {/* <td style={{ padding: '15px' }}>{config.level_id|| '—'}</td> */}
                  <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(config)}
                        style={{ padding: '6px 12px', background: '#3e7430', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(config.id)}
                        style={{ padding: '6px 12px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GradeConfig;
