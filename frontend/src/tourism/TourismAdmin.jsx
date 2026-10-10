import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import "./tourism.css";

const AttractionMapPicker = lazy(
  () => import("./components/AttractionMapPicker")
);

const emptyLocation = {
  name: "",
  district: "",
  description: "",
  latitude: "",
  longitude: "",
};

function TourismAdmin() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [tours, setTours] = useState([]);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(emptyLocation);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${localStorage.getItem("officerToken")}`,
        ...options.headers,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Unable to load tourism operations.");
    }
    return data;
  }, []);

  const loadData = useCallback(async () => {
    setError("");
    try {
      const [locationData, tourData, feedbackData] = await Promise.all([
        request("/api/tourism/admin/locations"),
        request("/api/tourism/admin/tours"),
        request("/api/tourism/admin/feedback"),
      ]);
      setLocations(locationData.locations || []);
      setTours(tourData.tours || []);
      setEntries(feedbackData.entries || []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load tourism operations.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    if (!localStorage.getItem("officerToken")) {
      navigate("/login", { replace: true });
      return;
    }
    loadData();
  }, [loadData, navigate]);

  const resetForm = () => {
    setEditingId("");
    setForm(emptyLocation);
  };

  const updateCoordinates = (latitude, longitude) => {
    setForm((current) => ({
      ...current,
      latitude: String(latitude),
      longitude: String(longitude),
    }));
  };

  const editLocation = (location) => {
    setEditingId(location._id);
    setForm({
      name: location.name,
      district: location.district,
      description: location.description || "",
      latitude: String(location.latitude),
      longitude: String(location.longitude),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveLocation = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      };
      if (editingId) {
        const location = locations.find((entry) => entry._id === editingId);
        await request(`/api/tourism/admin/locations/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({ ...body, active: location?.active ?? true }),
        });
      } else {
        await request("/api/tourism/admin/locations", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      resetForm();
      await loadData();
    } catch (requestError) {
      setError(requestError.message || "Unable to save this location.");
    } finally {
      setSaving(false);
    }
  };

  const toggleLocation = async (location) => {
    setError("");
    try {
      await request(`/api/tourism/admin/locations/${location._id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: location.name,
          district: location.district,
          description: location.description || "",
          latitude: location.latitude,
          longitude: location.longitude,
          active: !location.active,
        }),
      });
      await loadData();
    } catch (requestError) {
      setError(requestError.message || "Unable to update this location.");
    }
  };

  const moderateEntry = async (entry, moderationStatus) => {
    setError("");
    try {
      await request(`/api/tourism/admin/feedback/${entry._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          moderationStatus,
          adminResponse: entry.adminResponse || "",
        }),
      });
      await loadData();
    } catch (requestError) {
      setError(requestError.message || "Unable to update this entry.");
    }
  };

  const updateAdminResponse = (id, adminResponse) => {
    setEntries((current) =>
      current.map((entry) =>
        entry._id === id ? { ...entry, adminResponse } : entry
      )
    );
  };

  const saveAdminResponse = async (entry) => {
    setError("");
    try {
      await request(`/api/tourism/admin/feedback/${entry._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          moderationStatus: "Reviewed",
          adminResponse: entry.adminResponse || "",
        }),
      });
      await loadData();
    } catch (requestError) {
      setError(requestError.message || "Unable to save the admin response.");
    }
  };

  return (
    <div className="tourism-app">
      <header className="tourism-topbar">
        <Link className="tourism-brand" to="/admin-dashboard">
          <span className="tourism-brand-mark">TG</span>
          <span>
            <strong>Tourism Guide Portal</strong>
            <small>Tourism operations</small>
          </span>
        </Link>
        <div className="tourism-topbar-actions">
          <Link className="tourism-button quiet" to="/admin-dashboard">Admin dashboard</Link>
        </div>
      </header>

      <main className="tourism-main">
        <section className="tourism-welcome">
          <div>
            <span className="tourism-eyebrow">ADMINISTRATION</span>
            <h1>Tourism operations</h1>
            <p>Maintain attraction geofences, monitor authenticated tours, and review verified tourist feedback and complaints.</p>
          </div>
          <div className="tourism-welcome-mark" aria-hidden="true">⌖</div>
        </section>

        {error && <div className="tourism-alert error" role="alert">{error}</div>}

        <section className="tourism-section">
          <div className="tourism-section-heading">
            <div>
              <span className="tourism-eyebrow">ATTRACTION DIRECTORY</span>
              <h2>{editingId ? "Update attraction" : "Add a tourist location"}</h2>
              <p>Search for a place or select its exact meeting point on the map. The pin sets the 200 m GPS verification boundary.</p>
            </div>
          </div>

          <form className="tourism-admin-location-form" onSubmit={saveLocation}>
            <div className="tourism-admin-map-field">
              <Suspense
                fallback={
                  <div className="tourism-empty">Loading map tools...</div>
                }
              >
                <AttractionMapPicker
                  form={form}
                  onLocationSelect={(selectedPlace) => {
                    setForm((current) => ({
                      ...current,
                      name: selectedPlace.name || current.name,
                      district: selectedPlace.district || current.district,
                      latitude: String(selectedPlace.latitude),
                      longitude: String(selectedPlace.longitude),
                    }));
                  }}
                  onCoordinatesSelect={updateCoordinates}
                />
              </Suspense>
            </div>
            <label>
              Attraction name
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                maxLength={120}
                required
              />
            </label>
            <label>
              District
              <input
                value={form.district}
                onChange={(event) =>
                  setForm((current) => ({ ...current, district: event.target.value }))
                }
                maxLength={80}
                required
              />
            </label>
            <label>
              Latitude
              <input
                type="number"
                step="any"
                min="-90"
                max="90"
                value={form.latitude}
                onChange={(event) =>
                  setForm((current) => ({ ...current, latitude: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Longitude
              <input
                type="number"
                step="any"
                min="-180"
                max="180"
                value={form.longitude}
                onChange={(event) =>
                  setForm((current) => ({ ...current, longitude: event.target.value }))
                }
                required
              />
            </label>
            <label className="tourism-admin-description">
              Visitor information
              <textarea
                rows={3}
                maxLength={1000}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </label>
            <div className="tourism-tour-actions">
              <button className="tourism-button primary" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Save location" : "Add location"}
              </button>
              {editingId && (
                <button
                  className="tourism-button quiet"
                  type="button"
                  onClick={resetForm}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          {loading ? (
            <div className="tourism-empty">Loading attractions...</div>
          ) : (
            <div className="tourism-admin-table-wrap">
              <table className="tourism-admin-table">
                <thead>
                  <tr>
                    <th>Attraction</th>
                    <th>District</th>
                    <th>Coordinates</th>
                    <th>Directory status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((location) => (
                    <tr key={location._id}>
                      <td>
                        <strong>{location.name}</strong>
                        {location.description && <small>{location.description}</small>}
                      </td>
                      <td>{location.district}</td>
                      <td>{location.latitude}, {location.longitude}</td>
                      <td>
                        <span className={`tourism-tour-status ${location.active ? "verified" : ""}`}>
                          {location.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="tourism-admin-actions">
                          <button type="button" onClick={() => editLocation(location)}>Edit</button>
                          <button type="button" onClick={() => toggleLocation(location)}>
                            {location.active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {locations.length === 0 && (
                    <tr><td colSpan="5">No locations yet. Add the first attraction above.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="tourism-section">
          <div className="tourism-section-heading">
            <div>
              <span className="tourism-eyebrow">LIVE ACCOUNTABILITY</span>
              <h2>Authenticated tour activity</h2>
            </div>
            <span className="tourism-section-count">{tours.length} recent</span>
          </div>
          {loading ? (
            <div className="tourism-empty">Loading tour activity...</div>
          ) : tours.length === 0 ? (
            <div className="tourism-empty">Guide tour activity will appear here.</div>
          ) : (
            <div className="tourism-admin-table-wrap">
              <table className="tourism-admin-table">
                <thead>
                  <tr>
                    <th>Tour</th>
                    <th>Guide</th>
                    <th>Attraction</th>
                    <th>Participants</th>
                    <th>Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {tours.map((tour) => (
                    <tr key={tour._id}>
                      <td>
                        <strong>{tour.tourCode}</strong>
                        <small>{new Date(tour.startedAt).toLocaleString("en-IN")}</small>
                      </td>
                      <td>{tour.guideApplicationId?.fullName || "Licensed guide"}</td>
                      <td>
                        {tour.attractionId?.name || "—"}
                        <small>{tour.attractionId?.district}</small>
                      </td>
                      <td>{tour.participants?.filter((entry) => entry.locationVerified).length || 0}</td>
                      <td>
                        <span className={`tourism-tour-status ${tour.verified ? "verified" : ""}`}>
                          {tour.verified ? "GPS authenticated" : tour.status}
                        </span>
                        <small>{tour.verificationMessage}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="tourism-section">
          <div className="tourism-section-heading">
            <div>
              <span className="tourism-eyebrow">GUEST VOICE</span>
              <h2>Tourist feedback &amp; complaints</h2>
              <p>Feedback comes from verified tour participants. Complaints can be reviewed, answered, or hidden.</p>
            </div>
            <span className="tourism-section-count">{entries.length} entries</span>
          </div>
          {loading ? (
            <div className="tourism-empty">Loading tourist submissions...</div>
          ) : entries.length === 0 ? (
            <div className="tourism-empty">No tourist feedback or complaints submitted.</div>
          ) : (
            <div className="tourism-feedback-list">
              {entries.map((entry) => (
                <article className="tourism-feedback-card" key={entry._id}>
                  <div className="tourism-feedback-heading">
                    <div>
                      <span className={`tourism-tour-status ${entry.type === "Feedback" ? "verified" : ""}`}>
                        {entry.type}
                      </span>
                      <h3>{entry.attractionId?.name || "Tour attraction"}</h3>
                      <p>
                        {entry.touristId?.fullName || "Tourist"} · guide{" "}
                        {entry.guideId?.fullName || "—"} ·{" "}
                        {new Date(entry.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                    {entry.type === "Feedback" && (
                      <strong className="tourism-feedback-rating">
                        ★ {entry.rating}/5
                      </strong>
                    )}
                  </div>
                  <p className="tourism-feedback-message">{entry.message}</p>
                  <label className="tourism-response-label">
                    Admin response
                    <textarea
                      value={entry.adminResponse || ""}
                      onChange={(event) => updateAdminResponse(entry._id, event.target.value)}
                      rows={2}
                      maxLength={2000}
                    />
                  </label>
                  <div className="tourism-feedback-footer">
                    <span className={`tourism-tour-status ${entry.moderationStatus === "Reviewed" ? "verified" : ""}`}>
                      {entry.moderationStatus}
                    </span>
                    <div className="tourism-admin-actions">
                      <button type="button" onClick={() => saveAdminResponse(entry)}>Review &amp; respond</button>
                      <button type="button" onClick={() => moderateEntry(entry, "Hidden")}>Hide</button>
                      {entry.moderationStatus === "Hidden" && (
                        <button type="button" onClick={() => moderateEntry(entry, "Pending")}>Restore</button>
                      )}
                    </div>
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

export default TourismAdmin;
