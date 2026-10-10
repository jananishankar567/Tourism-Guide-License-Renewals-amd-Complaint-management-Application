function TouristTourHistory({
  joinCode,
  onJoinCodeChange,
  onOpenTourCode,
  loadingTours,
  tours,
  touristId,
  onOpenFeedback,
}) {
  return (
    <section className="dashboard-panel tourist-section" id="tourist-tours">
      <div className="panel-heading">
        <div>
          <span className="panel-label">GPS-VERIFIED VISITS</span>
          <h3>My authenticated tours</h3>
        </div>
        <span className="progress-status">{tours.length} tour{tours.length === 1 ? "" : "s"}</span>
      </div>

      <form className="tourist-join-code" onSubmit={onOpenTourCode}>
        <label htmlFor="tourism-join-code">Have a guide’s tour code?</label>
        <div>
          <input
            id="tourism-join-code"
            type="text"
            value={joinCode}
            onChange={(event) => onJoinCodeChange(event.target.value)}
            placeholder="Enter 10-character code"
            maxLength={10}
            pattern="[A-Fa-f0-9]{10}"
            autoCapitalize="characters"
            required
          />
          <button className="tourist-inline-button" type="submit">
            Continue to check-in
          </button>
        </div>
      </form>

      {loadingTours ? (
        <div className="empty-activity tourist-empty-state">
          <div className="empty-icon">⌕</div>
          <h4>Loading your tour history...</h4>
        </div>
      ) : tours.length === 0 ? (
        <div className="empty-activity tourist-empty-state">
          <div className="empty-icon">⌖</div>
          <h4>Your authenticated tours will appear here</h4>
          <p>Ask your guide to display the tour QR code when you arrive.</p>
        </div>
      ) : (
        <div className="tourist-tour-list">
          {tours.map((tour) => {
            const participant = tour.participants?.find(
              (entry) => String(entry.touristId) === String(touristId)
            );
            const feedbackEligible =
              tour.status === "Completed" &&
              tour.verified &&
              participant?.locationVerified;

            return (
              <article className="tourist-tour-row" key={tour._id}>
                <div className="tourist-tour-marker" aria-hidden="true">⌖</div>
                <div className="tourist-tour-copy">
                  <span className={`progress-status ${tour.verified ? "tourist-verified-status" : ""}`}>
                    {tour.verified ? "GPS verified" : tour.status}
                  </span>
                  <h4>{tour.attractionId?.name || "Tour location"}</h4>
                  <p>
                    {tour.guideApplicationId?.fullName || "Licensed guide"}
                    {tour.attractionId?.district ? ` · ${tour.attractionId.district}` : ""}
                  </p>
                  <small>
                    {tour.completedAt
                      ? new Date(tour.completedAt).toLocaleDateString("en-IN")
                      : "In progress"}
                    {tour.verificationMessage ? ` · ${tour.verificationMessage}` : ""}
                  </small>
                </div>
                {feedbackEligible && (
                  <div className="tourist-tour-actions">
                    {!tour.hasFeedback && (
                      <button
                        type="button"
                        className="tourist-inline-button"
                        onClick={() => onOpenFeedback("Feedback", tour)}
                      >
                        Leave feedback
                      </button>
                    )}
                    {!tour.hasComplaint && (
                      <button
                        type="button"
                        className="tourist-secondary-button"
                        onClick={() => onOpenFeedback("Complaint", tour)}
                      >
                        Report an issue
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default TouristTourHistory;
