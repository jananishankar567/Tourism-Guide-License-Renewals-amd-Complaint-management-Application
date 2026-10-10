// // // import React, { useState } from "react";

// // // function Login() {
// // //   const [email, setEmail] = useState("");
// // //   const [password, setPassword] = useState("");

// // //   const handleLogin = (e) => {
// // //     e.preventDefault();

// // //     console.log("Email:", email);
// // //     console.log("Password:", password);
// // //   };

// // //   return (
// // //     <div className="login-page">
// // //       <div className="login-container">

// // //         {/* Left Section */}
// // //         <div className="login-left">
// // //           <div className="brand">
// // //             <div className="brand-icon">TG</div>
// // //             <span>Tourism Guide Portal</span>
// // //           </div>

// // //           <div className="welcome-content">
// // //             <h1>Welcome Back!</h1>
// // //             <p>
// // //               Login to manage your tourism guide license,
// // //               renewals and complaints.
// // //             </p>
// // //           </div>
// // //         </div>

// // //         {/* Right Section */}
// // //         <div className="login-right">
// // //           <div className="login-box">

// // //             <h2>Sign In</h2>
// // //             <p className="login-subtitle">
// // //               Access your applicant account
// // //             </p>

// // //             <form onSubmit={handleLogin}>

// // //               {/* Email */}
// // //               <div className="form-group">
// // //                 <label>Email Address</label>
// // //                 <input
// // //                   type="email"
// // //                   placeholder="Enter your email"
// // //                   value={email}
// // //                   onChange={(e) => setEmail(e.target.value)}
// // //                   required
// // //                 />
// // //               </div>

// // //               {/* Password */}
// // //               <div className="form-group">
// // //                 <label>Password</label>
// // //                 <input
// // //                   type="password"
// // //                   placeholder="Enter your password"
// // //                   value={password}
// // //                   onChange={(e) => setPassword(e.target.value)}
// // //                   required
// // //                 />
// // //               </div>

// // //               <div className="login-options">
// // //                 <label className="remember">
// // //                   <input type="checkbox" />
// // //                   Remember me
// // //                 </label>

// // //                 <a href="/forgot-password">
// // //                   Forgot Password?
// // //                 </a>
// // //               </div>

// // //               <button type="submit" className="login-button">
// // //                 Login
// // //               </button>

// // //             </form>

// // //             <div className="signup-section">
// // //               <span>New applicant?</span>
// // //               <a href="/signup">Create an account</a>
// // //             </div>

// // //           </div>
// // //         </div>

// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // export default Login;

// // import React, { useState } from "react";

// // function Login() {
// //   const [email, setEmail] = useState("");
// //   const [password, setPassword] = useState("");

// //   const handleLogin = async (e) => {
// //     e.preventDefault();

// //     try {
// //       const response = await fetch("http://localhost:5000/api/auth/login", {
// //         method: "POST",
// //         headers: {
// //           "Content-Type": "application/json",
// //         },
// //         body: JSON.stringify({
// //           email,
// //           password,
// //         }),
// //       });

// //       const data = await response.json();

// //       if (!response.ok) {
// //         alert(data.message || "Login failed");
// //         return;
// //       }

// //       // Store JWT token in browser
// //       localStorage.setItem("token", data.token);

// //       alert("Login successful!");

// //       console.log("Login response:", data);

// //       // Redirect to dashboard
// //       window.location.href = "/dashboard";
// //     } catch (error) {
// //       console.error("Login error:", error);
// //       alert("Unable to connect to the server.");
// //     }
// //   };

// //   return (
// //     <div className="login-page">
// //       <div className="login-container">

// //         {/* Left Section */}
// //         <div className="login-left">
// //           <div className="brand">
// //             <div className="brand-icon">TG</div>
// //             <span>Tourism Guide Portal</span>
// //           </div>

// //           <div className="welcome-content">
// //             <h1>Welcome Back!</h1>

// //             <p>
// //               Login to manage your tourism guide license,
// //               renewals and complaints.
// //             </p>
// //           </div>
// //         </div>

// //         {/* Right Section */}
// //         <div className="login-right">
// //           <div className="login-box">

// //             <h2>Sign In</h2>

// //             <p className="login-subtitle">
// //               Access your applicant account
// //             </p>

// //             <form onSubmit={handleLogin}>

// //               {/* Email */}
// //               <div className="form-group">
// //                 <label>Email Address</label>

// //                 <input
// //                   type="email"
// //                   placeholder="Enter your email"
// //                   value={email}
// //                   onChange={(e) => setEmail(e.target.value)}
// //                   required
// //                 />
// //               </div>

