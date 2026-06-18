import { escHtml, isDivergence, divergeTooltip, formatSize } from "./utils.js";

const API = {
  observations: "/api/observations",
  nasa: (id) => `/api/nasa/neo/${id}`,
};

let selectedAsteroid = null;
let selectedRating = null;
let editRating = null;
let activeTag = null;
let allObservations = [];

// ─── DOM REFS ─────────────────────────────────────────────────

const formHeader = document.getElementById("formHeader");
const formBody = document.getElementById("formBody");
const formChevron = document.getElementById("formChevron");
const formSub = document.getElementById("formSub");
const asteroidSearch = document.getElementById("asteroidSearch");
const searchDropdown = document.getElementById("searchDropdown");
const observationForm = document.getElementById("observationForm");
const observationsList = document.getElementById("observationsList");
const emptyState = document.getElementById("emptyState");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalClose = document.getElementById("modalClose");
const modalCancel = document.getElementById("modalCancel");
const editForm = document.getElementById("editForm");

// ─── INIT ─────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  loadObservations();
  bindFormToggle();
  bindAsteroidSearch();
  bindFormEvents();
  bindModalEvents();
  bindRatingDots("ratingRow", (val) => {
    selectedRating = val;
    document.getElementById("dangerRating").value = val;
  });
  bindRatingDots("editRatingRow", (val) => {
    editRating = val;
    document.getElementById("editDangerRating").value = val;
  });
  checkUrlForAsteroid();
});

// ─── URL CHECK ────────────────────────────────────────────────

async function checkUrlForAsteroid() {
  const params = new URLSearchParams(window.location.search);
  const nasaId = params.get("nasaId");
  if (!nasaId) return;
  openForm();
  formSub.textContent = "— loading asteroid data...";
  await loadAsteroidById(nasaId);
}

// ─── LOAD OBSERVATIONS ────────────────────────────────────────

async function loadObservations() {
  try {
    const res = await fetch(API.observations);
    if (!res.ok) throw new Error("Failed to load");
    const data = await res.json();
    allObservations = data;
    if (data.length === 0) {
      emptyState.style.display = "block";
    } else {
      buildTagFilter(data);
      data.forEach((obs) => appendCard(obs));
    }
  } catch {
    observationsList.innerHTML = `<p class="load-error">Could not load observations. Try refreshing.</p>`;
  }
}

// ─── CARD RENDERING ───────────────────────────────────────────

