import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertBox from '../components/common/AlertBox';

const StudentLogin = () => {
  const navigate = useNavigate();
  const { studentLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    school_code: '',
    enrollment_no: '',
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await studentLogin({
        school_code: formData.school_code.trim(),
        enrollment_no: formData.enrollment_no.trim(),
      });
      
      console.log('studentLogin raw response:', response);
      const authData = (response?.data?.data) ? response.data.data : (response?.data || response);
      console.log('studentLogin authData:', authData);
      
      if (!authData || typeof authData !== 'object' || !authData.access_token) {
        console.error('Unexpected login response shape:', response);
        setError('Login failed. The server returned an unexpected response. Please ensure the backend is up to date.');
        return;
      }
      
      const { access_token, refresh_token } = authData;
      
      if (access_token) {
        localStorage.setItem('access_token', access_token);
        if (refresh_token) {
          localStorage.setItem('refresh_token', refresh_token);
        }
        localStorage.setItem('student_session', 'true');
        if (authData?.student) {
          localStorage.setItem('student_info', JSON.stringify(authData.student));
        }
        navigate('/student-dashboard');
      } else {
        setError('Login failed. No access token received.');
      }
    } catch (err) {
      console.error('Student login error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      if (err.response?.data?.error?.message) {
        setError(err.response.data.error.message);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Login failed. Please check your school code and enrollment number.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-left">
        <div className="al-top">
          {/* <div className="al-crest">
            <img src="/images/logomoe.jpg" height="70px" width="70px" alt="State Ministry of Education" />
          </div> */}
          <h2>Student Portal Login</h2>
          <p>Access your student profile, terminal reports, and academic records.</p>
        </div>
        <div className="al-mid">
          <h3>Welcome Back<br /><span className="hl">Sign In.</span></h3>
          <p>Enter your school code and enrollment number to access your dashboard.</p>
          <div className="features">
            <div className="feature-item">📋 Terminal Reports</div>
            <div className="feature-item">📊 Academic Records</div>
            <div className="feature-item">👤 Student Profile</div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <Link to="/" className="back-link">← Back to Home</Link>

        <div className="form-header">
          <h1>Student Sign In</h1>
          <p>Use your school code and enrollment number</p>
        </div>

        <AlertBox type="error" message={error} />

        <form onSubmit={handleSubmit}>
          <div className="form-card">
            <div className="form-field">
              <label>School Code *</label>
              <div className="input-wrap">
                <span className="i-ico">🏫</span>
                <input
                  type="text"
                  id="school_code"
                  placeholder="Enter school code"
                  value={formData.school_code}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-field">
              <label>Enrollment Number *</label>
              <div className="input-wrap">
                <span className="i-ico">🎓</span>
                <input
                  type="text"
                  id="enrollment_no"
                  placeholder="Enter enrollment number"
                  value={formData.enrollment_no}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="submit-area">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentLogin;
