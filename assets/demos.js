/* Canlı ürün demoları. GSAP'a bağlı değil; yalnız görünürken çalışır, hareket azaltma açıksa son durumu gösterir. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var STOP = {};
  // Bekleme: jeton iptal edildiyse akış STOP ile kesilir
  function sleep(ms, tok) {
    return new Promise(function (res, rej) { setTimeout(function () { if (tok.dead) rej(STOP); else res(); }, ms); });
  }
  function guard(p) { p.catch(function (e) { if (e !== STOP) throw e; }); }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function watch(node, on, off, thr) {
    if (!("IntersectionObserver" in window)) { on(); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) on(); else off(); }); }, { threshold: thr || 0.3 }).observe(node);
  }

  /* ---------- Hintvo: uygulamanın örnek toplantısı (desktop/src/renderer/demo/meeting.json) ---------- */
  (function () {
    var H = $(".demo-h"); if (!H) return;
    var LINES = [
      { who: "Them", t: "Okay, main topic today is the failed payments ticket. Support says about two percent of charges fail on the first try." },
      { who: "Them", t: "We need to add retries when a payment fails. Where should that logic live?", q: 0 },
      { who: "You", t: "I think it belongs in the queue worker. Do we already have any retry setup there?" },
      { who: "Them", t: "Also, do we store the Stripe charge ID anywhere? We can't charge anyone twice.", q: 1 }
    ];
    var CARDS = [
      { q: "Where should the payment retry logic live?", heard: "Question heard at 00:08", ms: "3.4 s",
        files: ["src/queue/consumer.ts", "src/payments/charge.ts"],
        text: "We should put the retry in the payments queue worker, not inside the charge function. Right now a failed job just stays failed, and the charge function makes one attempt and records it as attempt 1. The worker is where we can safely try again.",
        src: ["src/queue/consumer.ts:8-15", "src/payments/charge.ts:9-15"] },
      { q: "Do we store the Stripe charge ID before a retry?", heard: "Question heard at 00:23", ms: "3.8 s",
        files: ["src/payments/charge.ts", "src/queue/consumer.ts", "prisma/schema.prisma"],
        text: "We don't save it before the retry, and that matters. The charge ID only gets written to the database after Stripe answers. If the worker crashes between those two steps, we lose the ID.",
        src: ["src/payments/charge.ts:9-15", "src/queue/consumer.ts:8", "prisma/schema.prisma:17"] }
    ];
    var lines = $(".dh-lines", H), qEl = $(".dh-q", H), heard = $(".dh-heard", H), ms = $(".dh-ms", H), scan = $(".dh-scan", H), text = $(".dh-text", H), src = $(".dh-src", H), wave = $(".dh-wave", H);
    for (var i = 0; i < 26; i++) { var b = el("i"); b.style.animationDelay = (-(i * 0.37) % 1).toFixed(2) + "s"; b.style.animationDuration = (0.7 + (i * 7 % 5) * 0.13).toFixed(2) + "s"; wave.appendChild(b); }

    function fillCard(c, full) {
      qEl.textContent = c.q; heard.textContent = c.heard; ms.textContent = c.ms; ms.classList.toggle("on", !!full);
      scan.textContent = ""; text.textContent = ""; src.textContent = "";
      c.text.split(" ").forEach(function (w) { var s = el("span", full ? "on" : "", w + " "); text.appendChild(s); });
      c.src.forEach(function (s) { src.appendChild(el("code", full ? "on" : "", s)); });
    }
    function addLine(l, full) {
      var d = el("div", "dh-line" + (l.who === "You" ? " you" : "")); d.appendChild(el("b", "", l.who));
      var s = el("span", "", full ? l.t : ""); d.appendChild(s); lines.appendChild(d);
      if (full && l.q != null) d.classList.add("q");
      return { row: d, span: s };
    }
    async function showCard(c, tok) {
      H.classList.remove("has"); await sleep(320, tok);
      fillCard(c, false); H.classList.add("has"); await sleep(450, tok);
      for (var i = 0; i < c.files.length; i++) { scan.textContent = "Reading " + c.files[i]; await sleep(430, tok); }
      scan.textContent = "Answering from your code";
      var words = $$("span", text);
      for (var j = 0; j < words.length; j++) { words[j].classList.add("on"); await sleep(42, tok); }
      scan.textContent = ""; ms.classList.add("on");
      var chips = $$("code", src);
      for (var k = 0; k < chips.length; k++) { chips[k].classList.add("on"); await sleep(130, tok); }
      await sleep(1900, tok);
    }
    async function run(tok) {
      for (;;) {
        lines.textContent = ""; H.classList.remove("has"); await sleep(600, tok);
        for (var i = 0; i < LINES.length; i++) {
          var l = LINES[i], n = addLine(l, false), words = l.t.split(" ");
          for (var w = 0; w < words.length; w++) { n.span.textContent += (w ? " " : "") + words[w]; await sleep(62, tok); }
          if (l.q != null) { n.row.classList.add("q"); await showCard(CARDS[l.q], tok); } else await sleep(650, tok);
        }
        await sleep(4200, tok);
      }
    }
    if (reduce) { LINES.slice(0, 2).forEach(function (l) { addLine(l, true); }); fillCard(CARDS[0], true); H.classList.add("has"); return; }
    var tok = null;
    function start() { if (tok && !tok.dead) return; tok = { dead: false }; H.classList.add("run"); guard(run(tok)); }
    function stop() { if (tok) tok.dead = true; H.classList.remove("run"); }
    watch(H, start, stop, 0.35);
    $(".dh-replay", H).addEventListener("click", function () { stop(); start(); });
  })();

  /* ---------- Cliveo: brif, sahne listesi, render, gerçek video ---------- */
  (function () {
    var C = $(".demo-c"); if (!C) return;
    var V = {
      offer: { brief: "A lunch offer for Bostan Kitchen. Stop the scroll in the first second.", len: "23 s", scenes: [["Hook", "kinetic text"], ["Dish close-up", "footage"], ["The offer", "price card"], ["Why now", "countdown"], ["Call to action", "end card"]] },
      trailer: { brief: "Introduce Bostan Kitchen to people who have never heard of it.", len: "37 s", scenes: [["Logo reveal", "brand"], ["Hook", "kinetic text"], ["Menu highlights", "footage"], ["The place", "footage"], ["Call to action", "end card"]] },
      review: { brief: "Turn Elif's five star review into a short video.", len: "21 s", scenes: [["Hook", "kinetic text"], ["Customer quote", "quote card"], ["Rating", "stars"], ["The trip", "footage"], ["Call to action", "end card"]] },
      kinetic: { brief: "A word by word teaser for Patika Outdoor's winter tents.", len: "24 s", scenes: [["Question", "kinetic text"], ["Word by word", "kinetic text"], ["Product", "footage"], ["Punchline", "kinetic text"], ["Call to action", "end card"]] }
    };
    var ORDER = ["offer", "trailer", "review", "kinetic"];
    var chips = $$(".dc-types .chip", C), brief = $(".dc-brief p", C), scenes = $(".dc-scenes", C), bar = $(".bar i", C), label = $(".dc-render .mono", C), video = $("video", C), pct = $(".dc-veil b", C), state = $(".dc-state", C);
    var tok = null, touched = false, current = "offer", visible = false;
    function setState(t) { state.lastChild.nodeValue = t; }
    function mark(type) { chips.forEach(function (c) { var on = c.getAttribute("data-v") === type; c.classList.toggle("on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); }); }
    function setVideo(type) { video.pause(); video.setAttribute("poster", "assets/img/cliveo-" + type + ".webp"); video.setAttribute("src", "assets/video/cliveo-" + type + ".mp4"); }
    function fillScenes(v, on) { scenes.textContent = ""; v.scenes.forEach(function (s, i) { var li = el("li", on ? "on" : ""); li.appendChild(el("b", "", "0" + (i + 1))); li.appendChild(el("span", "", s[0])); li.appendChild(el("em", "", s[1])); scenes.appendChild(li); }); }

    async function make(type, t) {
      var v = V[type]; current = type; mark(type);
      C.classList.remove("done"); pct.textContent = "0%"; bar.style.transform = "scaleX(0)"; label.textContent = ""; setVideo(type);
      setState("Writing"); brief.textContent = ""; fillScenes(v, false);
      for (var i = 0; i < v.brief.length; i++) { brief.textContent += v.brief[i]; await sleep(17, t); }
      await sleep(250, t);
      var rows = $$("li", scenes);
      for (var r = 0; r < rows.length; r++) { rows[r].classList.add("on"); await sleep(230, t); }
      setState("Rendering"); label.textContent = "1080 x 1920, " + v.len;
      for (var p = 0; p <= 100; p += 2) { pct.textContent = p + "%"; bar.style.transform = "scaleX(" + p / 100 + ")"; await sleep(34, t); }
      C.classList.add("done"); setState("Ready"); label.textContent = "Rendered. 1080 x 1920, " + v.len;
      try { video.currentTime = 0; } catch (e) {}
      var pl = video.play(); if (pl && pl.catch) pl.catch(function () {});
      if (!touched) { await sleep(9000, t); return make(ORDER[(ORDER.indexOf(type) + 1) % ORDER.length], t); }
    }
    function go(type) { if (tok) tok.dead = true; tok = { dead: false }; guard(make(type, tok)); }

    if (reduce) {
      var show = function (type) { var v = V[type]; current = type; mark(type); brief.textContent = v.brief; fillScenes(v, true); setVideo(type); label.textContent = "1080 x 1920, " + v.len; bar.style.transform = "scaleX(1)"; C.classList.add("done"); setState("Ready"); video.setAttribute("controls", ""); };
      show("offer"); chips.forEach(function (c) { c.addEventListener("click", function () { show(c.getAttribute("data-v")); }); });
      return;
    }
    chips.forEach(function (c) { c.addEventListener("click", function () { touched = true; go(c.getAttribute("data-v")); }); });
    watch(C, function () { if (visible) return; visible = true; go(current); }, function () { visible = false; if (tok) tok.dead = true; video.pause(); }, 0.3);
  })();

  /* ---------- fiskalna.mk: çalışan kasa (ürünler ve fiyatlar demo mağazadan) ---------- */
  (function () {
    var F = $(".demo-f"); if (!F) return;
    var ITEMS = [["ЈО", "Јогурт 1 л", 70, "#166534"], ["КС", "Кифла со сирење", 25, "#115e59"], ["ЃЕ", "Ѓеврек", 20, "#155e75"], ["ЈА", "Јајца 10 ком", 150, "#9d174d"],
      ["БИ", "Бисквити 200 г", 65, "#0f766e"], ["БА", "Банани", 95, "#15803d"], ["КА", "Капучино", 90, "#9a3412"], ["ЈБ", "Јаболка", 60, "#92400e"],
      ["ДО", "Домати", 80, "#166534"], ["КШ", "Кашкавал", 690, "#9a3412"], ["БС", "Бело сирење", 420, "#0f766e"], ["ВИ", "Виршли 400 г", 160, "#155e75"]];
    var grid = $(".df-grid", F), linesEl = $(".df-lines", F), countEl = $(".df-count", F), totalEl = $(".df-total b", F), vatEl = $(".df-vat", F), pay = $(".df-pay", F), receipt = $(".df-receipt", F), ghost = $(".df-ghost", F), body = $(".df-body", F);
    var cart = [], busy = false, shown = 0, raf = 0;
    function fmt(n) { return n.toFixed(2).replace(".", ",") + " ден"; }
    function total() { return cart.reduce(function (s, c) { return s + ITEMS[c.i][2] * c.n; }, 0); }
    function render(bumpIdx) {
      linesEl.textContent = "";
      cart.forEach(function (c) {
        var it = ITEMS[c.i], li = el("li", c.i === bumpIdx ? "bump" : ""), name = el("span", "", it[1]);
        name.appendChild(el("small", "", "x" + c.n)); li.appendChild(name); li.appendChild(el("b", "", fmt(it[2] * c.n))); linesEl.appendChild(li);
      });
      linesEl.scrollTop = linesEl.scrollHeight;
      var count = cart.reduce(function (s, c) { return s + c.n; }, 0), t = total();
      countEl.textContent = count; F.classList.toggle("has", count > 0); pay.disabled = !count || busy;
      pay.textContent = count ? "Плати " + fmt(t) : "Плати";
      vatEl.textContent = fmt(t * 5 / 105);
      // Toplam eski değerden yenisine sayar
      cancelAnimationFrame(raf);
      if (reduce) { shown = t; totalEl.textContent = fmt(t); return; }
      var from = shown, t0 = performance.now();
      (function step(now) { var k = Math.min(1, (now - t0) / 320); shown = from + (t - from) * k; totalEl.textContent = fmt(shown); if (k < 1) raf = requestAnimationFrame(step); })(t0);
    }
    function add(i) {
      if (busy) return;
      var row = cart.filter(function (c) { return c.i === i; })[0];
      if (row) row.n++; else cart.push({ i: i, n: 1 });
      render(i);
    }
    function doPay() {
      if (busy || !cart.length) return Promise.resolve();
      busy = true; pay.disabled = true;
      var t = total(), d = new Date(), two = function (n) { return (n < 10 ? "0" : "") + n; };
      receipt.textContent = "";
      receipt.appendChild(el("b", "", "МАРКЕТ ПРИМЕР ДООЕЛ")); receipt.appendChild(el("p", "", "Фискална сметка, демо")); receipt.appendChild(el("hr"));
      cart.forEach(function (c) { var r = el("div"); r.appendChild(el("span", "", ITEMS[c.i][1] + " x" + c.n)); r.appendChild(el("span", "", fmt(ITEMS[c.i][2] * c.n))); receipt.appendChild(r); });
      receipt.appendChild(el("hr"));
      var v = el("div"); v.appendChild(el("span", "", "ДДВ 5%")); v.appendChild(el("span", "", fmt(t * 5 / 105))); receipt.appendChild(v);
      var tt = el("div", "t"); tt.appendChild(el("span", "", "ВКУПНО")); tt.appendChild(el("span", "", fmt(t))); receipt.appendChild(tt);
      receipt.appendChild(el("hr")); receipt.appendChild(el("p", "", two(d.getDate()) + "." + two(d.getMonth() + 1) + "." + d.getFullYear() + " " + two(d.getHours()) + ":" + two(d.getMinutes())));
      receipt.appendChild(el("div", "bc"));
      F.classList.remove("tear"); void receipt.offsetWidth; F.classList.add("print");
      return new Promise(function (res) {
        setTimeout(function () {
          F.classList.add("tear");
          setTimeout(function () { cart = []; busy = false; F.classList.remove("print", "tear"); render(-1); res(); }, 650);
        }, reduce ? 3500 : 3900);
      });
    }
    ITEMS.forEach(function (it, i) {
      var b = el("button", "df-item"); b.type = "button";
      var badge = el("i", "", it[0]); badge.style.background = it[3]; b.appendChild(badge); b.appendChild(el("span", "", it[1])); b.appendChild(el("b", "", fmt(it[2])));
      b.addEventListener("click", function () { add(i); }); grid.appendChild(b);
    });
    pay.addEventListener("click", function () { doPay(); });
    render(-1);
    if (reduce) return;

    // Otomatik gösterim: ziyaretçi dokunana kadar hayalet imleç satış yapar
    var tok = null, touched = false, items = $$(".df-item", grid);
    function moveTo(node) { var a = node.getBoundingClientRect(), o = body.getBoundingClientRect(), s = o.width / body.offsetWidth || 1; ghost.style.transform = "translate(" + ((a.left + a.width / 2 - o.left) / s) + "px," + ((a.top + a.height / 2 - o.top) / s) + "px)"; }
    async function tap(node, t) { moveTo(node); await sleep(620, t); node.classList.add("hit"); await sleep(150, t); node.classList.remove("hit"); }
    async function auto(t) {
      var seq = [0, 1, 2, 2, 4, 6], round = 0;
      for (;;) {
        await sleep(900, t); ghost.classList.add("on");
        for (var i = 0; i < seq.length; i++) { var idx = (seq[i] + round) % ITEMS.length; await tap(items[idx], t); add(idx); await sleep(260, t); }
        await tap(pay, t); ghost.classList.remove("on"); await doPay(); if (t.dead) throw STOP;
        round += 3;
      }
    }
    function stop() { if (tok) tok.dead = true; ghost.classList.remove("on"); }
    F.addEventListener("pointerdown", function (e) { if (!e.isTrusted || touched) return; touched = true; stop(); }, true);
    watch(F, function () { if (touched || (tok && !tok.dead)) return; tok = { dead: false }; guard(auto(tok)); }, stop, 0.4);
  })();
})();
