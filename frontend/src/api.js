const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = (
  configuredApiUrl || "http://localhost:5000"
).replace(/\/+$/, "");

export function apiUrl(path) {
  return `${API_BASE_URL}/${String(path).replace(/^\/+/, "")}`;
}
