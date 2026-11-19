/* Partage des résultats : Google Classroom (de préférence), courriel, copie.
   Le résultat devient un lien vers resultat.html, qui l'affiche proprement.
   Le « code de contrôle » détecte une modification simple du lien ; ce n'est pas une sécurité forte.
   Conception pédagogique : Nadia Aguilar Neri */
(function () {
  "use strict";
  var SRC = (document.currentScript && document.currentScript.src) || location.href;
  var EMAIL = "naguilarneri@gmail.com";

  function b64u(str) {
    var bytes = new TextEncoder().encode(str), bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function code(s) {
    var h = 0x811c9dc5; s = "i3u56|" + s;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ("00000000" + h.toString(16).toUpperCase()).slice(-8).slice(0, 6);
  }
  function lien(r) {
    var o = { a: r.activite, n: r.nom, p: r.points, m: r.total, l: r.parts.map(function (x) { return [x.t, x.p, x.n]; }), d: new Date().toISOString() };
    o.c = code(JSON.stringify(o));
    return new URL("resultat.html", SRC).href + "#" + b64u(JSON.stringify(o));
  }
  function texte(r, url) {
    var d = new Date();
    return r.activite + "\nNom : " + r.nom + "\nRésultat : " + r.points + " / " + r.total + " points (premier essai)\n" +
      r.parts.map(function (x) { return "· " + x.t + " : " + (x.p === null ? "—" : x.p) + " / " + x.n; }).join("\n") +
      "\nLe " + d.toLocaleDateString("fr-FR") + " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) +
      (url ? "\n\nRésultat détaillé : " + url : "");
  }

  /* render(conteneur, get) : get() renvoie { activite, nom, points, total, parts:[{t,p,n}] } ou { erreur: "…" } */
  function render(box, get) {
    box.classList.add("partage");
    box.innerHTML =
      '<div class="partage-btns">' +
      '<button type="button" class="pb pb-classroom">Remettre dans Classroom</button>' +
      '<button type="button" class="pb pb-mail">Envoyer par courriel</button>' +
      '<button type="button" class="pb pb-copie">Copier</button></div>' +
      '<p class="partage-fb" aria-live="polite"></p>' +
      '<p class="partage-aide">Dans Classroom : choisissez votre cours, puis le devoir indiqué par votre professeure, ajoutez le lien et touchez « Remettre ».</p>';
    var fb = box.querySelector(".partage-fb"), btns = box.querySelectorAll("button");
    function msg(ok, html) { fb.className = "partage-fb " + (ok ? "ok" : "ko"); fb.innerHTML = html; }
    function prendre() { var r = get(); if (!r || r.erreur) { msg(false, (r && r.erreur) || "Résultat incomplet."); return null; } return r; }
    btns[0].addEventListener("click", function () {
      var r = prendre(); if (!r) return; var u = lien(r);
      window.open("https://classroom.google.com/share?url=" + encodeURIComponent(u) + "&title=" + encodeURIComponent(r.activite + " · " + r.nom), "_blank", "noopener");
      msg(true, "Classroom s'ouvre dans un nouvel onglet. Choisissez votre cours, puis le devoir, et touchez « Remettre ».");
    });
    btns[1].addEventListener("click", function () {
      var r = prendre(); if (!r) return; var u = lien(r);
      location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(r.activite + " · " + r.nom) + "&body=" + encodeURIComponent(texte(r, u));
      msg(true, "Votre application de courriel s'ouvre. Si rien ne se passe, touchez « Copier » et envoyez le texte à " + EMAIL + ".");
    });
    btns[2].addEventListener("click", function () {
      var r = prendre(); if (!r) return; var t = texte(r, lien(r));
      var ok = function () { msg(true, "Copié ! Collez-le dans le devoir Classroom ou dans un courriel à " + EMAIL + "."); };
      var ko = function () { msg(false, "Copie impossible : faites une capture d'écran du tableau."); };
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(ok, ko); else ko();
    });
    return { setEnabled: function (on) { for (var i = 0; i < btns.length; i++) btns[i].disabled = !on; } };
  }

  window.Partage = { render: render, lien: lien, code: code };

  /* style commun, injecté une seule fois */
  var css = ".partage-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}" +
    ".pb{font:inherit;font-size:.95rem;font-weight:700;border-radius:10px;padding:10px 16px;min-height:44px;cursor:pointer;border:1.5px solid #2f4b8f;background:#fff;color:#2f4b8f}" +
    ".pb-classroom{background:#2f4b8f;color:#fff}" +
    ".pb:disabled{opacity:.45;cursor:default}" +
    ".partage-fb{font-size:.92rem;margin:8px 0 0}.partage-fb:empty{display:none}" +
    ".partage-fb.ok{color:#2f4b8f}.partage-fb.ko{color:#b3261e}" +
    ".partage-aide{font-size:.85rem;color:#5b6274;margin:6px 0 0}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
})();
