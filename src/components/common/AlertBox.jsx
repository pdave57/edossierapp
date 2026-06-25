// src/components/Common/AlertBox.jsx
import React from 'react';

const AlertBox = ({ type, message }) => {
  if (!message) return null;

  return (
    <div className={`alert-box ${type}`} style={{ display: 'block' }}>
      {message}
    </div>
  );
};

export default AlertBox;