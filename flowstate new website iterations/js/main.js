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
    const coords = cursor.querySelector(".cursor-coords");
    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const target = { x: pos.x, y: pos.y };
    addEventListener("pointermove", (e) => {
      target.x = e.clientX; target.y = e.clientY;
      coords.textContent = `x:${e.clientX} y:${e.clientY}`;
    });
    gsap.ticker.add(() => {
      pos.x += (target.x - pos.x) * 0.22;
      pos.y += (target.y - pos.y) * 0.22;
      cursor.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    });
    const hoverables = "a, button, .link-pill, .live-todo label, .pc-chart";
    const grabbables = ".drag-card, .art-head.grab";
    document.addEventListener("pointerover", (e) => {
      if (e.target.closest(grabbables)) cursor.classList.add("is-grab");
      else if (e.target.closest(hoverables)) cursor.classList.add("is-hover");
    });
    document.addEventListener("pointerout", (e) => {
      if (e.target.closest(grabbables)) cursor.classList.remove("is-grab");
      if (e.target.closest(hoverables)) cursor.classList.remove("is-hover");
    });
  }

  /* ---------- theme toggle (canvas -> pop -> wild) ---------- */
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    const THEMES = ["canvas", "pop", "wild"];
    themeToggle.addEventListener("click", () => {
      const cur = document.documentElement.dataset.theme || "canvas";
      const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
      if (next === "canvas") delete document.documentElement.dataset.theme;
      else document.documentElement.dataset.theme = next;
      try { localStorage.setItem("fs-theme", next); } catch (_) {}
      // theme swaps fonts/sizes — recompute scroll positions
      requestAnimationFrame(() => ScrollTrigger.refresh());
    });
  }

  /* ---------- nav hide on scroll down ---------- */
  const nav = document.querySelector(".nav");
  ScrollTrigger.create({
    start: "top top",
    onUpdate: (self) => {
      if (self.scroll() < 80) return nav.classList.remove("is-hidden");
      nav.classList.toggle("is-hidden", self.direction === 1);
    },
  });

  /* ---------- scene HUD (live midpoint check — pin-spacer safe) ---------- */
  const hudNum = document.querySelector(".scene-hud-num");
  const hudName = document.querySelector(".scene-hud-name");
  const hudSections = [...document.querySelectorAll("[data-scene]")];
  let hudCurrent = "";
  gsap.ticker.add(() => {
    const mid = innerHeight * 0.55;
    let active = null;
    for (const sec of hudSections) {
      const r = sec.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) { active = sec; break; }
    }
    if (active && active.dataset.scene !== hudCurrent) {
      hudCurrent = active.dataset.scene;
      hudNum.textContent = `scene ${hudCurrent} / 08`;
      hudName.textContent = `— ${active.dataset.sceneName}`;
      document.querySelectorAll(".rail a").forEach((a) =>
        a.classList.toggle("is-active", a.dataset.rail === hudCurrent));
    }
  });

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
    .from(".hero-ctas .btn", { opacity: 0, y: 18, duration: 0.7, stagger: 0.09 }, 0.9)
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
     SCENE 02 — PROLOGUE (2021 → 2026)
     ============================================================ */
  const prologueTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".prologue", start: "top top",
      end: "+=220%", pin: ".prologue-pin", scrub: 0.6,
    },
  });
  prologueTl
    .from(".prologue-kicker", { opacity: 0, y: 16 }, 0)
    .from("#prologueYear", { opacity: 0, y: 10 }, 0.06)
    .from("#prologueLine", { opacity: 0, y: 26 }, 0.1)
    .to("#prologueYear", { scrambleText: { text: "2026", chars: "0123456789" }, duration: 0.5 }, 0.9)
    .to("#prologueLine", { opacity: 0, y: -18, duration: 0.25 }, 0.86)
    .call(() => {}, [], 1.1)
    .set("#prologueLine", { textContent: "Now we all work with AI." }, 1.1)
    .to("#prologueLine", { opacity: 1, y: 0, duration: 0.3 }, 1.15)
    .to(".prologue-pills .pill", {
      opacity: 1, y: 0, scale: 1, stagger: 0.07, duration: 0.36, ease: "back.out(2)",
    }, 1.4)
    .to(".prologue-aside", { opacity: 1, duration: 0.4 }, 2.0)
    .to({}, { duration: 0.4 }); // hold

  /* ============================================================
     SCENE 03 — THE LINE (plan vs reality)
     ============================================================ */
  gsap.set(".j-straight", { drawSVG: "0%" });
  gsap.set(".j-tangle, .j-branch", { drawSVG: "0%" });
  gsap.set(".j-end", { scale: 0, transformOrigin: "center" });
  gsap.set(".j-start", { scale: 0, transformOrigin: "center" });
  gsap.set(".j-label", { opacity: 0 });

  const lineTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".lineplot", start: "top top",
      end: "+=260%", pin: ".lineplot-pin", scrub: 0.6,
    },
  });
  lineTl
    .from(".lineplot-kicker, .lineplot-title", { opacity: 0, y: 24, stagger: 0.08, duration: 0.4 }, 0)
    .to(".j-start", { scale: 1, duration: 0.25, ease: "back.out(2)" }, 0.25)
    .to(".j-label", { opacity: 1, duration: 0.2, stagger: 0.1 }, 0.3)
    .to(".j-straight", { drawSVG: "100%", duration: 0.7, ease: "none" }, 0.4)
    .to(".j-end", { scale: 1, duration: 0.25, ease: "back.out(2.5)" }, 1.05)
    .to(".lineplot-aside", { opacity: 1, y: 0, duration: 0.3 }, 1.3)
    .to(".j-tangle", { drawSVG: "100%", duration: 2.4, ease: "none" }, 1.5)
    .to(".j-branch-1", { drawSVG: "100%", duration: 0.4, ease: "none" }, 2.1)
    .to(".j-x-1", { opacity: 1, duration: 0.15 }, 2.5)
    .to(".j-note-1", { opacity: 1, duration: 0.2 }, 2.55)
    .to(".j-branch-2", { drawSVG: "100%", duration: 0.4, ease: "none" }, 2.9)
    .to(".j-x-2", { opacity: 1, duration: 0.15 }, 3.3)
    .to(".j-note-2", { opacity: 1, duration: 0.2 }, 3.35)
    .to(".j-x-3", { opacity: 1, duration: 0.18 }, 3.9)
    .to(".j-note-3", { opacity: 1, duration: 0.25 }, 3.95)
    .to({}, { duration: 0.5 });

  /* ============================================================
     SCENE 04 — PILE-UP (horizontal)
     ============================================================ */
  const ICONS = {
    table: '<svg viewBox="0 0 24 24"><path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5zM3 9.5h18M3 14.5h18M9 3.5v17M15 3.5v17" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><path d="M4 20V9M10 20V4M16 20v-8M21 20H3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    video: '<svg viewBox="0 0 24 24"><rect x="2.5" y="6" width="13" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M15.5 12 21 8.8v6.4L15.5 12z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    doc: '<svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 21V4.5A1.5 1.5 0 0 1 6.5 3z M15 3v4h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    code: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m10 10-2.2 2L10 14M14 10l2.2 2L14 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    map: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-5.1-7-11a7 7 0 1 1 14 0c0 5.9-7 11-7 11z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.6" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    img: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="9" cy="10" r="1.8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m5 19 5.5-5.5L14 17l3-3 3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  };

  const CHATS = [
    { title: "plan the trip", arts: [["table", "trip budget"], ["map", "alfama pins"]] },
    { title: "plan the trip v2 (final)", arts: [["chart", "cost compare"], ["doc", "itinerary.md"]] },
    { title: "interview prep — 2am", arts: [["doc", "answers that slap"], ["video", "mock round"]] },
    { title: "the 47-tab special", arts: [["img", "moodboard"], ["code", "scraper v3"]] },
    { title: "budget spreadsheet attempt", arts: [["table", "actual numbers"], ["chart", "runway"]] },
    { title: "meal prep, week 12", arts: [["doc", "high-protein list"], ["table", "grocery run"]] },
    { title: "random 1:47am rabbit hole", arts: [["video", "how magnets work"], ["img", "screenshots"]] },
  ];

  // deterministic pseudo-random for skeleton bars
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  const track = document.getElementById("pileupTrack");
  CHATS.forEach((chat, ci) => {
    const col = document.createElement("div");
    col.className = "chat-col";
    let html = `<div class="chat-col-title"><span>${chat.title}</span><span class="t-num">#${ci + 1}</span></div>`;
    const blocks = 3 + Math.floor(rand() * 2);
    for (let b = 0; b < blocks; b++) {
      html += `<div class="sk-row">`;
      const bars = 2 + Math.floor(rand() * 3);
      for (let i = 0; i < bars; i++) {
        const w = 34 + Math.floor(rand() * 58);
        const right = b % 2 === 0 && i === 0 ? "sk-right" : "";
        html += `<span class="sk-bar ${right}" style="--w:${w}%"></span>`;
      }
      html += `</div>`;
      if (chat.arts[b]) {
        const [kind, label] = chat.arts[b];
        html += `<span class="sk-art">${ICONS[kind]}${label}</span>`;
      }
    }
    col.innerHTML = html;
    track.appendChild(col);
  });

  const pileup = document.querySelector(".pileup");
  const captions = gsap.utils.toArray(".pileup-caption");
  const getTrackShift = () => -(track.scrollWidth - innerWidth + innerWidth * 0.1);

  const pileTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".pileup", start: "top top",
      end: "+=320%", pin: ".pileup-pin", scrub: 0.7,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // caption swaps at fixed progress marks
        const marks = [0, 0.22, 0.44, 0.64, 0.85];
        let active = 0;
        marks.forEach((m, i) => { if (self.progress >= m) active = i; });
        captions.forEach((c, i) => {
          gsap.to(c, { opacity: i === active ? 1 : 0, y: i === active ? 0 : (i < active ? -20 : 20), duration: 0.35, overwrite: "auto" });
        });
        pileup.classList.toggle("at-final", self.progress >= 0.85);
      },
    },
  });
  pileTl.to(track, { x: getTrackShift, ease: "none", duration: 1 });
  gsap.from(".chat-col", {
    opacity: 0, y: 60, stagger: 0.12, duration: 0.8, ease: "power3.out",
    scrollTrigger: { trigger: ".pileup", start: "top 70%" },
  });

  /* ============================================================
     SCENE 05 — REVEAL
     ============================================================ */
  const wordmark = new SplitText("#revealWordmark", { type: "chars" });
  const revealTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".reveal", start: "top top",
      end: "+=240%", pin: ".reveal-pin", scrub: 0.6,
    },
  });
  revealTl
    .from("#revealAsk", { opacity: 0, y: 40, duration: 0.5 }, 0)
    .to("#revealAsk", { opacity: 0, scale: 0.94, y: -30, duration: 0.4 }, 0.9)
    .to(".reveal-grid", { opacity: 0.9, scale: 1, duration: 0.7, ease: "power2.out" }, 1.0)
    .set(".reveal-brand", { opacity: 1 }, 1.15)
    .from(wordmark.chars, { yPercent: 120, opacity: 0, stagger: 0.045, duration: 0.6, ease: "back.out(1.4)" }, 1.2)
    .from(".reveal-tag", { opacity: 0, y: 20, duration: 0.4 }, 1.7)
    .to(".reveal-pills .pill", { opacity: 1, scale: 1, stagger: 0.05, duration: 0.3, ease: "back.out(2.2)" }, 1.85)
    .to({}, { duration: 0.5 });

  /* ============================================================
     SCENE 06 — PLAYGROUND
     ============================================================ */
  // entrance
  gsap.from(".canvas-frame", {
    opacity: 0, y: 90, scale: 0.96, duration: 1.1, ease: "power3.out",
    scrollTrigger: { trigger: ".playground", start: "top 62%" },
  });
  gsap.from(".playground-head > *", {
    opacity: 0, y: 34, stagger: 0.1, duration: 0.9, ease: "power3.out",
    scrollTrigger: { trigger: ".playground", start: "top 72%" },
  });
  gsap.from(".play-card", {
    opacity: 0, scale: 0.88, y: 30, stagger: 0.09, duration: 0.8, ease: "back.out(1.5)",
    scrollTrigger: { trigger: ".canvas-frame", start: "top 55%" },
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

  // chart re-roll
  const playChart = document.getElementById("playChart");
  if (playChart) {
    playChart.closest(".pc-chart").addEventListener("click", (e) => {
      if (e.target.closest(".art-head")) return;
      playChart.querySelectorAll(".bar").forEach((bar) => {
        bar.style.setProperty("--h", `${28 + Math.floor(Math.random() * 66)}%`);
      });
    });
  }

  /* ============================================================
     SCENE 07 — JUGGLERS
     ============================================================ */
  document.querySelectorAll(".juggler-row").forEach((row) => {
    const img = row.querySelector("img");
    const cap = row.querySelector("figcaption");
    const tl = gsap.timeline({
      scrollTrigger: { trigger: row, start: "top 68%" },
    });
    tl.to(img, { clipPath: "inset(0 0% 0 0 round 18px)", duration: 1.15, ease: "power4.inOut" })
      .from(row.querySelectorAll(".juggler-copy > *"), { opacity: 0, y: 30, stagger: 0.09, duration: 0.7, ease: "power3.out" }, 0.25)
      .to(cap, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0.9);
  });
  gsap.from(".jugglers-head > *", {
    opacity: 0, y: 34, stagger: 0.1, duration: 0.9, ease: "power3.out",
    scrollTrigger: { trigger: ".jugglers", start: "top 72%" },
  });

  /* ============================================================
     SCENE 08 — SHARE
     ============================================================ */
  gsap.from(".share-inner > .eyebrow, .share-inner > h2", {
    opacity: 0, y: 34, stagger: 0.1, duration: 0.9, ease: "power3.out",
    scrollTrigger: { trigger: ".share", start: "top 70%" },
  });
  document.querySelectorAll(".share-nope li").forEach((li, i) => {
    gsap.from(li, {
      opacity: 0, y: 22, duration: 0.55, ease: "power3.out",
      scrollTrigger: { trigger: li, start: "top 84%" },
    });
    gsap.to(li.querySelector(".nope-strike"), {
      scaleX: 1, duration: 0.55, ease: "power3.inOut", delay: 0.25 + i * 0.08,
      scrollTrigger: { trigger: li, start: "top 78%" },
    });
  });
  gsap.from(".share-yes", {
    opacity: 0, y: 50, scale: 0.94, duration: 0.9, ease: "back.out(1.4)",
    scrollTrigger: { trigger: ".share-yes", start: "top 82%" },
  });
  gsap.from(".link-pill", {
    opacity: 0, y: 24, duration: 0.7, ease: "power3.out",
    scrollTrigger: { trigger: ".link-pill", start: "top 88%" },
  });

  // copy-link interaction + confetti
  const copyBtn = document.getElementById("copyLink");
  const toast = document.getElementById("shareToast");
  copyBtn.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText("https://flowstatetool.com/c/weekend-in-lisbon"); } catch (_) {}
    gsap.fromTo(toast, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" });
    gsap.to(toast, { opacity: 0, delay: 2.6, duration: 0.5 });
    confetti(copyBtn);
  });

  function confetti(fromEl) {
    const rect = fromEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const theme = document.documentElement.dataset.theme;
    const colors = theme === "pop" || theme === "wild"
      ? ["#0072e3", "#ffb200", "#ff6100", "#00aa3c", "#ab54f7", "#ea3737", "#ffdb08"]
      : ["#0f4fc7", "#101010", "#ffd84d", "#f4f3ee"];
    for (let i = 0; i < 26; i++) {
      const p = document.createElement("div");
      p.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:${5 + Math.random() * 6}px;height:${5 + Math.random() * 6}px;background:${colors[i % colors.length]};z-index:4000;pointer-events:none;border-radius:${Math.random() > 0.5 ? "50%" : "2px"}`;
      document.body.appendChild(p);
      gsap.to(p, {
        x: (Math.random() - 0.5) * 320,
        y: -(60 + Math.random() * 200),
        rotation: Math.random() * 540,
        duration: 0.7 + Math.random() * 0.5,
        ease: "power2.out",
      });
      gsap.to(p, {
        y: `+=${260 + Math.random() * 160}`,
        opacity: 0,
        delay: 0.55,
        duration: 0.9,
        ease: "power2.in",
        onComplete: () => p.remove(),
      });
    }
  }

  /* ============================================================
     FINALE
     ============================================================ */
  gsap.from(".finale-wordmark, .finale-line, .finale .btn-big", {
    opacity: 0, y: 44, stagger: 0.12, duration: 1, ease: "power3.out",
    scrollTrigger: { trigger: ".finale", start: "top 62%" },
  });
  gsap.from(".finale-pills .pill", {
    opacity: 0, scale: 0.7, stagger: 0.06, duration: 0.5, ease: "back.out(2)",
    scrollTrigger: { trigger: ".finale", start: "top 55%" },
  });
  document.querySelectorAll(".finale-pills .pill").forEach((pill, i) => {
    gsap.to(pill, {
      y: `+=${10 + (i % 4) * 5}`, duration: 2.4 + (i % 5) * 0.4,
      yoyo: true, repeat: -1, ease: "sine.inOut", delay: i * 0.18,
    });
  });

  /* ---------- reduced motion: reveal everything, kill pins ---------- */
  if (reduceMotion) {
    ScrollTrigger.getAll().forEach((st) => st.kill());
    gsap.set("*", { clearProps: "opacity,transform,visibility" });
    document.querySelectorAll(".juggler-img img").forEach((img) => (img.style.clipPath = "none"));
  }

  addEventListener("load", () => ScrollTrigger.refresh());
})();
