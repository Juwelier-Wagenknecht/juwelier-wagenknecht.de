/* Juwelier Wagenknecht — „Der Takt"
   Bewegungsregel: nichts gleitet, alles springt. Jede Bewegung rastet in Stufen ein.
   Signatur: Uhren ◆ Schmuck — das Ankerrad tickt, der Brillant zündet Facette für Facette. */
(function () {
  "use strict";
  document.body.classList.add("js");

  /* ---------------- Kopf über der dunklen Bühne ------------------------------------------- */
  // Auf Seiten mit Hero schwebt der Kopf transparent darüber und wird erst beim Scrollen hell.
  var buehne = document.querySelector(".hero");
  if (buehne) {
    document.body.classList.add("hat-buehne");
    var kopfEl = document.querySelector(".kopf"), topbarEl = document.querySelector(".topbar");
    var messen = function () {
      var hoehe = (kopfEl ? kopfEl.offsetHeight : 0) + (topbarEl ? topbarEl.offsetHeight : 0);
      document.documentElement.style.setProperty("--kopfhoehe", hoehe + "px");
    };
    messen();
    window.addEventListener("resize", messen, { passive: true });
  }
  // Scroll-Kante statt Trennlinie (Apple, Noah 02.10.2026): Glas + weicher Schatten erst, wenn
  // Inhalt unter den Kopf läuft. Mit Bühne: ab 62 % des Heros, sonst ab dem ersten Pixel.
  function kopfSetzen() {
    var y = window.scrollY;
    document.body.classList.toggle("gescrollt", buehne ? y > buehne.offsetHeight * 0.62 : y > 2);
  }

  var ruhig = window.matchMedia("(prefers-reduced-motion: reduce)");
  function sanft() { return ruhig.matches; }
  function istMobil() { return window.matchMedia("(max-width: 900px)").matches; }
  function klemm(x, a, b) { return x < a ? a : (x > b ? b : x); }

  /* ---------------- Reveal: erst einhängen, wenn das Element in die Nähe kommt ------------- */
  var rvs = [].slice.call(document.querySelectorAll(".rv, .abschnitt > .wrap > *, .zeile, .karte, .hand, .fall, .epoche, .beleg, .duo-bild, .ep-bild, .takt"));
  rvs.forEach(function (el) { el.classList.add("rv"); });
  // EIN System: Geschwister rasten nacheinander ein (60 ms Abstand, höchstens vier Stufen),
  // damit eine lange Liste nie träge wirkt (Emil Kowalski: nur kleine Gruppen staffeln).
  rvs.forEach(function (el) {
    var p = el.parentNode, i = 0;
    if (!p) return;
    [].slice.call(p.children).some(function (k) { if (k === el) return true; if (k.classList.contains("rv")) i++; return false; });
    if (i) el.style.setProperty("--rv-i", String(Math.min(i, 4)));
  });
  if ("IntersectionObserver" in window && !sanft()) {
    var beo = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("da"); beo.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.02 });
    rvs.forEach(function (el) { beo.observe(el); });
    // Sicherheitsnetz: was nach 2,5 s noch verdeckt ist, wird sichtbar gemacht
    setTimeout(function () { rvs.forEach(function (el) { el.classList.add("da"); }); }, 2500);
  } else {
    rvs.forEach(function (el) { el.classList.add("da"); });
  }

  /* ---------------- Taktband: die Scroll-Anzeige springt in 40 Stufen ---------------------- */
  var band = document.querySelector(".taktband");
  function bandSetzen() {
    if (!band) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? window.scrollY / max : 0;
    band.style.width = (Math.round(p * 40) / 40 * 100).toFixed(2) + "%";
  }

  /* ---------------- Hemmung: Rad springt Zahn für Zahn, Brillant zündet ------------------- */
  // Noah, 03.10.2026: „gesyncht". Der Takt hängt an den SCHRITTEN, nicht an der Sektion: jeder
  // Schritt, der die Lesezeile (60 % der Fensterhöhe) kreuzt, dreht das Rad um 24/4 = 6 Zähne,
  // innerhalb des Schritts Zahn für Zahn. Die Zeichnung steht dabei sticky daneben (styles.css).
  var hemm = document.querySelector(".hemmung");
  var rad = hemm && hemm.querySelector(".rad");
  var anker = hemm && hemm.querySelector(".anker");
  var zaehler = hemm && hemm.querySelector("[data-zahn]");
  var facetten = hemm ? [].slice.call(hemm.querySelectorAll(".fz")) : [];
  var takteListe = hemm && hemm.querySelector(".takte");
  var takte = hemm ? [].slice.call(hemm.querySelectorAll(".takt")) : [];
  var zFacetten = hemm && hemm.querySelector("[data-facetten]");
  var ZAEHNE = 24, LESEZEILE = 0.6, letzterZahn = -1;

  // Lage der Schritte aus dem LAYOUT (offsetTop), nicht aus getBoundingClientRect: der Reveal
  // verschiebt sie kurz per transform — sonst stünde der Takt danach falsch, bis wieder gescrollt wird.
  var taktLagen = [];
  function dokOben(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
  function taktLagenMessen() {
    taktLagen = takte.map(function (t) { return { oben: dokOben(t), hoehe: t.offsetHeight || 1 }; });
    letzterZahn = -1;
  }
  var werkEl = hemm && hemm.querySelector(".hemmwerk");
  function hemmungSetzen() {
    if (!hemm || !takte.length) return;
    if (werkEl) {
      var oben = parseFloat(getComputedStyle(werkEl).top) || 0;
      werkEl.classList.toggle("klebt", werkEl.getBoundingClientRect().top <= oben + 1 && window.scrollY > 0);
    }
    if (!taktLagen.length) taktLagenMessen();
    var linie = window.scrollY + (window.innerHeight || 1) * LESEZEILE;
    // Position in Schritten: 0 = noch keiner erreicht, n = alle durch
    var pos = 0;
    for (var i = 0; i < taktLagen.length; i++) {
      var l = taktLagen[i];
      if (l.oben >= linie) break;
      pos = i + klemm((linie - l.oben) / l.hoehe, 0, 1);
    }
    var zahn = Math.round(pos / takte.length * ZAEHNE);
    if (zahn === letzterZahn) return;
    letzterZahn = zahn;
    var jetzt = pos > 0 ? Math.min(takte.length - 1, Math.floor(pos - 1e-6)) : -1;
    if (rad) rad.setAttribute("transform", "rotate(" + (zahn * (360 / ZAEHNE)) + ")");
    if (anker) anker.setAttribute("transform", "rotate(" + (zahn % 2 ? 7 : -7) + ")");
    if (zaehler) zaehler.textContent = zahn ? String(zahn) : "\u2013";
    var hell = Math.round(zahn / ZAEHNE * facetten.length);
    facetten.forEach(function (f, i) { f.setAttribute("opacity", i < hell ? "1" : "0.22"); });
    if (zFacetten) zFacetten.textContent = hell ? String(hell) : "\u2013";
    if (takteListe) takteListe.style.setProperty("--takt-p", (zahn / ZAEHNE).toFixed(4));
    takte.forEach(function (t, i) {
      t.classList.toggle("an", i <= jetzt);
      t.classList.toggle("jetzt", i === jetzt);
    });
  }

  /* ---------------- Zahlenband: zählt im Takt hoch, einmal, wenn es ins Bild kommt -------- */
  var zahlEls = [].slice.call(document.querySelectorAll(".zahl-gross"));
  function hochzaehlen(el) {
    var ziel = el.textContent, m = ziel.match(/^(\d+)(.*)$/);
    if (!m || sanft()) return;
    var wert = +m[1], rest = m[2], schritte = wert > 9 ? 16 : Math.max(wert, 1), n = 0;
    // Jahreszahlen zählen die letzten Jahrzehnte hoch, nicht von null — 1908 bleibt als Jahr lesbar.
    var start = wert >= 1000 ? wert - 80 : 0;
    el.textContent = start + rest;
    var t = setInterval(function () {
      n++;
      el.textContent = (n >= schritte ? wert : Math.round(start + (wert - start) * n / schritte)) + rest;
      if (n >= schritte) { clearInterval(t); el.textContent = ziel; }
    }, 55);
  }
  if (zahlEls.length && "IntersectionObserver" in window && !sanft()) {
    var zBeo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { zBeo.unobserve(e.target); hochzaehlen(e.target); } });
    }, { threshold: 0.6 });
    zahlEls.forEach(function (el) { zBeo.observe(el); });
  }

  /* ---------------- Bilder: leichter Parallax in 2-px-Stufen (nur im Bild, nur transform) -- */
  var pxBilder = sanft() ? [] : [].slice.call(document.querySelectorAll(".duo-bild img, .ep-bild img"));
  function parallaxSetzen() {
    if (!pxBilder.length) return;
    var fh = window.innerHeight || 1;
    pxBilder.forEach(function (img) {
      var r = img.closest(".duo-bild, .ep-bild").getBoundingClientRect();
      if (r.bottom < -40 || r.top > fh + 40) return;
      var mitte = (r.top + r.height / 2 - fh / 2) / fh;          // -1 … 1
      var max = r.height * 0.025;                                 // Reserve aus scale 1.06
      var v = Math.round(klemm(-mitte * max * 1.4, -max, max) / 2) * 2;
      img.style.translate = "0 " + v + "px";
    });
  }

  /* ---------------- Zeitstrahl: die Linie sitzt genau auf den Knoten ---------------------- */
  var strahl = document.querySelector(".strahl");
  function strahlSetzen() {
    if (!strahl) return;
    var p = strahl.querySelector(".st-punkt");
    if (!p) return;
    var y = p.getBoundingClientRect().top - strahl.getBoundingClientRect().top + p.offsetHeight / 2;
    strahl.style.setProperty("--linie-y", Math.round(y) + "px");
  }
  window.addEventListener("resize", strahlSetzen, { passive: true });
  window.addEventListener("load", strahlSetzen);

  /* ---------------- Taktleiste: lebende Uhr, offen oder geschlossen ----------------------- */
  var ZEITEN = { 0: [], 1: [[570, 750], [840, 1080]], 2: [[570, 750]], 3: [[570, 750], [840, 1080]],
                 4: [[570, 750], [840, 1080]], 5: [[570, 750]], 6: [] };
  var TAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  function zwei(n) { return (n < 10 ? "0" : "") + n; }
  function hhmm(m) { return Math.floor(m / 60) + ":" + zwei(m % 60); }  // 21.10.2026: „9:30“ wie in den Öffnungszeiten, nicht „09:30“

  function uhrSetzen() {
    var jetzt = new Date();
    var s = zwei(jetzt.getHours()) + zwei(jetzt.getMinutes());
    ["h1", "h2", "m1", "m2"].forEach(function (k, i) {
      var el = document.querySelector('[data-uhr="' + k + '"]');
      if (el && el.textContent !== s[i]) el.textContent = s[i];
    });
    var wt = (jetzt.getDay() + 6) % 7;                 // 0 = Montag
    var min = jetzt.getHours() * 60 + jetzt.getMinutes();
    var heute = ZEITEN[wt] || [];
    var offen = heute.some(function (f) { return min >= f[0] && min < f[1]; });
    var text, zusatz;
    if (offen) {
      var bis = heute.filter(function (f) { return min >= f[0] && min < f[1]; })[0][1];
      text = "Jetzt geöffnet";
      zusatz = "bis " + hhmm(bis) + " Uhr";
    } else {
      var spaeter = heute.filter(function (f) { return f[0] > min; })[0];
      if (spaeter) {
        text = "Gerade geschlossen";
        zusatz = "öffnet heute um " + hhmm(spaeter[0]) + " Uhr";
      } else {
        var d = 1, naechster = null;
        while (d <= 7) {
          var t = (wt + d) % 7;
          if ((ZEITEN[t] || []).length) { naechster = { tag: t, von: ZEITEN[t][0][0] }; break; }
          d++;
        }
        text = "Gerade geschlossen";
        zusatz = naechster
          ? "öffnet " + TAGE[(naechster.tag + 1) % 7] + " um " + hhmm(naechster.von) + " Uhr"
          : "Öffnungszeiten siehe Kontakt";
      }
    }
    [].slice.call(document.querySelectorAll("[data-lage]")).forEach(function (el) { el.textContent = text; });
    [].slice.call(document.querySelectorAll("[data-lage-zusatz]")).forEach(function (el) { el.textContent = zusatz; });
    [].slice.call(document.querySelectorAll("[data-lage-punkt]")).forEach(function (el) {
      el.classList.toggle("auf", offen); el.classList.toggle("zu", !offen);
    });
    // heutige Zeile in allen Öffnungszeiten-Tabellen markieren
    [].slice.call(document.querySelectorAll('.zeiten tr[data-tag]')).forEach(function (tr) {
      tr.classList.toggle("heute", +tr.getAttribute("data-tag") === wt);
    });
  }

  /* ---------------- Zeiger: tickt zur Maus, statt ihr zu folgen --------------------------- */
  var zeiger = document.querySelector(".zeiger");
  if (zeiger && window.matchMedia("(hover: hover) and (pointer: fine)").matches && !sanft()) {
    var zx = 0, zy = 0, an = false, winkel = 0;
    document.addEventListener("mousemove", function (e) {
      zx = e.clientX; zy = e.clientY;
      if (!an) { an = true; document.body.classList.add("zeigt"); }
    }, { passive: true });
    setInterval(function () {
      if (!an) return;
      winkel = (winkel + 30) % 360;
      zeiger.style.transform = "translate(-50%,-50%) rotate(" + winkel + "deg)";
      zeiger.style.left = zx + "px";
      zeiger.style.top = zy + "px";
    }, 250);
    document.addEventListener("mouseleave", function () { document.body.classList.remove("zeigt"); an = false; });
  }

  /* ---------------- Mobilmenü ------------------------------------------------------------- */
  var brenner = document.querySelector(".brenner");
  var mobil = document.getElementById("mobilmenu");
  if (brenner && mobil) {
    // Das Menü wächst aus dem Knopf (CSS @starting-style) und geht denselben Weg zurück.
    var zuTimer = 0;
    brenner.addEventListener("click", function () {
      var offen = !mobil.hidden && !mobil.classList.contains("schliesst");
      clearTimeout(zuTimer);
      if (offen) {
        mobil.classList.add("schliesst");
        zuTimer = setTimeout(function () { mobil.hidden = true; mobil.classList.remove("schliesst"); }, sanft() ? 0 : 320);
      } else {
        mobil.classList.remove("schliesst");
        mobil.hidden = false;
      }
      document.body.classList.toggle("menu-offen", !offen);
      brenner.setAttribute("aria-expanded", String(!offen));
      brenner.setAttribute("aria-label", offen ? "Menü öffnen" : "Menü schließen");
    });
  }

  /* ---------------- Kontaktformular: normaler POST an den Formular-Dienst ------------------ */
  // Das Formular geht per POST an den Formular-Dienst der HandwerksManufaktur (Cloudflare Worker),
  // der die Nachricht als Mail an das Postfach des Ladens schickt und danach auf diese Seite
  // zurückleitet: ?gesendet=1 (Danke) oder ?fehler=1 (Telefon + WhatsApp statt stillem Verlieren).
  var form = document.getElementById("schreiben");
  if (form && form.tagName === "FORM") {
    var senden = document.getElementById("f-senden");
    var hinweis = document.getElementById("f-hinweis");
    var danke = document.getElementById("f-danke");
    var felder = form.querySelector(".f-felder");
    var sage = function (text, art) {
      if (!hinweis) return;
      hinweis.textContent = text;
      hinweis.className = "f-hinweis" + (art ? " " + art : "");
      hinweis.hidden = !text;
    };
    // Zeitstempel gegen Bots ohne JavaScript; der Dienst verwirft Absendungen unter 3 Sekunden.
    var ts = form.querySelector('[name="ts"]');
    if (ts) ts.value = String(Date.now());
    var wert = function (n) {
      var el = form.querySelector('[name="' + n + '"]');
      return el ? (el.value || "").trim() : "";
    };
    form.addEventListener("submit", function (e) {
      var fehlt = [];
      if (!wert("name")) fehlt.push("Name");
      if (!wert("kontakt")) fehlt.push("Telefon oder E-Mail");
      if (!wert("nachricht")) fehlt.push("Nachricht");
      if (fehlt.length) {
        e.preventDefault();
        sage("Bitte noch ausfüllen: " + fehlt.join(", ") + ".", "fehler");
        return;
      }
      sage("");
      if (senden) { senden.disabled = true; senden.setAttribute("aria-busy", "true"); }
    });
    var anfrage = new URLSearchParams(location.search);
    if (anfrage.has("gesendet") || anfrage.has("fehler")) {
      if (anfrage.has("gesendet")) {
        if (felder) felder.hidden = true;
        if (danke) danke.hidden = false;
      } else {
        sage("Das Absenden hat gerade nicht geklappt. Bitte rufen Sie uns an (" +
             "0906 5388" + ") oder schreiben Sie uns per WhatsApp.", "fehler");
      }
      form.scrollIntoView({ block: "center" });
      history.replaceState(null, "", location.pathname + "#schreiben");
    }
  }

  /* ---------------- Karte erst auf Klick --------------------------------------------------- */
  // Vorher geht keine Anfrage an OpenStreetMap — deshalb braucht die Seite kein Banner.
  var karte = document.getElementById("karte");
  if (karte) {
    var start = karte.querySelector(".karte-start");
    if (start) {
      start.addEventListener("click", function () {
        var rahmen = document.createElement("iframe");
        rahmen.title = "Karte: Juwelier Wagenknecht, Hindenburgstraße 9, Donauwörth";
        rahmen.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
        rahmen.setAttribute("loading", "eager");
        rahmen.src = karte.getAttribute("data-karte");
        karte.innerHTML = "";
        karte.appendChild(rahmen);
        karte.classList.add("geladen");
      });
    }
  }

  /* ---------------- Scroll-Schleife mit setTimeout-Rückfall ------------------------------- */
  var offen = false;
  function lauf() {
    offen = false;
    bandSetzen(); hemmungSetzen(); kopfSetzen(); strahlSetzen(); parallaxSetzen();
  }
  function anstossen() {
    if (offen) return;
    offen = true;
    if (window.requestAnimationFrame) {
      var id = window.requestAnimationFrame(lauf);
      setTimeout(function () { if (offen) { window.cancelAnimationFrame(id); lauf(); } }, 120);
    } else {
      setTimeout(lauf, 16);
    }
  }
  window.addEventListener("scroll", anstossen, { passive: true });
  window.addEventListener("resize", function () { taktLagen = []; anstossen(); }, { passive: true });
  window.addEventListener("load", function () { taktLagen = []; anstossen(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { taktLagen = []; anstossen(); });
  lauf();
  uhrSetzen();
  setInterval(uhrSetzen, 20000);
})();
