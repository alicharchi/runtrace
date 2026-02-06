import { API_BASE } from "./config";

export const fetchRuns = () =>
  fetch(`${API_BASE}/runs`).then((r) => r.json());

export async function fetchParameters(runId) {
  if (!runId) return [];

  const url = `${API_BASE}/parameters?runid=${runId}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to fetch parameters. Response:", text);
    throw new Error("Failed to fetch parameters");
  }

  return res.json();
}

export async function fetchPlotData(runId, parameter) {
  if (!runId || !parameter) return [];

  const url = `${API_BASE}/events/filter?runid=${runId}&parameter=${parameter}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    console.error(`Failed to fetch plot data. Response: ${text}`);
    throw new Error(`Failed to fetch plot data: ${res.status}`);
  }

  const data = await res.json();
  return data.points || [];
}

