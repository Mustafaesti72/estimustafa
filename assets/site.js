/* Portfolyo hareketleri: GSAP + ScrollTrigger + Lenis. Kaydırma dinleyicisi yok; her şey ScrollTrigger üzerinden. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // Videolar: yalnız görünürken oynar (hareket azaltma açıksa kapak görseli kalır)
  if (!reduce && "IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { var p = e.target.play(); if (p && p.catch) p.catch(function () {}); }
        else e.target.pause();
      });
    }, { threshold: 0.25 });
    $$("video").forEach(function (v) { vio.observe(v); });
  }

  if (!window.gsap || !window.ScrollTrigger || reduce) { root.classList.remove("js"); return; }
  gsap.registerPlugin(ScrollTrigger);
  var EASE = "expo.out";

  /* ---------- metin bölme ---------- */
  function splitChars(el) {
    // Harfler kelime kutularinda: dar ekranda satir kelime ortasindan bolunmez
    var words = el.textContent.split(" "); el.textContent = "";
    words.forEach(function (w, i) {
      var box = document.createElement("span"); box.className = "chw";
      w.split("").forEach(function (c) { var s = document.createElement("span"); s.className = "ch"; s.textContent = c; box.appendChild(s); });
      el.appendChild(box);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return $$(".ch", el);
  }
  function splitWords(el, masked) {
    var words = el.textContent.trim().split(/\s+/); el.setAttribute("aria-label", el.textContent.trim()); el.textContent = "";
    var out = [];
    words.forEach(function (w, i) {
      var inner = document.createElement("span"); inner.textContent = w; inner.setAttribute("aria-hidden", "true");
      if (masked) { var m = document.createElement("span"); m.className = "w-mask"; m.setAttribute("aria-hidden", "true"); m.appendChild(inner); el.appendChild(m); }
      else { inner.className = "w"; el.appendChild(inner); }
      out.push(inner);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return out;
  }

  /* ---------- yumuşak kaydırma ---------- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var t = $(a.getAttribute("href")); if (!t) return;
        e.preventDefault(); lenis.scrollTo(t, { offset: 0, duration: 1.4 });
      });
    });
  }

  /* ---------- açılış ---------- */
  var heroChars = $$(".hero .chars").map(splitChars);
  var layers = $$(".stack .layer");
  gsap.set(".stack-in", { rotationX: 10, rotationY: -20, rotationZ: 3 });
  gsap.set(heroChars, { yPercent: 115 });
  gsap.set(".hero-copy > *", { y: 30, opacity: 0 });
  gsap.set(".nav", { yPercent: -100 });
  var counter = { v: 0 }, countEl = $(".loader-count");
  if (lenis) lenis.stop();
  window.scrollTo(0, 0);

  var intro = gsap.timeline({ onComplete: function () { if (lenis) lenis.start(); ScrollTrigger.refresh(); } });
  intro
    .to(counter, { v: 100, duration: 1.5, ease: "power2.inOut", onUpdate: function () { countEl.textContent = Math.round(counter.v); } })
    .to(".loader-count, .loader-name", { yPercent: -40, opacity: 0, duration: 0.45, ease: "power2.in" })
    .to(".loader", { yPercent: -100, duration: 0.9, ease: "expo.inOut" }, "-=0.15")
    .set(".loader", { display: "none" })
    .to(heroChars[0], { yPercent: 0, duration: 1.1, ease: EASE, stagger: 0.022 }, "-=0.55")
    .to(heroChars[1], { yPercent: 0, duration: 1.1, ease: EASE, stagger: 0.022 }, "-=1.0")
    .from(layers, { z: "-=900", y: 260, opacity: 0, rotationX: -25, duration: 1.6, ease: EASE, stagger: 0.14 }, "-=1.1")
    .to(".hero-copy > *", { y: 0, opacity: 1, duration: 0.9, ease: EASE, stagger: 0.1 }, "-=1.2")
    .to(".nav", { yPercent: 0, duration: 0.8, ease: EASE }, "-=1.0")
    .to(".glow", { opacity: 1, duration: 1 }, "-=0.8");

  /* ---------- ilerleme çubuğu ---------- */
  gsap.to(".progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

  /* ---------- imleç ışığı, eğim, mıknatıs (yalnız fare) ---------- */
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine) {
    var gx = gsap.quickTo(".glow", "x", { duration: 0.6, ease: "power3" });
    var gy = gsap.quickTo(".glow", "y", { duration: 0.6, ease: "power3" });
    var rx = gsap.quickTo(".stack-in", "rotationX", { duration: 0.9, ease: "power3" });
    var ry = gsap.quickTo(".stack-in", "rotationY", { duration: 0.9, ease: "power3" });
    window.addEventListener("pointermove", function (e) {
      gx(e.clientX); gy(e.clientY);
      var nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
      rx(10 - ny * 14); ry(-20 + nx * 18);
    }, { passive: true });

    $$(".magnetic").forEach(function (el) {
      var mx = gsap.quickTo(el, "x", { duration: 0.5, ease: "elastic.out(1,0.5)" });
      var my = gsap.quickTo(el, "y", { duration: 0.5, ease: "elastic.out(1,0.5)" });
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.28); my((e.clientY - r.top - r.height / 2) * 0.28);
      });
      el.addEventListener("pointerleave", function () { mx(0); my(0); });
    });
  }

  /* ---------- kahraman: kaydırınca yığın uzaklaşır ---------- */
  gsap.to(".stack", { yPercent: 18, scale: 0.94, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero h1", { yPercent: -14, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  /* ---------- kayan şerit: hız kaydırmaya tepki verir ---------- */
  var track = $(".marquee-track");
  track.innerHTML += track.innerHTML;
  var mq = gsap.to(track, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
  ScrollTrigger.create({
    onUpdate: function (self) {
      var v = Math.min(Math.abs(self.getVelocity()) / 350, 7);
      gsap.to(mq, { timeScale: (self.direction < 0 ? -1 : 1) * (1 + v), duration: 0.3, overwrite: true });
    }
  });

  /* ---------- kelime kelime aydınlanan başlıklar ---------- */
  $$(".scrub-words").forEach(function (el) {
    var words = splitWords(el, false);
    gsap.fromTo(words, { opacity: 0.16 }, { opacity: 1, ease: "none", stagger: 0.4, scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 48%", scrub: true } });
  });
  $$(".reveal-words").forEach(function (el) {
    var words = splitWords(el, true);
    gsap.from(words, { yPercent: 115, duration: 1.1, ease: EASE, stagger: 0.07, scrollTrigger: { trigger: el, start: "top 88%" } });
  });

  /* ---------- bölüme göre zemin tonu ---------- */
  var BASE = "#08090a", activeTint = BASE;
  function tintTo(c) { activeTint = c; gsap.to(document.body, { backgroundColor: c, duration: 0.8, ease: "power2.out", overwrite: "auto" }); }
  $$("[data-tint]").forEach(function (sec) {
    var c = sec.getAttribute("data-tint");
    ScrollTrigger.create({
      trigger: sec, start: "top 55%", end: "bottom 55%",
      onToggle: function (self) { if (self.isActive) tintTo(c); else if (activeTint === c) tintTo(BASE); }
    });
  });

  /* ---------- ürün metinleri ---------- */
  $$(".product").forEach(function (sec) {
    gsap.from($$(".p-tag, .p-facts li, .p-copy .btn", sec), { y: 34, opacity: 0, duration: 0.9, ease: EASE, stagger: 0.08, scrollTrigger: { trigger: $(".p-copy", sec), start: "top 78%" } });
  });

  var mm = gsap.matchMedia();

  /* Geniş ekran: sabitlenen sahneler */
  mm.add("(min-width: 901px)", function () {
    // Hintvo: pencere 3B yatıktan düzleşir, kart ve telefon sonra gelir
    var h = gsap.timeline({ scrollTrigger: { trigger: ".p-hintvo .p-pin", start: "top top", end: "+=140%", pin: true, scrub: 1, anticipatePin: 1 } });
    h.from(".p-hintvo .b-main", { rotationX: 58, scale: 0.68, yPercent: 34, opacity: 0.25, ease: "power2.out", duration: 1 })
      .from(".p-hintvo .f-card", { xPercent: -45, yPercent: 30, rotation: -9, opacity: 0, ease: "power2.out", duration: 0.6 }, 0.55)
      .from(".p-hintvo .f-phone", { yPercent: 70, rotation: 12, opacity: 0, ease: "power2.out", duration: 0.6 }, 0.7)
      .to(".p-hintvo .p-stage", { scale: 0.97, duration: 0.3 }, 1.3);

    // Cliveo: dikey kaydırma yatay geçide dönüşür
    var wrap = $(".p-cliveo .h-wrap"), tr = $(".p-cliveo .h-track");
    var dist = function () { return Math.max(0, tr.scrollWidth - window.innerWidth); };
    gsap.to(tr, { x: function () { return -dist(); }, ease: "none", scrollTrigger: { trigger: wrap, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });

    // fiskalna: ekran küçükten tam genişliğe büyür
    gsap.from(".p-fisk .f-screen", { scale: 0.62, rotationX: 22, opacity: 0.4, transformPerspective: 1600, ease: "none", scrollTrigger: { trigger: ".p-fisk .f-screen", start: "top 95%", end: "top 12%", scrub: 1 } });
    $$(".p-fisk .par").forEach(function (el) {
      var y = parseFloat(el.getAttribute("data-y")) || 0;
      gsap.fromTo(el, { y: y }, { y: -y, ease: "none", scrollTrigger: { trigger: ".p-fisk .f-pair", start: "top bottom", end: "bottom top", scrub: true } });
    });
  });

  /* Dar ekran: sabitleme yok, sade girişler */
  mm.add("(max-width: 900px)", function () {
    $$(".p-stage > *, .f-screen, .f-pair > *").forEach(function (el) {
      gsap.from(el, { y: 60, opacity: 0, duration: 1, ease: EASE, scrollTrigger: { trigger: el, start: "top 88%" } });
    });
  });

  /* ---------- deneyim ---------- */
  gsap.from(".xp-row", { y: 40, opacity: 0, duration: 0.9, ease: EASE, stagger: 0.09, scrollTrigger: { trigger: ".xp-list", start: "top 82%" } });

  /* ---------- hakkında ---------- */
  gsap.fromTo(".portrait", { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.3, ease: "expo.inOut", scrollTrigger: { trigger: ".about", start: "top 75%" } });
  gsap.to(".portrait img", { scale: 1, ease: "none", scrollTrigger: { trigger: ".about", start: "top bottom", end: "bottom top", scrub: true } });
  $$(".stat b").forEach(function (b) {
    var end = parseFloat(b.getAttribute("data-count")), suf = b.getAttribute("data-suffix") || "", o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.6, ease: "power2.out", scrollTrigger: { trigger: b, start: "top 90%" }, onUpdate: function () { b.textContent = Math.round(o.v) + suf; } });
  });
  gsap.from(".award", { y: 36, opacity: 0, duration: 0.8, ease: EASE, stagger: 0.07, scrollTrigger: { trigger: ".awards", start: "top 86%" } });

  /* ---------- iletişim ---------- */
  gsap.from(".contact h2 .w-mask > span", { yPercent: 115, duration: 1.2, ease: EASE, stagger: 0.12, scrollTrigger: { trigger: ".contact h2", start: "top 85%" } });
  gsap.from(".contact .mail, .contact .foot", { y: 30, opacity: 0, duration: 0.9, ease: EASE, stagger: 0.1, scrollTrigger: { trigger: ".contact .mail", start: "top 95%" } });

  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
