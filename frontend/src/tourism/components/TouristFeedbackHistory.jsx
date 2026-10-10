function TouristFeedbackHistory({ entries }) {
  return (
    <section className="dashboard-panel tourist-section" id="tourist-feedback">
      <div className="panel-heading">
        <div>
          <span className="panel-label">TOURIST SUPPORT</span>
          <h3>My feedback &amp; complaints</h3>
        </div>
        <span className="progress-status">{entries.length} submitted</span>
      </div>

      {entries.length === 0 ? (
        <div className="empty-activity tourist-empty-state">
          <div className="empty-icon">✉</div>
          <h4>No feedback or complaints yet</h4>
          <p>After a verified tour, your submissions and administration responses will appear here.</p>
        </div>
      ) : (
        <div className="tourist-feedback-list">
          {entries.map((entry) => (
            <article className="tourist-feedback-row" key={entry._id}>
              <div className="tourist-feedback-heading">
                <div>
                  <span className={`progress-status ${entry.moderationStatus === "Reviewed" ? "tourist-reviewed-status" : ""}`}>
                    {entry.type} · {entry.moderationStatus}
                  </span>
                  <h4>{entry.attractionId?.name || "Tour location"}</h4>
                  <p>
                    Guide {entry.guideId?.fullName || "—"} ·{" "}
                    {new Date(entry.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                {entry.type === "Feedback" && (
                  <strong className="tourist-rating">★ {entry.rating}/5</strong>
                )}
              </div>
              <p className="tourist-feedback-message">{entry.message}</p>
              {entry.adminResponse && (
                <div className="tourist-admin-reply">
                  <strong>Administration response</strong>
                  <p>{entry.adminResponse}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default TouristFeedbackHistory;
