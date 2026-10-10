// // import "./Signup.css";
// // import { useNavigate } from "react-router-dom";

// // function Signup() {
// //   const navigate = useNavigate();

// //   return (
// //     <div className="signup-page">

// //       {/* Header */}
// //       <header className="signup-header">

// //         <div className="signup-brand">

// //           <div className="signup-brand-mark">
// //             TG
// //           </div>

// //           <div>
// //             <h1>Tourism Guide Portal</h1>
// //             <span>License Management System</span>
// //           </div>

// //         </div>

// //         <button
// //           className="back-button"
// //           onClick={() => navigate("/")}
// //         >
// //           ← Back to Home
// //         </button>

// //       </header>


// //       {/* Main Content */}
// //       <main className="signup-main">

// //         {/* Left Information Section */}
// //         <section className="signup-intro">

// //           <div className="intro-label">
// //             NEW APPLICANT
// //           </div>

// //           <h2>
// //             Create your
// //             <span> applicant account</span>
// //           </h2>

// //           <p>
// //             Register with the Tourism Guide Portal to begin
// //             your application for a Tamil Nadu Local-Level
// //             Tourist Guide License.
// //           </p>


// //           {/* Steps */}
// //           <div className="registration-steps">

// //             <div className="registration-step active">

// //               <div className="step-number">
// //                 1
// //               </div>

// //               <div>
// //                 <h4>Create Account</h4>
// //                 <p>
// //                   Enter your basic account details.
// //                 </p>
// //               </div>

// //             </div>


// //             <div className="registration-step">

// //               <div className="step-number">
// //                 2
// //               </div>

// //               <div>
// //                 <h4>Complete Profile</h4>
// //                 <p>
// //                   Provide your personal information.
// //                 </p>
// //               </div>

// //             </div>


// //             <div className="registration-step">

// //               <div className="step-number">
// //                 3
// //               </div>

// //               <div>
// //                 <h4>Apply for License</h4>
// //                 <p>
// //                   Submit your license application.
// //                 </p>
// //               </div>

// //             </div>

// //           </div>

// //         </section>


// //         {/* Registration Card */}
// //         <section className="signup-card">

// //           <div className="signup-card-header">

// //             <div>
// //               <span>STEP 1 OF 3</span>

// //               <h3>Create Account</h3>

// //               <p>
// //                 Enter your details to register.
// //               </p>
// //             </div>

// //           </div>


// //           <form>

// //             {/* Full Name */}
// //             <div className="form-group">

// //               <label htmlFor="fullName">
// //                 Full Name
// //               </label>

// //               <input
// //                 type="text"
// //                 id="fullName"
// //                 placeholder="Enter your full name"
// //               />

// //             </div>


// //             {/* Email */}
// //             <div className="form-group">

// //               <label htmlFor="email">
// //                 Email Address
// //               </label>

// //               <input
// //                 type="email"
// //                 id="email"
// //                 placeholder="Enter your email address"
// //               />

// //             </div>


// //             {/* Mobile */}
// //             <div className="form-group">

// //               <label htmlFor="mobile">
// //                 Mobile Number
// //               </label>

// //               <input
// //                 type="tel"
// //                 id="mobile"
// //                 placeholder="Enter your 10-digit mobile number"
// //               />

// //             </div>


// //             {/* Password Row */}
// //             <div className="form-row">

// //               <div className="form-group">

// //                 <label htmlFor="password">
// //                   Password
// //                 </label>

// //                 <input
// //                   type="password"
// //                   id="password"
// //                   placeholder="Create a password"
// //                 />

// //               </div>


// //               <div className="form-group">

// //                 <label htmlFor="confirmPassword">
// //                   Confirm Password
// //                 </label>

// //                 <input
// //                   type="password"
// //                   id="confirmPassword"
// //                   placeholder="Confirm your password"
// //                 />

// //               </div>

// //             </div>


// //             {/* Terms */}
// //             <div className="terms">

// //               <input
// //                 type="checkbox"
// //                 id="terms"
// //               />

// //               <label htmlFor="terms">
// //                 I agree to the Terms of Use and Privacy Policy
// //                 of the Tourism Guide Portal.
// //               </label>

// //             </div>


// //             {/* Submit */}
// //             <button
// //               type="button"
// //               className="create-account-button"
// //             >
// //               Create Applicant Account
// //               <span>→</span>
// //             </button>

// //           </form>


// //           {/* Existing account */}
// //           <div className="existing-account">