function buildCard(obs) {
  const diverges = isDivergence(obs.dangerRating, obs.isHazardous);
  const tooltipText = divergeTooltip(obs.dangerRating, obs.isHazardous);

  const card = document.createElement("div");
  card.classList.add("obs-card");
  card.dataset.id = obs._id;

  card.innerHTML = `
    <div class="obs-card-main">
      <div class="obs-card-top">
        <div class="obs-card-titles">
          <p class="obs-card-title">${escHtml(obs.title || obs.asteroidName)}</p>
          <p class="obs-card-subtitle">${escHtml(obs.asteroidName)} · approach: ${escHtml(obs.approachDate)} · ID: ${escHtml(obs.nasaId)}</p>
        </div>
        <div class="badges">
          <span class="badge ${obs.isHazardous ? "badge-hazard" : "badge-safe"}">
            ${obs.isHazardous ? '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> HAZARDOUS' : "SAFE"}
          </span>
          ${
            diverges
              ? `
            <div class="diverge-wrap">
              <span class="badge badge-diverge">
                <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> DIVERGENCE
              </span>
              <div class="diverge-tooltip">${tooltipText}</div>
            </div>`
              : ""
          }
        </div>
      </div>

      <div class="obs-stats">
        <div class="obs-stat">
          <div class="obs-stat-label">MISS DIST</div>
          <div class="obs-stat-value">${escHtml(obs.missDistance)}</div>
        </div>
        <div class="obs-stat">
          <div class="obs-stat-label">EST. SIZE</div>
          <div class="obs-stat-value">${formatSize(obs.estimatedSize)}</div>
        </div>
        <div class="obs-stat">
          <div class="obs-stat-label">SPEED</div>
          <div class="obs-stat-value">${obs.speed ? escHtml(obs.speed) : "—"}</div>
        </div>
      </div>

      ${obs.notes ? `<p class="obs-notes">${escHtml(obs.notes)}</p>` : ""}

      <div class="obs-card-footer">
        <div class="footer-left">
          <div class="rating-dots">
            ${[1, 2, 3, 4, 5].map((n) => `<div class="rating-pip ${n <= obs.dangerRating ? "on" : ""}"></div>`).join("")}
          </div>
          ${obs.tag ? `<span class="obs-tag">${escHtml(obs.tag)}</span>` : ""}
        </div>
        <div class="card-actions">
          <button class="expand-btn" data-id="${obs._id}" data-nasa="${obs.nasaId}">
            <i class="fa-solid fa-chevron-down" aria-hidden="true"></i> approach history
          </button>
          <button class="icon-btn edit-btn" data-id="${obs._id}" title="Edit" aria-label="Edit observation">
            <i class="fa-solid fa-pen" aria-hidden="true"></i>
          </button>
          <button class="icon-btn delete-btn" data-id="${obs._id}" title="Delete" aria-label="Delete observation">
            <i class="fa-solid fa-trash" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="timeline-section" id="timeline-${obs._id}">
      <div class="timeline-header">
        <p class="timeline-title">APPROACH HISTORY — ALL KNOWN PASSES</p>
        <button class="goto-now-btn" data-scroll="${obs._id}">
          <i class="fa-solid fa-location-crosshairs" aria-hidden="true"></i> GO TO NOW
        </button>
      </div>
      <div class="timeline-scroll" id="scroll-${obs._id}">
        <div class="timeline-track" id="track-${obs._id}">
          <div class="timeline-line"></div>
        </div>
      </div>
      <div class="timeline-legend" id="legend-${obs._id}">
        <!-- injected by renderTimeline -->
      </div>
    </div>
  `;

  card.querySelector(".expand-btn").addEventListener("click", (e) => {
    toggleTimeline(obs._id, obs.nasaId, e.target.closest(".expand-btn"));
  });
  card
    .querySelector(".edit-btn")
    .addEventListener("click", () => openEditModal(obs));
  card
    .querySelector(".delete-btn")
    .addEventListener("click", () => deleteObservation(obs._id, card));

  card.querySelector(".goto-now-btn").addEventListener("click", () => {
    const scroll = document.getElementById(`scroll-${obs._id}`);
    const track = document.getElementById(`track-${obs._id}`);
    const nowMarker = track.querySelector(".timeline-now-marker");
    if (!nowMarker) return;
    const markerLeft = parseFloat(nowMarker.style.left);
    const scrollTo = markerLeft - scroll.clientWidth / 2;
    scroll.scrollTo({ left: scrollTo, behavior: "smooth" });
  });
  return card;
}

function prependCard(obs) {
  allObservations.unshift(obs);
  buildTagFilter(allObservations);
  const card = buildCard(obs);
  observationsList.prepend(card);
}

function appendCard(obs) {
  const card = buildCard(obs);
  observationsList.append(card);
}

// ─── TAG FILTER ───────────────────────────────────────────────

function buildTagFilter(observations) {
  const tagFilter = document.getElementById("tagFilter");
  const tags = [...new Set(observations.map((o) => o.tag).filter(Boolean))];
  if (tags.length === 0) {
    tagFilter.innerHTML = "";
    return;
  }
  tagFilter.innerHTML = `
    <span class="tag-filter-label">FILTER BY TAG</span>
    <button class="tag-filter-btn active" data-tag="all">ALL</button>
    ${tags.map((tag) => `<button class="tag-filter-btn" data-tag="${escHtml(tag)}">${escHtml(tag)}</button>`).join("")}
  `;
  tagFilter.querySelectorAll(".tag-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      tagFilter
        .querySelectorAll(".tag-filter-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeTag = btn.dataset.tag === "all" ? null : btn.dataset.tag;
      renderFilteredCards();
    });
  });
}

