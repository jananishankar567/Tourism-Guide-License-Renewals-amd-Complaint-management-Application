function TouristFeedbackDialog({
  activeForm,
  error,
  rating,
  message,
  saving,
  onClose,
  onRatingChange,
  onMessageChange,
  onSubmit,
}) {
  if (!activeForm) return null;

  const isFeedback = activeForm.type === "Feedback";

  return (
    <div
      className="tourist-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="dashboard-panel tourist-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tourist-response-title"
      >
        <button
          className="tourist-modal-close"
          type="button"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>
        <span className="panel-label">
          {isFeedback ? "GPS-VERIFIED EXPERIENCE" : "TOURIST SUPPORT"}
        </span>
        <h3 id="tourist-response-title">
          {isFeedback ? "Rate your tour" : "Report a tour concern"}
        </h3>
        <p className="tourist-modal-context">
          {activeForm.tour.attractionId?.name || "Completed tour"} with{" "}
          {activeForm.tour.guideApplicationId?.fullName || "your guide"}
        </p>
        <form className="tourist-feedback-form" onSubmit={onSubmit}>
          {error && <div className="tourist-inline-error" role="alert">{error}</div>}
          {isFeedback && (
            <label>
              Your rating
              <select
                value={rating}
                onChange={(event) => onRatingChange(Number(event.target.value))}
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} {value === 1 ? "star" : "stars"}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            {isFeedback ? "Your experience" : "What happened?"}
            <textarea
              value={message}
              onChange={(event) => onMessageChange(event.target.value)}
              minLength={isFeedback ? 5 : 10}
              maxLength={3000}
              rows={5}
              required
            />
          </label>
          <button className="tourist-inline-button" disabled={saving}>
            {saving ? "Submitting..." : "Submit securely"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default TouristFeedbackDialog;