// //             <span>
// //               Already have an account?
// //             </span>

// //             <button>
// //               Login
// //             </button>

// //           </div>

// //         </section>

// //       </main>


// //       {/* Footer */}
// //       <footer className="signup-footer">

// //         <span>
// //           © 2026 Tourism Guide Portal
// //         </span>

// //         <span>
// //           Secure Digital Licensing System
// //         </span>

// //       </footer>

// //     </div>
// //   );
// // }

// // export default Signup;
// import "./Signup.css";
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";

// function Signup() {
//   const navigate = useNavigate();

//   const [formData, setFormData] = useState({
//     fullName: "",
//     email: "",
//     mobile: "",
//     password: "",
//     confirmPassword: ""
//   });

//   const [agreeTerms, setAgreeTerms] = useState(false);

//   const [message, setMessage] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);


//   // Handle input changes
//   const handleChange = (event) => {
//     const { name, value } = event.target;

//     setFormData({
//       ...formData,
//       [name]: value
//     });

//     setError("");
//     setMessage("");
//   };


//   // Submit registration
//   const handleSubmit = async (event) => {
//     event.preventDefault();

//     setError("");
//     setMessage("");


//     // Check required fields
//     if (
//       !formData.fullName ||
//       !formData.email ||
//       !formData.mobile ||
//       !formData.password ||
//       !formData.confirmPassword
//     ) {
//       setError("Please fill in all required fields.");
//       return;
//     }


//     // Validate email
//     const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//     if (!emailPattern.test(formData.email)) {
//       setError("Please enter a valid email address.");
//       return;
//     }


//     // Validate mobile
//     const mobilePattern = /^[0-9]{10}$/;

//     if (!mobilePattern.test(formData.mobile)) {
//       setError("Mobile number must contain exactly 10 digits.");
//       return;
//     }


//     // Validate password length
//     if (formData.password.length < 8) {
//       setError("Password must contain at least 8 characters.");
//       return;
//     }


//     // Check password confirmation
//     if (formData.password !== formData.confirmPassword) {
//       setError("Passwords do not match.");
//       return;
//     }


//     // Check terms
//     if (!agreeTerms) {
//       setError("Please accept the Terms of Use and Privacy Policy.");
//       return;
//     }


//     try {

//       setLoading(true);


//       const response = await fetch(
//         "http://localhost:5000/api/auth/register",
//         {
//           method: "POST",

//           headers: {
//             "Content-Type": "application/json"
//           },

//           body: JSON.stringify({
//             fullName: formData.fullName,
//             email: formData.email,
//             mobile: formData.mobile,
//             password: formData.password
//           })
//         }
//       );


//       const data = await response.json();


//       if (!response.ok) {
//         setError(data.message || "Registration failed.");
//         return;
//       }


//       // Registration successful
//       setMessage(
//         "Account created successfully! You can now login."
//       );


//       // Clear form
//       setFormData({
//         fullName: "",
//         email: "",
//         mobile: "",
//         password: "",
//         confirmPassword: ""
//       });

//       setAgreeTerms(false);


//     } catch (error) {

//       console.error("Registration error:", error);

//       setError(
//         "Unable to connect to the server. Please make sure the backend is running."
//       );

//     } finally {

//       setLoading(false);

//     }
//   };


//   return (
//     <div className="signup-page">

//       {/* Header */}
//       <header className="signup-header">

//         <div className="signup-brand">

//           <div className="signup-brand-mark">
//             TG
//           </div>

//           <div>
//             <h1>Tourism Guide Portal</h1>
//             <span>License Management System</span>
//           </div>

//         </div>


//         <button
//           className="back-button"
//           onClick={() => navigate("/")}
//         >
//           ← Back to Home
//         </button>

//       </header>


//       {/* Main */}
//       <main className="signup-main">

//         {/* Left Information */}
//         <section className="signup-intro">

//           <div className="intro-label">
//             NEW APPLICANT
//           </div>

//           <h2>
//             Create your
//             <span> applicant account</span>
//           </h2>

//           <p>
//             Register with the Tourism Guide Portal to begin
//             your application for a Tamil Nadu Local-Level
//             Tourist Guide License.
//           </p>


//           {/* Registration Steps */}
//           <div className="registration-steps">

//             <div className="registration-step active">

//               <div className="step-number">
//                 1
//               </div>

//               <div>
//                 <h4>Create Account</h4>
//                 <p>
//                   Enter your basic account details.
//                 </p>
//               </div>

