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
  const contactForm = document.querySelector(".contact-form");
  const contactEmail = "hello@studio.example";

  if (cursorLight) {
    window.addEventListener("pointermove", (event) => {
      cursorLight.style.setProperty("--x", `${event.clientX}px`);
      cursorLight.style.setProperty("--y", `${event.clientY}px`);
    }, { passive: true });
  }

  if (menuToggle && mobileMenu) {
    const toggleMenu = () => {
      const open = !body.classList.contains("menu-open");
      body.classList.toggle("menu-open", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      mobileMenu.setAttribute("aria-hidden", String(!open));
    };

    menuToggle.addEventListener("click", toggleMenu);
    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", toggleMenu);
    });
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 5, 4) * 55}ms`;
    revealObserver.observe(item);
  });

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
      startScroll = workTrack.scrollLeft;
      workTrack.classList.add("is-dragging");
    });

    workTrack.addEventListener("pointermove", (event) => {
      if (!isDown) return;
      const delta = event.clientX - startX;
      if (Math.abs(delta) < 6) return;
      hasDragged = true;
      event.preventDefault();
      workTrack.scrollLeft = startScroll - delta;
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

  if (contactForm) {
    const setError = (field, message) => {
      const label = field.closest("label");
      const note = label.querySelector("small");
      label.classList.toggle("invalid", Boolean(message));
      note.textContent = message || "";
    };

    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const form = new FormData(contactForm);
      const name = contactForm.elements.name;
      const email = contactForm.elements.email;
      const message = contactForm.elements.message;
      const status = contactForm.querySelector(".form-status");
      let valid = true;

      setError(name, "");
      setError(email, "");
      setError(message, "");

      if (!name.value.trim()) {
        setError(name, "Name is required.");
        valid = false;
      }

      if (!email.value.trim() || !email.validity.valid) {
        setError(email, "Use a valid email.");
        valid = false;
      }

      if (!message.value.trim()) {
        setError(message, "Tell us what needs to be built.");
        valid = false;
      }

      if (!valid) {
        status.textContent = "Fix the highlighted fields.";
        return;
      }

      const subject = encodeURIComponent(`Website project from ${form.get("name")}`);
      const bodyText = [
        `Name: ${form.get("name")}`,
        `Email: ${form.get("email")}`,
        `Company / website: ${form.get("company") || "Not provided"}`,
        "",
        form.get("message")
      ].join("\n");

      status.textContent = "Mail draft prepared. If it does not open, email us directly.";
      window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
    });
  }

  async function initHeroScene() {
    const canvas = document.getElementById("hero-canvas");
    if (!canvas) return;

    try {
      const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance"
      });
      const pointer = { x: 0, y: 0 };
      const group = new THREE.Group();
      const frameGroup = new THREE.Group();
      const gridGroup = new THREE.Group();
      let width = 1;
      let height = 1;

      camera.position.set(0, 0.35, 13);
      scene.add(group);
      group.add(frameGroup, gridGroup);

      const frameMaterial = new THREE.LineBasicMaterial({
        color: 0xefebe1,
        transparent: true,
        opacity: 0.62
      });
      const innerMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.035,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const accentMaterial = new THREE.LineBasicMaterial({
        color: 0xee3528,
        transparent: true,
        opacity: 0.72
      });

      function makeRoundedRect(w, h, r) {
        const shape = new THREE.Shape();
        const x = -w / 2;
        const y = -h / 2;
        shape.moveTo(x + r, y);
        shape.lineTo(x + w - r, y);
        shape.quadraticCurveTo(x + w, y, x + w, y + r);
        shape.lineTo(x + w, y + h - r);
        shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        shape.lineTo(x + r, y + h);
        shape.quadraticCurveTo(x, y + h, x, y + h - r);
        shape.lineTo(x, y + r);
        shape.quadraticCurveTo(x, y, x + r, y);
        return shape;
      }

      function makeFrame(index) {
        const w = 5.25 + index * 0.44;
        const h = 3.22 + index * 0.27;
        const shape = makeRoundedRect(w, h, 0.22);
        const points = shape.getPoints(22);
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.LineLoop(geo, frameMaterial.clone());
        line.material.opacity = 0.72 - index * 0.075;

        const panel = new THREE.Mesh(new THREE.ShapeGeometry(shape), innerMaterial.clone());
        panel.material.opacity = 0.06 - index * 0.006;

        const browserLineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-w / 2 + 0.18, h / 2 - 0.46, 0.01),
          new THREE.Vector3(w / 2 - 0.18, h / 2 - 0.46, 0.01)
        ]);
        const browserLine = new THREE.Line(browserLineGeo, frameMaterial.clone());
        browserLine.material.opacity = 0.28;

        const frame = new THREE.Group();
        frame.add(panel, line, browserLine);

        for (let dot = 0; dot < 3; dot += 1) {
          const dotGeo = new THREE.CircleGeometry(0.045, 12);
          const dotMat = new THREE.MeshBasicMaterial({
            color: dot === 0 ? 0xee3528 : 0xefebe1,
            transparent: true,
            opacity: dot === 0 ? 0.9 : 0.44
          });
          const mesh = new THREE.Mesh(dotGeo, dotMat);
          mesh.position.set(-w / 2 + 0.36 + dot * 0.16, h / 2 - 0.25, 0.03);
          frame.add(mesh);
        }

        frame.position.set(index * 0.5, -index * 0.16, -index * 0.64);
        frame.rotation.set(0.1, -0.35, -0.02);
        frame.userData.baseX = frame.position.x;
        frame.userData.baseY = frame.position.y;
        frame.userData.baseZ = frame.position.z;
        frame.userData.index = index;
        return frame;
      }

      for (let i = 0; i < 7; i += 1) {
        frameGroup.add(makeFrame(i));
      }

      function makeGridLine(points, material) {
        const curve = new THREE.CatmullRomCurve3(points);
        const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(60));
        return new THREE.Line(geo, material);
      }

      const gridMaterial = new THREE.LineBasicMaterial({
        color: 0xefebe1,
        transparent: true,
        opacity: 0.18
      });

      for (let row = -8; row <= 8; row += 1) {
        const points = [];
        for (let i = 0; i <= 36; i += 1) {
          const t = i / 36;
          const x = -4.3 + t * 8.6;
          const z = -4.7 + Math.sin(t * Math.PI) * -1.7;
          const y = row * 0.19 + Math.sin(t * Math.PI * 1.2 + row * 0.2) * 0.28;
          points.push(new THREE.Vector3(x, y, z));
        }
        gridGroup.add(makeGridLine(points, gridMaterial));
      }

      for (let col = -9; col <= 9; col += 1) {
        const points = [];
        for (let i = 0; i <= 36; i += 1) {
          const t = i / 36;
          const y = -1.55 + t * 3.1;
          const z = -4.7 + Math.sin(t * Math.PI) * -1.3;
          const x = col * 0.24 + Math.sin(t * Math.PI * 1.5 + col * 0.18) * 0.22;
          points.push(new THREE.Vector3(x, y, z));
        }
        gridGroup.add(makeGridLine(points, gridMaterial));
      }

      const accentGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.12, 0, 0),
        new THREE.Vector3(0.12, 0, 0),
        new THREE.Vector3(0, -0.12, 0),
        new THREE.Vector3(0, 0.12, 0)
      ]);
      const accent = new THREE.LineSegments(accentGeo, accentMaterial);
      accent.position.set(1.7, -1.42, -2.2);
      group.add(accent);

      gridGroup.position.set(-1.15, -0.85, -0.7);
      gridGroup.rotation.set(-0.28, -0.08, 0.03);
      frameGroup.position.set(1.22, 0.35, 0);
      group.rotation.set(-0.04, 0.07, 0.02);

      function resize() {
        const rect = canvas.getBoundingClientRect();
        width = Math.max(1, rect.width);
        height = Math.max(1, rect.height);
        const ratio = Math.min(window.devicePixelRatio || 1, 1.8);
        renderer.setPixelRatio(ratio);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      canvas.closest(".hero-stage").addEventListener("pointermove", (event) => {
        const rect = canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      }, { passive: true });

      window.addEventListener("resize", resize);
      resize();

      renderer.setAnimationLoop((time) => {
        const t = time * 0.001;
        frameGroup.children.forEach((frame) => {
          const i = frame.userData.index;
          frame.position.x = frame.userData.baseX + Math.sin(t * 0.75 + i) * 0.045;
          frame.position.y = frame.userData.baseY + Math.cos(t * 0.62 + i * 0.4) * 0.04;
          frame.position.z = frame.userData.baseZ + Math.sin(t * 0.5 + i * 0.6) * 0.055;
        });
        gridGroup.rotation.z = 0.03 + Math.sin(t * 0.32) * 0.015;
        accent.rotation.z = t * 0.7;
        group.rotation.y += ((pointer.x * 0.09 + 0.07) - group.rotation.y) * 0.035;
        group.rotation.x += ((-pointer.y * 0.055 - 0.04) - group.rotation.x) * 0.035;
        renderer.render(scene, camera);
      });
    } catch (error) {
      root.classList.add("no-webgl");
      console.warn("Three.js scene unavailable, using CSS fallback.", error);
    }
  }

  initHeroScene();
})();
