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

export async function deleteUser(userId, token) {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to delete user");
  }

  return res.json();
}

export async function updateUser(userId, updateData, token) {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(updateData),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to update user");
  }
  return res.json();
}

export async function fetchRunInfo(runId, token) {
  if (!runId) return [];

  const url = `${API_BASE}/runinfo?runid=${runId}`;
  return fetchWithToken(url, token);
}

export async function login(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Login failed");
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error("No token received");
  }

  return data.access_token;
}

export async function fetchCurrentUser(token) {
  const res = await fetch(`${API_BASE}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user info");
  }

  return res.json();
}