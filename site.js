(() => {
  const menuButton = document.querySelector(".menu-toggle");
  const mobileNav = document.querySelector("#mobile-navigation, .mobile-nav");

  if (!menuButton || !mobileNav) return;

  const closeMenu = () => {
    menuButton.setAttribute("aria-expanded", "false");
    mobileNav.classList.remove("is-open");
    document.body.classList.remove("menu-is-open");
  };

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    mobileNav.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("menu-is-open", !isOpen);
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
})();
