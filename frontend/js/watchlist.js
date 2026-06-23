import {
  getWatchlist,
  getNeo,
  updateWatchlistItem,
  deleteWatchlistItem,
} from "./api.js";
import "./nav.js";
import { escHtml } from "./utils.js";
import { ldClass, formatLD, formatVelocity, formatDate } from "./format.js";

const els = {
  count: document.querySelector("#watchlist-count"),
  list: document.querySelector("#watchlist"),
  empty: document.querySelector("#empty-state"),
};

let items = []; // saved docs from Mongo

// Build one card. The "next approach" row starts as a placeholder and gets filled in once the live NASA lookup comes.
function renderCard(item) {
  const card = document.createElement("article");
  card.className = "watch-card";
  card.dataset.id = item._id;

  const name = escHtml(item.name);
  const neoId = escHtml(item.neoId);
  const tag = escHtml(item.tag);
  const note = escHtml(item.note);
  const added = item.addedAt ? formatDate(item.addedAt.slice(0, 10)) : "—";

  card.innerHTML = `
    <header class="watch-card-head">
      <div class="watch-card-title">
        <span class="object-name">${name}</span>
        <span class="badge ${item.hazardous ? "badge-hazard" : "badge-safe"}">
          ${item.hazardous ? "HAZARDOUS" : "SAFE"}
        </span>
        ${tag ? `<span class="tag-pill">${tag}</span>` : ""}
      </div>
      <div class="watch-card-actions">
        <button class="icon-btn edit-btn" data-id="${item._id}">Edit</button>
        <button class="icon-btn delete-btn" data-id="${item._id}">Delete</button>
      </div>
    </header>

    <p class="watch-meta">ID ${neoId} · added ${added}</p>
    ${note ? `<p class="watch-note">"${note}"</p>` : ""}

    <div class="next-approach" data-neo="${neoId}">
      <span class="next-label">Loading next approach…</span>
    </div>
  `;
  return card;
}

function fillNextApproach(card, data) {
  const box = card.querySelector(".next-approach");
  if (!data.next) {
    box.innerHTML = `<span class="next-label">No upcoming approach on record.</span>`;
    return;
  }
  const cls = ldClass(data.next.missLD);
  box.innerHTML = `
    <span class="next-item">Next: ${formatDate(data.next.date)}</span>
    <span class="next-item ${cls}">${formatLD(data.next.missLD)}</span>
    <span class="next-item">${formatVelocity(data.next.velocityKms)}</span>
  `;
}

function openEditForm(card, item) {
  const form = document.createElement("form");
  form.className = "edit-form";
  form.innerHTML = `
    <div class="field">
      <label for="edit-tag">Tag</label>
      <input type="text" id="edit-tag" name="tag" value="${escHtml(item.tag)}"
        placeholder="e.g. close call" maxlength="40" />
    </div>
    <div class="field">
      <label for="edit-note">Note</label>
      <textarea id="edit-note" name="note" rows="2" maxlength="240"
        placeholder="Why are you tracking this one?">${escHtml(item.note)}</textarea>
    </div>
    <div class="edit-form-actions">
      <button type="submit" class="btn-submit">Save changes</button>
      <button type="button" class="btn-cancel cancel-btn">Cancel</button>
    </div>
  `;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const tag = form.elements.tag.value.trim();
    const note = form.elements.note.value.trim();
    const submitBtn = form.querySelector(".btn-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving…";

    try {
      await updateWatchlistItem(item._id, { tag, note });
      await load();
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Save changes";
      alert(err.message);
    }
  });

  form.querySelector(".cancel-btn").addEventListener("click", () => load());

  card.replaceChildren(form);
}

async function handleDelete(id) {
  if (!confirm("Remove this asteroid from your watchlist?")) return;
  try {
    await deleteWatchlistItem(id);
    await load();
  } catch (err) {
    alert(err.message);
  }
}

async function load() {
  els.list.replaceChildren();
  try {
    items = await getWatchlist();
  } catch (err) {
    els.list.innerHTML = `<p class="empty-row">${escHtml(err.message)}</p>`;
    return;
  }

  els.count.textContent = `${items.length} saved · next approaches pulled live`;

  if (items.length === 0) {
    els.empty.hidden = false;
    return;
  }
  els.empty.hidden = true;

  for (const item of items) {
    els.list.append(renderCard(item));
  }

  for (const item of items) {
    const card = els.list.querySelector(`[data-id="${item._id}"]`);
    getNeo(item.neoId)
      .then((data) => fillNextApproach(card, data))
      .catch(() => {
        const box = card.querySelector(".next-approach");
        box.innerHTML = `<span class="next-label">Couldn't refresh from NASA.</span>`;
      });
  }
}

function init() {
  els.list.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".edit-btn");
    const deleteBtn = e.target.closest(".delete-btn");
    if (editBtn) {
      const item = items.find((i) => i._id === editBtn.dataset.id);
      const card = els.list.querySelector(`[data-id="${editBtn.dataset.id}"]`);
      openEditForm(card, item);
    } else if (deleteBtn) {
      handleDelete(deleteBtn.dataset.id);
    }
  });

  load();
}

init();
