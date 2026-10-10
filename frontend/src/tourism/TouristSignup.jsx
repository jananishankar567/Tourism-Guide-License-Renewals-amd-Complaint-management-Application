import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import "./tourism.css";

function TouristSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setError("");
  };

  const submitSignup = async (event) => {
    event.preventDefault();
    setError("");

    if (form.fullName.trim().length < 2 || !/^\d{10}$/.test(form.mobile)) {
      setError("Enter your full name and a valid 10-digit mobile number.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/tourism/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("json")) {
        throw new Error(
          response.status === 404
            ? "Tourist signup API not found. Restart the backend from the backend folder, then try again."
            : `The server returned an unexpected response (${response.status}). Please try again later.`
        );
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to create your tourist account.");
      }
      navigate("/login", {
        state: { message: "Tourist account created. Please sign in." },
      });
    } catch (requestError) {
      setError(requestError.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="tourism-auth-page">
      <Link className="tourism-brand" to="/">
        <span className="tourism-brand-mark">TG</span>
        <span>
          <strong>Tourism Guide Portal</strong>
          <small>Discover with confidence</small>
        </span>
      </Link>

      <section className="tourism-auth-card">
        <Link className="tourism-back-link" to="/" aria-label="Back to home">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            focusable="false"
          >
            <path
              d="M19 12H5m0 0 7 7m-7-7 7-7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Back</span>
        </Link>
        <span className="tourism-eyebrow">TOURIST ACCOUNT</span>
        <h1>Plan a more meaningful visit</h1>
        <p>Create an account to find licensed guides, verify tours, and share trusted feedback.</p>

        {error && <div className="tourism-alert error" role="alert">{error}</div>}

        <form onSubmit={submitSignup} className="tourism-form">
          <label>
            Full name
            <input
              autoComplete="name"
              name="fullName"
              value={form.fullName}
              onChange={updateField}
              required
              maxLength={100}
            />
          </label>
          <label>
            Email address
            <input
              autoComplete="email"
              type="email"
              name="email"
              value={form.email}
              onChange={updateField}
              required
            />
          </label>
          <label>
            Mobile number
            <input
              autoComplete="tel"
              inputMode="numeric"
              name="mobile"
              value={form.mobile}
              onChange={updateField}
              required
              maxLength={10}
              pattern="[0-9]{10}"
            />
          </label>
          <label>
            Password
            <input
              autoComplete="new-password"
              type="password"
              name="password"
              value={form.password}
              onChange={updateField}
              required
              minLength={8}
            />
          </label>
          <button className="tourism-button primary" disabled={loading}>
            {loading ? "Creating account..." : "Create tourist account"}
          </button>
        </form>

        <p className="tourism-auth-footer">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}

export default TouristSignup;
