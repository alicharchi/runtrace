export const COLORS = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
];

export function formatDateTime(isoString) {
  if (!isoString) return "";
  
  const normalized = isoString.replace(
    /\.(\d{3})\d*/,
    ".$1"
  );
  
  const utcString = normalized.endsWith("Z")
    ? normalized
    : `${normalized}Z`;

  return new Date(utcString).toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return "N/A";

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return "N/A";
  }

  let diffInSeconds = Math.floor((end - start) / 1000);

  const hours = Math.floor(diffInSeconds / 3600);
  diffInSeconds %= 3600;
  const minutes = Math.floor(diffInSeconds / 60);
  const seconds = diffInSeconds % 60;

  // Pad with leading zeros
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return `${hh}:${mm}:${ss}`;
}
