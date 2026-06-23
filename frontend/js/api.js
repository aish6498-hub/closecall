const NASA_BASE = "/api/nasa";

async function request(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let message = "Request failed.";
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      // To avoid no block error.
    }
    throw new Error(message);
  }
  return res.json();
}

// --- NASA feed (proxied through our backend) ---

export function getFeed() {
  return request(`${NASA_BASE}/feed`);
}

export async function getNeo(id) {
  const neo = await request(`${NASA_BASE}/neo/${id}`);
  const today = new Date().toISOString().slice(0, 10);

  const upcoming = (neo.close_approach_data || [])
    .filter((a) => a.close_approach_date >= today)
    .sort((a, b) => a.close_approach_date.localeCompare(b.close_approach_date));

  const next = upcoming[0] || null;

  return {
    id: neo.id,
    name: neo.name,
    hazardous: neo.is_potentially_hazardous_asteroid,
    next: next
      ? {
          date: next.close_approach_date,
          missLD: Number(next.miss_distance.lunar),
          velocityKms: Number(next.relative_velocity.kilometers_per_second),
        }
      : null,
  };
}

// --- NASA single NEO (raw, full response) ---
export function getNeoRaw(id) {
  return request(`${NASA_BASE}/neo/${id}`);
}

// --- Observations CRUD ---
export function getObservations() {
  return request("/api/observations");
}

export function createObservation(payload) {
  return request("/api/observations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateObservation(id, payload) {
  return request(`/api/observations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteObservation(id) {
  return request(`/api/observations/${id}`, { method: "DELETE" });
}

// --- Watchlist CRUD ---
export function getWatchlist() {
  return request("/api/watchlist");
}

export function addToWatchlist(payload) {
  return request("/api/watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateWatchlistItem(id, payload) {
  return request(`/api/watchlist/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteWatchlistItem(id) {
  return request(`/api/watchlist/${id}`, { method: "DELETE" });
}
