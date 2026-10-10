import "./App.css";

import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

import Signup from "./Signup";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Application from "./Application";
import ApplicationStatus from "./ApplicationStatus";
import License from "./License";
import AdminDashboard from "./admin/AdminDashboard";
import AdminApplications from "./admin/AdminApplications";
import ApplicationReview from "./admin/ApplicationReview";
import Renewal from "./Renewal";
import RenewLicense from "./RenewLicense";
import RenewLicenseForm from "./RenewLicenseForm";
import RenewalStatus from "./RenewalStatus";
import ComplaintsDashboard from "./complaints/ComplaintsDashboard";
import ComplaintDetails from "./complaints/ComplaintDetails";
import SubmitComplaint from "./complaints/SubmitComplaint";
import Profile from "./profile/Profile";
import Renewals from "./admin/Renewals";
import AdminComplaints from "./admin/AdminComplaints";
import AdminLicenses from "./admin/AdminLicenses";
import AdminReports from "./admin/AdminReports";
import TouristSignup from "./tourism/TouristSignup";
import TouristDashboard from "./tourism/TouristDashboard";
import TouristJoin from "./tourism/TouristJoin";
import GuideTours from "./tourism/GuideTours";
import TourismAdmin from "./tourism/TourismAdmin";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="portal">

      {/* Header */}
      <header className="topbar">

        <div className="brand">
          <div className="brand-mark">TG</div>

          <div>
            <h1>Tourism Guide Portal</h1>
            <span>License Management System</span>
          </div>
        </div>

        <nav className="navigation">
          <a href="#home">Home</a>
          <a href="#services">Services</a>
          <a href="#about">About</a>
        </nav>

      </header>


      {/* Main */}
      <main>

        {/* Hero */}
        <section className="hero" id="home">

          <div className="hero-content">

            <div className="portal-label">
              TOURISM GUIDE LICENSING SYSTEM
            </div>

            <h2>
              Apply for and manage your
              <span> Tourism Guide License</span>
            </h2>

            <p>
              A unified digital platform for tourism guide license
              applications, renewals and complaint management.
            </p>

          </div>

        </section>


        {/* Account Selection */}
        <section className="account-section">

          <div className="section-heading">
            <h3>Get Started</h3>

            <p>
              Choose the option that best describes you.
            </p>
          </div>


          <div className="account-grid">

            {/* New Applicant */}
            <div className="account-card primary-card">

              <div className="card-icon">
                +
              </div>

              <div className="card-content">

                <span className="card-label">
                  NEW APPLICANT
                </span>

                <h4>Create your account</h4>

                <p>
                  New to the Tourism Guide Portal?
                  Register your account to apply for
                  a tourism guide license.
                </p>

                <button
                  className="primary-button"
                  onClick={() => navigate("/signup")}
                >
                  Sign Up
                  <span>→</span>
                </button>

              </div>

            </div>


            {/* Existing Applicant */}
            <div className="account-card">

              <div className="card-icon secondary-icon">
                →
              </div>

              <div className="card-content">

                <span className="card-label">
                  EXISTING USER
                </span>

                <h4>Sign in to your account</h4>

                <p>
                  Already registered? Sign in to manage your guide
                  application, license and complaints, or find guides,
                  join tours and follow up on your tourist feedback.
                </p>

                <button
                  className="secondary-button"
                  onClick={() => navigate("/login")}
                >
                  Login
                  <span>→</span>
                </button>

              </div>

            </div>

          </div>

          <div className="tourist-access">
            <span>Visiting a tourist destination?</span>
            <p>Find a currently licensed local guide and share feedback after a verified tour.</p>
            <button
              className="text-button"
              onClick={() => navigate("/tourism/signup")}
            >
              Create a tourist account →
            </button>
          </div>


          {/* Officer Access */}
          <div className="officer-access">

            <span>
              Are you a licensing officer?
            </span>

            <button
              className="text-button"
              type="button"
              onClick={() => navigate("/login")}
            >
              Officer Login →
            </button>

          </div>

        </section>


        {/* Services */}
        <section
          className="services-section"
          id="services"
        >

          <div className="section-heading">

            <h3>Portal Services</h3>

            <p>
              Manage your tourism guide licensing services
              from one place.
            </p>

          </div>


          <div className="services-grid">

            <div className="service-item">

              <div className="service-number">
                01
              </div>

              <h4>License Application</h4>

              <p>
                Submit your application and supporting
                documents for verification.
              </p>

            </div>


            <div className="service-item">

              <div className="service-number">
                02
              </div>

              <h4>License Renewal</h4>

              <p>
                Renew an existing tourism guide license
                through the online portal.
              </p>

            </div>


            <div className="service-item">

              <div className="service-number">
                03
              </div>

              <h4>Complaint Management</h4>

              <p>
                Submit, track and manage complaints
                related to guide services.
              </p>

            </div>

          </div>

          <div className="tourist-services">
            <div className="tourist-services-heading">
              <span className="card-label">FOR TOURISTS</span>
              <h3>Plan and enjoy a trusted tour</h3>
              <p>
                Services for visitors exploring Tamil Nadu with verified
                tourism guides.
              </p>
            </div>

            <div className="services-grid">
              <div className="service-item">
                <div className="service-number">04</div>
                <h4>Find Verified Guides</h4>
                <p>
                  Browse licensed guides available near your chosen tourist
                  destination and choose the guide that suits your visit.
                </p>
              </div>

              <div className="service-item">
                <div className="service-number">05</div>
                <h4>Check In to an Authentic Tour</h4>
                <p>
                  Join a guide’s tour with a participation code or QR scan,
                  with GPS location checks at the attraction.
                </p>
              </div>

              <div className="service-item">
                <div className="service-number">06</div>
                <h4>Share Trusted Feedback</h4>
                <p>
                  Submit feedback or a complaint after a verified tour and
                  follow the administration’s response.
                </p>
              </div>
            </div>

            <button
              className="primary-button tourist-services-cta"
              type="button"
              onClick={() => navigate("/tourism/signup")}
            >
              Get started as a tourist
              <span aria-hidden="true">→</span>
            </button>
          </div>

        </section>

      </main>


      {/* Footer */}
      <footer className="footer">

        <div>

          <strong>
            Tourism Guide Portal
          </strong>

          <p>
            Tourism Guide License Application,
            Renewal and Complaint Management System
          </p>

        </div>

        <div className="footer-right">
          © 2026 Tourism Guide Portal
        </div>

      </footer>

    </div>
  );
}


