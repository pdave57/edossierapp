const AlertBox = ({ type, message }) => {
  if (!message) return null;

  return (
    <div className={`alert-box ${type === 'error' ? 'error' : type}`} style={{ display: 'block' }}>
      {message}
    </div>
  );
};

export default AlertBox;