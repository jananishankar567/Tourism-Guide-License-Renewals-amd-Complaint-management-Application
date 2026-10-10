function TouristGuideDirectory({
  locations,
  selectedLocation,
  onSelectLocation,
  loadingLocations,
  guides,
  loadingGuides,
  preferredGuideId,
  onChooseGuide,
}) {
  return (
    <section className="dashboard-panel tourist-section" id="tourist-guides">
      <div className="panel-heading">
        <div>
          <span className="panel-label">DESTINATION DISCOVERY</span>
          <h3>Find a verified guide</h3>
          <p className="tourist-guide-auto-note">
            Approved guides with active licenses are added automatically and refreshed every minute.
          </p>
        </div>
        <span className="progress-status">Licensed guides</span>
      </div>

      <div className="tourist-location-picker">
        <label htmlFor="tourist-location">Choose a tourist location</label>
        <select
          id="tourist-location"
          value={selectedLocation}
          onChange={(event) => onSelectLocation(event.target.value)}
          disabled={loadingLocations}
        >
          <option value="">
            {loadingLocations ? "Loading locations..." : "Choose an attraction"}
          </option>
          {locations.map((location) => (
            <option key={location._id} value={location._id}>
              {location.name} · {location.district}
            </option>
          ))}
        </select>
        {locations.length === 0 && !loadingLocations && (
          <p>Attractions will appear here once added by the tourism administration.</p>
        )}
      </div>

      {selectedLocation && (
        <div className="tourist-guide-grid">
          {loadingGuides ? (
            <div className="empty-activity tourist-empty-state">
              <div className="empty-icon">⌕</div>
              <h4>Finding verified guides...</h4>
            </div>
          ) : guides.length === 0 ? (
            <div className="empty-activity tourist-empty-state">
              <div className="empty-icon">⌖</div>
              <h4>No verified guides listed yet</h4>
              <p>Try another destination or check back later.</p>
            </div>
          ) : (
            guides.map((guide) => (
              <article className="dashboard-card tourist-guide-card" key={guide.id}>
                <div className="dashboard-card-header">
                  <span className="tourist-guide-verified">✓ Licensed &amp; verified</span>
                  <div className="status-icon license-icon" aria-hidden="true">✓</div>
                </div>
                <h2>{guide.name}</h2>
                <p className="tourist-guide-details">
                  {guide.district} · Licence {guide.licenseNumber}
                </p>
                <div className="tourist-guide-rating">
                  <strong>★ {guide.averageRating ?? "New"}</strong>
                  <span>
                    {guide.reviewCount
                      ? `${guide.reviewCount} verified review${guide.reviewCount === 1 ? "" : "s"}`
                      : "No reviews yet"}
                  </span>
                </div>
                <div className="tourist-guide-languages">
                  <strong>Languages</strong>
                  <span>{guide.languages || "Contact the guide for details"}</span>
                </div>
                <button
                  type="button"
                  className="dashboard-card-link tourist-guide-choice"
                  onClick={() => onChooseGuide(guide)}
                >
                  {preferredGuideId === guide.id
                    ? "✓ Selected for my trip"
                    : "Choose this guide →"}
                </button>
              </article>
            ))
          )}
        </div>
      )}
      {preferredGuideId && guides.some((guide) => guide.id === preferredGuideId) && (
        <p className="tourist-selection-note" role="status">
          Your preference is saved on this device. Coordinate tour timing directly with your selected guide.
        </p>
      )}
    </section>
  );
}

export default TouristGuideDirectory;
