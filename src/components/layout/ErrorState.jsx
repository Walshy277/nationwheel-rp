const ErrorState = ({ title, message, action }) => (
  <div className="error-state">
    <h2>{title}</h2>
    {message && <p>{message}</p>}
    {action}
  </div>
);

export default ErrorState;