// //               {/* Password */}
// //               <div className="form-group">
// //                 <label>Password</label>

// //                 <input
// //                   type="password"
// //                   placeholder="Enter your password"
// //                   value={password}
// //                   onChange={(e) => setPassword(e.target.value)}
// //                   required
// //                 />
// //               </div>

// //               {/* Remember + Forgot Password */}
// //               <div className="login-options">

// //                 <label className="remember">
// //                   <input type="checkbox" />
// //                   Remember me
// //                 </label>

// //                 <a href="/forgot-password">
// //                   Forgot Password?
// //                 </a>

// //               </div>

// //               {/* Login Button */}
// //               <button
// //                 type="submit"
// //                 className="login-button"
// //               >
// //                 Login
// //               </button>

// //             </form>

// //             {/* Signup */}
// //             <div className="signup-section">
// //               <span>New applicant?</span>

// //               <a href="/signup">
// //                 Create an account
// //               </a>
// //             </div>

// //           </div>
// //         </div>

// //       </div>
// //     </div>
// //   );
// // }

// // export default Login;

// import React, { useState } from "react";

// function Login() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);

//   const handleLogin = async (e) => {
//     e.preventDefault();

//     try {
//       const response = await fetch(
//         "http://localhost:5000/api/auth/login",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             email,
//             password,
//           }),
//         }
//       );

//       const data = await response.json();

//       if (!response.ok) {
//         alert(data.message || "Login failed");
//         return;
//       }

//       // Store JWT token in browser
//       localStorage.setItem("token", data.token);

//       // Store applicant email
//       if (data.applicant?.email) {
//         localStorage.setItem(
//           "applicantEmail",
//           data.applicant.email
//         );
//       }

//       alert("Login successful!");

//       console.log("Login response:", data);

//       // Redirect to dashboard
//       window.location.href = "/dashboard";

//     } catch (error) {
//       console.error("Login error:", error);
//       alert("Unable to connect to the server.");
//     }
//   };

//   return (
//     <div className="login-page">

//       <div className="login-container">

//         {/* Left Section */}
//         <div className="login-left">

//           <div className="brand">

//             <div className="brand-icon">
//               TG
//             </div>

//             <span>
//               Tourism Guide Portal
//             </span>

//           </div>

//           <div className="welcome-content">

//             <h1>
//               Welcome Back!
//             </h1>

//             <p>
//               Login to manage your tourism guide license,
//               renewals and complaints.
//             </p>

//           </div>

//         </div>


//         {/* Right Section */}
//         <div className="login-right">

//           <div className="login-box">

//             <h2>
//               Sign In
//             </h2>

//             <p className="login-subtitle">
//               Access your applicant account
//             </p>


//             <form onSubmit={handleLogin}>

//               {/* Email */}
//               <div className="form-group">

//                 <label>
//                   Email Address
//                 </label>

//                 <input
//                   type="email"
//                   placeholder="Enter your email"
//                   value={email}
//                   onChange={(e) =>
//                     setEmail(e.target.value)
//                   }
//                   required
//                 />

//               </div>


//               {/* Password */}
//               <div className="form-group">

//                 <label>
//                   Password
//                 </label>

//                 <div className="password-wrapper">

//                   <input
//                     type={
//                       showPassword
//                         ? "text"
//                         : "password"
//                     }
//                     placeholder="Enter your password"
//                     value={password}
//                     onChange={(e) =>
//                       setPassword(e.target.value)
//                     }
//                     required
//                   />

//                   <button
//                     type="button"
//                     className="password-toggle"
//                     onClick={() =>
//                       setShowPassword(!showPassword)
//                     }
//                     aria-label={
//                       showPassword
//                         ? "Hide password"
//                         : "Show password"
//                     }
//                   >
//                     {showPassword ? "◉" : "◉"}
//                   </button>

//                 </div>

//               </div>


//               {/* Remember + Forgot Password */}
//               <div className="login-options">

//                 <label className="remember">

//                   <input
//                     type="checkbox"
//                   />

//                   Remember me

//                 </label>


//                 <a href="/forgot-password">
//                   Forgot Password?
//                 </a>

//               </div>


//               {/* Login Button */}
//               <button
//                 type="submit"
//                 className="login-button"
//               >
//                 Login
//               </button>

//             </form>


//             {/* Signup */}
//             <div className="signup-section">

//               <span>
//                 New applicant?
//               </span>

//               <a href="/signup">
//                 Create an account
//               </a>

//             </div>

//           </div>

//         </div>

//       </div>

