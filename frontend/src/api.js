import { API_BASE } from "./config";

async function fetchWithToken(url, token, options = {}, fallback = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    let text;
    try {
      text = await res.text();
    } catch {
      text = "";
    }
    console.error(`API request failed. Response: ${text}`);
    throw new Error(text || "API request failed");
  }

  try {
    return await res.json();
  } catch {
    return fallback;
  }
}

// ------------------- Auth -------------------

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
  if (!data.access_token) throw new Error("No token received");

  return data.access_token;
}

export async function fetchCurrentUser(token) {
  const res = await fetch(`${API_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch user info");

  try {
    return await res.json();
  } catch {
    return {};
  }
}

// ------------------- Runs & Parameters -------------------

export const fetchRuns = (token) => fetchWithToken(`${API_BASE}/runs`, token, {}, []);

export async function fetchRunInfo(runId, token) {
  if (!runId) return [];
  return fetchWithToken(`${API_BASE}/runinfo?runid=${runId}`, token, {}, []);
}

export async function fetchParameters(runId, token) {
  if (!runId) return [];
  return fetchWithToken(`${API_BASE}/parameters?runid=${runId}`, token, {}, []);
}

export async function fetchPlotData(runId, parameter, token) {
  if (!runId || !parameter) return [];
  const data = await fetchWithToken(
    `${API_BASE}/events/filter?runid=${runId}&parameter=${parameter}`,
    token,
    {},
    {}
  );
  return data.points || [];
}

// ------------------- Users -------------------

export async function fetchUsers(token) {
  return fetchWithToken(`${API_BASE}/users`, token, {}, []);
}

export async function addUser(userData, token) {
  return fetchWithToken(`${API_BASE}/users/`, token, {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export async function updateUser(userId, updateData, token) {
  return fetchWithToken(`${API_BASE}/users/${userId}`, token, {
    method: "PATCH",
    body: JSON.stringify(updateData),
  });
}

export async function deleteUser(userId, token) {
  return fetchWithToken(`${API_BASE}/users/${userId}`, token, {
    method: "DELETE",
  });
}
