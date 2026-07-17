/* ============================================================
   POWER USERS — switchable demo-video showcase
   shared by index.html + how-it-works.html

   Silent, controls-free, autoplaying loop. The default tab
   mounts + plays when the section comes into view (or when the
   landing crazy-scroll engine focuses the scene). Switching a
   tab swaps the video; tabs without a video show "coming soon".

   To add / change a video: edit PU_VIDEOS below. Flip a
   `youtubeId` from null to an unlisted YouTube id to light up
   that tab. Nothing else needs to change.
   ============================================================ */
(function () {
  "use strict";

  // ---- config: single source of truth ------------------------------------
  // NOTE: confirm which id is Traveling vs Deep research (one-line swap).
  const PU_VIDEOS = [
    { key: "travel",   label: "Traveling",          youtubeId: "UCTMQQu6Nko" },
    { key: "film",     label: "Filmmaking",         youtubeId: null },
    { key: "product",  label: "Product management", youtubeId: null },
    { key: "research", label: "Deep research",      youtubeId: "nLqg49b2wdA", default: true },
  ];

  const embedUrl = (id) =>
    "https://www.youtube-nocookie.com/embed/" + id +
    "?autoplay=1&mute=1&loop=1&playlist=" + id +
    "&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&fs=0&iv_load_policy=3";

  function init() {
    const section =
      document.getElementById("powerusers") ||
      document.getElementById("power-users");
    if (!section) return;

    const tabsEl = section.querySelector(".pu-tabs");
    const frameEl = section.querySelector(".pu-frame");
    const titleEl = section.querySelector(".pu-title");
    if (!tabsEl || !frameEl) return;

    const defaultVid =
      PU_VIDEOS.find((v) => v.default && v.youtubeId) ||
      PU_VIDEOS.find((v) => v.youtubeId) ||
      PU_VIDEOS[0];

    let activeKey = defaultVid.key;
    let mountedId = null; // youtube id currently in the frame
    let seen = false;     // has the section been activated (mounted) yet

    // ---- build tab buttons ------------------------------------------------
    const btns = PU_VIDEOS.map((v) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pu-tab" + (v.youtubeId ? "" : " is-soon");
      b.dataset.key = v.key;
      b.setAttribute("role", "tab");
      b.innerHTML =
        v.label +
        (v.youtubeId ? "" : '<span class="pu-tab-soon">soon</span>');
      b.addEventListener("click", () => select(v.key));
      tabsEl.appendChild(b);
      return b;
    });

    function renderFrame(vid) {
      if (vid.youtubeId) {
        if (mountedId === vid.youtubeId) return; // already showing this one
        frameEl.innerHTML = "";
        const ifr = document.createElement("iframe");
        ifr.src = embedUrl(vid.youtubeId);
        ifr.title = vid.label + " — Flowstate demo";
        ifr.allow =
          "autoplay; encrypted-media; picture-in-picture; accelerometer; gyroscope";
        ifr.setAttribute("frameborder", "0");
        const guard = document.createElement("div");
        guard.className = "pu-guard";
        guard.setAttribute("aria-hidden", "true");
        frameEl.appendChild(ifr);
        frameEl.appendChild(guard);
        mountedId = vid.youtubeId;
      } else {
        mountedId = null;
        frameEl.innerHTML =
          '<div class="pu-soon">' +
          '<span class="pu-soon-tag">coming soon</span>' +
          '<span class="pu-soon-title">' + vid.label + "</span>" +
          '<span class="pu-soon-sub">this demo is on the way</span>' +
          "</div>";
      }
    }

    function select(key) {
      const vid = PU_VIDEOS.find((v) => v.key === key);
      if (!vid) return;
      activeKey = key;
      btns.forEach((b) => {
        const on = b.dataset.key === key;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      if (titleEl) titleEl.textContent = vid.label;
      if (seen) renderFrame(vid); // only touch the frame once activated
    }

    // set the active tab / title up front, but defer mounting the iframe
    select(activeKey);

    // ---- activate (mount + play) once, on view or on scene focus ----------
    function activate() {
      if (seen) return;
      seen = true;
      renderFrame(PU_VIDEOS.find((v) => v.key === activeKey));
    }
    // expose for the landing crazy-scroll builder (main.js)
    window.PowerUsers = { activate: activate };

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              activate();
              io.disconnect();
            }
          });
        },
        { threshold: 0.25 }
      );
      io.observe(section);
    } else {
      activate();
    }
    // fallback: never leave it un-mounted if IO doesn't fire (e.g. transformed
    // ancestors in crazy mode) — check on scroll, and once after a short delay.
    const nearViewport = () => {
      const r = section.getBoundingClientRect();
      return r.top < window.innerHeight * 1.2 && r.bottom > 0;
    };
    const onScroll = () => {
      if (nearViewport()) {
        activate();
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    setTimeout(() => { if (nearViewport()) activate(); }, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
