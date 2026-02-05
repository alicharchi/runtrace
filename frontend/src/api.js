export const API = "http://localhost:8001";

export const fetchRuns = () =>
  fetch(`${API}/runs`).then((r) => r.json());

export const fetchParameters = () =>
  fetch(`${API}/parameters`).then((r) => r.json());

/**
 * Fetch a single EventsSeries for a given run and parameter.
 * Ensures we always return an object with a `points` array.
 */
export const fetchSeries = ({ runId, parameter }) => {
  if (!runId || !parameter) return Promise.resolve({ points: [] });

  return fetch(`${API}/events/filter?runid=${runId}&parameter=${parameter}`)
    .then((r) => {
      if (!r.ok) throw new Error("Failed to fetch series");
      return r.json();
    })
    .then((data) => (data && Array.isArray(data.points) ? data : { points: [] }));
};
