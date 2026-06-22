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
