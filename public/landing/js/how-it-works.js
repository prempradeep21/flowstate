/* ============================================================
   FLOWSTATE — how it works
   nine small stories, each a looping mockup animation inside a
   mini canvas. the HTML is authored in its finished state; this
   script hides the pieces and replays how they got there.
   ============================================================ */
(() => {
  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------- sticky nav — same behavior as the other pages ---------- */
  const nav = $(".nav");
  const onNavScroll = () => {
    nav.classList.toggle("is-scrolled", (window.scrollY || window.pageYOffset) > 20);
  };
  onNavScroll();
  addEventListener("scroll", onNavScroll, { passive: true });

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduceMotion && typeof Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- custom cursor (desktop only) ---------- */
  const cursor = $(".cursor");
  if (!isTouch && cursor) {
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
    document.addEventListener("pointerover", (e) => {
      if (e.target.closest(hoverables)) cursor.classList.add("is-hover");
    });
    document.addEventListener("pointerout", (e) => {
      if (e.target.closest(hoverables)) cursor.classList.remove("is-hover");
    });
  }

  /* ---------- progress rail + hairline ---------- */
  const railItems = $$(".hiw-rail-item");
  railItems.forEach((item) => {
    const id = item.dataset.rail;
    const section = document.getElementById(id);
    if (!section) return;
    ScrollTrigger.create({
      trigger: section, start: "top 55%", end: "bottom 55%",
      onToggle: (self) => item.classList.toggle("is-active", self.isActive),
    });
    item.addEventListener("click", (e) => {
      e.preventDefault();
      if (lenis) lenis.scrollTo(section, { duration: 1.1 });
      else section.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });
  gsap.to(".hiw-progress-bar", {
    scaleX: 1, ease: "none",
    scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: true },
  });

  /* ---------- the interactive tip splitter works in every mode ---------- */
  buildTipSplitter();

  /* ---------- reduced motion: leave the page in its finished state ---------- */
  if (reduceMotion) {
    document.body.classList.add("hiw-static");
    return;
  }

  /* ============================================================
     SHARED HELPERS
     ============================================================ */

  // run looping timelines only while their section is on screen
  const gate = (trigger, ...tweens) => {
    ScrollTrigger.create({
      trigger, start: "top 88%", end: "bottom 8%",
      onToggle: (self) => tweens.forEach((t) => (self.isActive ? t.play() : t.pause())),
    });
  };

  // character-by-character typing inside a repeating timeline
  const typeInto = (tl, el, text, pos) => {
    const state = { n: 0 };
    tl.to(state, {
      n: text.length,
      duration: text.length / 26,
      ease: "none",
      onUpdate: () => { el.textContent = text.slice(0, Math.round(state.n)); },
    }, pos);
  };

  // gentle float loop (the heroFloat pattern)
  const float = (els) => els.map((el, i) => gsap.to(el, {
    y: `+=${6 + (i % 3) * 3}`, duration: 2.4 + i * 0.4,
    yoyo: true, repeat: -1, ease: "sine.inOut", delay: i * 0.3, paused: true,
  }));

  /* ---------- page + per-step entrances ---------- */
  gsap.from(".hiw-hero-inner > *", {
    opacity: 0, y: 26, duration: 0.9, stagger: 0.12, ease: "power3.out", delay: 0.15,
  });
  $$(".hiw-step").forEach((step) => {
    gsap.from($$(".hiw-step-copy > *", step), {
      opacity: 0, y: 28, duration: 0.8, stagger: 0.09, ease: "power3.out",
      scrollTrigger: { trigger: step, start: "top 74%" },
    });
    gsap.from($(".hiw-canvas", step), {
      opacity: 0, y: 40, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: step, start: "top 74%" },
    });
  });
  gsap.from(".hiw-finale .playground-head > *", {
    opacity: 0, y: 26, duration: 0.8, stagger: 0.1, ease: "power3.out",
    scrollTrigger: { trigger: ".hiw-finale", start: "top 74%" },
  });
  gsap.from(".hiw-demo", {
    opacity: 0, y: 44, scale: 0.94, duration: 0.85, stagger: 0.12, ease: "back.out(1.5)",
    scrollTrigger: { trigger: ".hiw-gallery", start: "top 80%" },
  });
  gsap.from(".hiw-vibe .playground-head > *", {
    opacity: 0, y: 26, duration: 0.8, stagger: 0.1, ease: "power3.out",
    scrollTrigger: { trigger: ".hiw-vibe", start: "top 74%" },
  });
  gsap.from(".hiw-vibe-card", {
    opacity: 0, y: 44, scale: 0.94, duration: 0.85, stagger: 0.14, ease: "back.out(1.5)",
    scrollTrigger: { trigger: ".hiw-vibe-gallery", start: "top 80%" },
  });
  gsap.from(".hiw-cta-center > *", {
    opacity: 0, y: 26, duration: 0.8, stagger: 0.1, ease: "power3.out",
    scrollTrigger: { trigger: ".hiw-cta", start: "top 74%" },
  });

  /* ============================================================
     STEP 01 — drop a question, watch the answer land
     ============================================================ */
  (function step1() {
    const root = $("#s1Canvas"); if (!root) return;
    const cur = $(".s1-cursor", root);
    const q = $(".s1-q", root);
    const typeEl = $(".s1-type", root);
    const wire = $(".s1-wire-path", root);
    const ans = $(".s1-answer", root);
    const lines = $$(".s1-answer .doc-line", root);
    const text = typeEl.textContent.trim();

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.2, paused: true, defaults: { ease: "power2.out" } });
    tl.set(cur, { left: "70%", top: "78%", opacity: 0, scale: 1 })
      .set(q, { opacity: 0, scale: 0.9, transformOrigin: "left top" })
      .call(() => { typeEl.textContent = ""; })
      .set(wire, { drawSVG: "0%", opacity: 0 })
      .set(ans, { opacity: 0, y: 18, scale: 0.94 })
      // glide in and click an empty spot
      .to(cur, { opacity: 1, duration: 0.25 })
      .to(cur, { left: "15%", top: "15%", duration: 1.0, ease: "power2.inOut" })
      .to(cur, { scale: 0.8, duration: 0.11, yoyo: true, repeat: 1 })
      .to(q, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.7)" }, "<");
    typeInto(tl, typeEl, text);
    tl.to({}, { duration: 0.35 })
      .set(wire, { opacity: 1 })
      .to(wire, { drawSVG: "100%", duration: 0.65, ease: "power2.inOut" })
      .to(ans, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "back.out(1.6)" }, "-=0.15")
      .from(lines, { scaleX: 0, transformOrigin: "left center", stagger: 0.07, duration: 0.4 }, "-=0.2")
      .to(cur, { left: "62%", top: "72%", opacity: 0, duration: 0.9, ease: "power2.inOut" }, "-=0.3")
      .to({}, { duration: 1.7 })
      .to([q, ans], { opacity: 0, y: -8, duration: 0.5, stagger: 0.08, ease: "power2.in" })
      .to(wire, { opacity: 0, duration: 0.3 }, "<");
    gate(root, tl);
  })();

  /* ============================================================
     STEP 02 — follow-ups stay wired to their answers
     ============================================================ */
  (function step2() {
    const root = $("#s2Canvas"); if (!root) return;
    const q1 = $(".s2-q1", root), a1 = $(".s2-a1", root), w1 = $(".s2-wire1", root);
    const q2 = $(".s2-q2", root), a2 = $(".s2-a2", root);
    const w2 = $(".s2-wire2", root), w3 = $(".s2-wire3", root);
    const label = $(".s2-label", root);

    // the first pair is already on the canvas — draw it in once on scroll
    gsap.set(w1, { drawSVG: "0%" });
    gsap.from([q1, a1], {
      opacity: 0, y: 16, scale: 0.94, duration: 0.6, stagger: 0.15, ease: "back.out(1.5)",
      scrollTrigger: { trigger: root, start: "top 72%" },
      onComplete: () => gsap.to(w1, { drawSVG: "100%", duration: 0.5 }),
    });

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.4, paused: true, defaults: { ease: "power2.out" } });
    tl.set(q2, { opacity: 0, scale: 0.88, transformOrigin: "left bottom" })
      .set([w2, w3], { drawSVG: "0%", opacity: 0 })
      .set(a2, { opacity: 0, y: 16, scale: 0.94 })
      .set(label, { opacity: 0 })
      .to({}, { duration: 0.4 })
      .set(w2, { opacity: 1 })
      .to(w2, { drawSVG: "100%", duration: 0.6, ease: "power2.inOut" })
      .to(q2, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" }, "-=0.15")
      .set(w3, { opacity: 1 }, "+=0.5")
      .to(w3, { drawSVG: "100%", duration: 0.5, ease: "power2.inOut" })
      .to(a2, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "back.out(1.6)" }, "-=0.1")
      .to(label, { opacity: 1, duration: 0.5 }, "+=0.3")
      .to({}, { duration: 2.0 })
      .to([q2, a2, label], { opacity: 0, duration: 0.45, stagger: 0.06, ease: "power2.in" })
      .to([w2, w3], { opacity: 0, duration: 0.3 }, "<");
    gate(root, tl);
  })();

  /* ============================================================
     STEP 03 — branches fan out from the main thread
     ============================================================ */
  (function step3() {
    const root = $("#s3Canvas"); if (!root) return;
    const parent = $(".s3-parent", root);
    const wires = [$(".s3-w1", root), $(".s3-w2", root), $(".s3-w3", root)];
    const kids = [$(".s3-c1", root), $(".s3-c2", root), $(".s3-c3", root)];

    const bobs = float(kids);
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.4, paused: true, defaults: { ease: "power2.out" } });
    tl.set(parent, { opacity: 0, scale: 0.9, transformOrigin: "center" })
      .set(wires, { drawSVG: "0%", opacity: 0 })
      .set(kids, { opacity: 0, scale: 0.7 })
      .set(root, { scale: 1 })
      .to(parent, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" })
      .to({}, { duration: 0.35 })
      .set(wires, { opacity: 1 })
      .to(wires, { drawSVG: "100%", duration: 0.6, ease: "power2.inOut", stagger: 0.16 })
      .to(kids, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.8)", stagger: 0.16 }, "-=0.9")
      // the canvas eases back, like zooming out to see the shape of it
      .to(root, { scale: 0.965, duration: 0.8, ease: "power2.inOut" }, "-=0.3")
      .to({}, { duration: 2.2 })
      .to(root, { scale: 1, duration: 0.6, ease: "power2.inOut" })
      .to([parent, ...kids], { opacity: 0, duration: 0.45, ease: "power2.in" }, "<")
      .to(wires, { opacity: 0, duration: 0.3 }, "<");
    gate(root, tl, ...bobs);
  })();

  /* ============================================================
     STEP 04 — documents drop onto the canvas
     ============================================================ */
  (function step4() {
    const root = $("#s4Canvas"); if (!root) return;
    const drop = $(".s4-drop", root);
    const doc1 = $(".s4-doc1", root), doc2 = $(".s4-doc2", root);
    const chip = $(".s4-chip", root);

    gsap.set(drop, { opacity: 0 });
    gsap.set(doc1, { y: -190, rotation: -8, opacity: 0 });
    gsap.set(doc2, { y: -190, rotation: 7, opacity: 0 });
    gsap.set(chip, { opacity: 0, scale: 0.7 });

    const tl = gsap.timeline({
      paused: false, defaults: { ease: "power2.out" },
      scrollTrigger: { trigger: root, start: "top 70%" },
    });
    tl.to(drop, { opacity: 1, duration: 0.5 })
      .to(doc1, { y: 0, rotation: -2, opacity: 1, duration: 0.8, ease: "back.out(1.15)" }, "+=0.2")
      .fromTo(drop, { backgroundColor: "rgba(15,79,199,0.14)" }, { backgroundColor: "rgba(15,79,199,0.05)", duration: 0.5 }, "-=0.25")
      .to(doc2, { y: 0, rotation: 2, opacity: 1, duration: 0.8, ease: "back.out(1.15)" }, "-=0.2")
      .fromTo(drop, { backgroundColor: "rgba(15,79,199,0.14)" }, { backgroundColor: "rgba(15,79,199,0.05)", duration: 0.5 }, "-=0.25")
      .to(chip, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.8)" }, "-=0.1")
      .to(drop, { opacity: 0, duration: 0.7 }, "+=0.6");

    gate(root, ...float([doc1, doc2]));
  })();

  /* ============================================================
     STEP 05 — point a question at the sources
     ============================================================ */
  (function step5() {
    const root = $("#s5Canvas"); if (!root) return;
    const docs = [$(".s5-doc1", root), $(".s5-doc2", root)];
    const scans = $$(".s5-scan", root);
    const wires = [$(".s5-w1", root), $(".s5-w2", root)];
    const q = $(".s5-q", root);
    const ans = $(".s5-a", root);
    const cites = $$(".s5-cites .chip", root);

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.2, paused: true, defaults: { ease: "power2.out" } });
    tl.set(q, { opacity: 0, scale: 0.9, transformOrigin: "left center" })
      .set(wires, { drawSVG: "0%", opacity: 0 })
      .set(ans, { opacity: 0, y: 18, scale: 0.94 })
      .set(scans, { opacity: 0, top: "38%" })
      .to(q, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" })
      // wires reach back into the sources…
      .set(wires, { opacity: 1 }, "+=0.3")
      .to(wires, { drawSVG: "100%", duration: 0.55, ease: "power2.inOut", stagger: 0.18 })
      .call(() => docs.forEach((d) => d.classList.add("is-pulse")))
      // …which get scanned
      .to(scans, { opacity: 1, duration: 0.25 })
      .to(scans, { top: "72%", duration: 0.9, ease: "sine.inOut" }, "<")
      .to(scans, { opacity: 0, duration: 0.3 }, "-=0.2")
      .call(() => docs.forEach((d) => d.classList.remove("is-pulse")))
      // and the cited answer pops
      .to(ans, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "back.out(1.6)" })
      .from(cites, { opacity: 0, y: 8, scale: 0.8, duration: 0.4, stagger: 0.12, ease: "back.out(1.8)" }, "-=0.2")
      .to({}, { duration: 2.2 })
      .to([q, ans], { opacity: 0, duration: 0.45, stagger: 0.08, ease: "power2.in" })
      .to(wires, { opacity: 0, duration: 0.3 }, "<");
    gate(root, tl);
  })();

  /* ============================================================
     STEP 06 — table · timeline · calendar, on a loop
     ============================================================ */
  (function step6() {
    const root = $("#s6Canvas"); if (!root) return;
    const prompt = $(".s6-prompt", root);
    const cards = [
      { el: $(".s6-af-table", root), label: "→ turn it into a table" },
      { el: $(".s6-af-timeline", root), label: "→ …or a timeline" },
      { el: $(".s6-af-cal", root), label: "→ …or a calendar" },
    ];

    gsap.set(cards.map((c) => c.el), { opacity: 0 });

    const master = gsap.timeline({ repeat: -1, paused: true });
    cards.forEach(({ el, label }) => {
      const seg = gsap.timeline({ defaults: { ease: "power2.out" } });
      seg.call(() => { prompt.textContent = label; })
        .fromTo(prompt, { opacity: 0.25, y: -4 }, { opacity: 1, y: 0, duration: 0.35 })
        .fromTo(el, { opacity: 0, y: 16, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.4)" }, "-=0.05");
      const rows = $$(".mini-table tr", el);
      if (rows.length) seg.from(rows, { x: -14, opacity: 0, duration: 0.32, stagger: 0.07 }, "-=0.2");
      const nodes = $$(".tl-node", el);
      if (nodes.length) {
        seg.from($(".tl-line", el), { scaleX: 0, transformOrigin: "left center", duration: 0.45 }, "-=0.2")
          .from(nodes, { scale: 0, duration: 0.35, stagger: 0.09, ease: "back.out(2)" }, "-=0.25");
      }
      const cells = $$(".cal-grid span", el);
      if (cells.length) seg.from(cells, { scale: 0, opacity: 0, duration: 0.3, stagger: 0.012 }, "-=0.2");
      seg.to({}, { duration: 2.0 })
        .to(el, { opacity: 0, y: -12, duration: 0.4, ease: "power2.in" });
      master.add(seg);
    });
    gate(root, master);
  })();

  /* ============================================================
     STEP 07 — ask for a change, the table updates in place
     ============================================================ */
  (function step7() {
    const root = $("#s7Canvas"); if (!root) return;
    const q = $(".s7-q", root);
    const wire = $(".s7-wire", root);
    const row = $(".s7-row", root);
    const n = $(".s7-n", root), e = $(".s7-e", root), total = $(".s7-total", root);
    const cells = [n, e, total];

    const before = () => { n.textContent = "3"; e.textContent = "52k"; total.innerHTML = "<b>212k</b>"; };
    const after = () => { n.textContent = "6"; e.textContent = "104k"; total.innerHTML = "<b>264k</b>"; };

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.6, paused: true, defaults: { ease: "power2.out" } });
    tl.call(before)
      .set(q, { opacity: 0, y: 14 })
      .set(wire, { drawSVG: "0%", opacity: 0 })
      .to(q, { opacity: 1, y: 0, duration: 0.5 })
      .set(wire, { opacity: 1 }, "+=0.15")
      .to(wire, { drawSVG: "100%", duration: 0.55, ease: "power2.inOut" })
      .fromTo(row, { backgroundColor: "rgba(15,79,199,0)" }, { backgroundColor: "rgba(15,79,199,0.14)", duration: 0.35 }, "+=0.05")
      .call(after)
      .fromTo(cells, { opacity: 0.15 }, { opacity: 1, duration: 0.45 }, "<")
      .to(row, { backgroundColor: "rgba(15,79,199,0)", duration: 0.6 }, "+=1.3")
      .to(q, { opacity: 0, duration: 0.4, ease: "power2.in" }, "+=0.6")
      .to(wire, { opacity: 0, duration: 0.3 }, "<");
    gate(root, tl);
  })();

  /* ============================================================
     STEP 08 — one link, and the crew shows up
     ============================================================ */
  (function step8() {
    const root = $("#s8Canvas"); if (!root) return;
    const you = $(".s8-you", root), kai = $(".s8-kai", root), ivy = $(".s8-ivy", root);
    const share = $(".s8-share", root), chip = $(".s8-chip", root);
    const sticky = $(".s8-sticky", root), q = $(".s8-q", root);

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.8, paused: true, defaults: { ease: "power2.out" } });
    tl.set(you, { left: "40%", top: "60%", opacity: 0, scale: 1 })
      .set(kai, { left: "-8%", top: "70%", opacity: 0, scale: 1 })
      .set(ivy, { left: "106%", top: "30%", opacity: 0, scale: 1 })
      .set(chip, { opacity: 0, y: -8 })
      .set(share, { scale: 1 })
      .set(sticky, { opacity: 0, scale: 0.55 })
      .set(q, { opacity: 0, scale: 0.55 })
      // you press Share
      .to(you, { opacity: 1, duration: 0.25 })
      .to(you, { left: "78%", top: "10%", duration: 0.9, ease: "power2.inOut" })
      .to(you, { scale: 0.8, duration: 0.11, yoyo: true, repeat: 1 })
      .to(share, { scale: 0.92, duration: 0.11, yoyo: true, repeat: 1 }, "<")
      .to(chip, { opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.7)" })
      .to(you, { left: "30%", top: "40%", opacity: 0, duration: 0.9, ease: "power2.inOut" }, "+=0.3")
      // kai arrives and drops a sticky
      .to(kai, { opacity: 1, duration: 0.25 }, "-=0.6")
      .to(kai, { left: "34%", top: "78%", duration: 0.85, ease: "sine.inOut" }, "<")
      .to(kai, { left: "18%", top: "66%", duration: 0.7, ease: "power2.inOut" })
      .to(kai, { scale: 0.8, duration: 0.11, yoyo: true, repeat: 1 })
      .to(sticky, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.8)" }, "<")
      // ivy arrives with a question for the ai
      .to(ivy, { opacity: 1, duration: 0.25 }, "-=0.8")
      .to(ivy, { left: "72%", top: "44%", duration: 0.85, ease: "sine.inOut" }, "<")
      .to(ivy, { left: "56%", top: "60%", duration: 0.7, ease: "power2.inOut" })
      .to(ivy, { scale: 0.8, duration: 0.11, yoyo: true, repeat: 1 })
      .to(q, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.8)" }, "<")
      .to({}, { duration: 1.6 })
      // everyone drifts off, the canvas resets
      .to(kai, { left: "-10%", top: "88%", opacity: 0, duration: 0.9, ease: "power2.in" })
      .to(ivy, { left: "108%", top: "70%", opacity: 0, duration: 0.9, ease: "power2.in" }, "<")
      .to([sticky, q, chip], { opacity: 0, duration: 0.45, stagger: 0.08, ease: "power2.in" }, "-=0.3");
    gate(root, tl, ...float([$(".s8-table", root)]));
  })();

  /* ============================================================
     FINALE — four little tools, each doing its thing
     ============================================================ */

  /* poll — the votes keep coming in */
  (function poll() {
    const card = $('[data-demo="poll"]'); if (!card) return;
    const opts = $$(".poll-opt", card);
    const votesEl = $(".poll-votes", card);
    let votes = [12, 7, 4];

    const render = (animate) => {
      const sum = votes.reduce((a, b) => a + b, 0);
      const lead = votes.indexOf(Math.max(...votes));
      opts.forEach((opt, i) => {
        const pct = Math.round((votes[i] / sum) * 100);
        opt.classList.toggle("is-lead", i === lead);
        $(".poll-pct", opt).textContent = pct + "%";
        gsap.to($(".poll-fill", opt), { width: pct + "%", duration: animate ? 0.7 : 0, ease: "power2.out" });
      });
      votesEl.textContent = sum;
    };
    render(false);

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.3, paused: true });
    tl.call(() => {
      votes[Math.floor(Math.random() * 3)] += 1 + Math.floor(Math.random() * 3);
      const sum = votes.reduce((a, b) => a + b, 0);
      if (sum > 70) votes = [12, 7, 4];
      render(true);
    }).to({}, { duration: 0.7 });
    gate(card, tl);
  })();

  /* habit tracker — the month fills itself in */
  (function habit() {
    const card = $('[data-demo="habit"]'); if (!card) return;
    const cells = $$(".hb-grid span", card);
    const streakEl = $(".hb-n", card);

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.4, paused: true });
    tl.call(() => {
      cells.forEach((c) => c.classList.remove("is-fill"));
      streakEl.textContent = "0";
    });
    const target = 24;
    cells.slice(0, target).forEach((cell, i) => {
      tl.call(() => {
        // an occasional rest day keeps the grid honest
        if (i % 6 !== 5) cell.classList.add("is-fill");
        streakEl.textContent = String(Math.max(1, Math.round(i * 0.75)));
      }, null, i * 0.09 + 0.6);
    });
    tl.to({}, { duration: 2.2 });
    gate(card, tl);
  })();

  /* countdown — the ring closes in on departure day */
  (function countdown() {
    const card = $('[data-demo="count"]'); if (!card) return;
    const arc = $(".cd-arc", card);
    const daysEl = $(".cd-days", card);
    const next = $(".cd-next", card);

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.0, paused: true });
    const state = { d: 30 };
    tl.set(arc, { drawSVG: "6%" })
      .call(() => { daysEl.textContent = "30"; next && next.classList.remove("is-done"); })
      .to(arc, { drawSVG: "62%", duration: 2.2, ease: "power2.inOut" })
      .to(state, {
        d: 12, duration: 2.2, ease: "power2.inOut",
        onUpdate: () => { daysEl.textContent = String(Math.round(state.d)); },
        onStart: () => { state.d = 30; },
      }, "<")
      .call(() => next && next.classList.add("is-done"))
      .fromTo(next, { scale: 0.85 }, { scale: 1, duration: 0.4, ease: "back.out(2)" })
      .to({}, { duration: 1.6 });
    gate(card, tl);
  })();

  /* ============================================================
     VIBE CODERS — github viewer types a repo, then explains it
     ============================================================ */
  (function vibeGithub() {
    const card = $(".vibe-gh"); if (!card) return;
    const typeEl = $(".gh-type", card);
    const overview = $(".gh-reveal", card);
    const docLines = $$(".mini-doc .doc-line", overview);
    const tags = $$(".vibe-tags .chip", overview);
    const stats = $$(".vibe-stat", overview);
    const text = typeEl.textContent.trim();

    // hide the reveal + clear the url so nothing flashes before it plays
    gsap.set(overview, { opacity: 0 });
    typeEl.textContent = "";

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.6, paused: true, defaults: { ease: "power2.out" } });
    tl.set(overview, { opacity: 0, y: 14 })
      .call(() => { typeEl.textContent = ""; });
    typeInto(tl, typeEl, text);
    tl.to({}, { duration: 0.35 })
      .to(overview, { opacity: 1, y: 0, duration: 0.5 })
      .from(docLines, { scaleX: 0, transformOrigin: "left center", stagger: 0.06, duration: 0.4 }, "-=0.2")
      .from(tags, { opacity: 0, y: 8, scale: 0.8, stagger: 0.08, duration: 0.35, ease: "back.out(1.8)" }, "-=0.1")
      .from(stats, { opacity: 0, y: 10, stagger: 0.09, duration: 0.4, ease: "back.out(1.6)" }, "-=0.15")
      .to({}, { duration: 2.6 })
      .to(overview, { opacity: 0, y: -10, duration: 0.5, ease: "power2.in" });
    gate(card, tl);
  })();

  /* ============================================================
     VIBE CODERS — skill viewer reveals what a skill is
     ============================================================ */
  (function vibeSkill() {
    const card = $(".vibe-skill"); if (!card) return;
    const name = $(".vibe-skill-name", card);
    const by = $(".vibe-skill-by", card);
    const avatar = $(".vibe-avatar", card);
    const reveal = $(".skill-reveal", card);
    const docLines = $$(".mini-doc .doc-line", reveal);
    const tags = $$(".vibe-tags .chip", reveal);
    const metas = $$(".vibe-meta-item", reveal);

    gsap.set([name, by, avatar, reveal], { opacity: 0 });

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.6, paused: true, defaults: { ease: "power2.out" } });
    tl.set([name, by], { opacity: 0, x: -10 })
      .set(avatar, { opacity: 0, scale: 0.5 })
      .set(reveal, { opacity: 0, y: 14 })
      .to(avatar, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.8)" })
      .to([name, by], { opacity: 1, x: 0, duration: 0.4, stagger: 0.08 }, "-=0.2")
      .to(reveal, { opacity: 1, y: 0, duration: 0.5 }, "-=0.1")
      .from(docLines, { scaleX: 0, transformOrigin: "left center", stagger: 0.06, duration: 0.4 }, "-=0.25")
      .from(tags, { opacity: 0, y: 8, scale: 0.8, stagger: 0.08, duration: 0.35, ease: "back.out(1.8)" }, "-=0.1")
      .from(metas, { opacity: 0, y: 10, stagger: 0.1, duration: 0.4, ease: "back.out(1.6)" }, "-=0.1")
      .to({}, { duration: 2.6 })
      .to([reveal, name, by, avatar], { opacity: 0, y: -8, duration: 0.5, ease: "power2.in" });
    gate(card, tl);
  })();

  /* ============================================================
     TIP SPLITTER — a real working tool (all modes)
     ============================================================ */
  function buildTipSplitter() {
    const card = $('[data-demo="tip"]'); if (!card) return;
    const segs = $$(".ts-seg", card);
    const steps = $$(".ts-step", card);
    const countEl = $(".ts-count", card);
    const totalEl = $(".ts-total", card);
    const state = { bill: 84, tip: 15, people: 4 };
    let idle = null;

    const render = () => {
      const each = (state.bill * (1 + state.tip / 100)) / state.people;
      countEl.textContent = String(state.people);
      totalEl.textContent = "$" + each.toFixed(2);
      segs.forEach((s) => s.classList.toggle("is-on", Number(s.dataset.tip) === state.tip));
      if (!reduceMotion && typeof gsap !== "undefined") {
        gsap.fromTo(totalEl, { y: 6, opacity: 0.3 }, { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" });
      }
    };

    segs.forEach((seg) => seg.addEventListener("click", () => {
      state.tip = Number(seg.dataset.tip); render();
    }));
    steps.forEach((btn) => btn.addEventListener("click", () => {
      state.people = Math.min(12, Math.max(1, state.people + Number(btn.dataset.d)));
      render();
    }));
    render();

    // idle auto-demo until the visitor touches it themselves
    if (!reduceMotion) {
      const script = [
        () => ({ tip: 20 }), () => ({ people: 5 }), () => ({ tip: 10 }),
        () => ({ people: 3 }), () => ({ tip: 15 }), () => ({ people: 4 }),
      ];
      let i = 0;
      idle = gsap.timeline({ repeat: -1, repeatDelay: 2.4, paused: true });
      idle.call(() => {
        const change = script[i++ % script.length]();
        let btn = null;
        if (change.tip != null) {
          state.tip = change.tip;
          btn = segs.find((s) => Number(s.dataset.tip) === change.tip);
        } else {
          btn = steps[change.people > state.people ? 1 : 0];
          state.people = change.people;
        }
        if (btn) {
          btn.classList.add("is-press");
          setTimeout(() => btn.classList.remove("is-press"), 220);
        }
        render();
      }).to({}, { duration: 0.5 });
      ScrollTrigger.create({
        trigger: card, start: "top 88%", end: "bottom 8%",
        onToggle: (self) => idle && (self.isActive ? idle.play() : idle.pause()),
      });
      card.addEventListener("pointerdown", () => {
        if (idle) { idle.kill(); idle = null; }
      }, { once: true });
    }
  }
})();
