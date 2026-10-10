import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { API_BASE_URL } from "../api";
import "./tourism.css";

function GuideTours() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [activeTour, setActiveTour] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const requestLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("This browser does not support GPS verification."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        ({ coords }) =>
          resolve({
            latitude: coords.latitude,
            longitude: coords.longitude,
          }),
        (locationError) => {
          reject(
            new Error(
              locationError.code === locationError.PERMISSION_DENIED
                ? "Allow location access to verify your presence at the attraction."
                : "Unable to get your location. Please try again near the attraction."
            )
          );
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });

  const fetchGuideTours = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tourism/guide/tours`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to load your tours.");
      }
      const tours = data.tours || [];
      setHistory(tours);
      setActiveTour(tours.find((tour) => tour.status === "Started") || null);
    } catch (requestError) {
      setError(requestError.message || "Unable to load guide tours.");
    } finally {
      setLoading(false);
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
        setError(requestError.message || "Unable to load locations.");
      }
    };

    loadLocations();
    fetchGuideTours();
  }, [fetchGuideTours, navigate]);

  const startTour = async () => {
    if (!selectedLocation) {
      setError("Choose the attraction where your tour will take place.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const coords = await requestLocation();
      const response = await fetch(`${API_BASE_URL}/api/tourism/tours`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ attractionId: selectedLocation, ...coords }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to start this tour.");
      }
      setActiveTour(data.tour);
      setHistory((current) => [data.tour, ...current]);
    } catch (requestError) {
      setError(requestError.message || "Unable to start this tour.");
    } finally {
      setSaving(false);
    }
  };

  const completeTour = async () => {
    if (!activeTour) return;
    setSaving(true);
    setError("");
    try {
      const coords = await requestLocation();
      const response = await fetch(
        `${API_BASE_URL}/api/tourism/tours/${activeTour._id}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(coords),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to complete this tour.");
      }
      setActiveTour(null);
      await fetchGuideTours();
    } catch (requestError) {
      setError(requestError.message || "Unable to complete this tour.");
    } finally {
      setSaving(false);
    }
  };

  const cancelTour = async () => {
    if (!activeTour || !window.confirm("Cancel this tour?")) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/tourism/tours/${activeTour._id}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to cancel this tour.");
      }
      setActiveTour(null);
      await fetchGuideTours();
    } catch (requestError) {
      setError(requestError.message || "Unable to cancel this tour.");
    } finally {
      setSaving(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("applicant");
    navigate("/login");
  };

  const joinUrl = activeTour
    ? `${window.location.origin}/tourism/join/${activeTour.tourCode}`
    : "";

  return (
    <div className="tourism-app">
      <header className="tourism-topbar">
        <Link className="tourism-brand" to="/dashboard">
          <span className="tourism-brand-mark">TG</span>
          <span>
            <strong>Tourism Guide Portal</strong>
            <small>Guide tour verification</small>
          </span>
        </Link>
        <div className="tourism-topbar-actions">
          <Link className="tourism-button quiet" to="/dashboard">Applicant dashboard</Link>
          <button className="tourism-button quiet" onClick={signOut}>Sign out</button>
        </div>
      </header>

      <main className="tourism-main">
        <section className="tourism-welcome">
          <div>
            <span className="tourism-eyebrow">LICENSED GUIDE TOOLS</span>
            <h1>Authenticate your tour.</h1>
            <p>Start at the registered attraction, invite tourists to check in with your QR code, then confirm completion from the same location.</p>
          </div>
          <div className="tourism-welcome-mark" aria-hidden="true">⌖</div>
        </section>

        {error && <div className="tourism-alert error" role="alert">{error}</div>}

        <section className="tourism-section tourism-guide-workspace">
          <div className="tourism-section-heading">
            <div>
              <span className="tourism-eyebrow">GPS + TOURIST CHECK-IN</span>
              <h2>{activeTour ? "Tour in progress" : "Start a tour"}</h2>
              <p>Both guide and tourist locations must be within 200 m of the attraction.</p>
            </div>
          </div>

          {loading ? (
            <div className="tourism-empty">Loading your guide profile...</div>
          ) : activeTour ? (
            <div className="tourism-active-tour">
              <div className="tourism-active-details">
                <span className="tourism-tour-status">Waiting for completion</span>
                <h3>{activeTour.attractionId?.name || "Registered attraction"}</h3>
                <p>
                  {activeTour.attractionId?.district} · Started{" "}
                  {new Date(activeTour.startedAt).toLocaleString("en-IN")}
                </p>
                <div className="tourism-code-box">
                  <span>Tour participation code</span>
                  <strong>{activeTour.tourCode}</strong>
                  <small>Tourists can scan the QR or enter this code after signing in.</small>
                </div>
                <div className="tourism-tour-actions">
                  <button
                    className="tourism-button primary"
                    onClick={completeTour}
                    disabled={saving}
                  >
                    {saving ? "Checking GPS..." : "Complete and authenticate tour"}
                  </button>
                  <button
                    className="tourism-button quiet"
                    onClick={cancelTour}
                    disabled={saving}
                  >
                    Cancel tour
                  </button>
                </div>
              </div>
              <div className="tourism-qr-card">
                <QRCodeSVG value={joinUrl} size={190} includeMargin />
                <strong>Tourist check-in</strong>
                <span>Scan this code at the attraction</span>
              </div>
            </div>
          ) : (
            <div className="tourism-start-form">
              <label htmlFor="guide-location">Registered tourist location</label>
              <select
                id="guide-location"
                value={selectedLocation}
                onChange={(event) => setSelectedLocation(event.target.value)}
              >
                <option value="">Choose an attraction</option>
                {locations.map((location) => (
                  <option key={location._id} value={location._id}>
                    {location.name} · {location.district}
                  </option>
                ))}
              </select>
              <p>
                Your active guide licence and your location will be verified
                before a participation QR code is issued.
              </p>
              <button
                className="tourism-button primary"
                onClick={startTour}
                disabled={saving || locations.length === 0}
              >
                {saving ? "Verifying location..." : "Start GPS-verified tour"}
              </button>
            </div>
          )}
        </section>

        <section className="tourism-section">
          <div className="tourism-section-heading">
            <div>
              <span className="tourism-eyebrow">YOUR ACTIVITY</span>
              <h2>Recent tours</h2>
            </div>
          </div>
          {history.length === 0 ? (
            <div className="tourism-empty">Completed and cancelled tours will appear here.</div>
          ) : (
            <div className="tourism-tour-list">
              {history.map((tour) => (
                <article className="tourism-tour-card" key={tour._id}>
                  <div className="tourism-tour-info">
                    <span className={`tourism-tour-status ${tour.verified ? "verified" : ""}`}>
                      {tour.verified ? "GPS authenticated" : tour.status}
                    </span>
                    <h3>{tour.attractionId?.name || "Tour location"}</h3>
                    <p>{tour.attractionId?.district}</p>
                    <small>
                      {tour.completedAt
                        ? new Date(tour.completedAt).toLocaleString("en-IN")
                        : new Date(tour.startedAt).toLocaleString("en-IN")}
                      {" · "}{tour.participants?.length || 0} tourist check-ins
                    </small>
                    {tour.verificationMessage && <small>{tour.verificationMessage}</small>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default GuideTours;
