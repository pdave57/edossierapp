import React from "react";

function Register() {
  return (
    <section className="auth register" id="register">
      <h2 className="sec-title">Register</h2>
      <form className="auth-form">
        <label>
          Full Name
          <input type="text" name="name" required />
        </label>
        <label>
          Email
          <input type="email" name="email" required />
        </label>
        <label>
          Password
          <input type="password" name="password" required />
        </label>
        <button type="submit" className="btn-primary">Create Account</button>
      </form>
    </section>
  );
}

export default Register;
