import { getFeed, getWatchlist, addToWatchlist } from "./api.js";
import "./nav.js";
import { escHtml } from "./utils.js";
import {
  ldClass,
  barWidth,
  formatLD,
  formatVelocity,
  formatDiameter,
  formatDate,
  isUnder500m,
} from "./format.js";

// --- module state ---
let allObjects = [];
let savedIds = new Set();
let activeFilter = "all";
let activeSort = "miss";
let selectedId = null;

// Familiar things to scale asteroids.
const REFERENCES = [
  { name: "a school bus", meters: 12 },
  { name: "a basketball court", meters: 28 },
  { name: "a football field", meters: 110 },
  { name: "the Eiffel Tower", meters: 330 },
  { name: "the Empire State Building", meters: 443 },
  { name: "the Burj Khalifa", meters: 830 },
];

// --- element refs ---
const els = {
  meta: document.querySelector("#feed-meta"),
  statTotal: document.querySelector("#stat-total"),
  statHazard: document.querySelector("#stat-hazard"),
  statClosest: document.querySelector("#stat-closest"),
  statFastest: document.querySelector("#stat-fastest"),
  tableBody: document.querySelector("#feed-body"),
  refreshBtn: document.querySelector("#refresh-btn"),
  filterPills: document.querySelector("#filter-pills"),
  sortPills: document.querySelector("#sort-pills"),
  comparator: document.querySelector("#comparator"),
  comparatorHeadline: document.querySelector("#comparator-headline"),
  comparatorBars: document.querySelector("#comparator-bars"),
};

// --- size comparator ---

function tidy(mult) {
  return mult >= 2 ? Math.round(mult) : mult.toFixed(1);
}

function sizeLabel(meters) {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.round(meters)} m`;
}

function compareSize(maxM) {
  let ref = REFERENCES[0];
  for (const r of REFERENCES) {
    if (maxM >= r.meters) ref = r;
  }
  const multiplier = maxM / ref.meters;

  let headline;
  if (multiplier >= 0.8 && multiplier <= 1.3) {
    headline = `about the size of ${ref.name}`;
  } else {
    headline = `about ${tidy(multiplier)}× ${ref.name}`;
  }
  return { ref, multiplier, headline };
}

function renderComparator(obj) {
  if (!obj) return;
  selectedId = obj.id;

  const { ref, headline } = compareSize(obj.diameterMaxM);
  const name = escHtml(obj.name);
  els.comparatorHeadline.innerHTML = `<strong>${name}</strong> is ${headline}.`;

  // Scale both bars against whichever is larger.
  const larger = Math.max(obj.diameterMaxM, ref.meters);
  const astW = (obj.diameterMaxM / larger) * 100;
  const refW = (ref.meters / larger) * 100;

  els.comparatorBars.innerHTML = `
    <div class="cmp-row">
      <span class="cmp-label">${name} — up to ${sizeLabel(obj.diameterMaxM)}</span>
      <span class="cmp-bar"><span class="cmp-fill cmp-asteroid" style="width:${astW}%"></span></span>
    </div>
    <div class="cmp-row">
      <span class="cmp-label">${ref.name} — ${sizeLabel(ref.meters)}</span>
      <span class="cmp-bar"><span class="cmp-fill cmp-ref" style="width:${refW}%"></span></span>
    </div>
  `;
  els.comparator.hidden = false;
}

// --- filtering + sorting ---

function applyFilter(objects) {
  switch (activeFilter) {
    case "hazardous":
      return objects.filter((o) => o.hazardous);
    case "under1ld":
      return objects.filter((o) => o.missLD < 1);
    case "under500m":
      return objects.filter((o) => isUnder500m(o.diameterMaxM));
    default:
      return objects;
  }
}

function applySort(objects) {
  const copy = [...objects];
  switch (activeSort) {
    case "date":
      return copy.sort((a, b) => a.approachDate.localeCompare(b.approachDate));
    case "size":
      return copy.sort((a, b) => b.diameterMaxM - a.diameterMaxM);
    case "velocity":
      return copy.sort((a, b) => b.velocityKms - a.velocityKms);
    default:
      return copy.sort((a, b) => a.missLD - b.missLD);
  }
}

// --- rendering ---

function renderStats() {
  const hazardCount = allObjects.filter((o) => o.hazardous).length;
  const closest = Math.min(...allObjects.map((o) => o.missLD));
  const fastest = Math.max(...allObjects.map((o) => o.velocityKms));

  els.statTotal.textContent = allObjects.length;
  els.statHazard.textContent = hazardCount;
  els.statClosest.textContent = formatLD(closest);
  els.statFastest.textContent = formatVelocity(fastest);
}

function renderRow(obj) {
  const tr = document.createElement("tr");
  const id = escHtml(obj.id);
  const name = escHtml(obj.name);
  tr.dataset.id = obj.id;
  if (obj.id === selectedId) tr.classList.add("is-selected");
  const cls = ldClass(obj.missLD);
  const saved = savedIds.has(obj.id);

  tr.innerHTML = `
    <td class="object-cell">
      <span class="threat-dot ${obj.hazardous ? "is-hazard" : ""}"></span>
      <div class="object-id">
        <span class="object-name">${name}</span>
        <span class="object-neo">${id}</span>
        <span class="badge ${obj.hazardous ? "badge-hazard" : "badge-safe"}">
          ${obj.hazardous ? "HAZARDOUS" : "SAFE"}
        </span>
      </div>
    </td>
    <td>${formatDate(obj.approachDate)}</td>
    <td class="miss-cell">
      <span class="miss-value ${cls}">${formatLD(obj.missLD)}</span>
      <span class="miss-bar"><span class="miss-bar-fill ${cls}"
        style="width:${barWidth(obj.missLD)}"></span></span>
    </td>
    <td>${formatDiameter(obj.diameterMinM, obj.diameterMaxM)}</td>
    <td>${formatVelocity(obj.velocityKms)}</td>
    <td class="action-cell">
      <button class="watch-btn ${saved ? "is-saved" : ""}"
        data-id="${id}" ${saved ? "disabled" : ""}>
        ${saved ? "Saved" : "Watch"}
      </button>
      <a class="log-btn" href="observations.html?nasaId=${id}">Log</a>
    </td>
  `;
  return tr;
}

function renderTable() {
  const rows = applySort(applyFilter(allObjects));
  els.tableBody.replaceChildren();

  if (rows.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="6" class="empty-row">
      Nothing matches that filter this week.</td>`;
    els.tableBody.append(tr);
    return;
  }

  for (const obj of rows) {
    els.tableBody.append(renderRow(obj));
  }
}

