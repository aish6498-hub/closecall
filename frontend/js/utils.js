export function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isDivergence(rating, isHazardous) {
  if (isHazardous && rating <= 2) return true;
  if (!isHazardous && rating >= 4) return true;
  return false;
}

export function divergeTooltip(rating, isHazardous) {
  if (isHazardous && rating <= 2) {
    return `You rated this ${rating}/5 danger.<br>NASA classifies it as HAZARDOUS.<br>You think it is safer than NASA.`;
  }
  if (!isHazardous && rating >= 4) {
    return `You rated this ${rating}/5 danger.<br>NASA classifies it as SAFE.<br>You think it is more dangerous than NASA.`;
  }
  return "";
}

export function formatSize(meters) {
  if (!meters) return "—";
  if (meters >= 1000) return `≈${(meters / 1000).toFixed(1)} km`;
  return `≈${Math.round(meters)} m`;
}
