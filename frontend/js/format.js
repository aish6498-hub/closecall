// 1 LD = Distance between Earth to Moon . 
//   under 1 LD: danger (red), 
//   1–3 LD: warn (amber), 
//   above 3: neutral.
export function ldClass(ld) {
  if (ld < 1) return "danger";
  if (ld <= 3) return "warn";
  return "neutral";
}

// Mini bar width as a percentage.
export function barWidth(ld) {
  const capped = Math.min(ld, 10);
  return '${(capped / 10) * 100}%';
}

export function formatLD(ld) {
  return '${ld.toFixed(1)} LD';
}

export function formatVelocity(kms) {
  return '${kms.toFixed(1)} km/s';
}

// Show metres until it gets silly, then switch to km.
export function formatDiameter(minM, maxM) {
  if (maxM >= 1000) {
    return '${(minM / 1000).toFixed(1)} – ${(maxM / 1000).toFixed(1)} km';
  }
  return '${Math.round(minM)} – ${Math.round(maxM)} m';
}

export function formatDate(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function isUnder500m(maxM) {
  return maxM < 500;
}