// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertBox from '../components/common/AlertBox';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const getLoginErrorMessage = (err) => {
    const responseMessage = err.response?.data?.detail || err.response?.data?.message;

    if (responseMessage) {
      return Array.isArray(responseMessage)
        ? responseMessage.map((item) => item.msg || item.message || String(item)).join(' ')
        : responseMessage;
    }

    if (err.response?.status === 401) {
      return 'Login failed. Please check your email and password.';
    }

    return err.message || 'Login failed. Please try again.';
  };

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
      await login({ email: formData.email.trim(), password: formData.password });
      navigate('/admindashboard');
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-layout">
        <div className="auth-left">
          <div className="al-top">
            <div className="al-crest">
              <img src="/images/logomoe.jpg" height="70px" width="70px" alt="State Ministry of Education"/>
            </div>
            <h2>State Ministry of Education<br />Portal Login</h2>
            <p>Access your official account to manage school records, personnel, and ministry resources.</p>
          </div>
          <div className="al-mid">
            <h3>Welcome Back<br /><span className="hl">Sign In.</span></h3>
            <p>Enter your official credentials to access the integrated education management system.</p>
            <div className="features">
              <div className="feature-item">📊 School Census</div>
              <div className="feature-item">👥 Personnel Management</div>
              <div className="feature-item">📋 E-Dossier</div>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <Link to="/" className="back-link">← Back to Home</Link>

          <div className="form-header">
            <h1>Sign In</h1>
            <p>Don't have an account? <Link to="/register">Register here</Link></p>
          </div>

          <AlertBox type="error" message={error} />

          <form onSubmit={handleSubmit}>
            <div className="form-card">
              <div className="form-field">
                <label>Official Email *</label>
                <div className="input-wrap">
                  <span className="i-ico">✉️</span>
                  <input
                    type="email"
                    id="email"
                    placeholder="yourname@moe.state.gov.ng"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="form-field">
                <label>Password *</label>
                <div className="input-wrap">
                  <span className="i-ico">🔒</span>
                  <input
                    type="password"
                    id="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div style={{ marginTop: '10px', textAlign: 'right' }}>
                  <Link to="/forgot-password" style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>
                    Forgot password?
                  </Link>
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
    </>
  );
};

export default Login;