function renderFilteredCards() {
  observationsList.innerHTML = "";
  const filtered = activeTag
    ? allObservations.filter((o) => o.tag === activeTag)
    : allObservations;
  if (filtered.length === 0) {
    observationsList.innerHTML = `<p class="load-error">No observations with tag "${activeTag}".</p>`;
    return;
  }
  filtered.forEach((obs) => appendCard(obs));
}

// ─── FORM TOGGLE ──────────────────────────────────────────────

function bindFormToggle() {
  formHeader.addEventListener("click", toggleForm);
  formHeader.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") toggleForm();
  });
}

function toggleForm() {
  const isOpen = formBody.classList.contains("open");
  if (isOpen) {
    closeForm();
  } else {
    openForm();
  }
}

function openForm() {
  formBody.classList.add("open");
  formChevron.classList.remove("fa-chevron-down");
  formChevron.classList.add("fa-chevron-up");
  formHeader.setAttribute("aria-expanded", "true");
}

function closeForm() {
  formBody.classList.remove("open");
  formChevron.classList.remove("fa-chevron-up");
  formChevron.classList.add("fa-chevron-down");
  formHeader.setAttribute("aria-expanded", "false");
}

// ─── ASTEROID SEARCH ──────────────────────────────────────────

let searchTimeout = null;

function bindAsteroidSearch() {
  asteroidSearch.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    const query = asteroidSearch.value.trim();
    if (query.length < 2) {
      closeDropdown();
      return;
    }
    searchTimeout = setTimeout(() => searchAsteroid(query), 400);
  });

  asteroidSearch.addEventListener("blur", () => {
    setTimeout(closeDropdown, 200);
  });
}

async function searchAsteroid(query) {
  if (/^\d+$/.test(query)) {
    await loadAsteroidById(query);
    return;
  }
  showDropdownMessage("Enter a NASA asteroid ID (numeric) to look up.");
}

async function loadAsteroidById(nasaId) {
  setFieldsLoading(true);
  try {
    const res = await fetch(API.nasa(nasaId));
    if (!res.ok) {
      showDropdownMessage(
        "Asteroid not found. Check the NASA ID and try again."
      );
      clearAsteroidFields();
      return;
    }
    const data = await res.json();
    populateAsteroidFields(data);
    closeDropdown();
  } catch {
    showDropdownMessage("Could not reach NASA. Try again in a moment.");
    clearAsteroidFields();
  }
}

function setFieldsLoading(isLoading) {
  const fields = ["fieldDate", "fieldDistance", "fieldSize", "fieldHazard"];
  fields.forEach((id) => {
    document.getElementById(id).textContent = isLoading ? "loading..." : "—";
  });
}

function populateAsteroidFields(data) {
  selectedAsteroid = data;

  const name = data.name;
  const isHazardous = data.is_potentially_hazardous_asteroid;

  const approaches = data.close_approach_data || [];
  const latest = approaches[approaches.length - 1] || {};

  const date = latest.close_approach_date || "—";
  const distance = latest.miss_distance
    ? `${Number(latest.miss_distance.kilometers).toLocaleString(undefined, { maximumFractionDigits: 0 })} km`
    : "—";

  const minSize = data.estimated_diameter?.meters?.estimated_diameter_min || 0;
  const maxSize = data.estimated_diameter?.meters?.estimated_diameter_max || 0;
  const avgSize = Math.round((minSize + maxSize) / 2);

  const speed = latest.relative_velocity
    ? `${Number(latest.relative_velocity.kilometers_per_second).toFixed(2)} km/s`
    : "—";

  document.getElementById("nasaId").value = data.id;
  document.getElementById("asteroidName").value = name;
  document.getElementById("asteroidSpeed").value = speed;
  document.getElementById("asteroidSize").value = avgSize;
  document.getElementById("fieldDate").textContent = date;
  document.getElementById("fieldDistance").textContent = distance;
  document.getElementById("fieldSize").textContent = formatSize(avgSize);

  const hazardEl = document.getElementById("fieldHazard");
  hazardEl.innerHTML = isHazardous
    ? `<span class="hazard-pill"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> HAZARDOUS</span>`
    : `<span class="safe-pill">SAFE</span>`;

  const titleEl = document.getElementById("obsTitle");
  if (!titleEl.value || titleEl.value === titleEl.dataset.auto) {
    const autoTitle = `${name} — ${date}`;
    titleEl.value = autoTitle;
    titleEl.dataset.auto = autoTitle;
  }

  formSub.textContent = `— ${name} loaded`;
  asteroidSearch.value = name;
}

