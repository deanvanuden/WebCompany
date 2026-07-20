(function () {
  const root = document.documentElement;
  const body = document.body;
  const cursorLight = document.querySelector(".cursor-light");
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  const revealItems = document.querySelectorAll("[data-reveal]");
  const magneticItems = document.querySelectorAll(".magnetic");
  const workTrack = document.querySelector(".work-track");
  const galleryProgress = document.querySelector(".gallery-progress span");

  if ("IntersectionObserver" in window) {
    try {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });

      root.classList.add("js");
      revealItems.forEach((item, index) => {
        item.style.transitionDelay = `${Math.min(index % 5, 4) * 55}ms`;
        revealObserver.observe(item);
      });
    } catch (error) {
      root.classList.remove("js");
      revealItems.forEach((item) => item.classList.add("is-visible"));
    }
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  if (cursorLight) {
    window.addEventListener("pointermove", (event) => {
      cursorLight.style.setProperty("--x", `${event.clientX}px`);
      cursorLight.style.setProperty("--y", `${event.clientY}px`);
    }, { passive: true });
  }

  if (menuToggle && mobileMenu) {
    const menuLinks = Array.from(mobileMenu.querySelectorAll("a"));

    const setMenuState = (open) => {
      body.classList.toggle("menu-open", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
      mobileMenu.setAttribute("aria-hidden", String(!open));
      mobileMenu.toggleAttribute("inert", !open);
    };

    menuToggle.addEventListener("click", () => {
      setMenuState(!body.classList.contains("menu-open"));
    });

    menuLinks.forEach((link) => {
      link.addEventListener("click", () => setMenuState(false));
    });

    document.addEventListener("keydown", (event) => {
      if (!body.classList.contains("menu-open")) return;

      if (event.key === "Escape") {
        setMenuState(false);
        menuToggle.focus();
        return;
      }

      if (event.key !== "Tab" || menuLinks.length === 0) return;
      const lastMenuLink = menuLinks[menuLinks.length - 1];

      if (event.shiftKey && document.activeElement === menuToggle) {
        event.preventDefault();
        lastMenuLink.focus();
      } else if (!event.shiftKey && document.activeElement === lastMenuLink) {
        event.preventDefault();
        menuToggle.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1120 && body.classList.contains("menu-open")) {
        setMenuState(false);
      }
    }, { passive: true });
  }

  magneticItems.forEach((item) => {
    item.addEventListener("pointermove", (event) => {
      const box = item.getBoundingClientRect();
      const x = (event.clientX - box.left - box.width / 2) * 0.16;
      const y = (event.clientY - box.top - box.height / 2) * 0.2;
      item.style.setProperty("--mx", `${x}px`);
      item.style.setProperty("--my", `${y}px`);
    });

    item.addEventListener("pointerleave", () => {
      item.style.setProperty("--mx", "0px");
      item.style.setProperty("--my", "0px");
    });
  });

  if (workTrack && galleryProgress) {
    let isDown = false;
    let hasDragged = false;
    let startX = 0;
    let startY = 0;
    let startScroll = 0;

    const updateProgress = () => {
      const max = workTrack.scrollWidth - workTrack.clientWidth;
      const ratio = max > 0 ? workTrack.scrollLeft / max : 0;
      const cardRatio = workTrack.clientWidth / workTrack.scrollWidth;
      galleryProgress.style.width = `${Math.max(cardRatio * 100, 24)}%`;
      galleryProgress.style.transform = `translateX(${ratio * (100 / Math.max(cardRatio, 0.24) - 100)}%)`;
    };

    workTrack.addEventListener("pointerdown", (event) => {
      isDown = true;
      hasDragged = false;
      startX = event.clientX;
      startY = event.clientY;
      startScroll = workTrack.scrollLeft;
      workTrack.classList.add("is-dragging");
    });

    workTrack.addEventListener("pointermove", (event) => {
      if (!isDown) return;
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      if (Math.abs(deltaX) < 6 || Math.abs(deltaX) < Math.abs(deltaY)) return;
      hasDragged = true;
      event.preventDefault();
      workTrack.scrollLeft = startScroll - deltaX;
    });

    const stopDrag = () => {
      isDown = false;
      workTrack.classList.remove("is-dragging");
    };

    workTrack.addEventListener("pointerup", stopDrag);
    workTrack.addEventListener("pointercancel", stopDrag);
    workTrack.addEventListener("click", (event) => {
      if (!hasDragged) return;
      event.preventDefault();
      event.stopPropagation();
      hasDragged = false;
    }, true);
    workTrack.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    document.querySelectorAll("[data-gallery]").forEach((button) => {
      button.addEventListener("click", () => {
        const direction = button.dataset.gallery === "next" ? 1 : -1;
        const firstCard = workTrack.querySelector(".work-card");
        const distance = firstCard ? firstCard.getBoundingClientRect().width + 18 : 340;
        workTrack.scrollBy({ left: distance * direction, behavior: "smooth" });
      });
    });

    updateProgress();
  }

})();
