
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import "./Profile.css";

// const API_URL = "http://localhost:5000/api/profile";

// function Profile() {
//   const navigate = useNavigate();

//   const [applicant, setApplicant] = useState(null);
//   const [form, setForm] = useState({
//     fullName: "",
//     mobile: "",
//   });

//   const [editing, setEditing] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [message, setMessage] = useState("");
//   const [error, setError] = useState("");

//   async function loadProfile() {
//     const token = localStorage.getItem("token");

//     if (!token) {
//       navigate("/login");
//       return;
//     }

//     try {
//       const response = await fetch(`${API_URL}/me`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || "Unable to load profile");
//       }

//       setApplicant(data.applicant);
//       setForm({
//         fullName: data.applicant.fullName || "",
//         mobile: data.applicant.mobile || "",
//       });
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     loadProfile();
//   }, []);

//   function handleChange(event) {
//     setForm({
//       ...form,
//       [event.target.name]: event.target.value,
//     });
//   }

//   async function handleSave(event) {
//     event.preventDefault();

//     setMessage("");
//     setError("");

//     const token = localStorage.getItem("token");

//     if (!token) {
//       navigate("/login");
//       return;
//     }

//     setSaving(true);

//     try {
//       const response = await fetch(`${API_URL}/me`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(form),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || "Unable to update profile");
//       }

//       setApplicant(data.applicant);

//       setForm({
//         fullName: data.applicant.fullName,
//         mobile: data.applicant.mobile,
//       });

//       setEditing(false);
//       setMessage("Your profile was updated successfully.");
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setSaving(false);
//     }
//   }

//   if (loading) {
//     return <div className="profile-loading">Loading your profile...</div>;
//   }

//   return (
//     <div className="profile-page">
//       <header className="profile-topbar">
//         <div className="profile-brand">
//           <div className="profile-logo">TG</div>

//           <div>
//             <h2>Tourism Guide Portal</h2>
//             <p>Applicant Account Centre</p>
//           </div>
//         </div>

//         <button
//           type="button"
//           className="profile-back-button"
//           onClick={() => navigate("/dashboard")}
//         >
//           ← Dashboard
//         </button>
//       </header>

//       <main className="profile-container">
//         <section className="profile-heading">
//           <div>
//             <span className="profile-eyebrow">MY ACCOUNT</span>
//             <h1>My Profile</h1>
//             <p>
//               Manage your personal information and track your portal activity.
//             </p>
//           </div>

//           <div className="profile-avatar">
//             {(applicant?.fullName || "A").charAt(0).toUpperCase()}
//           </div>
//         </section>

//         {/* Success message with close button */}
//         {message && (
//           <div
//             className="profile-alert success"
//             role="status"
//             aria-live="polite"
//           >
//             <span>{message}</span>

//             <button
//               type="button"
//               className="profile-alert-close"
//               onClick={() => setMessage("")}
//               aria-label="Close success message"
//             >
//               ×
//             </button>
//           </div>
//         )}

//         {/* Error message with close button */}
//         {error && (
//           <div
//             className="profile-alert error"
//             role="alert"
//           >
//             <span>{error}</span>

//             <button
//               type="button"
//               className="profile-alert-close"
//               onClick={() => setError("")}
//               aria-label="Close error message"
//             >
//               ×
//             </button>
//           </div>
//         )}

//         <section className="profile-summary">
//           <div>
//             <span className="summary-label">APPLICANT</span>
//             <h2>{applicant?.fullName}</h2>
//             <p>{applicant?.email}</p>
//           </div>

//           <span className="account-badge">Account Active</span>
//         </section>

//         <div className="profile-content-grid">
//           <section className="profile-card personal-card">
//             <div className="profile-card-heading">
//               <div>
//                 <span className="profile-card-icon">01</span>
//                 <h2>Personal Information</h2>
//                 <p>Your registered applicant details</p>
//               </div>

//               {!editing && (
//                 <button
//                   type="button"
//                   className="edit-profile-button"
//                   onClick={() => {
//                     setMessage("");
//                     setError("");
//                     setEditing(true);
//                   }}
//                 >
//                   ✎ Edit
//                 </button>
//               )}
//             </div>

//             <form onSubmit={handleSave}>
//               <label htmlFor="fullName">Full Name</label>
//               <input
//                 id="fullName"
//                 name="fullName"
//                 value={form.fullName}
//                 onChange={handleChange}
//                 disabled={!editing || saving}
//                 required
//                 maxLength={100}
//               />

//               <label htmlFor="email">Registered Email</label>
//               <input
//                 id="email"
//                 value={applicant?.email || ""}
//                 disabled
//                 readOnly
//               />

//               <small>
//                 Email changes require a separate verification process.
//               </small>

//               <label htmlFor="mobile">Mobile Number</label>
//               <input
//                 id="mobile"
//                 name="mobile"
//                 type="tel"
//                 value={form.mobile}
//                 onChange={handleChange}
//                 disabled={!editing || saving}
//                 required
//                 maxLength={20}
//               />