function clearAsteroidFields() {
  selectedAsteroid = null;
  document.getElementById("nasaId").value = "";
  document.getElementById("asteroidName").value = "";
  document.getElementById("asteroidSpeed").value = "";
  document.getElementById("asteroidSize").value = "";
  document.getElementById("fieldDate").textContent = "—";
  document.getElementById("fieldDistance").textContent = "—";
  document.getElementById("fieldSize").textContent = "—";
  document.getElementById("fieldHazard").textContent = "—";
  formSub.textContent = "— select an asteroid to begin";
}

function showDropdownMessage(msg) {
  searchDropdown.innerHTML = `<div class="search-option">${msg}</div>`;
  searchDropdown.classList.add("open");
}

function closeDropdown() {
  searchDropdown.classList.remove("open");
  searchDropdown.innerHTML = "";
}

// ─── RATING DOTS ──────────────────────────────────────────────

function bindRatingDots(rowId, onChange) {
  const row = document.getElementById(rowId);
  if (!row) return;
  row.querySelectorAll(".rating-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      const val = Number(dot.dataset.val);
      row
        .querySelectorAll(".rating-dot")
        .forEach((d) => d.classList.remove("active"));
      dot.classList.add("active");
      onChange(val);
    });
  });
}

function setRatingDots(rowId, val) {
  const row = document.getElementById(rowId);
  if (!row) return;
  row.querySelectorAll(".rating-dot").forEach((dot) => {
    dot.classList.toggle("active", Number(dot.dataset.val) === val);
  });
}

// ─── FORM SUBMISSION ──────────────────────────────────────────

function bindFormEvents() {
  observationForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFormErrors();

    if (!selectedAsteroid) {
      showFormError("Search for an asteroid first.");
      return;
    }
    if (!selectedRating) {
      document.getElementById("ratingError").textContent =
        "Select a danger rating.";
      return;
    }

    const payload = {
      nasaId: document.getElementById("nasaId").value,
      asteroidName: document.getElementById("asteroidName").value,
      title: document.getElementById("obsTitle").value.trim(),
      tag: document.getElementById("obsTag").value.trim(),
      dangerRating: selectedRating,
      notes: document.getElementById("obsNotes").value.trim(),
      isHazardous: selectedAsteroid.is_potentially_hazardous_asteroid,
      approachDate: document.getElementById("fieldDate").textContent,
      missDistance: document.getElementById("fieldDistance").textContent,
      estimatedSize: Number(document.getElementById("asteroidSize").value),
      speed: document.getElementById("asteroidSpeed").value,
    };

    try {
      const res = await fetch(API.observations, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("POST status:", res.status);

      if (!res.ok) {
        showFormError("Failed to save. Please try again.");
        return;
      }

      const saved = await res.json();
      console.log("saved:", saved);
      prependCard(saved);
      resetForm();
      closeForm();
      emptyState.style.display = "none";
    } catch (err) {
      console.error("POST catch error:", err);
      showFormError("Could not connect. Please try again.");
    }
  });
}

