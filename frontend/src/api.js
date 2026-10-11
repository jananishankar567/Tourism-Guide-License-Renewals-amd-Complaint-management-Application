
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const defaultApiUrl = import.meta.env.DEV
  ? "http://localhost:5000"
  : "https://tourism-guide-license-renewals-amd.onrender.com";

export const API_BASE_URL = (
  configuredApiUrl ||
  defaultApiUrl
).replace(/\/+$/, "");

export function apiUrl(path) {
  return `${API_BASE_URL}/${String(path).replace(/^\/+/, "")}`;
}
