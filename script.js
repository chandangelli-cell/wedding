
/* =========================================
   PARENTS' ANNIVERSARY WEBSITE
   All interactive features
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
  // Small helper to select one element.
  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  // Helper to select multiple elements.
  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------------------------------------
     1. LOADING SCREEN
     --------------------------------------- */

  const loader = $("#loader");

  const hideLoader = () => {
    if (loader) {
      loader.classList.add("is-done");
      window.setTimeout(() => loader.remove(), 800);
    }
  };

  // Hide when the page finishes loading, with a safe fallback.
  if (document.readyState === "complete") {
    hideLoader();
  } else {
    window.addEventListener("load", hideLoader, { once: true });
  }

  // Never leave the loading screen stuck on slow connections.
  window.setTimeout(hideLoader, 2500);

  /* ---------------------------------------
     2. MOBILE NAVIGATION
     --------------------------------------- */

  const menuToggle = $("#menuToggle");
  const navMenu = $("#navMenu");
  const navLinks = $$(".nav-link");

  function closeMenu() {
    if (!menuToggle || !navMenu) return;

    navMenu.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
  }

  function openMenu() {
    if (!menuToggle || !navMenu) return;

    navMenu.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close navigation menu");
  }

  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => {
      const isOpen =
        menuToggle.getAttribute("aria-expanded") === "true";

      isOpen ? closeMenu() : openMenu();
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        closeMenu();
        setActiveLink(link);
      });
    });

    // Close the menu when clicking outside the header.
    document.addEventListener("click", (event) => {
      if (
        navMenu.classList.contains("is-open") &&
        !event.target.closest(".site-header")
      ) {
        closeMenu();
      }
    });

    // Close the menu when switching back to desktop width.
    window.addEventListener("resize", () => {
      if (window.innerWidth > 640) closeMenu();
    });
  }

  /* ---------------------------------------
     3. ACTIVE NAVIGATION LINK
     --------------------------------------- */

  function setActiveLink(activeLink) {
    navLinks.forEach((link) => {
      const isActive = link === activeLink;
      link.classList.toggle("active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  // Highlight the navigation item for the visible section.
  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const matchingLink = navLinks.find(
            (link) =>
              link.getAttribute("href") === `#${entry.target.id}`
          );

          if (matchingLink) setActiveLink(matchingLink);
        });
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: 0
      }
    );

    $$(".hero, #story, #memories, #letter, #wishes").forEach(
      (section) => sectionObserver.observe(section)
    );
  }

  /* ---------------------------------------
     4. SCROLL REVEAL ANIMATIONS
     --------------------------------------- */

  const revealElements = $$(".reveal");

  if (
    reduceMotion ||
    !("IntersectionObserver" in window)
  ) {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -35px 0px"
      }
    );

    revealElements.forEach((element) => {
      revealObserver.observe(element);
    });
  }

  /* ---------------------------------------
     5. PERSONAL PHOTO PLACEHOLDERS
     --------------------------------------- */

  $$(".replaceable-photo").forEach((img) => {
    const photoContainer = img.closest(
      ".gallery-photo, .story-photo"
    );
    const placeholder = photoContainer
      ? $(".photo-placeholder", photoContainer)
      : null;

    // Hide the placeholder when the real image loads.
    function showRealPhoto() {
      img.style.display = "block";
      if (placeholder) placeholder.hidden = true;

      if (photoContainer) {
        photoContainer.classList.add("has-photo");
      }
    }

    // Keep the designed placeholder if the photo is missing.
    function showPlaceholder() {
      img.style.display = "none";
      if (placeholder) placeholder.hidden = false;

      if (photoContainer) {
        photoContainer.classList.remove("has-photo");
      }
    }

    img.addEventListener("load", showRealPhoto);
    img.addEventListener("error", showPlaceholder);

    // Handle images that loaded before listeners were attached.
    if (img.complete) {
      if (img.naturalWidth > 0) {
        showRealPhoto();
      } else {
        showPlaceholder();
      }
    }
  });

  /* ---------------------------------------
     6. GALLERY FILTERS
     --------------------------------------- */

  const filterButtons = $$(".filter-btn");
  const galleryCards = $$(".gallery-card");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedFilter = button.dataset.filter;

      // Update the active filter and accessibility state.
      filterButtons.forEach((filterButton) => {
        const isActive = filterButton === button;

        filterButton.classList.toggle("active", isActive);
        filterButton.setAttribute(
          "aria-pressed",
          String(isActive)
        );
      });

      // Display matching cards.
      galleryCards.forEach((card) => {
        const matches =
          selectedFilter === "all" ||
          card.dataset.category === selectedFilter;

        card.classList.toggle("is-filtered", !matches);
      });
    });
  });

  /* ---------------------------------------
     7. FULL-SCREEN PHOTO LIGHTBOX
     --------------------------------------- */

  const lightbox = $("#lightbox");
  const lightboxClose = $("#lightboxClose");
  const lightboxImage = $("#lightboxImage");
  const lightboxCaption = $("#lightboxCaption");
  const lightboxPlaceholder = $("#lightboxPlaceholder");
  const lightboxContent = $(".lightbox-content");

  let previouslyFocusedElement = null;

  function openLightbox(card) {
    if (!lightbox || !lightboxImage) return;

    previouslyFocusedElement = document.activeElement;

    const photoPath = card.dataset.src;
    const photoTitle = card.dataset.title || "A treasured memory";

    lightboxCaption.textContent = photoTitle;
    lightboxImage.alt = photoTitle;
    lightboxImage.removeAttribute("src");

    lightboxContent.classList.remove("has-image");
    lightboxPlaceholder.hidden = false;

    lightbox.hidden = false;
    document.body.classList.add("no-scroll");

    // Put keyboard focus on the close button.
    lightboxClose.focus();

    // Load the selected photo. Missing files show a placeholder.
    lightboxImage.onload = () => {
      lightboxContent.classList.add("has-image");
      lightboxPlaceholder.hidden = true;
    };

    lightboxImage.onerror = () => {
      lightboxContent.classList.remove("has-image");
      lightboxPlaceholder.hidden = false;
    };

    lightboxImage.src = photoPath;
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;

    lightbox.hidden = true;
    document.body.classList.remove("no-scroll");

    lightboxImage.onload = null;
    lightboxImage.onerror = null;
    lightboxImage.removeAttribute("src");

    lightboxContent.classList.remove("has-image");
    lightboxPlaceholder.hidden = false;

    // Return keyboard focus to the photo that opened the viewer.
    if (
      previouslyFocusedElement &&
      typeof previouslyFocusedElement.focus === "function"
    ) {
      previouslyFocusedElement.focus();
    }
  }

  galleryCards.forEach((card) => {
    card.addEventListener("click", () => {
      openLightbox(card);
    });
  });

  if (lightboxClose) {
    lightboxClose.addEventListener("click", closeLightbox);
  }

  // Close only when the dark backdrop itself is clicked.
  if (lightbox) {
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });
  }

  // Escape closes the photo viewer and mobile menu.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeLightbox();
      closeMenu();
    }

    // Keep keyboard focus inside the open lightbox.
    if (
      event.key === "Tab" &&
      lightbox &&
      !lightbox.hidden
    ) {
      event.preventDefault();
      lightboxClose.focus();
    }
  });

  /* ---------------------------------------
     8. RETURN TO THE LETTER
     --------------------------------------- */

  const backToLetter = $("#backToLetter");
  const letterSection = $("#letter");

  if (backToLetter && letterSection) {
    backToLetter.addEventListener("click", () => {
      letterSection.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start"
      });
    });
  }

  /* ---------------------------------------
     9. FINAL CELEBRATION & FLOATING HEARTS
     --------------------------------------- */

  const loveButton = $("#loveButton");
  const loveResponse = $("#loveResponse");
  const announcement = $("#celebrationAnnouncement");

  let celebrationInProgress = false;

  function createFloatingHeart() {
    const heart = document.createElement("span");

    heart.className = "floating-heart";
    heart.setAttribute("aria-hidden", "true");
    heart.textContent = Math.random() > 0.35 ? "♥" : "✦";

    heart.style.setProperty(
      "--left",
      `${Math.random() * 94 + 3}%`
    );

    heart.style.setProperty(
      "--heart-size",
      `${Math.random() * 17 + 16}px`
    );

    heart.style.setProperty(
      "--heart-duration",
      `${Math.random() * 1.5 + 2.5}s`
    );

    const colors = [
      "#e6c989",
      "#f4d8c8",
      "#d6a49b",
      "#fff0cf"
    ];

    heart.style.setProperty(
      "--heart-color",
      colors[Math.floor(Math.random() * colors.length)]
    );

    document.body.appendChild(heart);

    // Remove each decoration after its animation.
    heart.addEventListener(
      "animationend",
      () => heart.remove(),
      { once: true }
    );
  }

  if (loveButton && loveResponse) {
    loveButton.addEventListener("click", () => {
      // Reveal the message on the first click.
      loveResponse.hidden = false;

      announcement.textContent =
        "A loving anniversary message for Amma and Nana.";

      // Let users tap again to enjoy another burst of hearts.
      if (celebrationInProgress) return;

      celebrationInProgress = true;

      const heartCount = reduceMotion ? 4 : 24;

      for (let i = 0; i < heartCount; i++) {
        window.setTimeout(
          createFloatingHeart,
          reduceMotion ? 0 : i * 100
        );
      }

      window.setTimeout(() => {
        celebrationInProgress = false;
      }, reduceMotion ? 500 : 3500);
    });
  }

  /* ---------------------------------------
     10. SAFETY: KEEP LINKS AND SCROLL SIMPLE
     --------------------------------------- */

  // All navigation uses ordinary section links.
  // No backend, tracking scripts, or paid APIs are required.
});