function resetForm() {
  observationForm.reset();
  selectedAsteroid = null;
  selectedRating = null;
  clearAsteroidFields();
  asteroidSearch.value = "";
  document
    .querySelectorAll("#ratingRow .rating-dot")
    .forEach((d) => d.classList.remove("active"));
  document.getElementById("dangerRating").value = "";
}

function clearFormErrors() {
  document.getElementById("titleError").textContent = "";
  document.getElementById("ratingError").textContent = "";
  document.getElementById("formError").textContent = "";
}

function showFormError(msg) {
  document.getElementById("formError").textContent = msg;
}

// ─── UTILS ────────────────────────────────────────────────────

// ─── DELETE ───────────────────────────────────────────────────

async function deleteObservation(id, cardEl) {
  const confirmed = window.confirm(
    "Delete this observation? This cannot be undone."
  );
  if (!confirmed) return;

  try {
    const res = await fetch(`${API.observations}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    cardEl.remove();
    allObservations = allObservations.filter((o) => o._id !== id);
    activeTag = null;
    buildTagFilter(allObservations);
    if (observationsList.children.length === 0) {
      emptyState.style.display = "block";
    }
  } catch {
    alert("Could not delete. Please try again.");
  }
}

// ─── EDIT MODAL ───────────────────────────────────────────────

function openEditModal(obs) {
  document.getElementById("editId").value = obs._id;
  document.getElementById("editTitle").value = obs.title || "";
  document.getElementById("editTag").value = obs.tag || "";
  document.getElementById("editNotes").value = obs.notes || "";
  editRating = obs.dangerRating;
  document.getElementById("editDangerRating").value = obs.dangerRating;
  setRatingDots("editRatingRow", obs.dangerRating);
  modalBackdrop.style.display = "flex";
}

function closeEditModal() {
  modalBackdrop.style.display = "none";
}

function bindModalEvents() {
  modalClose.addEventListener("click", closeEditModal);
  modalCancel.addEventListener("click", closeEditModal);
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeEditModal();
  });

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editId").value;

    const payload = {
      title: document.getElementById("editTitle").value.trim(),
      tag: document.getElementById("editTag").value.trim(),
      notes: document.getElementById("editNotes").value.trim(),
      dangerRating: editRating,
    };

    try {
      const res = await fetch(`${API.observations}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      updateCardInDom(updated);
      closeEditModal();
    } catch {
      alert("Could not save changes. Please try again.");
    }
  });
}

function updateCardInDom(obs) {
  const existing = observationsList.querySelector(`[data-id="${obs._id}"]`);
  if (!existing) return;
  const newCard = buildCard(obs);
  existing.replaceWith(newCard);
}

// ─── APPROACH TIMELINE ────────────────────────────────────────

async function toggleTimeline(obsId, nasaId, btn) {
  const section = document.getElementById(`timeline-${obsId}`);
  const isOpen = section.classList.contains("open");

  if (isOpen) {
    section.classList.remove("open");
    btn.innerHTML =
      '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i> approach history';
    return;
  }

  section.classList.add("open");
  btn.innerHTML =
    '<i class="fa-solid fa-chevron-up" aria-hidden="true"></i> hide history';

  const track = document.getElementById(`track-${obsId}`);
  if (track.dataset.loaded) return;

  track.innerHTML =
    '<div class="timeline-line"></div><p class="timeline-loading"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> loading passes...</p>';

  try {
    const res = await fetch(API.nasa(nasaId));
    if (!res.ok) throw new Error("NASA fetch failed");
    const data = await res.json();
    track.innerHTML = '<div class="timeline-line"></div>';
    renderTimeline(track, data.close_approach_data || []);
    track.dataset.loaded = "true";
  } catch {
    track.innerHTML =
      '<div class="timeline-line"></div><p class="timeline-error">Could not load approach history.</p>';
  }
}

