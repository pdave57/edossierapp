// src/pages/Register.jsx
import React, { useState, useEffect, useRef, navigate} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStates } from '../api/client';
import PasswordStrength from '../components/common/PasswordStrength';
import AlertBox from '../components/common/AlertBox';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const defaultStateSetRef = useRef(false);

  // Dynamic states from backend
  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(true);

  // Form state mirrors the backend struct (snake_case keys)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    state_id: '',
    school_id: '',
    email: '',
    password: '',
    confirmPassword: '', // client-side only
    termsAccepted: false,
  });

// Fetch states from backend on mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        setStatesLoading(true);
        const response = await getStates();
        const data = response.data?.data || [];
        const mapped = Array.isArray(data) ? data.map(s => ({ state_id: s.id, name: s.name })) : [];
        setStates(mapped);
        if (!defaultStateSetRef.current && mapped.length > 0) {
          const taraba = mapped.find((s) => s.name.toLowerCase() === 'taraba');
          if (taraba) {
            setFormData((prev) => {
              if (prev.state_id) return prev;
              defaultStateSetRef.current = true;
              return { ...prev, state_id: taraba.state_id };
            });
          }
        }
      } catch (err) {
        console.error('Failed to load states:', err);
        setError('Unable to load states. Please refresh the page and try again.');
      } finally {
        setStatesLoading(false);
      }
    };
    fetchStates();
  }, []);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateForm = () => {
    const { first_name, last_name, state_id, email, password, confirmPassword, termsAccepted } =
      formData;

    if (!first_name.trim()) {
      setError('Please enter your first name.');
      return false;
    }
    if (!last_name.trim()) {
      setError('Please enter your last name.');
      return false;
    }
    if (!state_id) {
      setError('Please select your state.');
      return false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (password.length < 6 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must be at least 6 characters with uppercase, lowercase, and a number.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    if (!termsAccepted) {
      setError('You must accept the Terms of Use to continue.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Payload matches the backend struct exactly
      const userData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        state_id: formData.state_id,
        school_id: formData.school_id.trim() || undefined,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      await register(userData);
      setSuccess(
        //'✅ Registration submitted successfully! Your account is under review. You will receive a confirmation email within 24–48 hours.'
        navigate('/login')
      );

      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        state_id: '',
        school_id: '',
        email: '',
        password: '',
        confirmPassword: '',
        termsAccepted: false,
      });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-layout">
        {/* Left Panel */}
        <div className="auth-left">
          <div className="al-top">
            <div className="al-crest">
              <img src="/images/logomoe.jpg" height="70px" width="70px" alt="State Ministry of Education" />
            </div>
            <h2>
              State Ministry of Education <br /> Registration
            </h2>
            <p>Create your official account to access all integrated ministry digital platforms and services.</p>
          </div>

          <div className="al-mid">
            <h3>
              Join the <br /> <span className="hl">Portal.</span>
            </h3>
            <p>
              Registration takes about 2 minutes. Your account will be reviewed and activated within
              24–48 hours by the ICT Directorate.
            </p>
            <div className="steps">
              <div className="step-item">
                <div className="step-num">01</div>
                <div className="step-text">
                  <h5>Enter Your Details</h5>
                  <p>Name, state, school, email and password.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-num">02</div>
                <div className="step-text">
                  <h5>Account Review</h5>
                  <p>ICT Directorate reviews and activates within 48 hours.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-num">03</div>
                <div className="step-text">
                  <h5>Access Systems</h5>
                  <p>Log in to access all integrated education platforms.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="al-foot">
            For Official Ministry Staff Only — Registration is free and mandatory for portal access.
          </div>
        </div>

        {/* Right Panel */}
        <div className="auth-right">
          <Link to="/" className="back-link">
            ← Back to Home
          </Link>

          <div className="form-header">
            <h1>Create Account</h1>
            <p>
              Already registered? <Link to="/login">Sign in here</Link>
            </p>
          </div>

          <AlertBox type="error" message={error} />
          <AlertBox type="success" message={success} />

          <form onSubmit={handleSubmit}>
            {/* Personal Information */}
            <div className="form-card">
              <div className="form-section-label">Personal Information</div>
              <div className="field-row-2">
                <div className="form-field">
                  <label>First Name *</label>
                  <div className="input-wrap">
                    <span className="i-ico">👤</span>
                    <input
                      type="text"
                      id="first_name"
                      placeholder="e.g. Ngozi"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label>Last Name *</label>
                  <div className="input-wrap">
                    <span className="i-ico">👤</span>
                    <input
                      type="text"
                      id="last_name"
                      placeholder="e.g. Okafor"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location / School */}
            <div className="form-card">
              <div className="form-section-label">Location & School</div>
              <div className="field-row-2">
                <div className="form-field">
                  <label>State *</label>
                  <div className="input-wrap">
                    <span className="i-ico">📍</span>
                    <select
                      id="state_id"
                      value={formData.state_id}
                      onChange={handleChange}
                      required
                      disabled={statesLoading}
                    >
                      <option value="">
                        {statesLoading ? 'Loading states...' : '— Select State —'}
                      </option>
                      {states.map((state) => (
                        <option key={state.state_id} value={state.state_id}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {states.length === 0 && !statesLoading && (
                    <span className="field-hint error-hint">
                      Unable to load states. Please refresh the page.
                    </span>
                  )}
                </div>
                <div className="form-field">
                  <label>School / Station</label>
                  <div className="input-wrap">
                    <span className="i-ico">🏫</span>
                    <input
                      type="text"
                      id="school_id"
                      placeholder="Optional — school or office code"
                      value={formData.school_id}
                      onChange={handleChange}
                    />
                  </div>
                  <span className="field-hint">Leave blank if not applicable.</span>
                </div>
              </div>
            </div>

            {/* Account Credentials */}
            <div className="form-card">
              <div className="form-section-label">Account Credentials</div>
              <div className="form-field">
                <label>Email Address *</label>
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
                <span className="field-hint">
                  Use your official ministry email. Personal emails (Gmail, Yahoo) will be rejected.
                </span>
              </div>

              <div className="form-field">
                <label>Password *</label>
                <div className="input-wrap">
                  <span className="i-ico">🔒</span>
                  <input
                    type="password"
                    id="password"
                    placeholder="Min. 6 chars (upper, lower, number)"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <PasswordStrength password={formData.password} />
              </div>

              <div className="form-field">
                <label>Confirm Password *</label>
                <div className="input-wrap">
                  <span className="i-ico">🔒</span>
                  <input
                    type="password"
                    id="confirmPassword"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="submit-area">
              <div className="check-row">
                <input
                  type="checkbox"
                  id="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                />
                <label htmlFor="termsAccepted">
                  I confirm I am an authorised Ministry of Education staff member and I agree to the{' '}
                  <a href="#">Terms of Use</a>, <a href="#">Data Privacy Policy</a>, and the{' '}
                  <a href="#">Acceptable Use Policy</a>.
                </label>
              </div>

              <button
                type="submit"
                className="btn-submit"
                disabled={loading || statesLoading}
              >
                {loading ? 'Submitting...' : 'Submit Registration'}
              </button>

              <div className="review-note">
                <span className="ico">📋</span>
                <span>
                  Your account will be reviewed by the <strong>ICT Directorate</strong> within{' '}
                  <strong>24–48 working hours</strong>. You'll receive a confirmation email once
                  activated. For urgent access contact <strong>ict@moe.state.gov.ng</strong> or call{' '}
                  <strong>+234 800 000 0000</strong>.
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Register;