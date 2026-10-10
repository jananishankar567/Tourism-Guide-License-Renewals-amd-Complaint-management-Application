import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../api";
import "./tourism.css";

function TouristJoin() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      localStorage.setItem(
        "tourismReturnTo",
        `/tourism/join/${encodeURIComponent(code)}`
      );
      navigate("/login", {
        state: { message: "Sign in with your tourist account to check in." },
        replace: true,
      });
    }
  }, [code, navigate]);

  const checkIn = () => {
    setError("");
    setStatus("");

    if (!navigator.geolocation) {
      setError("This browser does not support location verification.");
      return;
    }

    setJoining(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/tourism/tours/join`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              code,
              latitude: coords.latitude,
              longitude: coords.longitude,
            }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || "Unable to verify your presence.");
          }
          setStatus(data.message);
        } catch (requestError) {
          setError(requestError.message || "Unable to check in to this tour.");
        } finally {
          setJoining(false);
        }
      },
      (locationError) => {
        setJoining(false);
        setError(
          locationError.code === locationError.PERMISSION_DENIED
            ? "Allow location access to verify your presence at the attraction."
            : "Unable to get your location. Please try again near the attraction."
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <main className="tourism-auth-page">
      <Link className="tourism-brand" to="/tourism/tourist">
        <span className="tourism-brand-mark">TG</span>
        <span>
          <strong>Tourism Guide Portal</strong>
          <small>Verified tour check-in</small>
        </span>
      </Link>
      <section className="tourism-auth-card tourism-checkin-card">
        <span className="tourism-checkin-icon" aria-hidden="true">⌖</span>
        <span className="tourism-eyebrow">TOUR PARTICIPATION</span>
        <h1>Verify your visit</h1>
        <p>
          Confirm your presence near the tour location. Your browser will ask
          for GPS permission; location is used only to authenticate this tour.
        </p>
        {error && <div className="tourism-alert error" role="alert">{error}</div>}
        {status && <div className="tourism-alert success" role="status">{status}</div>}
        {!status && (
          <button
            className="tourism-button primary"
            type="button"
            onClick={checkIn}
            disabled={joining || !localStorage.getItem("token")}
          >
            {joining ? "Verifying location..." : "Verify and join tour"}
          </button>
        )}
        {status && (
          <button
            className="tourism-button primary"
            type="button"
            onClick={() => navigate("/tourism/tourist")}
          >
            View my tours
          </button>
        )}
        <p className="tourism-auth-footer">
          Location verification uses a 200 m radius around the registered attraction.
        </p>
      </section>
    </main>
  );
}

export default TouristJoin;