function renderTimeline(track, approaches) {
  if (approaches.length === 0) {
    track.innerHTML += `<p class="timeline-empty">No approach data available.</p>`;
    return;
  }

  const nowYear = new Date().getFullYear();

  // Group approaches by year
  const byYear = new Map();
  approaches.forEach((approach) => {
    const year = Number(approach.close_approach_date?.split("-")[0]);
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push(approach);
  });

  const sortedYears = [...byYear.keys()].sort((a, b) => a - b);
  const minYear = sortedYears[0];
  const maxYear = sortedYears[sortedYears.length - 1];
  const range = maxYear - minYear || 1;

  // Min gap between adjacent years
  const minGap = 30;
  const minYearGap = sortedYears.reduce((min, yr, i) => {
    if (i === 0) return min;
    return Math.min(min, yr - sortedYears[i - 1]);
  }, Infinity);

  const pxPerYear = minYearGap === Infinity ? 10 : minGap / minYearGap;
  const totalWidth = Math.max(900, Math.ceil(range * pxPerYear) + 80);
  track.style.minWidth = `${totalWidth}px`;

  const padding = 40;
  const usableWidth = totalWidth - padding * 2;
  const toPx = (year) => padding + ((year - minYear) / range) * usableWidth;

  // NOW marker
  const nowMarker = document.createElement("div");
  nowMarker.classList.add("timeline-now-marker");
  nowMarker.style.left = `${toPx(nowYear)}px`;
  track.appendChild(nowMarker);

  const nowLabel = document.createElement("span");
  nowLabel.classList.add("timeline-now-label");
  nowLabel.style.left = `${toPx(nowYear)}px`;
  nowLabel.textContent = "NOW";
  track.appendChild(nowLabel);

  // Render one node per year
  byYear.forEach((yearApproaches, year) => {
    const isFuture = year > nowYear;
    const distKms = yearApproaches.map((a) =>
      Number(a.miss_distance?.kilometers || 0)
    );
    const minDistKm = Math.min(...distKms);
    const isClose = !isFuture && minDistKm > 0 && minDistKm < 100000;

    const type = isFuture ? "future" : isClose ? "close" : "distant";

    const tooltipLines = isFuture
      ? ["future approach"]
      : yearApproaches.map((a) => {
          const d = Number(a.miss_distance?.kilometers || 0);
          return d ? `${Math.round(d / 1000)}k km` : "—";
        });
    const tooltipText = tooltipLines.join(" · ");

    const node = document.createElement("div");
    node.classList.add("timeline-node");
    node.style.left = `${toPx(year)}px`;
    node.innerHTML = `
      <div class="timeline-node-dot ${type}"></div>
      <div class="timeline-node-year ${type}">${year}</div>
      <div class="timeline-node-tooltip">${tooltipText}</div>
    `;
    track.appendChild(node);
  });

  // Legend counts — based on unique years
  const closeCount = [...byYear.entries()].filter(([year, appr]) => {
    const distKm = Math.min(
      ...appr.map((a) => Number(a.miss_distance?.kilometers || 0))
    );
    return year <= nowYear && distKm > 0 && distKm < 100000;
  }).length;

  const distantCount = [...byYear.entries()].filter(([year, appr]) => {
    const distKm = Math.min(
      ...appr.map((a) => Number(a.miss_distance?.kilometers || 0))
    );
    return year <= nowYear && distKm >= 100000;
  }).length;

  const futureCount = [...byYear.keys()].filter(
    (year) => year > nowYear
  ).length;

  const legend = track
    .closest(".timeline-section")
    .querySelector(".timeline-legend");
  if (legend) {
    legend.innerHTML = `
      <div class="legend-item">
        <div class="timeline-node-dot close"></div>
        ${closeCount} close
      </div>
      <div class="legend-item">
        <div class="timeline-node-dot distant"></div>
        ${distantCount} distant
      </div>
      <div class="legend-item">
        <div class="timeline-node-dot future"></div>
        ${futureCount} future
      </div>
    `;
  }
}
