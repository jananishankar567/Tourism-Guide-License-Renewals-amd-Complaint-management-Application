export function getApplicantEmail() {
  const savedEmail = localStorage.getItem("applicantEmail");

  if (savedEmail) {
    return savedEmail;
  }

  try {
    const applicant = JSON.parse(
      localStorage.getItem("applicant") || "null"
    );

    if (applicant?.email) {
      return applicant.email;
    }
  } catch (error) {
    console.error("Unable to read saved applicant details:", error);
  }

  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  try {
    const encodedPayload = token.split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const payload = JSON.parse(
      atob(encodedPayload.padEnd(Math.ceil(encodedPayload.length / 4) * 4, "="))
    );

    return payload.email || null;
  } catch (error) {
    console.error("Unable to read applicant email from session:", error);
    return null;
  }
}