// --- save flow ---

async function handleWatch(button) {
  const id = button.dataset.id;
  const obj = allObjects.find((o) => o.id === id);
  if (!obj) return;

  button.disabled = true;
  button.textContent = "Saving…";

  try {
    await addToWatchlist({
      neoId: obj.id,
      name: obj.name,
      hazardous: obj.hazardous,
    });
    savedIds.add(obj.id);
    button.textContent = "Saved";
    button.classList.add("is-saved");
  } catch (err) {
    button.disabled = false;
    button.textContent = "Watch";
    alert(err.message);
  }
}

// --- load + wire up ---

async function load() {
  els.tableBody.innerHTML =
    '<tr><td colspan="6" class="empty-row">Loading the feed…</td></tr>';
  try {
    const [feed, watchlist] = await Promise.all([getFeed(), getWatchlist()]);
    allObjects = feed.objects;
    savedIds = new Set(watchlist.map((w) => w.neoId));

    els.meta.textContent = `${formatDate(feed.start)} – ${formatDate(
      feed.end
    )} · ${feed.count} objects · live from NASA NeoWs`;

    renderStats();
    renderTable();

    const biggest = [...allObjects].sort(
      (a, b) => b.diameterMaxM - a.diameterMaxM
    )[0];
    renderComparator(biggest);
    renderTable();
  } catch (err) {
    els.tableBody.innerHTML = `<tr><td colspan="6" class="empty-row">
      ${escHtml(err.message)} Try refreshing.</td></tr>`;
  }
}

function wirePills(container, setter) {
  container.addEventListener("click", (e) => {
    const pill = e.target.closest("[data-value]");
    if (!pill) return;
    setter(pill.dataset.value);
    container
      .querySelectorAll("[data-value]")
      .forEach((p) => p.classList.toggle("is-active", p === pill));
    renderTable();
  });
}

function init() {
  wirePills(els.filterPills, (v) => (activeFilter = v));
  wirePills(els.sortPills, (v) => (activeSort = v));

  els.tableBody.addEventListener("click", (e) => {
    const btn = e.target.closest(".watch-btn");
    if (btn && !btn.disabled) {
      handleWatch(btn);
      return;
    }
    const row = e.target.closest("tr[data-id]");
    if (row) {
      const obj = allObjects.find((o) => o.id === row.dataset.id);
      renderComparator(obj);
      renderTable();
    }
  });

  els.refreshBtn.addEventListener("click", load);

  load();
}

init();