//             </div>


//             <div className="registration-step">

//               <div className="step-number">
//                 2
//               </div>

//               <div>
//                 <h4>Complete Profile</h4>
//                 <p>
//                   Provide your personal information.
//                 </p>
//               </div>

//             </div>


//             <div className="registration-step">

//               <div className="step-number">
//                 3
//               </div>

//               <div>
//                 <h4>Apply for License</h4>
//                 <p>
//                   Submit your license application.
//                 </p>
//               </div>

//             </div>

//           </div>

//         </section>


//         {/* Registration Card */}
//         <section className="signup-card">

//           <div className="signup-card-header">

//             <div>

//               <span>
//                 STEP 1 OF 3
//               </span>

//               <h3>
//                 Create Account
//               </h3>

//               <p>
//                 Enter your details to register.
//               </p>

//             </div>

//           </div>


//           <form onSubmit={handleSubmit}>

//             {/* Full Name */}
//             <div className="form-group">

//               <label htmlFor="fullName">
//                 Full Name
//               </label>

//               <input
//                 type="text"
//                 id="fullName"
//                 name="fullName"
//                 value={formData.fullName}
//                 onChange={handleChange}
//                 placeholder="Enter your full name"
//               />

//             </div>


//             {/* Email */}
//             <div className="form-group">

//               <label htmlFor="email">
//                 Email Address
//               </label>

//               <input
//                 type="email"
//                 id="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 placeholder="Enter your email address"
//               />

//             </div>


//             {/* Mobile */}
//             <div className="form-group">

//               <label htmlFor="mobile">
//                 Mobile Number
//               </label>

//               <input
//                 type="tel"
//                 id="mobile"
//                 name="mobile"
//                 value={formData.mobile}
//                 onChange={handleChange}
//                 placeholder="Enter your 10-digit mobile number"
//                 maxLength="10"
//               />

//             </div>


//             {/* Password Row */}
//             <div className="form-row">

//               <div className="form-group">

//                 <label htmlFor="password">
//                   Password
//                 </label>

//                 <input
//                   type="password"
//                   id="password"
//                   name="password"
//                   value={formData.password}
//                   onChange={handleChange}
//                   placeholder="Create a password"
//                 />

//               </div>


//               <div className="form-group">

//                 <label htmlFor="confirmPassword">
//                   Confirm Password
//                 </label>

//                 <input
//                   type="password"
//                   id="confirmPassword"
//                   name="confirmPassword"
//                   value={formData.confirmPassword}
//                   onChange={handleChange}
//                   placeholder="Confirm your password"
//                 />

//               </div>

//             </div>


//             {/* Success Message */}
//             {message && (
//               <div className="success-message">
//                 ✓ {message}
//               </div>
//             )}


//             {/* Error Message */}
//             {error && (
//               <div className="error-message">
//                 {error}
//               </div>
//             )}


//             {/* Terms */}
//             <div className="terms">

//               <input
//                 type="checkbox"
//                 id="terms"
//                 checked={agreeTerms}
//                 onChange={(event) =>
//                   setAgreeTerms(event.target.checked)
//                 }
//               />

//               <label htmlFor="terms">
//                 I agree to the Terms of Use and Privacy Policy
//                 of the Tourism Guide Portal.
//               </label>

//             </div>


//             {/* Submit */}
//             <button
//               type="submit"
//               className="create-account-button"
//               disabled={loading}
//             >

//               {loading
//                 ? "Creating Account..."
//                 : "Create Applicant Account"
//               }

//               {!loading && <span>→</span>}

//             </button>

//           </form>


//           {/* Existing account */}
//           <div className="existing-account">

//             <span>
//               Already have an account?
//             </span>

//             <button
//               type="button"
//               onClick={() => {
//                 // Login page will be created next
//                 alert("Login page will be added next.");
//               }}
//             >
//               Login
//             </button>

//           </div>

//         </section>

//       </main>


//       {/* Footer */}
//       <footer className="signup-footer">

//         <span>
//           © 2026 Tourism Guide Portal
//         </span>

//         <span>
//           Secure Digital Licensing System
//         </span>

//       </footer>

//     </div>
//   );
// }

// export default Signup;

