import "./nav.js";

// ===== SHOOTING STARS =====
function initShootingStars() {
  // 3 stars staggered by 4s each — guarantees one fires every ~4s
  // Negative delays start each star mid-cycle so first streak fires immediately.
  // Streak triggers at 75% of 24s = 18s into cycle.
  // delay = -18s + (n * 4s) staggers them 4s apart from t=0.
  const stars = [
    { top: 10, left: 8, length: 140, period: 24, delay: -18 },
    { top: 50, left: 30, length: 110, period: 24, delay: -14 },
    { top: 75, left: 60, length: 130, period: 24, delay: -10 },
    { top: 25, left: 55, length: 120, period: 24, delay: -6 },
    { top: 60, left: 15, length: 100, period: 24, delay: -2 },
    { top: 85, left: 40, length: 150, period: 24, delay: 2 },
  ];

  stars.forEach(({ top, left, length, period, delay }) => {
    const star = document.createElement("div");
    star.className = "shooting-star";
    star.setAttribute("aria-hidden", "true");
    star.style.cssText = `
      top: ${top}vh;
      left: ${left}vw;
      width: ${length}px;
      animation: shootStar ${period}s ${delay}s linear infinite;
    `;
    document.body.appendChild(star);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initShootingStars();
});
