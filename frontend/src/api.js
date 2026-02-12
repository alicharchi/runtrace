import { API_BASE } from "./config";

async function fetchWithToken(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`API request failed. Response: ${text}`);
    throw new Error(text || "API request failed");
  }

  return res.json();
}

export const fetchRuns = (token) => fetchWithToken(`${API_BASE}/runs`, token);

export async function fetchParameters(runId, token) {
  if (!runId) return [];

  const url = `${API_BASE}/parameters?runid=${runId}`;
  return fetchWithToken(url, token);
}

export async function fetchPlotData(runId, parameter, token) {
  if (!runId || !parameter) return [];

  const url = `${API_BASE}/events/filter?runid=${runId}&parameter=${parameter}`;
  const data = await fetchWithToken(url, token);
  return data.points || [];
}

export async function fetchUsers(token) {
  const url = `${API_BASE}/users`;
  return fetchWithToken(url, token);
}

export async function addUser(userData, token) {
  const res = await fetch(`${API_BASE}/users/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to add user");
  }

  return res.json();
}