import "./Signup.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { API_BASE_URL } from "./api";

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: ""
  });

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value
    });

    setError("");
    setMessage("");
  };

  // Submit registration
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    // Check required fields
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.mobile ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    // Validate email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Validate mobile
    const mobilePattern = /^[0-9]{10}$/;

    if (!mobilePattern.test(formData.mobile)) {
      setError("Mobile number must contain exactly 10 digits.");
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    // Check password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Check terms
    if (!agreeTerms) {
      setError(
        "Please accept the Terms of Use and Privacy Policy."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            mobile: formData.mobile,
            password: formData.password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed.");
        return;
      }

      // Registration successful
      setMessage(
        "Account created successfully! You can now login."
      );

      // Clear form
      setFormData({
        fullName: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: ""
      });

      setAgreeTerms(false);

    } catch (error) {
      console.error("Registration error:", error);

      setError(
        "Unable to connect to the server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">

      {/* Header */}
      <header className="signup-header">

        <div className="signup-brand">

          <div className="signup-brand-mark">
            TG
          </div>

          <div>
            <h1>Tourism Guide Portal</h1>
            <span>License Management System</span>
          </div>

        </div>

        <button
          type="button"
          className="signup-home-button"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>

      </header>


      {/* Main */}
      <main className="signup-main">

        {/* Left Information */}
        <section className="signup-intro">

          <div className="intro-label">
            NEW APPLICANT
          </div>

          <h2>
            Create your
            <span> applicant account</span>
          </h2>

          <p>
            Register with the Tourism Guide Portal to begin
            your application for a Tamil Nadu Local-Level
            Tourist Guide License.
          </p>


          {/* Registration Steps */}
          <div className="registration-steps">

            <div className="registration-step active">

              <div className="step-number">
                1
              </div>

              <div>
                <h4>Create Account</h4>

                <p>
                  Enter your basic account details.
                </p>
              </div>

            </div>


            <div className="registration-step">

              <div className="step-number">
                2
              </div>

              <div>
                <h4>Complete Profile</h4>

                <p>
                  Provide your personal information.
                </p>
              </div>

            </div>


            <div className="registration-step">

              <div className="step-number">
                3
              </div>

              <div>
                <h4>Apply for License</h4>

                <p>
                  Submit your license application.
                </p>
              </div>

            </div>

          </div>

        </section>


        {/* Registration Card */}
        <section className="signup-card">

          <div className="signup-card-header">

            <div>

              <span>
                STEP 1 OF 3
              </span>

              <h3>
                Create Account
              </h3>

              <p>
                Enter your details to register.
              </p>

            </div>

          </div>


          <form onSubmit={handleSubmit}>

            {/* Full Name */}
            <div className="form-group">

              <label htmlFor="fullName">
                Full Name
              </label>

              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
              />

            </div>


            {/* Email */}
            <div className="form-group">

              <label htmlFor="email">
                Email Address
              </label>

              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
              />

            </div>


            {/* Mobile */}
            <div className="form-group">

              <label htmlFor="mobile">
                Mobile Number
              </label>

              <input
                type="tel"
                id="mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Enter your 10-digit mobile number"
                maxLength="10"
              />

            </div>


            {/* Password Row */}
            <div className="form-row">

              <div className="form-group">

                <label htmlFor="password">
                  Password
                </label>

                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                />

              </div>


              <div className="form-group">

                <label htmlFor="confirmPassword">
                  Confirm Password
                </label>

                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                />

              </div>

            </div>


            {/* Success Message */}
            {message && (
              <div className="success-message">
                ✓ {message}
              </div>
            )}


            {/* Error Message */}
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}


            {/* Terms */}
            <div className="terms">

              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(event) =>
                  setAgreeTerms(event.target.checked)
                }
              />

              <label htmlFor="terms">
                I agree to the Terms of Use and Privacy Policy
                of the Tourism Guide Portal.
              </label>

            </div>


            {/* Submit */}
            <button
              type="submit"
              className="create-account-button"
              disabled={loading}
            >

              {loading
                ? "Creating Account..."
                : "Create Applicant Account"
              }

              {!loading && (
                <span>→</span>
              )}

            </button>

          </form>


          {/* Existing account */}
          <div className="existing-account">

            <span>
              Already have an account?
            </span>

            <button
              type="button"
              onClick={() => navigate("/login")}
            >
              Login
            </button>

          </div>

        </section>

      </main>


      {/* Footer */}
      <footer className="signup-footer">

        <span>
          © 2026 Tourism Guide Portal
        </span>

        <span>
          Secure Digital Licensing System
        </span>

      </footer>

    </div>
  );
}

export default Signup;