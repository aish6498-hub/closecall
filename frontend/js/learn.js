const hamburger = document.getElementById("navHamburger");
const navLinks = document.getElementById("navLinks");
const hamburgerIcon = document.getElementById("hamburgerIcon");

hamburger.addEventListener("click", (e) => {
  e.stopPropagation();
  const isOpen = navLinks.classList.toggle("open");
  hamburger.setAttribute("aria-expanded", isOpen);
  hamburgerIcon.className = isOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars";
});

document.addEventListener("click", () => {
  navLinks.classList.remove("open");
  hamburger.setAttribute("aria-expanded", false);
  hamburgerIcon.className = "fa-solid fa-bars";
});

async function loadApproachStats() {
  try {
    const res = await fetch("/api/approaches/stats");
    if (!res.ok) return;
    const data = await res.json();

    if (data.totalApproaches) {
      document.getElementById("stat-total").textContent =
        data.totalApproaches.toLocaleString() + "+";
    }
    if (data.hazardousCount) {
      document.getElementById("stat-hazardous").textContent =
        data.hazardousCount.toLocaleString() + "+";
    }
    if (data.fastest) {
      document.getElementById("stat-fastest").textContent =
        data.fastest.relativeVelocityKmS.toFixed(1) + " km/s";
    }
    if (data.closest) {
      document.getElementById("stat-closest").textContent = data.closest.name;
    }
  } catch {
    // Cards retain hardcoded fallback values — silently fail
  }
}

document.addEventListener("DOMContentLoaded", loadApproachStats);
