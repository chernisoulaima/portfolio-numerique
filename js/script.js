/* ==========================================================
   Portfolio numérique — script commun
   Chaque fonctionnalité ne s'active que si les éléments
   correspondants existent dans la page.
   ========================================================== */

(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { return null; }
  }

  function toast(msg) {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* ---------- 1. Mode sombre ---------- */
  const ICON_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const ICON_MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  const ICON_MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  const ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  const themeBtn = $("#theme-toggle");
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (themeBtn) {
      themeBtn.innerHTML = theme === "dark" ? ICON_SUN : ICON_MOON;
      themeBtn.setAttribute("aria-label", theme === "dark" ? "Activer le mode clair" : "Activer le mode sombre");
    }
  }
  applyTheme(document.documentElement.getAttribute("data-theme") || "light");
  if (themeBtn) themeBtn.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    store("theme", next);
  });

  /* ---------- 2. Menu mobile ---------- */
  const menuBtn = $("#menu-toggle");
  const nav = $("#main-nav");
  if (menuBtn && nav) {
    menuBtn.innerHTML = ICON_MENU;
    menuBtn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.innerHTML = open ? ICON_CLOSE : ICON_MENU;
    });
  }

  /* ---------- 2b. Défilement : barre de progression, en-tête, retour en haut ---------- */
  const header = $(".site-header");
  const progress = document.createElement("div");
  progress.className = "progress";
  document.body.prepend(progress);
  const toTop = document.createElement("button");
  toTop.className = "to-top"; toTop.type = "button"; toTop.setAttribute("aria-label", "Revenir en haut de la page");
  toTop.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  toTop.addEventListener("click", () => window.scrollTo({ top: 0 }));
  document.body.appendChild(toTop);
  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    if (header) header.classList.toggle("scrolled", y > 8);
    toTop.classList.toggle("show", y > 600);
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 2c. Apparition des blocs au défilement ---------- */
  const revealables = $$(".card, .module-card, .media-card, .mindmap, .transparence, .feature, .def");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -40px 0px" });
    revealables.forEach((n, i) => {
      if (n.getBoundingClientRect().top < innerHeight) return; // déjà visible : pas d'animation
      n.classList.add("reveal");
      n.style.transitionDelay = (i % 3) * 60 + "ms";
      io.observe(n);
    });
  }

  /* ---------- 2d. Sommaire actif (scrollspy) ---------- */
  const tocLinks = $$(".toc a[href^='#']");
  if (tocLinks.length && "IntersectionObserver" in window) {
    const map = new Map(tocLinks.map(a => [a.getAttribute("href").slice(1), a]));
    const spy = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        tocLinks.forEach(a => a.classList.remove("active"));
        const a = map.get(e.target.id);
        if (a) { a.classList.add("active"); a.scrollIntoView({ block: "nearest", inline: "nearest" }); }
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- 2e. Compteurs animés (accueil) ---------- */
  $$("[data-count]").forEach(n => {
    const target = Number(n.dataset.count);
    const start = performance.now();
    const step = t => {
      const p = Math.min(1, (t - start) / 1200);
      n.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  /* ---------- 2f. Mot qui change dans le titre (accueil) ---------- */
  const rot = $(".rotator");
  if (rot) {
    const words = rot.dataset.words.split("|");
    let k = 0;
    setInterval(() => {
      k = (k + 1) % words.length;
      rot.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).onfinish = () => {
        rot.textContent = words[k];
        rot.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 300 });
      };
    }, 2600);
  }

  /* ---------- 2g. Effet lumineux qui suit la souris sur les cartes ---------- */
  $$(".module-card").forEach(c => c.addEventListener("pointermove", e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mx", (e.clientX - r.left) + "px");
    c.style.setProperty("--my", (e.clientY - r.top) + "px");
  }));

  /* ---------- 3. Lien actif dans le menu ---------- */
  const here = location.pathname.replace(/index\.html$/, "");
  $$("#main-nav a").forEach(a => {
    const target = new URL(a.getAttribute("href"), location.href).pathname.replace(/index\.html$/, "");
    if (target === here) a.setAttribute("aria-current", "page");
  });

  /* ---------- 4. Filtre des modules (accueil) ---------- */
  $$(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      $$(".filter-btn").forEach(b => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      const f = btn.dataset.filter;
      $$(".module-card").forEach(c => { c.hidden = f !== "all" && c.dataset.module !== f; });
    });
  });

  /* ---------- 5. Cartes mentales (SVG généré depuis du JSON) ---------- */
  const SVGNS = "http://www.w3.org/2000/svg";
  function el(name, attrs, parent) {
    const n = document.createElementNS(SVGNS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  const PALETTE = ["#1d4ed8", "#0f766e", "#b45309", "#be123c", "#4f46e5", "#0369a1"];

  function renderMindmap(fig) {
    const data = JSON.parse($("script[type='application/json']", fig).textContent);
    const W = 1000, LEAF_H = 26, GAP = 22, PAD = 30;
    const right = [], left = [];
    data.branches.forEach((b, i) => (i % 2 === 0 ? right : left).push({ ...b, color: PALETTE[i % PALETTE.length] }));
    const sideH = side => side.reduce((s, b) => s + Math.max(1, b.items.length) * LEAF_H + GAP, -GAP);
    const H = Math.max(sideH(right), sideH(left), 120) + PAD * 2;

    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Carte mentale : " + data.centre });
    $(".mindmap-scroll", fig).appendChild(svg);
    const gLinks = el("g", {}, svg);
    const gNodes = el("g", {}, svg);
    const cx = W / 2, cy = H / 2;

    function layout(side, dir) {
      let y = (H - sideH(side)) / 2;
      side.forEach(b => {
        const h = Math.max(1, b.items.length) * LEAF_H;
        const by = y + h / 2;
        const bx = cx + dir * 175;
        const group = el("g", { class: "mm-branch-group" }, gNodes);
        group.dataset.branch = b.nom;
        el("path", { class: "mm-link", stroke: b.color, d: `M${cx},${cy} C${cx + dir * 90},${cy} ${bx - dir * 90},${by} ${bx},${by}` }, gLinks).dataset.branch = b.nom;

        const bn = el("g", { class: "mm-branch", tabindex: "0" }, group);
        const rect = el("rect", { rx: 10, stroke: b.color }, bn);
        const txt = el("text", { y: by + 5, "text-anchor": dir > 0 ? "start" : "end", x: bx + dir * 12 }, bn);
        txt.textContent = b.nom;
        const tw = txt.getComputedTextLength();
        rect.setAttribute("x", dir > 0 ? bx : bx - tw - 24);
        rect.setAttribute("y", by - 16);
        rect.setAttribute("width", tw + 24);
        rect.setAttribute("height", 32);
        const edge = bx + dir * (tw + 24);

        b.items.forEach((it, k) => {
          const ly = y + k * LEAF_H + LEAF_H / 2;
          const lx = edge + dir * 60;
          const p = el("path", { class: "mm-link", stroke: b.color, d: `M${edge},${by} C${edge + dir * 30},${by} ${lx - dir * 30},${ly} ${lx},${ly}` }, gLinks);
          p.dataset.branch = b.nom;
          const leaf = el("g", { class: "mm-leaf" }, group);
          el("circle", { cx: lx, cy: ly, r: 4, fill: b.color }, leaf);
          const t = el("text", { x: lx + dir * 10, y: ly + 4, "text-anchor": dir > 0 ? "start" : "end" }, leaf);
          t.textContent = it;
        });

        const focus = () => {
          $$("[data-branch]", svg).forEach(n => n.classList.toggle("mm-dim", n.dataset.branch !== b.nom));
        };
        const blur = () => $$("[data-branch]", svg).forEach(n => n.classList.remove("mm-dim"));
        bn.addEventListener("mouseenter", focus); bn.addEventListener("focus", focus);
        bn.addEventListener("mouseleave", blur); bn.addEventListener("blur", blur);
        y += h + GAP;
      });
    }
    layout(right, 1);
    layout(left, -1);

    const root = el("g", { class: "mm-root" }, gNodes);
    const rr = el("rect", { rx: 16 }, root);
    const rt = el("text", { x: cx, y: cy + 6, "text-anchor": "middle" }, root);
    rt.textContent = data.centre;
    const rw = rt.getComputedTextLength() + 40;
    rr.setAttribute("x", cx - rw / 2); rr.setAttribute("y", cy - 22);
    rr.setAttribute("width", rw); rr.setAttribute("height", 44);

    // Recadrage : la vue englobe exactement tout le contenu (aucun texte coupé)
    const bb = svg.getBBox();
    const m = 16;
    svg.setAttribute("viewBox", `${bb.x - m} ${bb.y - m} ${bb.width + m * 2} ${bb.height + m * 2}`);
  }
  $$(".mindmap").forEach(fig => { try { renderMindmap(fig); } catch (e) { console.error("Carte mentale :", e); } });

  /* ---------- 6. Quiz (généré depuis du JSON) ---------- */
  $$(".quiz").forEach(buildQuiz);
  function buildQuiz(box) {
    const qs = JSON.parse($("script[type='application/json']", box).textContent);
    $$(".quiz-render", box).forEach(n => n.remove());
    const host = document.createElement("div");
    host.className = "quiz-render";
    const bar = document.createElement("div");
    bar.className = "quiz-progress";
    bar.innerHTML = "<span></span>";
    host.appendChild(bar);
    const list = document.createElement("div");
    let answered = 0, good = 0;
    const score = document.createElement("p");
    score.className = "quiz-score";
    score.setAttribute("aria-live", "polite");

    qs.forEach((q, i) => {
      const wrap = document.createElement("div");
      wrap.className = "quiz-q";
      wrap.innerHTML = `<p>${i + 1}. ${q.q}</p>`;
      const opts = document.createElement("div");
      opts.className = "quiz-opts";
      const expl = document.createElement("div");
      expl.className = "quiz-expl";
      q.options.forEach((o, j) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "quiz-opt"; b.textContent = o;
        b.dataset.letter = "ABCDEF"[j];
        b.addEventListener("click", () => {
          $$("button", opts).forEach((x, k) => { x.disabled = true; if (k === q.answer) x.classList.add("correct"); });
          if (j !== q.answer) b.classList.add("wrong"); else good++;
          answered++;
          bar.firstChild.style.width = (answered / qs.length) * 100 + "%";
          expl.textContent = (j === q.answer ? "✔ Bonne réponse. " : "✘ Raté. ") + (q.explication || "");
          if (answered === qs.length) score.textContent = `Score : ${good} / ${qs.length}` + (good === qs.length ? " — parfait !" : "");
        });
        opts.appendChild(b);
      });
      wrap.append(opts, expl);
      list.appendChild(wrap);
    });
    const reset = document.createElement("button");
    reset.type = "button"; reset.className = "btn btn-ghost"; reset.textContent = "Recommencer";
    reset.addEventListener("click", () => buildQuiz(box));
    host.append(list, score, reset);
    box.appendChild(host);
  }

  /* ---------- 7. Checklist « Suis-je bien protégé ? » ---------- */
  $$(".checklist-box").forEach(box => {
    const inputs = $$("input[type=checkbox]", box);
    const bar = $(".meter > span", box);
    const out = $(".checklist-result", box);
    const KEY = "checklist:" + location.pathname;
    let saved = [];
    try { saved = JSON.parse(store(KEY) || "[]"); } catch (e) { saved = []; }
    inputs.forEach((inp, i) => { inp.checked = !!saved[i]; inp.addEventListener("change", update); });
    function update() {
      const n = inputs.filter(i => i.checked).length;
      const pct = Math.round((n / inputs.length) * 100);
      bar.style.width = pct + "%";
      bar.style.background = pct < 40 ? "var(--ko)" : pct < 75 ? "var(--sys)" : "var(--ok)";
      out.textContent = pct < 40 ? `${pct} % — Tu es exposé(e) : commence par les mots de passe et la 2FA.`
        : pct < 75 ? `${pct} % — Pas mal ! Encore quelques réflexes à prendre.`
        : `${pct} % — Excellent, tu es bien protégé(e).`;
      store(KEY, JSON.stringify(inputs.map(i => i.checked)));
    }
    update();
  });

  /* ---------- 8. Boutons « Copier » sur les blocs de code ---------- */
  $$("pre[data-copy]").forEach(pre => {
    const wrap = document.createElement("div");
    wrap.className = "copy-wrap";
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);
    const b = document.createElement("button");
    b.type = "button"; b.className = "copy-btn"; b.textContent = "Copier";
    b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(pre.innerText); toast("Copié dans le presse-papiers"); }
      catch (e) { toast("Copie impossible : sélectionne le texte à la main"); }
    });
    wrap.appendChild(b);
  });

  /* ---------- 8b. Copier le script vidéo ---------- */
  $$(".copy-script").forEach(b => b.addEventListener("click", async () => {
    const box = b.closest(".script-box");
    const txt = $$(".script-plans li", box).map(li => {
      const label = li.querySelector(".plan-label").innerText.replace(/\s+/g, " ").trim();
      return `[${label}]\n${li.querySelector("p").innerText}`;
    }).join("\n\n");
    try { await navigator.clipboard.writeText(txt); toast("Script copié"); }
    catch (e) { toast("Copie impossible : sélectionne le texte à la main"); }
  }));

  /* ---------- 9. Audios : message si le fichier n'existe pas encore ---------- */
  $$("audio[data-src]").forEach(a => {
    const msg = a.nextElementSibling && a.nextElementSibling.classList.contains("media-missing") ? a.nextElementSibling : null;
    a.addEventListener("error", () => {
      a.hidden = true;
      if (msg) msg.hidden = false;
      const tts = a.closest(".media-card") && a.closest(".media-card").querySelector(".tts-controls");
      if (tts) tts.hidden = false;   // secours : voix du navigateur
    }, true);
    a.src = a.dataset.src;
  });

  /* ---------- 10. Vidéos YouTube / fichiers locaux ---------- */
  function setYouTube(f, id, autoplay) {
    if (!id) return;
    const q = autoplay ? "?autoplay=1&rel=0" : "?rel=0";
    f.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}${q}" title="${f.dataset.title || "Vidéo"}" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
  }
  $$(".video-frame[data-youtube]").forEach(f => setYouTube(f, f.dataset.youtube.trim(), false));

  // Playlist : cliquer sur une vidéo recommandée la charge dans le lecteur principal
  $$(".yt-item").forEach(btn => btn.addEventListener("click", () => {
    const panel = btn.closest(".video-panel");
    const frame = $(".video-frame", panel);
    $$(".yt-item", panel).forEach(b => { b.classList.remove("active"); b.setAttribute("aria-pressed", "false"); });
    btn.classList.add("active"); btn.setAttribute("aria-pressed", "true");
    setYouTube(frame, btn.dataset.id, true);
    if (frame.getBoundingClientRect().top < 70) frame.scrollIntoView({ block: "center" });
  }));
  $$(".video-frame[data-video]").forEach(f => {
    const src = f.dataset.video.trim();
    if (!src) return;
    const v = document.createElement("video");
    v.controls = true; v.preload = "metadata"; v.src = src;
    v.addEventListener("loadedmetadata", () => { f.innerHTML = ""; f.appendChild(v); });
  });

  /* ---------- 11. Lecture vocale du résumé (navigateur) ---------- */
  const ttsBtn = $("#tts-play");
  const ttsStop = $("#tts-stop");
  if (ttsBtn) {
    if (!("speechSynthesis" in window)) {
      ttsBtn.disabled = true; ttsBtn.textContent = "Lecture vocale non disponible";
    } else {
      ttsBtn.addEventListener("click", () => {
        speechSynthesis.cancel();
        const src = $("#resume");
        const text = src ? src.innerText.replace(/\s+/g, " ") : "";
        const chunks = text.match(/[^.!?]+[.!?]*/g) || [text];
        const voices = speechSynthesis.getVoices();
        const fr = voices.find(v => /^fr/i.test(v.lang));
        chunks.forEach(c => {
          const u = new SpeechSynthesisUtterance(c.trim());
          u.lang = "fr-FR"; u.rate = 1; if (fr) u.voice = fr;
          speechSynthesis.speak(u);
        });
        toast("Lecture du résumé…");
      });
      if (ttsStop) ttsStop.addEventListener("click", () => speechSynthesis.cancel());
    }
  }

  /* ---------- 12. Partage Google Classroom ---------- */
  $$("[data-classroom-share]").forEach(a => {
    const url = encodeURIComponent(location.href.split("#")[0]);
    const title = encodeURIComponent(document.title);
    a.href = `https://classroom.google.com/share?url=${url}&title=${title}`;
    a.target = "_blank"; a.rel = "noopener";
  });

  /* ---------- 13. Animation de tri (algorithmique) ---------- */
  const bars = $("#sort-bars");
  if (bars) {
    let arr = [], running = false;
    const algoSel = $("#sort-algo");
    const speed = () => 220 - Number($("#sort-speed").value);
    function draw(active = [], done = []) {
      bars.innerHTML = "";
      arr.forEach((v, i) => {
        const s = document.createElement("span");
        s.style.height = v + "%";
        if (active.includes(i)) s.classList.add("active");
        if (done.includes(i)) s.classList.add("done");
        bars.appendChild(s);
      });
    }
    function shuffle() { arr = Array.from({ length: 24 }, () => 8 + Math.floor(Math.random() * 92)); draw(); $("#sort-info").textContent = "Tableau mélangé. Choisis un algorithme et lance le tri."; }
    const wait = () => new Promise(r => setTimeout(r, speed()));
    async function bubble() {
      let comps = 0;
      for (let i = 0; i < arr.length - 1; i++) {
        for (let j = 0; j < arr.length - 1 - i; j++) {
          comps++; draw([j, j + 1], range(arr.length - i, arr.length)); await wait();
          if (arr[j] > arr[j + 1]) { [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]; draw([j, j + 1], range(arr.length - i, arr.length)); await wait(); }
        }
      }
      return comps;
    }
    async function selection() {
      let comps = 0;
      for (let i = 0; i < arr.length - 1; i++) {
        let min = i;
        for (let j = i + 1; j < arr.length; j++) { comps++; draw([min, j], range(0, i)); await wait(); if (arr[j] < arr[min]) min = j; }
        [arr[i], arr[min]] = [arr[min], arr[i]];
      }
      return comps;
    }
    async function insertion() {
      let comps = 0;
      for (let i = 1; i < arr.length; i++) {
        let j = i;
        while (j > 0) { comps++; draw([j - 1, j]); await wait(); if (arr[j - 1] > arr[j]) { [arr[j - 1], arr[j]] = [arr[j], arr[j - 1]]; j--; } else break; }
      }
      return comps;
    }
    function range(a, b) { const r = []; for (let i = a; i < b; i++) r.push(i); return r; }
    $("#sort-shuffle").addEventListener("click", () => { if (!running) shuffle(); });
    $("#sort-run").addEventListener("click", async () => {
      if (running) return;
      running = true;
      const algo = algoSel.value;
      $("#sort-info").textContent = "Tri en cours…";
      const comps = await ({ bubble, selection, insertion })[algo]();
      draw([], range(0, arr.length));
      $("#sort-info").textContent = `Terminé : ${comps} comparaisons pour ${arr.length} éléments.`;
      running = false;
    });
    shuffle();
  }

  /* ---------- 14. Convertisseur de bases ---------- */
  const conv = $("#converter");
  if (conv) {
    const fields = { 10: $("#conv-dec"), 2: $("#conv-bin"), 16: $("#conv-hex"), 8: $("#conv-oct") };
    const valid = { 10: /^\d*$/, 2: /^[01]*$/, 16: /^[0-9a-f]*$/i, 8: /^[0-7]*$/ };
    Object.entries(fields).forEach(([base, inp]) => {
      inp.addEventListener("input", () => {
        const v = inp.value.trim();
        if (!valid[base].test(v)) { inp.setAttribute("aria-invalid", "true"); return; }
        inp.removeAttribute("aria-invalid");
        const n = v === "" ? null : parseInt(v, Number(base));
        Object.entries(fields).forEach(([b, other]) => {
          if (other !== inp) other.value = n === null ? "" : n.toString(Number(b)).toUpperCase();
        });
      });
    });
  }

  /* ---------- 15. Simulateur de portes logiques ---------- */
  const gate = $("#gate-sim");
  if (gate) {
    const A = $("#bit-a"), B = $("#bit-b"), sel = $("#gate-type"), out = $("#gate-out");
    const ops = {
      ET: (a, b) => a & b, OU: (a, b) => a | b, "NON-ET": (a, b) => 1 - (a & b),
      "NON-OU": (a, b) => 1 - (a | b), "OU-X": (a, b) => a ^ b, NON: a => 1 - a
    };
    const bit = b => b.getAttribute("aria-pressed") === "true" ? 1 : 0;
    function update() {
      const g = sel.value;
      B.disabled = g === "NON";
      const r = ops[g](bit(A), bit(B));
      out.textContent = "S = " + r;
      out.classList.toggle("on", r === 1);
      const tb = $("#gate-table tbody");
      tb.innerHTML = "";
      const rows = g === "NON" ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
      $("#gate-table thead tr").innerHTML = g === "NON" ? "<th>A</th><th>S</th>" : "<th>A</th><th>B</th><th>S</th>";
      rows.forEach(rw => {
        const s = ops[g](...rw);
        const cur = rw[0] === bit(A) && (g === "NON" || rw[1] === bit(B));
        tb.insertAdjacentHTML("beforeend", `<tr${cur ? ' style="font-weight:700;background:var(--surface-2)"' : ""}>${rw.map(x => `<td>${x}</td>`).join("")}<td>${s}</td></tr>`);
      });
    }
    [A, B].forEach(b => b.addEventListener("click", () => {
      b.setAttribute("aria-pressed", String(!bit(b)));
      b.textContent = bit(b);
      update();
    }));
    sel.addEventListener("change", update);
    update();
  }

  /* ---------- 16. Année dans le pied de page ---------- */
  $$("[data-year]").forEach(n => n.textContent = new Date().getFullYear());
})();
