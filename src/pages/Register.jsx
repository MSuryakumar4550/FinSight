import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Auth.css";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match!");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters!");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:8080/api/auth/register",
        { name: form.name, email: form.email, password: form.password }
      );
      localStorage.setItem("token",  res.data.token);
      localStorage.setItem("userId", res.data.userId);
      localStorage.setItem("name",   res.data.name);
      localStorage.setItem("email",  res.data.email);
      navigate("/");
    } catch (err) {
      setError(err.response?.data || "Registration failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">✦</div>
          <div>
            <h1 className="auth-brand">FinSight</h1>
            <p className="auth-tagline">Smarter spending starts here.</p>
          </div>
        </div>

        <h2 className="auth-title">Create account</h2>
        <p className="auth-sub">Start tracking your expenses today</p>

        {error && (
          <div className="auth-error">❌ {error}</div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Full Name</label>
            <input
              className="auth-input"
              type="text"
              name="name"
              placeholder="e.g. Suryakumar"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Email Address</label>
            <input
              className="auth-input"
              type="email"
              name="email"
              placeholder="surya@gmail.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              name="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Confirm Password</label>
            <input
              className="auth-input"
              type="password"
              name="confirm"
              placeholder="Re-enter password"
              value={form.confirm}
              onChange={handleChange}
              required
            />
          </div>

          <button
            className="auth-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}