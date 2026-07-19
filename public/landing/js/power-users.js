/* ============================================================
   POWER USERS — switchable demo-video showcase
   shared by index.html + how-it-works.html

   Silent, chrome-free, permanently-looping demo videos.

   Why the IFrame API instead of a plain <iframe>:
   YouTube deprecated `modestbranding` / `showinfo`, so the title
   bar (video title + channel name + avatar) reappears whenever the
   player is paused, cued or ended. Driving the player through the
   API lets us force it straight back to PLAYING, so that overlay
   never gets a chance to sit on screen. A transparent guard on top
   blocks hover/click, which covers the remaining cases.

   Quality: YouTube picks a rendition from the player's pixel size.
   We therefore render the player at a fixed 1920x1080 and scale it
   down to the container with a CSS transform, so it decodes 1080p
   and stays sharp instead of being served a soft ~480p stream.

   To add / change a video: edit PU_VIDEOS. Flip a `youtubeId` from
   null to an unlisted YouTube id to light that tab up; tabs without
   an id render as "coming soon" and always sort last.
   ============================================================ */
(function () {
  "use strict";

  // ---- config: single source of truth ------------------------------------
  // ids verified against the YouTube titles:
  //   UCTMQQu6Nko = "deep research on flowstate"
  //   nLqg49b2wdA = "travel itinerary on flowstate"
  //   ipikB_yx1UY = "freelance projects on flowstate"
  const PU_VIDEOS = [
    { key: "research",  label: "Deep research",      youtubeId: "UCTMQQu6Nko", default: true },
    { key: "travel",    label: "Traveling",          youtubeId: "nLqg49b2wdA" },
    { key: "freelance", label: "Freelance projects", youtubeId: "ipikB_yx1UY" },
    { key: "film",      label: "Filmmaking",         youtubeId: null },
    { key: "product",   label: "Product management", youtubeId: null },
  ];

  // ready tabs first, "coming soon" always last (adding an id auto-promotes it)
  const PU_ORDERED = PU_VIDEOS.slice().sort(
    (a, b) => (a.youtubeId ? 0 : 1) - (b.youtubeId ? 0 : 1)
  );

  // render size of the player — big enough that YouTube serves 1080p
  const PU_W = 1920;
  const PU_H = 1080;
  const PU_QUALITY = "hd1080";

  /* ---------- load the IFrame API once ---------- */
  let apiPromise = null;
  function loadYouTubeApi() {
    if (apiPromise) return apiPromise;
    apiPromise = new Promise((resolve) => {
      if (window.YT && window.YT.Player) return resolve(window.YT);
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof prev === "function") prev();
        resolve(window.YT);
      };
      if (!document.getElementById("yt-iframe-api")) {
        const s = document.createElement("script");
        s.id = "yt-iframe-api";
        s.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(s);
      }
    });
    return apiPromise;
  }

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
    let seen = false;   // has the section been activated yet
    let player = null;  // YT.Player instance

    /* ---------- tab buttons (ready first, "coming soon" last) ---------- */
    const btns = PU_ORDERED.map((v) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pu-tab" + (v.youtubeId ? "" : " is-soon");
      b.dataset.key = v.key;
      b.setAttribute("role", "tab");
      b.innerHTML =
        v.label + (v.youtubeId ? "" : '<span class="pu-tab-soon">soon</span>');
      b.addEventListener("click", () => select(v.key));
      tabsEl.appendChild(b);
      return b;
    });

    /* ---------- keep the 1920x1080 player scaled into the frame ---------- */
    function fitPlayer() {
      const iframe = frameEl.querySelector("iframe");
      if (!iframe) return;
      const w = frameEl.clientWidth;
      if (!w) return;
      iframe.style.position = "absolute";
      iframe.style.top = "0";
      iframe.style.left = "0";
      iframe.style.width = PU_W + "px";
      iframe.style.height = PU_H + "px";
      iframe.style.transformOrigin = "0 0";
      iframe.style.transform = "scale(" + w / PU_W + ")";
    }

    function addGuard() {
      if (frameEl.querySelector(".pu-guard")) return;
      const guard = document.createElement("div");
      guard.className = "pu-guard";
      guard.setAttribute("aria-hidden", "true");
      frameEl.appendChild(guard);
    }

    /* ---------- poster: the belt-and-braces branding blocker ----------
       YouTube shows its title bar (video title + channel name + avatar)
       whenever the player is UNSTARTED / CUED / PAUSED / ENDED — e.g. if a
       browser blocks muted autoplay. This poster (a plain thumbnail, no
       branding in it) covers the player until it is genuinely PLAYING, so
       that overlay is never visible to a visitor. */
    function setPoster(vid) {
      let img = frameEl.querySelector(".pu-poster");
      if (!img) {
        img = document.createElement("img");
        img.className = "pu-poster";
        img.alt = "";
        img.setAttribute("aria-hidden", "true");
        img.addEventListener("error", function () {
          const hq = "https://i.ytimg.com/vi/" + vid.youtubeId + "/hqdefault.jpg";
          if (img.src !== hq) img.src = hq;
        });
        frameEl.appendChild(img);
      }
      img.classList.remove("is-hidden");
      img.src = "https://i.ytimg.com/vi/" + vid.youtubeId + "/maxresdefault.jpg";
    }
    function hidePoster() {
      const img = frameEl.querySelector(".pu-poster");
      if (img) img.classList.add("is-hidden");
    }
    function showPoster() {
      const img = frameEl.querySelector(".pu-poster");
      if (img) img.classList.remove("is-hidden");
    }

    function showComingSoon(vid) {
      if (player && player.destroy) player.destroy();
      player = null;
      frameEl.innerHTML =
        '<div class="pu-soon">' +
        '<span class="pu-soon-tag">coming soon</span>' +
        '<span class="pu-soon-title">' + vid.label + "</span>" +
        '<span class="pu-soon-sub">this demo is on the way</span>' +
        "</div>";
    }

    /** Force the player back to playing so the title/channel overlay
     *  never persists, and keep quality pinned. */
    function keepPlaying(p) {
      try {
        p.mute();
        p.setPlaybackQuality(PU_QUALITY);
        p.playVideo();
      } catch (e) {}
    }

    /* Some browsers ignore the first programmatic play (autoplay policy), which
       leaves the player UNSTARTED with YouTube's branded overlay showing.
       Nudge it until it actually reports PLAYING. */
    let watchdog = null;
    function startWatchdog(p) {
      stopWatchdog();
      let tries = 0;
      watchdog = setInterval(() => {
        tries += 1;
        let state = -1;
        try { state = p.getPlayerState(); } catch (e) {}
        const YTS = window.YT && window.YT.PlayerState;
        if (YTS && (state === YTS.PLAYING || state === YTS.BUFFERING)) {
          stopWatchdog();
          return;
        }
        if (tries > 12) return stopWatchdog(); // give up; poster stays put
        keepPlaying(p);
      }, 700);
    }
    function stopWatchdog() {
      if (watchdog) clearInterval(watchdog);
      watchdog = null;
    }

    function createPlayer(vid) {
      stopWatchdog();
      frameEl.innerHTML = "";
      const host = document.createElement("div");
      host.className = "pu-player";
      frameEl.appendChild(host);
      setPoster(vid); // covers the player until it reports PLAYING

      loadYouTubeApi().then((YT) => {
        if (!YT || !YT.Player) return;
        player = new YT.Player(host, {
          host: "https://www.youtube-nocookie.com",
          width: PU_W,
          height: PU_H,
          videoId: vid.youtubeId,
          playerVars: {
            autoplay: 1,
            mute: 1,
            loop: 1,
            playlist: vid.youtubeId,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
          },
          events: {
            onReady: (e) => {
              keepPlaying(e.target);
              fitPlayer();
              addGuard();
              startWatchdog(e.target);
            },
            onStateChange: (e) => {
              const S = window.YT.PlayerState;
              // ENDED / PAUSED / CUED are exactly the states that surface the
              // channel name + avatar overlay — cover with the poster and
              // bounce straight back to play.
              if (e.data === S.ENDED) {
                showPoster();
                try { e.target.seekTo(0); } catch (err) {}
                keepPlaying(e.target);
              } else if (e.data === S.PAUSED || e.data === S.CUED) {
                showPoster();
                keepPlaying(e.target);
              } else if (e.data === S.PLAYING) {
                try { e.target.setPlaybackQuality(PU_QUALITY); } catch (err) {}
                fitPlayer();
                addGuard();
                stopWatchdog();
                hidePoster(); // only reveal the player once it is really playing
              }
            },
          },
        });
      });
    }

    function renderFrame(vid) {
      if (!vid.youtubeId) return showComingSoon(vid);
      if (player && player.loadVideoById) {
        // reuse the player so switching stays instant
        if (!frameEl.querySelector("iframe")) return createPlayer(vid);
        try {
          setPoster(vid); // cover during the swap
          player.loadVideoById({
            videoId: vid.youtubeId,
            suggestedQuality: PU_QUALITY,
          });
          player.mute();
          addGuard();
          fitPlayer();
          startWatchdog(player);
          return;
        } catch (e) {
          /* fall through to a fresh player */
        }
      }
      createPlayer(vid);
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
      if (seen) renderFrame(vid);
    }

    // set the active tab / title up front, but defer mounting the player
    select(activeKey);

    /* ---------- activate (mount + play) once, on view ---------- */
    function activate() {
      if (seen) return;
      seen = true;
      renderFrame(PU_VIDEOS.find((v) => v.key === activeKey));
    }
    // getPlayer() is a debug/verification hook (playback state + quality)
    window.PowerUsers = { activate: activate, getPlayer: () => player };

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
    // fallback: transformed ancestors (landing "crazy" mode) can stop IO firing
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

    window.addEventListener("resize", fitPlayer);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
