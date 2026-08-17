import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getSchools, getSchool, uploadSchoolLogo, getErrorMessage } from '../api/client';
import AlertBox from '../components/common/AlertBox';

const SchoolLogoUpload = () => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [schoolSearch, setSchoolSearch] = useState('');

  const fetchSchools = useCallback(async () => {
    try {
      const res = await getSchools();
      const list = Array.isArray(res.data) ? res.data : (res.data?.schools ?? res.data?.data ?? []);
      setSchools(list);
    } catch (err) {
      console.error('Schools fetch error:', err);
      setError(`Failed to load schools (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const handleSchoolChange = async (e) => {
    const schoolId = e.target.value;
    setError('');
    setSuccess('');
    setLogoFile(null);
    setLogoPreview(null);
    setSelectedSchool(null);

    if (!schoolId) return;

    try {
      const res = await getSchool(schoolId);
      const data = res.data?.data || res.data;
      setSelectedSchool(data);
    } catch (err) {
      setError(`Failed to load school details (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!logoFile || !selectedSchool?.id) return;
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      await uploadSchoolLogo(selectedSchool.id, logoFile);
      setSuccess('School logo uploaded successfully!');
      setLogoFile(null);
      setLogoPreview(null);
      const res = await getSchool(selectedSchool.id);
      const data = res.data?.data || res.data;
      setSelectedSchool(data);
    } catch (err) {
      setError(`Failed to upload logo (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  const filteredSchools = schools.filter((school) =>
    school.name?.toLowerCase().includes(schoolSearch.toLowerCase())
  );

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>Upload School Logo</h1>
      </div>

      <AlertBox type="error" message={error} />
      {success && <AlertBox type="success" message={success} />}

      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Select School</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search schools..."
              value={schoolSearch}
              onChange={(e) => setSchoolSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 36px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'white', fontSize: '0.9rem', marginBottom: '8px' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '11px', color: '#6b7280', pointerEvents: 'none' }} />
          </div>
          <select
            value={selectedSchool?.id || ''}
            onChange={handleSchoolChange}
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'white', fontSize: '0.9rem' }}
          >
            <option value="">Select school</option>
            {filteredSchools.map((school) => (
              <option key={school.id} value={school.id}>{school.name}</option>
            ))}
          </select>
        </div>

        {selectedSchool && (
          <>
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <p style={{ marginBottom: '10px', fontSize: '1.1rem', fontWeight: '500' }}>{selectedSchool.name}</p>
              <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '0.9rem' }}>{selectedSchool.code}</p>

              {selectedSchool.logo_url && (
                <div style={{ marginBottom: '20px' }}>
                  <img src={selectedSchool.logo_url} alt="Current logo" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <p style={{ marginTop: '8px', fontSize: '0.85rem', color: '#6b7280' }}>Current logo</p>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Choose Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
              />
            </div>

            {logoPreview && (
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <img src={logoPreview} alt="Preview" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <p style={{ marginTop: '8px', fontSize: '0.85rem', color: '#6b7280' }}>Preview</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleUpload}
                disabled={!logoFile || uploading}
                style={{ flex: 1, padding: '12px', background: logoFile ? '#3e7430' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', cursor: logoFile ? 'pointer' : 'not-allowed', fontWeight: '600', opacity: uploading ? 0.6 : 1 }}
              >
                {uploading ? 'Uploading...' : 'Upload Logo'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/schools')}
                style={{ flex: 1, padding: '12px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
              >
                Back to Schools
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SchoolLogoUpload;