//     </div>
//   );
// }

// export default Login;
import React, { useState } from "react";
import { API_BASE_URL } from "./api";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      /*
       * First try Applicant login
       */
      const applicantResponse = await fetch(
        `${API_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: trimmedEmail,
            password
          })
        }
      );

      const applicantData =
        await applicantResponse.json();

      /*
       * Applicant login successful
       */
      if (applicantResponse.ok) {
        localStorage.setItem(
          "token",
          applicantData.token
        );

        localStorage.setItem(
          "applicant",
          JSON.stringify(applicantData.applicant)
        );

        // Clear officer session if any
        localStorage.removeItem("officerToken");
        localStorage.removeItem("officer");

        const accountType = applicantData.applicant?.accountType || "Guide";
        const tourismReturnTo = localStorage.getItem("tourismReturnTo");
        localStorage.removeItem("tourismReturnTo");
        navigate(
          accountType === "Tourist" &&
            tourismReturnTo?.startsWith("/tourism/join/")
            ? tourismReturnTo
            : accountType === "Tourist"
              ? "/tourism/tourist"
              : "/dashboard"
        );
        return;
      }

      /*
       * If applicant login fails,
       * try Officer/Admin login
       */
      const officerResponse = await fetch(
        `${API_BASE_URL}/api/officer/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: trimmedEmail,
            password
          })
        }
      );

      const officerData =
        await officerResponse.json();

      /*
       * Officer/Admin login successful
       */
      if (officerResponse.ok) {
        localStorage.setItem(
          "officerToken",
          officerData.token
        );

        localStorage.setItem(
          "officer",
          JSON.stringify(officerData.officer)
        );

        // Clear applicant session if any
        localStorage.removeItem("token");
        localStorage.removeItem("applicant");

        /*
         * Both Officer and Admin use
         * the administration dashboard.
         */
        navigate("/admin-dashboard");
        return;
      }

      /*
       * Both authentication attempts failed
       */
      setError(
        "Invalid email or password. Please check your credentials."
      );

    } catch (error) {
      console.error("Login error:", error);

      setError(
        "Unable to connect to the server. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* LEFT SECTION */}

      <div className="login-left">

        <div className="login-brand">

          <div className="login-logo">
            TG
          </div>

          <div>
            <h1>
              Tourism Guide
            </h1>

            <p>
              License Management System
            </p>
          </div>

        </div>

        <div className="login-welcome">

          <span className="login-badge">
            TOURISM GUIDE SERVICES
          </span>

          <h2>
            Manage Your Tourism
            <br />
            Guide License
          </h2>

          <p>
            Apply for a tourism guide license, track your
            application, renew your license and manage
            complaints through one centralized platform.
          </p>

        </div>

        <div className="login-features">

          <div className="login-feature">
            <span>✓</span>

            <div>
              <strong>
                Online Applications
              </strong>

              <small>
                Apply for your guide license digitally
              </small>
            </div>
          </div>

          <div className="login-feature">
            <span>✓</span>

            <div>
              <strong>
                License Management
              </strong>

              <small>
                Track, manage and renew your license
              </small>
            </div>
          </div>

          <div className="login-feature">
            <span>✓</span>

            <div>
              <strong>
                Transparent Services
              </strong>

              <small>
                Track applications and complaints easily
              </small>
            </div>
          </div>

        </div>

      </div>

      {/* RIGHT SECTION */}

      <div className="login-right">

        <div className="login-card">

          <Link className="login-back-home" to="/">
            <span aria-hidden="true">←</span>
            Back to Home
          </Link>

          <div className="login-header">

            <div className="login-icon">
              🔐
            </div>

            <h2>
              Welcome Back
            </h2>

            <p>
              Sign in to access the Tourism Guide
              Management System
            </p>

          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          {location.state?.message && (
            <div className="login-success" role="status">
              {location.state.message}
            </div>
          )}

          <form onSubmit={handleLogin}>

            {/* EMAIL */}

            <div className="login-input-group">

              <label>
                Email Address
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

            </div>

            {/* PASSWORD */}

            <div className="login-input-group">

              <label>
                Password
              </label>

              <div className="login-password-wrapper">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>

              </div>

            </div>

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>

          </form>

          {/* NEW APPLICANT */}

          <div className="signup-section">

            <p>
              Don't have an account?
            </p>

            <button
              type="button"
              onClick={() => navigate("/signup")}
            >
              Create New Applicant Account
            </button>

          </div>

          <div className="login-security">

            <span>🔒</span>

            <p>
              Secure role-based access. Your dashboard
              is automatically determined by your account.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;