//               <label htmlFor="accountCreated">Account Created</label>
//               <input
//                 id="accountCreated"
//                 value={
//                   applicant?.createdAt
//                     ? new Date(applicant.createdAt).toLocaleDateString(
//                         "en-IN",
//                         {
//                           day: "2-digit",
//                           month: "long",
//                           year: "numeric",
//                         }
//                       )
//                     : "Not available"
//                 }
//                 disabled
//                 readOnly
//               />

//               {editing && (
//                 <div className="profile-form-actions">
//                   <button
//                     type="button"
//                     className="cancel-edit-button"
//                     disabled={saving}
//                     onClick={() => {
//                       setForm({
//                         fullName: applicant?.fullName || "",
//                         mobile: applicant?.mobile || "",
//                       });

//                       setEditing(false);
//                       setError("");
//                       setMessage("");
//                     }}
//                   >
//                     Cancel
//                   </button>

//                   <button
//                     type="submit"
//                     className="save-profile-button"
//                     disabled={saving}
//                   >
//                     {saving ? "Saving..." : "Save Changes"}
//                   </button>
//                 </div>
//               )}
//             </form>
//           </section>

//           <div className="profile-side-column">
//             <section className="profile-card">
//               <div className="profile-card-heading">
//                 <div>
//                   <span className="profile-card-icon">02</span>
//                   <h2>Application Status</h2>
//                   <p>Your licensing progress</p>
//                 </div>
//               </div>

//               <div className="profile-placeholder">
//                 <span className="placeholder-icon">▤</span>
//                 <h3>Status tracking</h3>
//                 <p>
//                   Your application status and officer remarks will appear here
//                   when connected to your application records.
//                 </p>

//                 <button
//                   type="button"
//                   onClick={() => navigate("/application-status")}
//                 >
//                   View Application Status →
//                 </button>
//               </div>
//             </section>

//             <section className="profile-card">
//               <div className="profile-card-heading">
//                 <div>
//                   <span className="profile-card-icon">03</span>
//                   <h2>Notifications</h2>
//                   <p>Important account updates</p>
//                 </div>
//               </div>

//               <div className="profile-placeholder">
//                 <span className="placeholder-icon">♧</span>
//                 <h3>Stay informed</h3>
//                 <p>
//                   Application decisions, complaint updates, and renewal
//                   reminders will appear here once notification services are
//                   connected.
//                 </p>
//               </div>
//             </section>
//           </div>
//         </div>
//       </main>

//       <footer className="profile-footer">
//         Tourism Guide License Management System · Applicant Account Centre
//       </footer>
//     </div>
//   );
// }

// export default Profile;


import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import "./Profile.css";

const API_URL = `${API_BASE_URL}/api/profile`;

