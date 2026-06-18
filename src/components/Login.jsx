import React from "react";

function Login() {
  return (
    <section className="auth login" id="login">
      <h2 className="sec-title">Login</h2>
      <form className="auth-form">
        <label>
          Email
          <input type="email" name="email" required />
        </label>
        <label>
          Password
          <input type="password" name="password" required />
        </label>
        <button type="submit" className="btn-primary">Sign In</button>
      </form>
    </section>
  );
}

export default Login;
