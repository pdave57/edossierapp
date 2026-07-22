import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getPersonnelById, uploadPersonnelAvatar, getSchools, getErrorMessage } from '../api/client';
import AlertBox from '../components/common/AlertBox';

const PersonnelAvatar = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const schoolIdParam = searchParams.get('school_id');
  const [personnel, setPersonnel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const fetchPersonnel = useCallback(async () => {
    if (!id) return;
    try {
      const res = await getPersonnelById(id);
      const data = res.data?.data || res.data;
      setPersonnel(data);
    } catch (err) {
      console.error(err);
      setError(`Failed to fetch personnel (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPersonnel();
  }, [fetchPersonnel]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!avatarFile || !id) return;
    setUploading(true);
    setError('');
    try {
      await uploadPersonnelAvatar(id, avatarFile);
      navigate(`/personnel?school_id=${schoolIdParam || ''}`);
    } catch (err) {
      setError(`Failed to upload avatar (${err?.response?.status ?? 'network error'}): ${getErrorMessage(err, 'Unknown error')}`);
      setUploading(false);
    }
  };

  const handleSkip = () => {
    navigate(`/personnel?school_id=${schoolIdParam || ''}`);
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>Upload Personnel Photo</h1>
      </div>

      <AlertBox type="error" message={error} />

      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        {personnel && (
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <p style={{ marginBottom: '10px', fontSize: '1.1rem', fontWeight: '500' }}>
              {personnel.last_name}, {personnel.first_name} {personnel.middle_name || ''}
            </p>
            <p style={{ color: 'var(--gray)', marginBottom: '20px' }}>{personnel.staff_id}</p>

            {personnel.avatar_url && (
              <div style={{ marginBottom: '20px' }}>
                <img src={personnel.avatar_url} alt="Current avatar" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover' }} />
                <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--gray)' }}>Current photo</p>
              </div>
            )}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Choose Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}
          />
        </div>

        {avatarPreview && (
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <img src={avatarPreview} alt="Preview" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover' }} />
            <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--gray)' }}>Preview</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleUpload}
            disabled={!avatarFile || uploading}
            style={{ flex: 1, padding: '12px', background: avatarFile ? '#3e7430' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', cursor: avatarFile ? 'pointer' : 'not-allowed', fontWeight: '600', opacity: uploading ? 0.6 : 1 }}
          >
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            style={{ flex: 1, padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonnelAvatar;
