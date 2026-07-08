/* ============================================================
   FLOWSTATE — scroll story engine
   Two modes: "normal" (the vertical scroll story) and "crazy"
   (the same scenes laid out in 3D depth — scrolling dollies the
   camera *into* the canvas). Switching modes reloads the page so
   each engine boots from a pristine DOM.
   ============================================================ */
(() => {
  gsap.registerPlugin(ScrollTrigger, Draggable, InertiaPlugin, DrawSVGPlugin, SplitText, ScrambleTextPlugin);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  const isSmall = () => window.innerWidth < 768;

  /* ---------- mode ---------- */
  const params = new URLSearchParams(location.search);
  let stored = null;
  try { stored = localStorage.getItem("fs-mode"); } catch (e) {}
  const requested = (params.get("mode") || stored || "normal") === "crazy" ? "crazy" : "normal";
  const CRAZY = requested === "crazy" && !reduceMotion;
  const MODE = CRAZY ? "crazy" : "normal";
  document.body.classList.add(`mode-${MODE}`);

  /* ---------- mode switcher (nav, top right) ---------- */
  const modeToggle = document.getElementById("modeToggle");
  const modeWipe = document.querySelector(".mode-wipe");

  function switchMode(next) {
    try {
      localStorage.setItem("fs-mode", next);
      sessionStorage.setItem("fs-wipe", "1");
    } catch (e) {}
    const url = new URL(location.href);
    if (next === "crazy") url.searchParams.set("mode", "crazy");
    else url.searchParams.delete("mode");
    if (modeWipe && modeToggle && !reduceMotion) {
      const r = modeToggle.getBoundingClientRect();
      modeWipe.style.setProperty("--wx", r.left + r.width / 2 + "px");
      modeWipe.style.setProperty("--wy", r.top + r.height / 2 + "px");
      modeWipe.classList.add("is-on");
      setTimeout(() => location.replace(url), 600);
    } else {
      location.replace(url);
    }
  }

  if (modeToggle) {
    const thumb = modeToggle.querySelector(".mode-thumb");
    const btns = [...modeToggle.querySelectorAll(".mode-btn")];
    const setThumb = () => {
      const active = btns.find((b) => b.dataset.mode === MODE);
      if (!active || !thumb) return;
      thumb.style.left = active.offsetLeft + "px";
      thumb.style.width = active.offsetWidth + "px";
    };
    btns.forEach((b) => {
      const on = b.dataset.mode === MODE;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
      b.addEventListener("click", () => { if (b.dataset.mode !== MODE) switchMode(b.dataset.mode); });
    });
    setThumb();
    addEventListener("resize", setThumb);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setThumb);
  }

  // arriving from a switch: the wipe starts closed over the page, then opens
  let arrived = false;
  try {
    arrived = sessionStorage.getItem("fs-wipe") === "1";
    if (arrived) sessionStorage.removeItem("fs-wipe");
  } catch (e) {}
  if (arrived && modeWipe && !reduceMotion) {
    if (modeToggle) {
      const r = modeToggle.getBoundingClientRect();
      modeWipe.style.setProperty("--wx", r.left + r.width / 2 + "px");
      modeWipe.style.setProperty("--wy", r.top + r.height / 2 + "px");
    }
    modeWipe.classList.add("no-anim", "is-on");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      modeWipe.classList.remove("no-anim");
      modeWipe.classList.remove("is-on");
    }));
  }

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

  /* ---------- smooth in-page nav ---------- */
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

  const upBtn = document.querySelector(".scroll-up");
  const downBtn = document.querySelector(".scroll-down");

  /* ---------- lite YouTube (both modes) ---------- */
  document.querySelectorAll(".yt-lite").forEach((box) => {
    const play = box.querySelector(".yt-play");
    if (!play || play.tagName !== "BUTTON") return;
    play.addEventListener("click", () => {
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
     SHARED SCENE BUILDERS — used by both engines
     ============================================================ */

  // hero headline + card entrance (time-based, plays on load)
  const heroIntro = () => {
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
  };

  // draggable hero artifacts w/ inertia + tilt
  const heroDrag = () => {
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
  };

  // gentle float loop on the hero cards
  const heroFloat = () => {
    document.querySelectorAll(".hero-stage .art-card").forEach((card, i) => {
      gsap.to(card, {
        y: `+=${8 + (i % 3) * 4}`, duration: 2.6 + i * 0.35,
        yoyo: true, repeat: -1, ease: "sine.inOut", delay: i * 0.2,
      });
    });
  };

  // draggable play cards (by handle where present)
  const playCardDrag = () => {
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
  };

  // interact scene: auto-playing question demo
  const interactSvg = document.getElementById("interactSvg");
  const setIxText = (sel, val) => {
    const el = interactSvg && interactSvg.querySelector(sel);
    if (el) el.textContent = val;
  };
  const buildInteract = (withTrigger) => {
    if (!interactSvg || reduceMotion) return;
    gsap.set([".ix-wire1", ".ix-wire2"], { drawSVG: "0%", opacity: 0 });
    gsap.set(".ix-q", { opacity: 0, y: 12 });
    gsap.set([".ix-q-line1", ".ix-q-line2"], { opacity: 0 });
    gsap.set(".ix-hl", { opacity: 0, scaleX: 0.85, transformOrigin: "left center" });

    const cfg = { repeat: -1, repeatDelay: 1.4, defaults: { ease: "power2.out" } };
    if (withTrigger) cfg.scrollTrigger = { trigger: ".interact-stage", start: "top 78%" };
    const ixTl = gsap.timeline(cfg);
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
  };

  // finale: the collaborative canvas crew loops
  const collabStage = document.getElementById("collabStage");
  const buildCollab = (autoplay) => {
    if (!collabStage || reduceMotion) return;
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

    if (autoplay) {
      loops.forEach((tl) => tl.play());
    } else {
      // only run the loops while the finale is on screen
      ScrollTrigger.create({
        trigger: ".collab", start: "top 85%",
        onToggle: (self) => loops.forEach((tl) => (self.isActive ? tl.play() : tl.pause())),
      });
    }
  };

  if (CRAZY) initCrazy();
  else initNormal();

  /* ============================================================
     NORMAL — the vertical scroll story
     ============================================================ */
  function initNormal() {
    // up / down arrows — jump between scenes
    const sceneEls = [...document.querySelectorAll(".scene")];
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

    /* ---------- SCENE 01 — HERO ---------- */
    heroIntro();
    heroDrag();
    heroFloat();

    // drift on scroll out
    document.querySelectorAll(".hero-stage .art-card").forEach((card) => {
      gsap.to(card, {
        yPercent: -30 * parseFloat(card.dataset.depth || 1),
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });
    });

    /* ---------- SCENE 04 — CHATFLOW (one chat builds itself… then multiplies) ---------- */
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

    /* ---------- SCENE 05 — REVEAL ---------- */
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

    /* ---------- SCENE 02 — THE CANVAS (full-bleed playground) ---------- */
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

    playCardDrag();

    /* ---------- SCENE 03 — ARTIFACTS GRID ---------- */
    gsap.from(".artifacts .playground-head > *", {
      opacity: 0, y: 30, stagger: 0.09, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: ".artifacts", start: "top 74%" },
    });
    gsap.from(".artifact-grid .art-card", {
      opacity: 0, y: 34, scale: 0.94, stagger: 0.08, duration: 0.7, ease: "back.out(1.4)",
      scrollTrigger: { trigger: ".artifact-grid", start: "top 82%" },
    });

    /* ---------- SCENE 06 — INTERACT (auto-playing question demo) ---------- */
    gsap.from(".interact .playground-head > *", {
      opacity: 0, y: 30, stagger: 0.09, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: ".interact", start: "top 74%" },
    });
    buildInteract(true);

    /* ---------- SCENE 08 — FINALE: THE COLLABORATIVE CANVAS ---------- */
    gsap.from(".collab-center > *", {
      opacity: 0, y: 40, stagger: 0.12, duration: 1, ease: "power3.out",
      scrollTrigger: { trigger: ".collab", start: "top 62%" },
    });
    buildCollab(false);

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
  }

  /* ============================================================
     CRAZY — the scroll dives *into* the canvas
     Every scene keeps its exact markup, copy and colors, but is
     re-homed onto a 3D stage and owned by a scrubbed timeline:
     as the camera approaches, the scene ASSEMBLES from scattered
     fragments (cards fly in, headlines tumble together, wires
     draw, bars grow); it is fully formed only at the screen
     plane; scrolling on SHATTERS it past the viewer while the
     next scene's fragments start converging in the distance.
     ============================================================ */
  function initCrazy() {
    const mainEl = document.querySelector("main");
    const scenes = gsap.utils.toArray("main .scene");
    const n = scenes.length;
    if (!mainEl || !n) { initNormal(); return; }

    // chatflow can't run its pinned choreography here — use its static stack layout
    const cf = document.querySelector(".chatflow");
    if (cf) cf.classList.add("cf-static");

    /* ---------- tuning knobs ---------- */
    const P = 1400;         // camera perspective — must match .warp-viewport CSS
    const D = 1700;         // z distance between consecutive scenes
    const SCROLL_VH = 1.7;  // scroll runway per scene, in viewport heights
    const WINDOW = 1.2;     // scene-widths of scroll a scene needs to assemble + shatter
    const T_TOTAL = 10;     // virtual timeline length (progress 0..1 maps here)
    const T_SHATTER = 5.5;  // assemble owns 0→4.5, hold 4.5→5.5, shatter 5.5→10

    /* ---------- build the 3D world ---------- */
    const vp = document.createElement("div");
    vp.className = "warp-viewport";
    const world = document.createElement("div");
    world.className = "warp-world";
    vp.appendChild(world);

    const layers = scenes.map((scene, i) => {
      const layer = document.createElement("div");
      layer.className = "warp-layer";
      layer.style.transform = `translate(-50%, -50%) translateZ(${-i * D}px)`;
      layer.style.visibility = "hidden"; // nothing shows until its timeline exists
      const fit = document.createElement("div");
      fit.className = "warp-fit";
      fit.appendChild(scene);
      layer.appendChild(fit);
      world.appendChild(layer);
      return { el: layer, fit, scene, tl: null, p: -1, v: false };
    });

    // ambient depth dust — brand specks floating in the space between scenes
    const dust = [];
    const DUST = isSmall() ? 22 : 60;
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < DUST; i++) {
      const p = document.createElement("i");
      const kind = ["wd-dot", "wd-dot", "wd-ring", "wd-plus", "wd-sq"][Math.floor(rand() * 5)];
      p.className = `warp-dust ${kind}${rand() < 0.42 ? " wd-blue" : ""}`;
      p.style.left = (3 + rand() * 94).toFixed(2) + "vw";
      p.style.top = (4 + rand() * 92).toFixed(2) + "vh";
      const z = -(rand() * (n - 0.6) * D);
      p.style.transform = `translateZ(${z.toFixed(1)}px) rotate(${Math.floor(rand() * 70 - 35)}deg)`;
      world.appendChild(p);
      dust.push({ el: p, z, o: -1, base: 0.5 + rand() * 0.5 });
    }

    document.body.appendChild(vp);

    const vignette = document.createElement("div");
    vignette.className = "warp-vignette";
    document.body.appendChild(vignette);

    const progress = document.createElement("div");
    progress.className = "warp-progress";
    progress.innerHTML = '<span class="warp-progress-bar"></span>';
    document.body.appendChild(progress);
    const progressBar = progress.firstElementChild;

    /* ---------- scroll runway ---------- */
    const SCROLL_PER = () => Math.max(1, Math.round(innerHeight * SCROLL_VH));
    const maxScroll = () => (n - 1) * SCROLL_PER();
    const sizeSpacer = () => { mainEl.style.height = maxScroll() + innerHeight + "px"; };

    // scale each scene down just enough that it fits the viewport at focus
    const fitLayers = () => {
      layers.forEach((L) => { L.fit.style.transform = "none"; });
      const hs = layers.map((L) => L.fit.offsetHeight);
      layers.forEach((L, i) => {
        const s = Math.min(1, innerHeight / Math.max(1, hs[i]));
        L.fit.style.transform = s < 0.999 ? `scale(${s.toFixed(4)})` : "none";
      });
    };

    /* ============================================================
       CHOREOGRAPHY HELPERS
       Deterministic per-build randomness so rebuilds (resize)
       reproduce the same scatter; radial directions come from
       layout offsets, which 3D transforms can't distort.
       ============================================================ */
    let rngState = 42;
    const rnd = () => (rngState = (rngState * 16807) % 2147483647) / 2147483647;
    const RR = (a, b) => a + rnd() * (b - a);
    const vwPx = (v) => (v * innerWidth) / 100;

    // unit direction from scene center to the element's layout position
    const dirOf = (el, scene) => {
      let x = el.offsetWidth / 2, y = el.offsetHeight / 2, node = el;
      while (node && node !== scene && scene.contains(node)) {
        x += node.offsetLeft; y += node.offsetTop;
        node = node.offsetParent;
      }
      const dx = x - scene.offsetWidth / 2, dy = y - scene.offsetHeight / 2;
      const len = Math.hypot(dx, dy);
      if (len < 40) { const a = rnd() * Math.PI * 2; return { x: Math.cos(a), y: Math.sin(a) }; }
      return { x: dx / len, y: dy / len };
    };

    // split headings once (after fonts) and reuse the chars across rebuilds
    const splitCache = new Map();
    const splitChars = (el) => {
      if (!el) return [];
      if (splitCache.has(el)) return splitCache.get(el);
      let chars;
      try { chars = new SplitText(el, { type: "lines,chars" }).chars; }
      catch (e) { chars = [el]; }
      splitCache.set(el, chars);
      return chars;
    };

    // simple rise-into-place for text blocks
    const rise = (tl, els, at = 0, o = {}) => {
      const list = gsap.utils.toArray(els);
      if (!list.length) return;
      tl.fromTo(list, { y: o.y != null ? o.y : 46, opacity: 0 }, {
        y: 0, opacity: 1, duration: o.dur || 1.6, ease: "power3.out", stagger: o.stagger || 0.25,
      }, at);
    };

    // headline chars tumble up into place
    const charsIn = (tl, chars, at = 0, o = {}) => {
      if (!chars.length) return;
      tl.fromTo(chars,
        { yPercent: 130, opacity: 0, rotationX: -55, transformPerspective: 600 },
        {
          yPercent: 0, opacity: 1, rotationX: 0,
          duration: o.dur || 1.4, ease: o.ease || "back.out(1.4)",
          stagger: { each: o.each || 0.05, from: o.from || "start" },
        }, at);
    };

    // headline chars break apart on exit
    const charsOut = (tl, chars, at = 0, o = {}) => {
      if (!chars.length) return;
      tl.to(chars, {
        yPercent: -140, opacity: 0,
        rotation: (i) => (i % 2 ? 20 : -20),
        duration: o.dur || 1.6, ease: "power2.in",
        stagger: { each: o.each || 0.02, from: "center" },
      }, T_SHATTER + at);
    };

    // cards converge from far outside the scene, along their own radial line
    const flyIn = (tl, scene, els, at = 0, o = {}) => {
      gsap.utils.toArray(els).forEach((el, i) => {
        const dir = dirOf(el, scene);
        const dist = vwPx((o.dist || 58) * RR(0.75, 1.3));
        tl.fromTo(el, {
          x: dir.x * dist, y: dir.y * dist * 0.8 + RR(-40, 40),
          rotation: RR(-1, 1) * (o.rot || 38),
          scale: o.scale != null ? o.scale : 0.5, opacity: 0,
        }, {
          x: 0, y: 0, rotation: 0, scale: 1, opacity: 1,
          duration: o.dur || 2, ease: o.ease || "power3.out",
        }, at + i * (o.stagger != null ? o.stagger : 0.2));
      });
    };

    // staggered radial fling outward past the camera
    const shatterOut = (tl, scene, els, at = 0, o = {}) => {
      gsap.utils.toArray(els).forEach((el, i) => {
        const dir = dirOf(el, scene);
        const dist = vwPx((o.dist || 66) * RR(0.8, 1.35));
        tl.to(el, {
          x: dir.x * dist, y: dir.y * dist * 0.85 + RR(-60, 30),
          rotation: RR(-1, 1) * (o.rot || 55),
          scale: o.scale != null ? o.scale : 1.7, opacity: 0,
          duration: o.dur || 2.4, ease: o.ease || "power2.in",
        }, T_SHATTER + at + i * (o.stagger != null ? o.stagger : 0.12));
      });
    };

    // shared interior micro-assembly: charts grow, docs write, code types
    const interiorsIn = (tl, q, at) => {
      const bars = q(".mini-chart .bar");
      if (bars.length) tl.fromTo(bars, { scaleY: 0, transformOrigin: "50% 100%" },
        { scaleY: 1, duration: 0.7, ease: "back.out(1.6)", stagger: 0.05 }, at);
      const docs = q(".mini-doc .doc-line");
      if (docs.length) tl.fromTo(docs, { scaleX: 0, transformOrigin: "0 50%" },
        { scaleX: 1, duration: 0.5, ease: "power2.out", stagger: 0.05 }, at + 0.3);
      const code = q(".mini-code .code-line");
      if (code.length) tl.fromTo(code, { x: -14, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: "power2.out", stagger: 0.07 }, at + 0.4);
      const sheets = q(".sheet-row");
      if (sheets.length) tl.fromTo(sheets, { opacity: 0 },
        { opacity: 1, duration: 0.35, stagger: 0.06 }, at + 0.4);
    };

    /* ============================================================
       SCENE TIMELINES — assemble 0→4.5 · hold · shatter 5.5→10
       ============================================================ */
    const builders = {

      hero(tl, sc) {
        const q = (s) => sc.querySelectorAll(s);
        const title = sc.querySelector(".hero-title");
        gsap.set(title, { visibility: "visible" });
        const chars = splitChars(title);
        tl.fromTo(q(".hero-grid"), { opacity: 0, scale: 1.18 },
          { opacity: 0.75, scale: 1, duration: 3.2, ease: "power2.out" }, 0);
        rise(tl, q(".eyebrow"), 0.3, { y: 26, dur: 1.2 });
        charsIn(tl, chars, 0.5, { each: 0.055, dur: 1.5 });
        rise(tl, q(".hero-sub"), 1.7, { y: 34 });
        const scr = q(".scribble path");
        if (scr.length) tl.fromTo(scr, { drawSVG: "0%" },
          { drawSVG: "100%", duration: 1.1, ease: "power2.inOut", stagger: 0.25 }, 2.9);
        flyIn(tl, sc, q(".hero-stage .art-card"), 0.9, { dist: 62, stagger: 0.5, dur: 2.2, ease: "back.out(1.2)" });
        interiorsIn(tl, q, 2.6);
        rise(tl, q(".hero-hint"), 3.6, { y: 14, dur: 0.8 });
        // shatter: cards blast past first, then the headline breaks apart
        shatterOut(tl, sc, q(".hero-stage .art-card"), 0, { stagger: 0.22, dist: 78, scale: 2.1 });
        charsOut(tl, chars, 0.7);
        tl.to(q(".scribble"), { opacity: 0, duration: 1, ease: "power2.in" }, T_SHATTER + 0.7);
        tl.to([q(".eyebrow"), q(".hero-sub"), q(".hero-hint")], {
          y: -60, opacity: 0, duration: 1.6, ease: "power2.in", stagger: 0.12,
        }, T_SHATTER + 0.9);
        tl.to(q(".hero-grid"), { opacity: 0, scale: 1.3, duration: 2.4, ease: "power2.in" }, T_SHATTER + 1.2);
      },

      playground(tl, sc) {
        const q = (s) => sc.querySelectorAll(s);
        const chars = splitChars(sc.querySelector("h2"));
        rise(tl, q(".playground-head .eyebrow"), 0, { y: 24, dur: 1 });
        charsIn(tl, chars, 0.25, { each: 0.035 });
        rise(tl, q(".playground-hint"), 1.3, { y: 18, dur: 1 });
        // the canvas opens like an iris
        tl.fromTo(q(".canvas-frame"),
          { opacity: 0, clipPath: "inset(46% 38% 46% 38%)" },
          { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 2.2, ease: "power3.inOut" }, 0.7);
        tl.fromTo(q(".canvas-grid"), { scale: 1.25 }, { scale: 1, duration: 2.4, ease: "power2.out" }, 0.7);
        // …and the whole deck of cards rains onto it
        flyIn(tl, sc, q(".play-card"), 1.2, { dist: 46, stagger: 0.1, dur: 1.4, rot: 30 });
        interiorsIn(tl, q, 3.1);
        rise(tl, q(".canvas-frame-label"), 3.9, { y: 12, dur: 0.6 });
        // shatter: the deck blows apart, then the canvas dives past
        shatterOut(tl, sc, q(".play-card"), 0, { stagger: 0.07, dist: 58, dur: 1.9, scale: 1.5 });
        tl.to(q(".canvas-frame"), { scale: 1.22, opacity: 0, duration: 2.2, ease: "power2.in" }, T_SHATTER + 1.5);
        charsOut(tl, chars, 0.4);
        tl.to([q(".playground-head .eyebrow"), q(".playground-hint"), q(".canvas-frame-label")], {
          opacity: 0, y: -40, duration: 1.4, ease: "power2.in",
        }, T_SHATTER + 0.5);
      },

      artifacts(tl, sc) {
        const q = (s) => sc.querySelectorAll(s);
        const chars = splitChars(sc.querySelector("h2"));
        rise(tl, q(".eyebrow"), 0, { y: 24, dur: 1 });
        charsIn(tl, chars, 0.25, { each: 0.035 });
        rise(tl, q(".playground-hint"), 1.2, { y: 18, dur: 1 });
        // cards flip up from the canvas floor
        const cards = q(".af-card");
        tl.fromTo(cards,
          { rotationX: 88, y: 90, opacity: 0, transformPerspective: 900, transformOrigin: "50% 100%" },
          { rotationX: 0, y: 0, opacity: 1, duration: 1.6, ease: "back.out(1.3)", stagger: 0.32 }, 1.0);
        // interiors materialize as each card lands
        interiorsIn(tl, q, 2.2);
        const rows = q(".mini-table tr");
        if (rows.length) tl.fromTo(rows, { opacity: 0, x: -16 },
          { opacity: 1, x: 0, duration: 0.4, stagger: 0.07 }, 2.3);
        const todos = q(".mini-todo li");
        if (todos.length) tl.fromTo(todos, { opacity: 0, x: -18 },
          { opacity: 1, x: 0, duration: 0.4, stagger: 0.08 }, 2.5);
        const cal = q(".cal-grid span");
        if (cal.length) tl.fromTo(cal, { opacity: 0, scale: 0.3 },
          { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)", stagger: 0.012 }, 2.7);
        const nodes = q(".tl-node");
        if (nodes.length) tl.fromTo(nodes, { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)", stagger: 0.12 }, 3.0);
        const toolRows = q(".mini-tool .tool-row");
        if (toolRows.length) tl.fromTo(toolRows, { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, 3.1);
        const knob = q(".tool-knob");
        if (knob.length) tl.fromTo(knob, { x: -60 }, { x: 0, duration: 0.8, ease: "power2.out" }, 3.2);
        // shatter: flip out and dive past
        tl.to(cards, {
          rotationX: -70, y: -120, opacity: 0, scale: 1.4,
          duration: 1.8, ease: "power2.in", stagger: 0.14,
        }, T_SHATTER);
        charsOut(tl, chars, 0.4);
        tl.to([q(".eyebrow"), q(".playground-hint")], {
          opacity: 0, y: -40, duration: 1.4, ease: "power2.in",
        }, T_SHATTER + 0.5);
      },

      chatflow(tl, sc) {
        const q = (s) => sc.querySelectorAll(s);
        const win = sc.querySelector(".cf-window");
        const items = [...sc.querySelectorAll(".cf-item")];
        const stChars = splitChars(sc.querySelector("#cfStatementLine"));
        tl.fromTo(win, { scale: 0.72, y: 120, opacity: 0, rotation: -3 },
          { scale: 1, y: 0, opacity: 1, rotation: 0, duration: 1.6, ease: "back.out(1.2)" }, 0);
        // the conversation writes itself, message by message
        items.forEach((item, i) => {
          const user = item.classList.contains("cf-user") || item.classList.contains("cf-drop");
          tl.fromTo(item, { x: user ? 90 : -90, y: 26, opacity: 0, scale: 0.85 },
            { x: 0, y: 0, opacity: 1, scale: 1, duration: 0.9, ease: "back.out(1.4)" }, 0.9 + i * 0.5);
        });
        interiorsIn(tl, q, 2.4);
        charsIn(tl, stChars, 3.5, { each: 0.025, dur: 1 });
        rise(tl, q(".cf-statement-sub"), 4.1, { y: 16, dur: 0.7 });
        // shatter: messages peel off alternating sides, the window dives
        items.forEach((item, i) => {
          tl.to(item, {
            x: (i % 2 ? 1 : -1) * vwPx(48), rotation: (i % 2 ? 14 : -14), opacity: 0,
            duration: 1.6, ease: "power2.in",
          }, T_SHATTER + i * 0.14);
        });
        tl.to(win, { scale: 1.35, y: -80, opacity: 0, duration: 2.2, ease: "power2.in" }, T_SHATTER + 0.8);
        charsOut(tl, stChars, 0.3, { each: 0.015 });
        tl.to(q(".cf-statement-sub"), { opacity: 0, y: -30, duration: 1.2, ease: "power2.in" }, T_SHATTER + 0.6);
      },

      reveal(tl, sc) {
        const grid = sc.querySelector(".reveal-grid");
        const chars = splitChars(sc.querySelector("#revealAsk"));
        tl.fromTo(grid, { opacity: 0, scale: 0.72 },
          { opacity: 0.9, scale: 1, duration: 4.2, ease: "power2.out" }, 0);
        // the question condenses out of a scattered cloud, center-out
        chars.forEach((c, i) => {
          const a = rnd() * Math.PI * 2, r = RR(90, 380);
          tl.fromTo(c,
            { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.7, scale: RR(1.9, 3), opacity: 0, rotation: RR(-40, 40) },
            { x: 0, y: 0, scale: 1, opacity: 1, rotation: 0, duration: 2, ease: "power3.out" },
            0.5 + Math.abs(i - chars.length / 2) * 0.045);
        });
        // shatter: it expands straight past the camera
        tl.to(chars, {
          scale: 2.6, opacity: 0,
          x: () => RR(-260, 260), y: () => RR(-160, 160),
          duration: 1.8, ease: "power2.in",
          stagger: { each: 0.02, from: "center" },
        }, T_SHATTER);
        tl.to(grid, { opacity: 0, scale: 1.35, duration: 2.4, ease: "power2.in" }, T_SHATTER + 0.4);
      },

      interact(tl, sc) {
        const q = (s) => sc.querySelectorAll(s);
        const chars = splitChars(sc.querySelector("h2"));
        rise(tl, q(".eyebrow"), 0, { y: 24, dur: 1 });
        charsIn(tl, chars, 0.25, { each: 0.035 });
        rise(tl, q(".playground-hint"), 1.2, { y: 18, dur: 1 });
        // the three nodes arrive from the directions their wires point
        // (relative offsets — the <g> elements carry baked-in translates)
        const input = sc.querySelector(".ix-card.ix-input");
        const artifact = sc.querySelector(".ix-card.ix-artifact");
        const qNode = [...q("g.ix-card")].find((g) => g !== input && g !== artifact);
        if (input) tl.from(input, { x: "-=260", y: "-=40", opacity: 0, duration: 1.8, ease: "power3.out" }, 1.2);
        if (qNode) tl.from(qNode, { y: "+=200", opacity: 0, duration: 1.8, ease: "back.out(1.3)" }, 1.7);
        if (artifact) tl.from(artifact, { x: "+=280", y: "-=30", opacity: 0, duration: 1.8, ease: "power3.out" }, 2.2);
        // shatter: they peel off along their wire directions
        if (input) tl.to(input, { x: "-=340", opacity: 0, duration: 1.9, ease: "power2.in" }, T_SHATTER);
        if (qNode) tl.to(qNode, { y: "+=240", opacity: 0, duration: 1.9, ease: "power2.in" }, T_SHATTER + 0.25);
        if (artifact) tl.to(artifact, { x: "+=360", opacity: 0, duration: 1.9, ease: "power2.in" }, T_SHATTER + 0.5);
        charsOut(tl, chars, 0.3);
        tl.to([q(".eyebrow"), q(".playground-hint")], {
          opacity: 0, y: -40, duration: 1.4, ease: "power2.in",
        }, T_SHATTER + 0.4);
      },

      usecases(tl, sc) {
        const q = (s) => sc.querySelectorAll(s);
        const chars = splitChars(sc.querySelector("h2"));
        rise(tl, q(".eyebrow"), 0, { y: 24, dur: 1 });
        charsIn(tl, chars, 0.25, { each: 0.035 });
        rise(tl, q(".playground-hint"), 1.2, { y: 18, dur: 1 });
        // cards cartwheel in from alternating sides
        const cards = [...q(".usecase-card")];
        cards.forEach((card, i) => {
          const side = i % 2 ? 1 : -1;
          tl.fromTo(card,
            { x: side * vwPx(RR(34, 52)), y: RR(-60, 80), rotation: side * RR(16, 34), scale: 0.7, opacity: 0 },
            { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, duration: 1.5, ease: "back.out(1.25)" },
            1.0 + i * 0.3);
        });
        tl.fromTo(q(".usecase-card .art-icon"), { scale: 0, rotation: -40 },
          { scale: 1, rotation: 0, duration: 0.6, ease: "back.out(2.4)", stagger: 0.1 }, 2.6);
        // shatter: radial fling
        shatterOut(tl, sc, cards, 0, { stagger: 0.12, dist: 62, scale: 1.5, dur: 2 });
        charsOut(tl, chars, 0.4);
        tl.to([q(".eyebrow"), q(".playground-hint")], {
          opacity: 0, y: -40, duration: 1.4, ease: "power2.in",
        }, T_SHATTER + 0.5);
      },

      collab(tl, sc) {
        const q = (s) => sc.querySelectorAll(s);
        tl.fromTo(q(".collab-grid"), { opacity: 0, scale: 1.15 },
          { opacity: 0.85, scale: 1, duration: 3, ease: "power2.out" }, 0);
        // the crew flies in and drops its items where they live
        const crews = [
          { cur: "#curMo", from: { x: -8, y: 46 }, items: ["#ciQ1", "#ciTweet"] },
          { cur: "#curZed", from: { x: 108, y: 60 }, items: ["#ciVideo", "#ciTodo"] },
          { cur: "#curKai", from: { x: 52, y: -8 }, items: ["#ciSticky2", "#ciQ2"] },
          { cur: "#curIvy", from: { x: 104, y: 92 }, items: ["#ciSticky", "#ciChart"] },
        ];
        crews.forEach((crew, ci) => {
          const cur = sc.querySelector(crew.cur);
          if (!cur) return;
          let t = 0.3 + ci * 0.3;
          tl.set(cur, { left: crew.from.x + "%", top: crew.from.y + "%", opacity: 0 }, 0);
          tl.to(cur, { opacity: 1, duration: 0.25 }, t);
          crew.items.forEach((sel) => {
            const item = sc.querySelector(sel);
            if (!item) return;
            const ix = parseFloat(item.style.getPropertyValue("--x")) || 50;
            const iy = parseFloat(item.style.getPropertyValue("--y")) || 50;
            tl.to(cur, { left: ix + 6 + "%", top: iy + 6 + "%", duration: 0.85, ease: "power2.inOut" }, t);
            t += 0.85;
            tl.to(cur, { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1, ease: "power2.out" }, t);
            tl.fromTo(item, { scale: 0.4, opacity: 0, y: 26 },
              { scale: 1, opacity: 1, y: 0, duration: 0.7, ease: "back.out(1.7)" }, t);
            t += 0.5;
          });
          tl.to(cur, { left: (crew.from.x > 50 ? -8 : 106) + "%", top: RR(6, 90) + "%", duration: 0.7, ease: "power2.in" }, t);
          tl.to(cur, { opacity: 0, duration: 0.3 }, t + 0.4);
        });
        interiorsIn(tl, q, 3.0);
        // the center statement lands last
        const chars = splitChars(sc.querySelector(".collab-title"));
        rise(tl, q(".collab-center .eyebrow"), 1.6, { y: 22, dur: 0.9 });
        charsIn(tl, chars, 1.9, { each: 0.04 });
        tl.fromTo(q(".btn-big"), { scale: 0.4, opacity: 0, y: 40 },
          { scale: 1, opacity: 1, y: 0, duration: 1, ease: "back.out(2.2)" }, 3.3);
        tl.fromTo(q(".footer"), { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: "power3.out" }, 3.6);
        // final scene — the camera never passes it, so no shatter
      },
    };

    // fallback for any scene without a bespoke build
    const buildGeneric = (tl, sc) => {
      flyIn(tl, sc, sc.children, 0.3, {});
      shatterOut(tl, sc, sc.children, 0, {});
    };

    /* ---------- build / rebuild ---------- */
    let built = false;
    const buildTimelines = () => {
      rngState = 42; // same scatter every build
      layers.forEach((L) => {
        const tl = gsap.timeline({ paused: true });
        (builders[L.scene.id] || buildGeneric)(tl, L.scene);
        tl.set({}, {}, T_TOTAL); // pin the duration so progress maps predictably
        // init every tween, then park at the scattered state
        tl.progress(1, true).progress(0, true);
        L.tl = tl;
        L.p = -1;
      });
      built = true;
    };
    const revertTimelines = () => {
      built = false;
      layers.forEach((L) => {
        if (L.tl) { L.tl.revert(); L.tl.kill(); L.tl = null; }
      });
    };

    /* ---------- camera state ---------- */
    let cam = 0, camTarget = 0;
    let tx = 0, ty = 0, txT = 0, tyT = 0; // pointer tilt
    let prevCam = 0, kick = 0;            // scroll-velocity pitch
    let introTween = null, introDone = false;

    const syncScroll = () => {
      camTarget = gsap.utils.clamp(0, 1, (window.scrollY || 0) / maxScroll()) * (n - 1) * D;
      if (!introDone && (window.scrollY || 0) > 4) {
        if (introTween) introTween.kill();
        introTween = null;
        introDone = true;
      }
    };

    sizeSpacer();
    fitLayers();
    syncScroll();
    // gentle dolly-in on a fresh load; instant when scroll is restored mid-page
    cam = camTarget - ((window.scrollY || 0) < 4 ? 560 : 0);
    prevCam = cam;

    // the hero assembles itself on arrival, then the scrub takes over
    const startIntro = () => {
      if ((window.scrollY || 0) > 4) { introDone = true; return; }
      const L0 = layers[0];
      introTween = gsap.to(L0.tl, {
        progress: 0.5, duration: 2, ease: "power3.out",
        onComplete: () => { introDone = true; introTween = null; L0.p = 0.5; },
      });
    };

    if (lenis) lenis.on("scroll", syncScroll);
    addEventListener("scroll", syncScroll, { passive: true });

    let resizeT = null;
    addEventListener("resize", () => {
      sizeSpacer();
      syncScroll();
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        if (!built) { fitLayers(); return; }
        revertTimelines();
        fitLayers();
        buildTimelines();
      }, 250);
    });

    if (!isTouch) {
      addEventListener("pointermove", (e) => {
        txT = e.clientX / innerWidth - 0.5;
        tyT = e.clientY / innerHeight - 0.5;
      });
    }

    // timelines need real font metrics (SplitText, offsets) before they exist
    const fontsReady = document.fonts && document.fonts.ready
      ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1600))])
      : Promise.resolve();
    fontsReady.then(() => {
      fitLayers();
      buildTimelines();
      startIntro();
    });

    /* ---------- the camera loop ---------- */
    let focusIdx = -1;
    gsap.ticker.add(() => {
      cam += (camTarget - cam) * 0.16;
      if (Math.abs(camTarget - cam) < 0.05) cam = camTarget;
      // fast scrolls pitch the whole tunnel slightly — motion that only scroll creates
      const vel = cam - prevCam;
      prevCam = cam;
      kick += (gsap.utils.clamp(-2.4, 2.4, vel * 0.02) - kick) * 0.08;
      tx += (txT - tx) * 0.06;
      ty += (tyT - ty) * 0.06;
      world.style.transform =
        `translateZ(${cam.toFixed(2)}px) rotateY(${(tx * 2.2).toFixed(3)}deg) rotateX(${(-ty * 2.2 + kick).toFixed(3)}deg)`;

      if (built) {
        const u = cam / D; // camera position in scene units
        layers.forEach((L, i) => {
          const p = gsap.utils.clamp(0, 1, 0.5 + (u - i) / WINDOW);
          // hard gate: a scene only exists while it is forming or shattering —
          // no whole-layer crossfades, never two formed scenes at once
          const vis = p > 0.001 && p < 0.965;
          if (vis !== L.v) { L.el.style.visibility = vis ? "visible" : "hidden"; L.v = vis; }
          if (i === 0 && !introDone) return; // the intro drives the hero timeline
          if (vis && Math.abs(p - L.p) > 0.0004) { L.tl.progress(p, true); L.p = p; }
        });
      }

      dust.forEach((pt) => {
        const d = cam + pt.z;
        let o = d >= 0
          ? gsap.utils.clamp(0, 1, 1 - d / (P * 0.42))
          : gsap.utils.clamp(0, 1, 1 - (-d) / (D * 1.9));
        o = Math.round(o * pt.base * 50) / 50;
        if (o !== pt.o) { pt.el.style.opacity = o; pt.o = o; }
      });

      const idx = gsap.utils.clamp(0, n - 1, Math.round(cam / D));
      if (idx !== focusIdx) {
        focusIdx = idx;
        layers.forEach((L, i) => L.el.classList.toggle("is-focus", i === idx));
      }
      progressBar.style.transform =
        `scaleX(${gsap.utils.clamp(0, 1, cam / ((n - 1) * D)).toFixed(4)})`;
    });

    /* ---------- up / down arrows — hop one scene per click ---------- */
    if (upBtn && downBtn) {
      const goScene = (dir) => {
        const idx = gsap.utils.clamp(0, n - 1, Math.round((window.scrollY || 0) / SCROLL_PER()) + dir);
        scrollToTarget(idx * SCROLL_PER());
      };
      upBtn.addEventListener("click", () => goScene(-1));
      downBtn.addEventListener("click", () => goScene(1));

      const updateArrows = () => {
        const y = window.scrollY || 0;
        upBtn.disabled = y < 40;
        downBtn.disabled = y > maxScroll() - 40;
      };
      updateArrows();
      if (lenis) lenis.on("scroll", updateArrows);
      else addEventListener("scroll", updateArrows, { passive: true });
      addEventListener("resize", updateArrows);
    }

    /* ---------- interaction that survives the scrub ---------- */
    // (heroFloat / collab sway loops are intentionally skipped here:
    //  time-based y tweens would fight the scrubbed y every frame)
    heroDrag();
    playCardDrag();
    buildInteract(false);
  }

  addEventListener("load", () => ScrollTrigger.refresh());
})();
