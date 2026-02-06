import { API_BASE } from "./config";

export const fetchRuns = () =>
  fetch(`${API_BASE}/runs`).then((r) => r.json());

export const fetchParameters = () =>
  fetch(`${API_BASE}/parameters`).then((r) => r.json());

export const fetchSeries = ({ runId, parameter }) => {
  if (!runId || !parameter) return Promise.resolve({ points: [] });

  return fetch(`${API_BASE}/events/filter?runid=${runId}&parameter=${parameter}`)
    .then((r) => {
      if (!r.ok) throw new Error("Failed to fetch series");
      return r.json();
    })
    .then((data) => (data && Array.isArray(data.points) ? data : { points: [] }));
};
