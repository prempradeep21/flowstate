/* ============================================================
   FLOWSTATE — scroll story engine
   ============================================================ */
(() => {
  gsap.registerPlugin(ScrollTrigger, Draggable, InertiaPlugin, DrawSVGPlugin, SplitText, ScrambleTextPlugin);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  const isSmall = () => window.innerWidth < 768;

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduceMotion) {
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- custom cursor ---------- */
  const cursor = document.querySelector(".cursor");
  if (!isTouch && cursor) {
    // hide the native OS cursor so only the custom concentric dots show
    document.body.classList.add("cursor-none");
    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const target = { x: pos.x, y: pos.y };
    addEventListener("pointermove", (e) => {
      target.x = e.clientX; target.y = e.clientY;
    });
    gsap.ticker.add(() => {
      pos.x += (target.x - pos.x) * 0.22;
      pos.y += (target.y - pos.y) * 0.22;
      cursor.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    });
    const hoverables = "a, button";
    const grabbables = ".drag-card, .art-head.grab, .src-card";
    document.addEventListener("pointerover", (e) => {
      if (e.target.closest(grabbables)) cursor.classList.add("is-grab");
      else if (e.target.closest(hoverables)) cursor.classList.add("is-hover");
    });
    document.addEventListener("pointerout", (e) => {
      if (e.target.closest(grabbables)) cursor.classList.remove("is-grab");
      if (e.target.closest(hoverables)) cursor.classList.remove("is-hover");
    });
  }

  /* ---------- sticky nav — fill deepens once you leave the top ---------- */
  const nav = document.querySelector(".nav");
  ScrollTrigger.create({
    start: "top top",
    onUpdate: (self) => nav.classList.toggle("is-scrolled", self.scroll() > 20),
  });

  /* ---------- smooth in-page nav + section arrows ---------- */
  const scrollToTarget = (target) => {
    if (lenis) { lenis.scrollTo(target, { duration: 1.1 }); return; }
    if (typeof target === "number") { window.scrollTo({ top: target, behavior: "smooth" }); return; }
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // header links (Home / Blog) + logo
  document.querySelectorAll("[data-nav]").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      e.preventDefault();
      scrollToTarget(href === "#top" ? 0 : href);
    });
  });

  // up / down arrows — jump between scenes
  const sceneEls = [...document.querySelectorAll(".scene")];
  const upBtn = document.querySelector(".scroll-up");
  const downBtn = document.querySelector(".scroll-down");
  if (upBtn && downBtn && sceneEls.length) {
    const sceneTops = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      return sceneEls.map((s) => Math.round(s.getBoundingClientRect().top + y));
    };
    const goScene = (dir) => {
      const y = window.scrollY || window.pageYOffset || 0;
      const tops = sceneTops();
      const eps = 12;
      let target;
      if (dir > 0) {
        target = tops.find((t) => t > y + eps);
        if (target == null) target = document.documentElement.scrollHeight;
      } else {
        const prev = tops.filter((t) => t < y - eps);
        target = prev.length ? prev[prev.length - 1] : 0;
      }
      scrollToTarget(target);
    };
    upBtn.addEventListener("click", () => goScene(-1));
    downBtn.addEventListener("click", () => goScene(1));

    const updateArrows = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      upBtn.disabled = y < 40;
      downBtn.disabled = y > max - 40;
    };
    updateArrows();
    if (lenis) lenis.on("scroll", updateArrows);
    else addEventListener("scroll", updateArrows, { passive: true });
    addEventListener("resize", updateArrows);
  }

  /* ============================================================
     SCENE 01 — HERO
     ============================================================ */
  const heroTitle = new SplitText(".hero-title", { type: "lines,chars", linesClass: "ht-line" });
  gsap.set(".hero-title", { visibility: "visible" });
  const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
  intro
    .from(heroTitle.chars, { yPercent: 110, opacity: 0, duration: 1.1, stagger: 0.016 }, 0.15)
    .from(".eyebrow", { opacity: 0, y: 14, duration: 0.8 }, 0.3)
    .from(".hero-sub", { opacity: 0, y: 18, duration: 0.9 }, 0.75)
    .from(".hero-stage .art-card", { opacity: 0, y: 44, scale: 0.92, duration: 1, stagger: 0.08, ease: "back.out(1.6)" }, 0.55)
    .from(".hero-hint", { opacity: 0, duration: 0.8 }, 1.4);

  // scribble underline draws in
  gsap.set(".scribble path", { drawSVG: "0%" });
  intro.to(".scribble path", { drawSVG: "100%", duration: 0.9, ease: "power2.inOut", stagger: 0.15 }, 1.0);

  // draggable artifacts w/ inertia + tilt
  document.querySelectorAll(".hero-stage .drag-card").forEach((card) => {
    Draggable.create(card, {
      type: "x,y",
      bounds: ".hero",
      inertia: true,
      edgeResistance: 0.72,
      zIndexBoost: true,
      onDragStart() { card.classList.add("is-dragging"); },
      onDrag() {
        const vx = InertiaPlugin.getVelocity(card, "x") || 0;
        gsap.to(card, { rotation: gsap.utils.clamp(-9, 9, vx / 220), duration: 0.2 });
      },
      onDragEnd() {
        card.classList.remove("is-dragging");
        gsap.to(card, { rotation: parseFloat(getComputedStyle(card).getPropertyValue("--r")) || 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
      },
    });
  });

  // gentle float loop + drift on scroll out
  document.querySelectorAll(".hero-stage .art-card").forEach((card, i) => {
    gsap.to(card, {
      y: `+=${8 + (i % 3) * 4}`, duration: 2.6 + i * 0.35,
      yoyo: true, repeat: -1, ease: "sine.inOut", delay: i * 0.2,
    });
    gsap.to(card, {
      yPercent: -30 * parseFloat(card.dataset.depth || 1),
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  });

  /* ============================================================
     SCENE 05 — CHATFLOW (one chat builds itself… then multiplies)
     ============================================================ */
  const cfViewport = document.getElementById("cfViewport");
  const cfThread = document.getElementById("cfThread");
  const cfSwarm = document.getElementById("cfSwarm");
  const cfItems = gsap.utils.toArray("#cfViewport .cf-item");
  const cfStatement = document.querySelector(".cf-statement");

  // skeleton chat content for the swarm windows
  const CFM_ICONS = {
    doc: '<svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 21V4.5A1.5 1.5 0 0 1 6.5 3z M15 3v4h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><path d="M4 20V9M10 20V4M16 20v-8M21 20H3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    code: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m10 10-2.2 2L10 14M14 10l2.2 2L14 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    map: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-5.1-7-11a7 7 0 1 1 14 0c0 5.9-7 11-7 11z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.6" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    img: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="9" cy="10" r="1.8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m5 19 5.5-5.5L14 17l3-3 3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    video: '<svg viewBox="0 0 24 24"><rect x="2.5" y="6" width="13" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M15.5 12 21 8.8v6.4L15.5 12z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  };
  const CFM_CHATS = [
    { title: "plan the trip v2 (final)", art: ["chart", "cost compare"] },
    { title: "interview prep — 2am", art: ["doc", "answers that slap"] },
    { title: "budget spreadsheet attempt", art: ["chart", "runway"] },
    { title: "the 47-tab special", art: ["img", "moodboard"] },
    { title: "meal prep, week 12", art: ["doc", "grocery list"] },
    { title: "random 1:47am rabbit hole", art: ["video", "how magnets work"] },
    { title: "plan the trip v3 (FINAL final)", art: ["map", "alfama pins"] },
    { title: "gift ideas — don’t open", art: ["doc", "shortlist.md"] },
    { title: "that scraper again", art: ["code", "scraper v3"] },
    { title: "market sizing, honest version", art: ["chart", "tam, honest"] },
    { title: "portugal but cheaper", art: ["map", "pins v2"] },
  ];
  // [x vw, y vh, rotation, scale, z] — offsets of each window's center from screen center
  const CFM_SPOTS_DESKTOP = [
    [-13, -36, 4, 1.0, 6], [14, -33, -3, 0.92, 4], [-37, -29, -5, 0.9, 4], [37, -28, 5, 0.96, 6],
    [-43, -3, 3, 1.05, 6], [43, -5, -4, 1.0, 4],
    [-35, 26, 4, 0.94, 4], [-12, 33, -5, 1.0, 6], [13, 31, 3, 0.9, 4], [37, 27, -3, 0.98, 6],
    [46, 13, 6, 0.85, 3],
  ];
  const CFM_SPOTS_MOBILE = [
    [-21, -33, -4, 0.95, 6], [20, -30, 4, 0.9, 4],
    [-26, -5, 3, 1.0, 6], [26, -1, -4, 0.92, 4],
    [-19, 27, 4, 0.9, 6], [21, 31, -3, 0.95, 4],
    [0, 39, 2, 0.85, 3],
  ];

  if (cfViewport && cfItems.length && cfSwarm && !reduceMotion) {
    const spots = isSmall() ? CFM_SPOTS_MOBILE : CFM_SPOTS_DESKTOP;

    // deterministic pseudo-random for skeleton bars
    let cfSeed = 11;
    const cfRand = () => (cfSeed = (cfSeed * 16807) % 2147483647) / 2147483647;

    // build the swarm: .cf-pos (scroll-driven position) > .cf-mini (idle float)
    const cfPosEls = spots.map((spot, i) => {
      const chat = CFM_CHATS[i % CFM_CHATS.length];
      const pos = document.createElement("div");
      pos.className = "cf-pos";
      pos.style.zIndex = spot[4];
      const w = (isSmall() ? 168 : 212) + Math.floor(cfRand() * (isSmall() ? 34 : 56));
      let body = "";
      const rows = 3 + Math.floor(cfRand() * 2);
      for (let b = 0; b < rows; b++) {
        body += '<div class="cfm-row">';
        const lines = 2 + Math.floor(cfRand() * 2);
        for (let l = 0; l < lines; l++) {
          const right = b % 2 === 0 && l === 0 ? "is-right" : "";
          body += `<span class="cfm-line ${right}" style="--w:${34 + Math.floor(cfRand() * 54)}%"></span>`;
        }
        body += "</div>";
        if (b === 1) body += `<span class="cfm-art">${CFM_ICONS[chat.art[0]]}${chat.art[1]}</span>`;
      }
      pos.innerHTML = `<article class="cf-mini" style="width:${w}px">
        <div class="cfm-bar"><span>${chat.title}</span><b>#${i + 2}</b></div>
        <div class="cfm-body">${body}</div>
      </article>`;
      cfSwarm.appendChild(pos);
      return pos;
    });

    gsap.set(cfPosEls, { xPercent: -50, yPercent: -50, opacity: 0 });
    gsap.set(cfItems, { opacity: 0, y: 16 });
    gsap.set(cfViewport, { y: 0 });
    gsap.set(cfStatement, { opacity: 0 });
    gsap.set(".cf-statement-sub", { y: 12 });

    // idle float — each window breathes independently of the scroll
    cfSwarm.querySelectorAll(".cf-mini").forEach((mini, i) => {
      gsap.to(mini, {
        y: `+=${6 + cfRand() * 9}`, rotation: (i % 2 ? 1 : -1) * (0.6 + cfRand() * 0.9),
        duration: 2.2 + cfRand() * 1.6, yoyo: true, repeat: -1, ease: "sine.inOut", delay: cfRand(),
      });
    });

    const stChars = new SplitText("#cfStatementLine", { type: "chars" });

    // auto-scroll the thread so the item at index i stays in view once revealed
    const scrollFor = (i) => () => {
      const el = cfItems[i];
      const shift = el.offsetTop + el.offsetHeight - cfThread.clientHeight + 22;
      return -Math.max(0, shift);
    };

    const cfTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".chatflow", start: "top top",
        end: "+=280%", pin: ".chatflow-pin", scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });

    // ACT 1 — the chat builds itself; the thread scrolls to keep up
    cfItems.forEach((item, i) => {
      cfTl.to(item, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, i === 0 ? 0 : "+=0.4");
      cfTl.to(cfViewport, { y: scrollFor(i), duration: 0.5, ease: "power2.inOut" }, "<0.12");
    });
    cfTl.to({}, { duration: 0.45 });

    // the window flinches — something is coming
    cfTl.to(".cf-window", { scale: 0.9, rotation: -1.5, duration: 0.4, ease: "power2.inOut" });
    cfTl.to(".chatflow-hint", { opacity: 0, duration: 0.25 }, "<");

    // ACT 2 — THE MULTIPLICATION: chats erupt out of the window, one after another
    cfPosEls.forEach((pos, i) => {
      const [tx, ty, rot, sc] = spots[i];
      cfTl.fromTo(pos,
        { x: 0, y: 0, scale: 0.12, opacity: 0, rotation: gsap.utils.random(-40, 40) },
        {
          x: () => (tx / 100) * innerWidth,
          y: () => (ty / 100) * innerHeight,
          scale: sc, opacity: 1, rotation: rot,
          duration: 0.6, ease: "back.out(1.55)",
        },
        i === 0 ? ">-0.05" : "<0.14");
      // every new chat knocks the original around a little
      cfTl.to(".cf-window", {
        scale: 0.9 - (i + 1) * 0.008,
        rotation: (i % 2 ? 1.4 : -1.8),
        duration: 0.3, ease: "power1.inOut",
      }, "<0.1");
    });

    // beat — a full wall of chats
    cfTl.to({}, { duration: 0.4 });

    // ACT 3 — SHOCKWAVE: the camera pushes through and the chat noise recedes…
    // …but the artifacts made in those chats stay lit — they're the whole point
    cfTl.to(cfSwarm, { scale: 1.16, duration: 0.7, ease: "power2.inOut" });
    cfTl.to(".cfm-bar, .cfm-line", { opacity: 0.07, duration: 0.7, ease: "power2.inOut" }, "<");
    cfTl.to(".cf-mini", {
      borderColor: "rgba(35,35,35,0.14)",
      backgroundColor: "rgba(244,243,238,0.38)",
      boxShadow: "0 6px 18px rgba(16,16,16,0.05)",
      duration: 0.7, ease: "power2.inOut",
    }, "<");
    cfTl.to(".cf-window", { opacity: 0.1, scale: 0.8, rotation: 0, duration: 0.7, ease: "power2.inOut" }, "<");
    // the artifacts light up in place
    cfTl.to(".cfm-art", {
      borderColor: "#0f4fc7", color: "#0c3f9e", scale: 1.1,
      boxShadow: "0 0 0 3px rgba(15,79,199,0.14), 0 6px 18px rgba(15,79,199,0.2)",
      duration: 0.5, stagger: 0.04, ease: "back.out(2)",
    }, "<0.25");

    // …and the point slams in, character by character
    cfTl.set(cfStatement, { opacity: 1 }, "<0.3");
    cfTl.from(stChars.chars, { yPercent: 130, opacity: 0, stagger: 0.016, duration: 0.55, ease: "back.out(1.5)" }, "<");
    cfTl.to(".cf-statement-sub", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, ">-0.1");

    // hold, then hand off to the reveal
    cfTl.to({}, { duration: 0.3 });
    cfTl.to(cfStatement, { opacity: 0, y: -20, duration: 0.4, ease: "power2.in" });
    cfTl.to([cfSwarm, ".cf-window"], { opacity: 0, duration: 0.4, ease: "power2.in" }, "<");
  }

  /* ============================================================
     SCENE 05 — REVEAL
     ============================================================ */
  const revealTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".reveal", start: "top top",
      end: "+=80%", pin: ".reveal-pin", scrub: 0.6,
    },
  });
  revealTl
    .from("#revealAsk", { opacity: 0, y: 44, duration: 0.5 }, 0)
    .to(".reveal-grid", { opacity: 0.9, scale: 1, duration: 0.8, ease: "power2.out" }, 0.15)
    .to({}, { duration: 0.25 });

  /* ============================================================
     SCENE 02 — THE CANVAS (full-bleed playground)
     ============================================================ */
  // the canvas plane is already there — soft fade; cards pop in as you arrive
  gsap.from(".canvas-frame", {
    opacity: 0, duration: 0.8, ease: "power2.out",
    scrollTrigger: { trigger: ".playground", start: "top 80%" },
  });
  gsap.from(".playground > .playground-head > *", {
    opacity: 0, y: 34, stagger: 0.1, duration: 0.9, ease: "power3.out",
    scrollTrigger: { trigger: ".playground", start: "top 72%" },
  });
  gsap.from(".play-card", {
    opacity: 0, scale: 0.88, y: 30, stagger: 0.09, duration: 0.8, ease: "back.out(1.5)",
    scrollTrigger: { trigger: ".canvas-frame", start: "top 68%" },
  });

  // draggable play cards (by handle where present)
  document.querySelectorAll(".play-card").forEach((card) => {
    const handle = card.querySelector(".art-head.grab");
    Draggable.create(card, {
      type: "x,y",
      bounds: "#canvasFrame",
      trigger: handle || card,
      inertia: true,
      edgeResistance: 0.78,
      zIndexBoost: true,
      onDragStart() { card.classList.add("is-dragging"); },
      onDragEnd() { card.classList.remove("is-dragging"); },
    });
  });

  // lite YouTube
  document.querySelectorAll(".yt-lite").forEach((box) => {
    box.querySelector(".yt-play").addEventListener("click", () => {
      const id = box.dataset.yt;
      const ifr = document.createElement("iframe");
      ifr.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      ifr.title = "YouTube video";
      ifr.allow = "autoplay; encrypted-media; picture-in-picture";
      ifr.allowFullscreen = true;
      box.appendChild(ifr);
    });
  });

  /* ============================================================
     SCENE 03 — ARTIFACTS GRID
     ============================================================ */
  gsap.from(".artifacts .playground-head > *", {
    opacity: 0, y: 30, stagger: 0.09, duration: 0.8, ease: "power3.out",
    scrollTrigger: { trigger: ".artifacts", start: "top 74%" },
  });
  gsap.from(".artifact-grid .art-card", {
    opacity: 0, y: 34, scale: 0.94, stagger: 0.08, duration: 0.7, ease: "back.out(1.4)",
    scrollTrigger: { trigger: ".artifact-grid", start: "top 82%" },
  });

  /* ============================================================
     SCENE 04 — INTERACT (auto-playing question demo)
     ============================================================ */
  gsap.from(".interact .playground-head > *", {
    opacity: 0, y: 30, stagger: 0.09, duration: 0.8, ease: "power3.out",
    scrollTrigger: { trigger: ".interact", start: "top 74%" },
  });

  const interactSvg = document.getElementById("interactSvg");
  const setIxText = (sel, val) => {
    const el = interactSvg && interactSvg.querySelector(sel);
    if (el) el.textContent = val;
  };
  if (interactSvg && !reduceMotion) {
    gsap.set([".ix-wire1", ".ix-wire2"], { drawSVG: "0%", opacity: 0 });
    gsap.set(".ix-q", { opacity: 0, y: 12 });
    gsap.set([".ix-q-line1", ".ix-q-line2"], { opacity: 0 });
    gsap.set(".ix-hl", { opacity: 0, scaleX: 0.85, transformOrigin: "left center" });

    const ixTl = gsap.timeline({
      repeat: -1, repeatDelay: 1.4, defaults: { ease: "power2.out" },
      scrollTrigger: { trigger: ".interact-stage", start: "top 78%" },
    });
    ixTl
      // reset to starting state each loop
      .call(() => { setIxText(".ix-porto-n", "3"); setIxText(".ix-porto-e", "310"); setIxText(".ix-total", "970"); })
      .set([".ix-wire1", ".ix-wire2"], { drawSVG: "0%", opacity: 0 })
      .set(".ix-hl", { opacity: 0, scaleX: 0.85 })
      .set([".ix-q-line1", ".ix-q-line2"], { opacity: 0 })
      .set(".ix-q", { opacity: 0, y: 12 })
      // a question is dropped on the canvas
      .to(".ix-q", { opacity: 1, y: 0, duration: 0.5 })
      // flow A: wire the dropped input into the question
      .set(".ix-wire1", { opacity: 1 })
      .to(".ix-wire1", { drawSVG: "100%", duration: 0.7 }, "+=0.15")
      .to(".ix-q-line1", { opacity: 1, duration: 0.3 }, "-=0.1")
      .to(".ix-q-line2", { opacity: 1, duration: 0.3 }, "+=0.05")
      // flow B: draw from question into the artifact and update it in place
      .set(".ix-wire2", { opacity: 1 }, "+=0.25")
      .to(".ix-wire2", { drawSVG: "100%", duration: 0.6 })
      .to(".ix-hl", { opacity: 1, scaleX: 1, duration: 0.4 }, "+=0.05")
      .call(() => { setIxText(".ix-porto-n", "4"); setIxText(".ix-porto-e", "410"); setIxText(".ix-total", "1070"); })
      .fromTo([".ix-porto-n", ".ix-porto-e", ".ix-total"], { opacity: 0.15 }, { opacity: 1, duration: 0.45 }, "<")
      .to(".ix-hl", { opacity: 0, duration: 0.6 }, "+=1.2");
  }

  /* ============================================================
     SCENE 08 — FINALE: THE COLLABORATIVE CANVAS
     ============================================================ */
  gsap.from(".collab-center > *", {
    opacity: 0, y: 40, stagger: 0.12, duration: 1, ease: "power3.out",
    scrollTrigger: { trigger: ".collab", start: "top 62%" },
  });

  const collabStage = document.getElementById("collabStage");
  if (collabStage && !reduceMotion) {
    // each crew member loops forever: fly in → drop an item → wander →
    // drop another → drift off while their items pack up. coords are % of stage.
    const crew = [
      {
        cursor: "#curMo", delay: 0,
        enter: { x: -6, y: 46 }, exit: { x: 106, y: 24 },
        stops: [
          { x: 9, y: 18, via: { x: 14, y: 38 }, item: "#ciQ1", dwell: 0.7 },
          { x: 74, y: 68, via: { x: 46, y: 50 }, item: "#ciTweet", dwell: 0.9 },
        ],
      },
      {
        cursor: "#curZed", delay: 1.6,
        enter: { x: 108, y: 60 }, exit: { x: -8, y: 12 },
        stops: [
          { x: 73, y: 15, via: { x: 88, y: 34 }, item: "#ciVideo", dwell: 0.8 },
          { x: 21, y: 78, via: { x: 52, y: 62 }, item: "#ciTodo", dwell: 0.6 },
        ],
      },
      {
        cursor: "#curKai", delay: 3.1,
        enter: { x: 52, y: -8 }, exit: { x: 30, y: 108 },
        stops: [
          { x: 45, y: 9, via: { x: 60, y: 3 }, item: "#ciSticky2", dwell: 0.6 },
          { x: 49, y: 81, via: { x: 68, y: 46 }, item: "#ciQ2", dwell: 0.9 },
        ],
      },
      {
        cursor: "#curIvy", delay: 4.7,
        enter: { x: 104, y: 92 }, exit: { x: -6, y: 84 },
        stops: [
          { x: 82, y: 41, via: { x: 92, y: 64 }, item: "#ciSticky", dwell: 0.7 },
          { x: 8, y: 46, via: { x: 42, y: 32 }, item: "#ciChart", dwell: 0.8 },
        ],
      },
    ];

    const loops = [];
    crew.forEach((member) => {
      const cur = collabStage.querySelector(member.cursor);
      const items = member.stops.map((s) => collabStage.querySelector(s.item));
      gsap.set(items, { opacity: 0, scale: 0.55 });
      gsap.set(cur, { left: member.enter.x + "%", top: member.enter.y + "%" });

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5, delay: member.delay, paused: true });
      tl.set(cur, { left: member.enter.x + "%", top: member.enter.y + "%" })
        .to(cur, { opacity: 1, duration: 0.25 });
      member.stops.forEach((stop, i) => {
        tl.to(cur, { left: stop.via.x + "%", top: stop.via.y + "%", duration: 0.85, ease: "sine.inOut" })
          .to(cur, { left: stop.x + "%", top: stop.y + "%", duration: 0.8, ease: "power2.inOut" })
          // little press…
          .to(cur, { scale: 0.8, duration: 0.11, yoyo: true, repeat: 1, ease: "power2.out" })
          // …and the item pops onto the canvas
          .to(items[i], { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.8)" }, "<")
          .to({}, { duration: stop.dwell });
      });
      tl.to(cur, { left: member.exit.x + "%", top: member.exit.y + "%", duration: 1.1, ease: "power2.in" })
        .to(cur, { opacity: 0, duration: 0.25 }, "-=0.3")
        .to(items, { opacity: 0, scale: 0.6, duration: 0.45, stagger: 0.12, ease: "power2.in" }, "-=0.55");
      loops.push(tl);
    });

    // items sway gently while they're on the canvas
    collabStage.querySelectorAll(".collab-item").forEach((el, i) => {
      gsap.to(el, {
        y: `+=${7 + (i % 3) * 4}`, duration: 2.3 + (i % 4) * 0.45,
        yoyo: true, repeat: -1, ease: "sine.inOut", delay: i * 0.35,
      });
    });

    // only run the loops while the finale is on screen
    ScrollTrigger.create({
      trigger: ".collab", start: "top 85%",
      onToggle: (self) => loops.forEach((tl) => (self.isActive ? tl.play() : tl.pause())),
    });
  }

  /* ---------- reduced motion: reveal everything, kill pins ---------- */
  if (reduceMotion) {
    ScrollTrigger.getAll().forEach((st) => st.kill());
    gsap.set("*", { clearProps: "opacity,transform,visibility" });
    // chatflow: lay it out as a static stack (CSS hides items/statement by default)
    const cf = document.querySelector(".chatflow");
    if (cf) cf.classList.add("cf-static");
    gsap.set(".cf-item", { opacity: 1, y: 0 });
    gsap.set(".cf-viewport", { y: 0 });
    // interact demo: render the final "answered / updated" state statically
    if (interactSvg) {
      setIxText(".ix-porto-n", "4");
      setIxText(".ix-porto-e", "410");
      setIxText(".ix-total", "1070");
      gsap.set(".ix-hl", { opacity: 1 });
    }
  }

  addEventListener("load", () => ScrollTrigger.refresh());
})();