function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Landing Page */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* New Applicant Registration */}
        <Route
          path="/signup"
          element={<Signup />}
        />

        {/* Existing Applicant Login */}
        <Route
          path="/login"
          element={<Login />}
        />
        <Route path="/tourism/signup" element={<TouristSignup />} />
        <Route path="/tourism/tourist" element={<TouristDashboard />} />
        <Route path="/tourism/join/:code" element={<TouristJoin />} />
        <Route path="/tourism/guide" element={<GuideTours />} />
        <Route path="/admin-tourism" element={<TourismAdmin />} />

        {/* Temporary Dashboard */}
       
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/application" element={<Application />} />
        <Route
  path="/application-status"
  element={<ApplicationStatus />}
/>
<Route
  path="/license"
  element={<License />}
/>
<Route
  path="/admin-dashboard"
  element={<AdminDashboard />}
/>
<Route
  path="/admin-applications"
  element={<AdminApplications />}
/>

<Route
  path="/admin-applications/:id"
  element={<ApplicationReview />}
/>
<Route path="/license/:id" element={<License />} />
<Route path="/renewal" element={<Renewal />} />
<Route
  path="/renew-license"
  element={<RenewLicense />}
/>
<Route
  path="/renew-license-form"
  element={<RenewLicenseForm />}
/>
<Route
  path="/renewal-status"
  element={<RenewalStatus />}
/>
<Route
  path="/complaints"
  element={<ComplaintsDashboard />}
/>
<Route
  path="/complaints/:id"
  element={<ComplaintDetails />}
/>
<Route
  path="/complaints/new"
  element={<SubmitComplaint />}
/>
<Route path="/profile" element={<Profile />} />
<Route path="/admin-renewals" element={<Renewals />} />
<Route path="/admin-complaints" element={<AdminComplaints />} />
<Route path="/admin-licenses" element={<AdminLicenses />} />
<Route path="/admin-reports" element={<AdminReports />} />
      </Routes>

    </BrowserRouter>
  );
}

export default App;
