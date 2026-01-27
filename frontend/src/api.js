export const API = "http://localhost:8001";

export const fetchRuns = () =>
  fetch(`${API}/runs`).then(r => r.json());

export const fetchParameters = () =>
  fetch(`${API}/parameters`).then(r => r.json());

export const fetchSeries = ({ runId, parameter }) =>
  fetch(`${API}/events/filter?runid=${runId}&parameter=${parameter}`)
    .then(r => r.json());
