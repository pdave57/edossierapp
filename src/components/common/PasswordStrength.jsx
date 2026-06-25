// src/components/Common/PasswordStrength.jsx
import React from 'react';

const PasswordStrength = ({ password }) => {
  const getStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const score = getStrength(password);
  const labels = ['Enter a password', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#ddd', '#e74c3c', '#e67e22', '#f0c020', '#5d9e4a'];

  return (
    <div>
      <div className="strength-bar">
        {[1,2,3,4].map(i => (
          <div
            key={i}
            className="sb-seg"
            style={{ background: i <= score ? colors[score] : 'var(--border)' }}
          />
        ))}
      </div>
      <div className="strength-label" style={{ color: colors[score] || 'var(--gray-l)' }}>
        {password ? `Strength: ${labels[score]}` : labels[0]}
      </div>
    </div>
  );
};

export default PasswordStrength;