function Profile() {
  const navigate = useNavigate();

  const [applicant, setApplicant] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
  });

  const [application, setApplication] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadProfile() {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const [profileResponse, applicationResponse] = await Promise.all([
        fetch(`${API_URL}/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_URL}/applications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const profileData = await profileResponse.json();
      const applicationData = await applicationResponse.json();

      if (!profileResponse.ok) {
        throw new Error(
          profileData.message || "Unable to load profile"
        );
      }

      setApplicant(profileData.applicant);

      setForm({
        fullName: profileData.applicant.fullName || "",
        mobile: profileData.applicant.mobile || "",
      });

      if (!applicationResponse.ok) {
        throw new Error(
          applicationData.message ||
            "Unable to load application details"
        );
      }

      const applications = applicationData.applications || [];

      setApplication(applications.length > 0 ? applications[0] : null);
    } catch (err) {
      setError(err.message || "Unable to load your account details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
    // Load the logged-in applicant's profile on page entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSave(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!/^\d{10}$/.test(form.mobile.trim())) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          mobile: form.mobile.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update profile");
      }

      setApplicant(data.applicant);

      setForm({
        fullName: data.applicant.fullName || "",
        mobile: data.applicant.mobile || "",
      });

      setEditing(false);
      setMessage("Your profile was updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  }

  function formatDate(date) {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function getStatusClass(status) {
    switch ((status || "").toLowerCase()) {
      case "approved":
        return "application-status-approved";
      case "rejected":
        return "application-status-rejected";
      case "returned":
        return "application-status-returned";
      case "under verification":
        return "application-status-pending";
      case "submitted":
        return "application-status-submitted";
      default:
        return "application-status-default";
    }
  }

  if (loading) {
    return <div className="profile-loading">Loading your profile...</div>;
  }

  return (
    <div className="profile-page">
      <header className="profile-topbar">
        <div className="profile-brand">
          <div className="profile-logo">TG</div>
          <div>
            <h2>Tourism Guide Portal</h2>
            <p>Applicant Account Centre</p>
          </div>
        </div>

        <button
          type="button"
          className="profile-back-button"
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>
      </header>

      <main className="profile-container">
        <section className="profile-heading">
          <div>
            <span className="profile-eyebrow">MY ACCOUNT</span>
            <h1>My Profile</h1>
            <p>
              Manage your personal information and track your portal activity.
            </p>
          </div>

          <div className="profile-avatar">
            {(applicant?.fullName || "A").charAt(0).toUpperCase()}
          </div>
        </section>

        {message && (
          <div
            className="profile-alert success"
            role="status"
            aria-live="polite"
          >
            <span>{message}</span>
            <button
              type="button"
              className="profile-alert-close"
              onClick={() => setMessage("")}
              aria-label="Close success message"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="profile-alert error" role="alert">
            <span>{error}</span>
            <button
              type="button"
              className="profile-alert-close"
              onClick={() => setError("")}
              aria-label="Close error message"
            >
              ×
            </button>
          </div>
        )}

        <section className="profile-summary">
          <div>
            <span className="summary-label">APPLICANT</span>
            <h2>{applicant?.fullName}</h2>
            <p>{applicant?.email}</p>
          </div>

          <span className="account-badge">Account Active</span>
        </section>

        <div className="profile-content-grid">
          <section className="profile-card personal-card">
            <div className="profile-card-heading">
              <div>
                <span className="profile-card-icon">01</span>
                <h2>Personal Information</h2>
                <p>Your registered applicant details</p>
              </div>

              {!editing && (
                <button
                  type="button"
                  className="edit-profile-button"
                  onClick={() => {
                    setMessage("");
                    setError("");
                    setEditing(true);
                  }}
                >
                  ✎ Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSave}>
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                disabled={!editing || saving}
                required
                minLength={2}
                maxLength={100}
              />

              <label htmlFor="email">Registered Email</label>
              <input
                id="email"
                value={applicant?.email || ""}
                disabled
                readOnly
              />

              <small>
                Email changes require a separate verification process.
              </small>

              <label htmlFor="mobile">Mobile Number</label>
              <input
                id="mobile"
                name="mobile"
                type="tel"
                value={form.mobile}
                onChange={handleChange}
                disabled={!editing || saving}
                required
                maxLength={10}
                inputMode="numeric"
              />

              <label htmlFor="accountCreated">Account Created</label>
              <input
                id="accountCreated"
                value={formatDate(applicant?.createdAt)}
                disabled
                readOnly
              />

              {editing && (
                <div className="profile-form-actions">
                  <button
                    type="button"
                    className="cancel-edit-button"
                    disabled={saving}
                    onClick={() => {
                      setForm({
                        fullName: applicant?.fullName || "",
                        mobile: applicant?.mobile || "",
                      });
                      setEditing(false);
                      setError("");
                      setMessage("");
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="save-profile-button"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </form>
          </section>

          <div className="profile-side-column">
            <section className="profile-card">
              <div className="profile-card-heading">
                <div>
                  <span className="profile-card-icon">02</span>
                  <h2>Application Status</h2>
                  <p>Your licensing progress</p>
                </div>
              </div>

              {application ? (
                <div className="profile-application-details">
                  <span className="summary-label">CURRENT STATUS</span>

                  <div>
                    <span
                      className={`application-status ${getStatusClass(
                        application.applicationStatus
                      )}`}
                    >
                      {application.applicationStatus || "Not available"}
                    </span>
                  </div>

                  <div className="application-info-row">
                    <span>Application Date</span>
                    <strong>{formatDate(application.createdAt)}</strong>
                  </div>

                  <div className="application-info-row">
                    <span>License Number</span>
                    <strong>
                      {application.licenseNumber || "Not issued"}
                    </strong>
                  </div>

                  <div className="application-info-row">
                    <span>Issue Date</span>
                    <strong>{formatDate(application.licenseIssueDate)}</strong>
                  </div>

                  <div className="application-info-row">
                    <span>Expiry Date</span>
                    <strong>{formatDate(application.licenseExpiryDate)}</strong>
                  </div>

                  <div className="officer-remarks">
                    <strong>Officer Remarks</strong>
                    <p>
                      {application.officerRemarks?.trim()
                        ? application.officerRemarks
                        : "No remarks provided by the officer."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/application-status")}
                  >
                    View Application Status →
                  </button>
                </div>
              ) : (
                <div className="profile-placeholder">
                  <span className="placeholder-icon">▤</span>
                  <h3>No application found</h3>
                  <p>
                    Your submitted guide license application will appear here
                    once it is available in your account.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/application-status")}
                  >
                    View Application Status →
                  </button>
                </div>
              )}
            </section>

            <section className="profile-card">
              <div className="profile-card-heading">
                <div>
                  <span className="profile-card-icon">03</span>
                  <h2>Notifications</h2>
                  <p>Important account updates</p>
                </div>
              </div>

              <div className="profile-placeholder">
                <span className="placeholder-icon">♧</span>
                <h3>Stay informed</h3>
                <p>
                  Application decisions, complaint updates, and renewal
                  reminders will appear here once notification services are
                  connected.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="profile-footer">
        Tourism Guide License Management System · Applicant Account Centre
      </footer>
    </div>
  );
}

export default Profile;