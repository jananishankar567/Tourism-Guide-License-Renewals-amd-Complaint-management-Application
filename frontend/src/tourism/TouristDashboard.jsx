import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import "../Dashboard.css";
import "./TouristDashboard.css";
import TouristFeedbackDialog from "./components/TouristFeedbackDialog";
import TouristFeedbackHistory from "./components/TouristFeedbackHistory";
import TouristGuideDirectory from "./components/TouristGuideDirectory";
import TouristTourHistory from "./components/TouristTourHistory";
import NotificationBell from "./components/NotificationBell";

function getSavedApplicant() {
  try {
    return JSON.parse(localStorage.getItem("applicant") || "null");
  } catch (error) {
    console.error("Unable to read saved tourist details:", error);
    return null;
  }
}

function TouristDashboard() {
  const navigate = useNavigate();
  const [applicant] = useState(getSavedApplicant);
  const touristId =
    applicant?.id || applicant?._id || applicant?.email || "tourist";
  const touristName = applicant?.fullName?.trim() || "Tourist";
  const touristInitial = touristName.charAt(0).toUpperCase();
  const preferredGuideStorageKey = `tourismPreferredGuide:${touristId}`;

  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [guides, setGuides] = useState([]);
  const [tours, setTours] = useState([]);
  const [myEntries, setMyEntries] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [loadingTours, setLoadingTours] = useState(true);
  const [error, setError] = useState("");
  const [activeForm, setActiveForm] = useState(null);
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [preferredGuideId, setPreferredGuideId] = useState(
    () => localStorage.getItem(preferredGuideStorageKey) || ""
  );
  const notificationStorageKey = `touristReadNotifications:${touristId}`;

  const fetchTours = useCallback(async () => {
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      };
      const [tourResponse, feedbackResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/tourism/tours/mine`, { headers }),
        fetch(`${API_BASE_URL}/api/tourism/feedback/mine`, { headers }),
      ]);
      const [tourData, feedbackData] = await Promise.all([
        tourResponse.json(),
        feedbackResponse.json(),
      ]);
      if (!tourResponse.ok) {
        throw new Error(tourData.message || "Unable to load your tours.");
      }
      if (!feedbackResponse.ok) {
        throw new Error(
          feedbackData.message || "Unable to load feedback history."
        );
      }
      setTours(tourData.tours || []);
      setMyEntries(feedbackData.entries || []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load your tours.");
    } finally {
      setLoadingTours(false);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationError("");
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      };
      const [tourResponse, feedbackResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/tourism/tours/mine`, { headers }),
        fetch(`${API_BASE_URL}/api/tourism/feedback/mine`, { headers }),
      ]);
      const [tourData, feedbackData] = await Promise.all([
        tourResponse.json(),
        feedbackResponse.json(),
      ]);
      if (!tourResponse.ok) {
        throw new Error(tourData.message || "Unable to refresh tour updates.");
      }
      if (!feedbackResponse.ok) {
        throw new Error(
          feedbackData.message || "Unable to refresh feedback updates."
        );
      }
      setTours(tourData.tours || []);
      setMyEntries(feedbackData.entries || []);
      setLoadingTours(false);
    } catch (requestError) {
      setNotificationError(
        requestError.message || "Unable to refresh notifications."
      );
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login", { replace: true });
      return;
    }

    const loadLocations = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/tourism/locations`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Unable to load tourist locations.");
        }
        setLocations(data.locations || []);
      } catch (requestError) {
        setError(requestError.message || "Unable to load tourist locations.");
      } finally {
        setLoadingLocations(false);
      }
    };

    loadLocations();
    fetchTours();
  }, [fetchTours, navigate]);

  useEffect(() => {
    const refreshInterval = window.setInterval(refreshNotifications, 60_000);
    return () => window.clearInterval(refreshInterval);
  }, [refreshNotifications]);

  useEffect(() => {
    if (!selectedLocation) {
      return undefined;
    }

    const controller = new AbortController();
    let initialLoad = true;
    const loadGuides = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/tourism/guides?locationId=${encodeURIComponent(selectedLocation)}`,
          { signal: controller.signal }
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Unable to find verified guides.");
        }
        setGuides(data.guides || []);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "Unable to find verified guides.");
        }
      } finally {
        if (!controller.signal.aborted) {
          if (initialLoad) {
            setLoadingGuides(false);
            initialLoad = false;
          }
        }
      }
    };

    loadGuides();
    const refreshInterval = window.setInterval(loadGuides, 60_000);
    return () => {
      controller.abort();
      window.clearInterval(refreshInterval);
    };
  }, [selectedLocation]);

  const chooseGuide = (guide) => {
    try {
      localStorage.setItem(preferredGuideStorageKey, guide.id);
      setPreferredGuideId(guide.id);
    } catch (storageError) {
      console.error("Unable to save preferred guide:", storageError);
      setError("Your browser could not save the guide selection.");
    }
  };

  const openTourCode = (event) => {
    event.preventDefault();
    const normalizedCode = joinCode.trim().toUpperCase();
    if (!/^[A-F\d]{10}$/.test(normalizedCode)) {
      setError("Enter the 10-character tour code shown beside the QR code.");
      return;
    }
    navigate(`/tourism/join/${normalizedCode}`);
  };

  const openFeedbackForm = (type, tour) => {
    setError("");
    setActiveForm({ type, tour });
    setMessage("");
    if (type === "Feedback") setRating(5);
  };

  const submitTourNote = async (event) => {
    event.preventDefault();
    const minimumLength = activeForm?.type === "Feedback" ? 5 : 10;
    if (!activeForm || message.trim().length < minimumLength) {
      setError(
        activeForm?.type === "Feedback"
          ? "Please write at least 5 characters of feedback."
          : "Please describe your complaint in at least 10 characters."
      );
      return;
    }

    setSaving(true);
    setError("");
    try {
      const isFeedback = activeForm.type === "Feedback";
      const response = await fetch(
        `${API_BASE_URL}/api/tourism/tours/${activeForm.tour._id}/${isFeedback ? "feedback" : "complaints"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(
            isFeedback ? { rating, message } : { message }
          ),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to submit your response.");
      }
      setActiveForm(null);
      setMessage("");
      await fetchTours();
    } catch (requestError) {
      setError(requestError.message || "Unable to submit your response.");
    } finally {
      setSaving(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("applicant");
    localStorage.removeItem("tourismReturnTo");
    navigate("/login");
  };

  const completedTours = tours.filter(
    (tour) => tour.status === "Completed" && tour.verified
  ).length;
  const notifications = [
    ...tours
      .filter((tour) => tour.status === "Completed" && tour.verified)
      .map((tour) => ({
        id: `tour-verified:${tour._id}:${tour.updatedAt || tour.completedAt}`,
        title: "Tour authenticated",
        message: `${tour.attractionId?.name || "Your tour"} was completed and GPS verified. Verified feedback is now available.`,
        date: tour.completedAt || tour.updatedAt,
        path: "tourist-tours",
      })),
    ...myEntries
      .filter(
        (entry) =>
          entry.adminResponse?.trim() ||
          entry.moderationStatus === "Reviewed"
      )
      .map((entry) => ({
        id: `tour-entry:${entry._id}:${entry.updatedAt || entry.moderationStatus}`,
        title: entry.adminResponse?.trim()
          ? "Tourism administration replied"
          : `${entry.type} reviewed`,
        message:
          entry.adminResponse?.trim() ||
          `Your ${entry.type.toLowerCase()} for ${entry.attractionId?.name || "your tour"} has been reviewed.`,
        date: entry.updatedAt || entry.createdAt,
        path: "tourist-feedback",
      })),
  ].sort(
    (first, second) =>
      new Date(second.date || 0) - new Date(first.date || 0)
  );

  return (
    <div className="dashboard-page tourist-dashboard">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <div className="dashboard-brand-mark">TG</div>
          <div>
            <h2>Tourism Guide</h2>
            <span>Portal</span>
          </div>
        </div>

        <nav className="dashboard-nav" aria-label="Tourist dashboard">
          <button className="dashboard-nav-item active" type="button">
            <span>⌂</span>
            Dashboard
          </button>
          <button
            className="dashboard-nav-item"
            type="button"
            onClick={() => document.getElementById("tourist-guides")?.scrollIntoView({ behavior: "smooth" })}
          >
            <span>⌕</span>
            Find a Guide
          </button>
          <button
            className="dashboard-nav-item"
            type="button"
            onClick={() => document.getElementById("tourist-tours")?.scrollIntoView({ behavior: "smooth" })}
          >
            <span>⌖</span>
            My Tours
          </button>
          <button
            className="dashboard-nav-item"
            type="button"
            onClick={() => document.getElementById("tourist-feedback")?.scrollIntoView({ behavior: "smooth" })}
          >
            <span>✉</span>
            Feedback &amp; Complaints
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button
            className="dashboard-nav-item logout-item"
            type="button"
            onClick={signOut}
          >
            <span>↪</span>
            Sign out
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar tourist-dashboard-topbar">
          <div>
            <p className="dashboard-page-label">TOURIST DASHBOARD</p>
            <h1>Welcome back, {touristName}!</h1>
          </div>
          <div className="dashboard-header-actions">
            <NotificationBell
              notifications={notifications}
              storageKey={notificationStorageKey}
              loading={notificationsLoading}
              error={notificationError}
              onRefresh={refreshNotifications}
              onSelect={(notification) =>
                document
                  .getElementById(notification.path)
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              emptyMessage="Verified tour and administration response updates appear here."
            />
            <div className="dashboard-user tourist-dashboard-user">
              <div className="user-avatar">{touristInitial}</div>
              <div>
                <strong>{touristName}</strong>
                <span>Tourist account</span>
              </div>
            </div>
          </div>
        </header>

        {error && !activeForm && (
          <div className="tourist-dashboard-alert" role="alert">
            {error}
            <button type="button" onClick={() => setError("")} aria-label="Dismiss message">
              ×
            </button>
          </div>
        )}

        <section className="tourist-dashboard-welcome">
          <div>
            <span className="panel-label">EXPLORE WITH CONFIDENCE</span>
            <h2>Your next meaningful visit starts here.</h2>
            <p>
              Discover licensed local guides, join GPS-authenticated tours, and share feedback from verified visits.
            </p>
          </div>
          <span className="tourist-dashboard-welcome-icon" aria-hidden="true">✦</span>
        </section>

        <section className="dashboard-cards tourist-dashboard-cards" aria-label="Tourist activity summary">
          <article className="dashboard-card">
            <div className="dashboard-card-header">
              <span>Destinations</span>
              <div className="status-icon application-icon">⌖</div>
            </div>
            <h2>{locations.length}</h2>
            <p>Registered tourist locations available to explore.</p>
          </article>
          <article className="dashboard-card">
            <div className="dashboard-card-header">
              <span>Verified Guides</span>
              <div className="status-icon license-icon">✓</div>
            </div>
            <h2>{guides.length}</h2>
            <p>{selectedLocation ? "Licensed guides for your selected destination." : "Choose a destination to view available guides."}</p>
          </article>
          <article className="dashboard-card">
            <div className="dashboard-card-header">
              <span>Authenticated Tours</span>
              <div className="status-icon complaint-icon">⌖</div>
            </div>
            <h2>{completedTours}</h2>
            <p>Completed tours with guide and tourist location verification.</p>
          </article>
          <article className="dashboard-card">
            <div className="dashboard-card-header">
              <span>My Submissions</span>
              <div className="status-icon rejected-icon">✉</div>
            </div>
            <h2>{myEntries.length}</h2>
            <p>Feedback and complaints with administration follow-up.</p>
          </article>
        </section>

        <section className="tourist-dashboard-sections">
          <TouristGuideDirectory
            locations={locations}
            selectedLocation={selectedLocation}
            onSelectLocation={(locationId) => {
              setSelectedLocation(locationId);
              setGuides([]);
              setLoadingGuides(Boolean(locationId));
            }}
            loadingLocations={loadingLocations}
            guides={guides}
            loadingGuides={loadingGuides}
            preferredGuideId={preferredGuideId}
            onChooseGuide={chooseGuide}
          />
          <TouristTourHistory
            joinCode={joinCode}
            onJoinCodeChange={setJoinCode}
            onOpenTourCode={openTourCode}
            loadingTours={loadingTours}
            tours={tours}
            touristId={touristId}
            onOpenFeedback={openFeedbackForm}
          />
          <TouristFeedbackHistory entries={myEntries} />
        </section>
      </main>

      <TouristFeedbackDialog
        activeForm={activeForm}
        error={error}
        rating={rating}
        message={message}
        saving={saving}
        onClose={() => {
          setActiveForm(null);
          setError("");
        }}
        onRatingChange={setRating}
        onMessageChange={setMessage}
        onSubmit={submitTourNote}
      />
    </div>
  );
}

export default TouristDashboard;
