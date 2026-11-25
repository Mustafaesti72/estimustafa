/* Portfolyo hareketleri: GSAP + ScrollTrigger + Lenis. Kaydırma dinleyicisi yok; her şey ScrollTrigger üzerinden. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // Üsküp saati
  (function () {
    var clocks = $$(".clock"); if (!clocks.length) return;
    var fmt; try { fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Skopje" }); } catch (e) { return; }
    function tick() { var t = fmt.format(new Date()); clocks.forEach(function (c) { c.textContent = t; }); }
    tick(); setInterval(tick, 20000);
  })();

  // Videolar: yalnız görünürken oynar (demo kendi videosunu yönetir: data-manual)
  if (!reduce && "IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { var p = e.target.play(); if (p && p.catch) p.catch(function () {}); }
        else e.target.pause();
      });
    }, { threshold: 0.25 });
    $$("video:not([data-manual])").forEach(function (v) { vio.observe(v); });
  }

  /* ---------- zemin: imlece tepki veren eş yükselti çizgileri (WebGL2) ---------- */
  var field = { k: reduce ? 0.6 : 0 };
  (function () {
    var cv = $(".field"); if (!cv) return;
    var gl = cv.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) { cv.style.display = "none"; return; }
    var VS = "#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    var FS = "#version 300 es\nprecision highp float;uniform vec2 uR;uniform float uT;uniform vec2 uM;uniform float uK;out vec4 o;" +
      "vec3 pm(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}" +
      "float sn(vec2 v){const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);" +
      "vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);" +
      "vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.0);" +
      "vec3 q=pm(pm(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));" +
      "vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);m=m*m;m=m*m;" +
      "vec3 x=2.0*fract(q*C.www)-1.0;vec3 h=abs(x)-0.5;vec3 ox=floor(x+0.5);vec3 a0=x-ox;" +
      "m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);" +
      "vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.0*dot(m,g);}" +
      "void main(){vec2 p=(gl_FragCoord.xy-0.5*uR)/uR.y;vec2 m=(uM-0.5*uR)/uR.y;float d=length(p-m);" +
      "float n=sn(p*1.1+vec2(uT*0.030,-uT*0.020))*0.62+sn(p*2.3-vec2(uT*0.025,uT*0.010))*0.22;" +
      "n+=0.5*exp(-d*d*7.0);float v=n*9.0;float f=abs(fract(v)-0.5);float w=fwidth(v);" +
      "float line=1.0-smoothstep(w*0.5,w*1.6,f);float near=exp(-d*d*3.2);float hi=smoothstep(0.25,0.95,n);" +
      "float a=line*(0.085+0.6*near+0.12*hi);vec3 lime=vec3(0.784,0.961,0.259);" +
      "vec3 col=mix(vec3(0.72),lime,clamp(near*1.4+hi*0.7,0.0,1.0))*a+lime*near*0.03;o=vec4(col*uK,1.0);}";
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) { cv.style.display = "none"; return; }
    var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.style.display = "none"; return; }
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uR = gl.getUniformLocation(pr, "uR"), uT = gl.getUniformLocation(pr, "uT"), uM = gl.getUniformLocation(pr, "uM"), uK = gl.getUniformLocation(pr, "uK");
    var dpr = 1, W = 0, H = 0, mx = 0.72, my = 0.45, tx = mx, ty = my, hasPointer = false;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 900 ? 1.25 : 1.5);
      W = Math.round(window.innerWidth * dpr); H = Math.round(window.innerHeight * dpr);
      cv.width = W; cv.height = H; gl.viewport(0, 0, W, H);
    }
    function draw(t) {
      gl.uniform2f(uR, W, H); gl.uniform1f(uT, t); gl.uniform2f(uM, mx * W, (1 - my) * H); gl.uniform1f(uK, field.k * (window.innerWidth < 900 ? 0.55 : 1));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    size(); window.addEventListener("resize", function () { size(); if (reduce) draw(12); });
    if (reduce) { draw(12); return; }
    window.addEventListener("pointermove", function (e) { if (e.pointerType === "touch") return; hasPointer = true; tx = e.clientX / window.innerWidth; ty = e.clientY / window.innerHeight; }, { passive: true });
    var t0 = performance.now();
    (function loop(now) {
      requestAnimationFrame(loop);
      if (document.hidden || field.k < 0.01) return;
      var t = (now - t0) / 1000;
      // İmleç yokken (dokunmatik) odak kendi kendine gezinir
      if (!hasPointer) { tx = 0.6 + Math.cos(t * 0.23) * 0.3; ty = 0.72 + Math.sin(t * 0.31) * 0.16; }
      mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
      draw(t);
    })(t0);
  })();

  if (!window.gsap || !window.ScrollTrigger || reduce) { root.classList.remove("js"); return; }
  gsap.registerPlugin(ScrollTrigger);
  var EASE = "expo.out";

  /* ---------- metin bölme ---------- */
  function splitChars(el) {
    // Harfler kelime kutularında: dar ekranda satır kelime ortasından bölünmez
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
  // Teknik etiketler: karışık harflerden soldan sağa çözülür
  function scramble(el) {
    var final = el.textContent, glyphs = "ABCDEFGHJKLMNPRSTUVXYZ0123456789/<>_", o = { p: 0 };
    el.setAttribute("aria-label", final);
    gsap.to(o, { p: 1, duration: 0.9, ease: "power2.out", onUpdate: function () {
      var n = Math.floor(o.p * final.length), s = final.slice(0, n);
      for (var i = n; i < final.length; i++) s += final[i] === " " ? " " : glyphs[(Math.random() * glyphs.length) | 0];
      el.textContent = s;
    }, onComplete: function () { el.textContent = final; } });
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
  gsap.set(".hero .kicker, .hero-copy > *", { y: 30, opacity: 0 });
  gsap.set(".nav", { yPercent: -100 });
  var counter = { v: 0 }, countEl = $(".loader-count");
  if (lenis) lenis.stop();
  window.scrollTo(0, 0);

  var intro = gsap.timeline({ onComplete: function () { if (lenis) lenis.start(); ScrollTrigger.refresh(); } });
  intro
    .to(counter, { v: 100, duration: 1.4, ease: "power2.inOut", onUpdate: function () { countEl.textContent = Math.round(counter.v); } })
    .to(".loader-count, .loader-name", { yPercent: -40, opacity: 0, duration: 0.45, ease: "power2.in" })
    .to(".loader", { yPercent: -100, duration: 0.9, ease: "expo.inOut" }, "-=0.15")
    .set(".loader", { display: "none" })
    .to(field, { k: 1, duration: 2.2, ease: "power2.out" }, "-=0.7")
    .to(heroChars[0], { yPercent: 0, duration: 1.1, ease: EASE, stagger: 0.022 }, "<0.1")
    .to(heroChars[1], { yPercent: 0, duration: 1.1, ease: EASE, stagger: 0.022 }, "<0.12")
    .from(layers, { z: "-=900", y: 260, opacity: 0, rotationX: -25, duration: 1.6, ease: EASE, stagger: 0.14 }, "<0.05")
    .to(".hero .kicker, .hero-copy > *", { y: 0, opacity: 1, duration: 0.9, ease: EASE, stagger: 0.08 }, "<0.25")
    .to(".nav", { yPercent: 0, duration: 0.8, ease: EASE }, "<0.1");

  /* ---------- ilerleme çubuğu ---------- */
  gsap.to(".progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

  /* ---------- zemin çizgileri: kahramanda ve iletişimde tam, arada kısık ---------- */
  ScrollTrigger.create({ start: 0, end: "max", onUpdate: function (self) {
    if (intro.isActive()) return;
    var y = self.scroll(), vh = window.innerHeight, max = ScrollTrigger.maxScroll(window);
    var top = 1 - Math.min(1, y / vh), end = Math.max(0, 1 - (max - y) / (vh * 0.9));
    field.k = 0.2 + 0.8 * Math.max(top, end);
  } });

  /* ---------- imleç halkası, eğim, mıknatıs (yalnız fare) ---------- */
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine) {
    var cur = $(".cur"), curLabel = $(".cur span");
    var cx = gsap.quickTo(cur, "x", { duration: 0.35, ease: "power3" });
    var cy = gsap.quickTo(cur, "y", { duration: 0.35, ease: "power3" });
    var rx = gsap.quickTo(".stack-in", "rotationX", { duration: 0.9, ease: "power3" });
    var ry = gsap.quickTo(".stack-in", "rotationY", { duration: 0.9, ease: "power3" });
    var seen = false;
    window.addEventListener("pointermove", function (e) {
      if (!seen) { seen = true; gsap.set(cur, { x: e.clientX, y: e.clientY }); gsap.to(cur, { opacity: 1, duration: 0.4 }); }
      cx(e.clientX); cy(e.clientY);
      var nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
      rx(10 - ny * 14); ry(-20 + nx * 18);
    }, { passive: true });
    document.addEventListener("pointerover", function (e) {
      // Demo içindeki düğmelerde halka küçülür ki tıklanan yer görünsün
      var ctl = e.target.closest && e.target.closest("button");
      var t = !ctl && e.target.closest && e.target.closest("[data-cursor]");
      if (t) { curLabel.textContent = t.getAttribute("data-cursor"); cur.classList.add("on"); } else cur.classList.remove("on");
    });
    document.addEventListener("pointerleave", function () { gsap.to(cur, { opacity: 0, duration: 0.3 }); seen = false; });

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

  /* ---------- başlıklar ve etiketler ---------- */
  $$(".scrub-words").forEach(function (el) {
    var words = splitWords(el, false);
    gsap.fromTo(words, { opacity: 0.16 }, { opacity: 1, ease: "none", stagger: 0.4, scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 48%", scrub: true } });
  });
  $$(".reveal-words").forEach(function (el) {
    var words = splitWords(el, true);
    gsap.from(words, { yPercent: 115, duration: 1.1, ease: EASE, stagger: 0.07, scrollTrigger: { trigger: el, start: "top 88%" } });
  });
  $$(".scramble").forEach(function (el) {
    ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: function () { scramble(el); } });
  });
  // Dev dış hat yazı: bölüm boyunca yana kayar
  $$(".ghost span").forEach(function (el, i) {
    gsap.fromTo(el, { xPercent: i % 2 ? -30 : 4 }, { xPercent: i % 2 ? 4 : -30, ease: "none", scrollTrigger: { trigger: el.parentNode.parentNode, start: "top bottom", end: "bottom top", scrub: true } });
  });

  /* ---------- bölüme göre zemin tonu ve köşe göstergesi ---------- */
  var BASE = "#08090a", activeTint = BASE;
  function tintTo(c) { activeTint = c; gsap.to(document.body, { backgroundColor: c, duration: 0.8, ease: "power2.out", overwrite: "auto" }); }
  $$("[data-tint]").forEach(function (sec) {
    var c = sec.getAttribute("data-tint");
    ScrollTrigger.create({
      trigger: sec, start: "top 55%", end: "bottom 55%",
      onToggle: function (self) { if (self.isActive) tintTo(c); else if (activeTint === c) tintTo(BASE); }
    });
  });
  var hud = $(".hud"), hudN = $(".hud b"), hudT = $(".hud span"), hudOn = 0;
  $$(".product").forEach(function (sec) {
    ScrollTrigger.create({
      trigger: sec, start: "top 40%", end: "bottom 60%",
      onToggle: function (self) {
        hudOn += self.isActive ? 1 : -1;
        if (self.isActive) { hudN.textContent = sec.getAttribute("data-idx"); hudT.textContent = sec.getAttribute("data-name"); }
        gsap.to(hud, { opacity: hudOn > 0 ? 1 : 0, duration: 0.4, overwrite: true });
      }
    });
  });

  /* ---------- ürün metinleri ---------- */
  $$(".product").forEach(function (sec) {
    gsap.from($$(".p-tag, .p-facts li, .p-copy .btn", sec), { y: 34, opacity: 0, duration: 0.9, ease: EASE, stagger: 0.08, scrollTrigger: { trigger: $(".p-copy", sec), start: "top 78%" } });
  });

  var mm = gsap.matchMedia();

  /* Geniş ekran: sabitlenen sahneler */
  mm.add("(min-width: 901px)", function () {
    // Hintvo: canlı pencere 3B yatıktan düzleşir, telefon sonra gelir
    var h = gsap.timeline({ scrollTrigger: { trigger: ".p-hintvo .p-pin", start: "top top", end: "+=110%", pin: true, refreshPriority: 1, scrub: 1, anticipatePin: 1 } });
    h.from(".p-hintvo .demo-h", { rotationX: 56, scale: 0.7, yPercent: 30, opacity: 0.25, ease: "power2.out", duration: 1 })
      .from(".p-hintvo .f-phone", { yPercent: 70, rotation: 12, opacity: 0, ease: "power2.out", duration: 0.6 }, 0.6)
      .to(".p-hintvo .p-stage", { scale: 0.98, duration: 0.5 }, 1.2);

    // Cliveo: dikey kaydırma yatay geçide dönüşür
    var wrap = $(".p-cliveo .h-wrap"), tr = $(".p-cliveo .h-track");
    var dist = function () { return Math.max(0, tr.scrollWidth - window.innerWidth); };
    gsap.to(tr, { x: function () { return -dist(); }, ease: "none", scrollTrigger: { trigger: wrap, start: "top top", end: function () { return "+=" + dist(); }, pin: true, refreshPriority: 1, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });

    // fiskalna: kasa penceresi yandan gelir, ekran görüntüsü küçükten tam genişliğe büyür
    gsap.from(".p-fisk .demo-f", { xPercent: 22, rotationY: -24, opacity: 0, transformPerspective: 1600, ease: "none", scrollTrigger: { trigger: ".p-fisk .f-head", start: "top 85%", end: "top 20%", scrub: 1 } });
    gsap.from(".p-fisk .f-screen", { scale: 0.62, rotationX: 22, opacity: 0.4, transformPerspective: 1600, ease: "none", scrollTrigger: { trigger: ".p-fisk .f-screen", start: "top 95%", end: "top 12%", scrub: 1 } });
    $$(".par").forEach(function (el) {
      var y = parseFloat(el.getAttribute("data-y")) || 0;
      gsap.fromTo(el, { y: y }, { y: -y, ease: "none", scrollTrigger: { trigger: el.parentNode, start: "top bottom", end: "bottom top", scrub: true } });
    });
  });

  /* Dar ekran: sabitleme yok, sade girişler */
  mm.add("(max-width: 900px)", function () {
    $$(".p-stage > *, .demo-c, .demo-f, .shots > *, .f-screen, .f-pair > *").forEach(function (el) {
      gsap.from(el, { y: 60, opacity: 0, duration: 1, ease: EASE, scrollTrigger: { trigger: el, start: "top 88%" } });
    });
  });

  /* ---------- deneyim ---------- */
  $$(".xp-list").forEach(function (list) {
    gsap.from($$(".xp-row", list), { y: 40, opacity: 0, duration: 0.9, ease: EASE, stagger: 0.09, scrollTrigger: { trigger: list, start: "top 82%" } });
  });

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
  gsap.from(".contact .kicker, .contact .mail, .contact .foot", { y: 30, opacity: 0, duration: 0.9, ease: EASE, stagger: 0.1, scrollTrigger: { trigger: ".contact h2", start: "top 80%" } });

  // Tetikleyiciler sayfa sırasıyla yenilenmeli: sabitlenen sahnelerin eklediği boşluk sonrakilere yansır
  ScrollTrigger.sort(); ScrollTrigger.refresh();
  window.addEventListener("load", function () { ScrollTrigger.sort(); ScrollTrigger.refresh(); });
})();
