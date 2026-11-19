/* Moteur d'exercices autocorrigés — Écouter · Niveau B1
   Types : qcm (choix), conj (conjugaison avec diagnostic d'erreur), ordre (chronologie).
   On répond à tout l'exercice, puis « Vérifier » corrige et donne les points.
   Exos.bilan affiche le tableau récapitulatif. Aucune donnée n'est enregistrée. */
(function () {
  "use strict";

  var IMP = {
    avoir: ["avais", "avais", "avait", "avions", "aviez", "avaient"],
    etre: ["étais", "étais", "était", "étions", "étiez", "étaient"]
  };
  var PRES = {
    avoir: ["ai", "as", "a", "avons", "avez", "ont"],
    etre: ["suis", "es", "est", "sommes", "êtes", "sont"]
  };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function norm(s) {
    return String(s).toLowerCase()
      .replace(/[’`´ʼ]/g, "'")
      .replace(/\s+/g, " ")
      .replace(/\s*'\s*/g, "'")
      .trim()
      .replace(/[.!?;,]+$/, "");
  }
  function noAcc(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  var REG = [];

  /* ---------- Bloc d'exercice : on répond à tout, puis « Vérifier » ----------
     Chaque item fournit { answered(), check() } ; check() corrige et renvoie true/false. */
  function vshell(root, cfg, buildItems) {
    root.classList.add("ex");
    root.innerHTML = "";
    var head = el("div", "ex-head");
    head.appendChild(el("h3", null, (cfg.num ? '<span class="num ' + (cfg.color || "c-bleu") + '">' + esc(cfg.num) + "</span>" : "") + esc(cfg.titre)));
    var sc = el("div", "score"); sc.setAttribute("aria-live", "polite"); head.appendChild(sc);
    root.appendChild(head);
    if (cfg.consigne) root.appendChild(el("p", "consigne", cfg.consigne));
    var list = el("div", "items"); root.appendChild(list);
    var row = el("div", "btn-row");
    var verif = el("button", "btn primary", "Vérifier"); verif.type = "button";
    var reset = el("button", "btn small", "Recommencer"); reset.type = "button";
    row.appendChild(verif); row.appendChild(reset); root.appendChild(row);
    var msg = el("p", "ex-msg"); msg.setAttribute("aria-live", "polite"); root.appendChild(msg);
    var reg = { root: root, cfg: cfg, score: null, total: 0 }; REG.push(reg);
    var items = [], warned = false;
    function build() {
      list.innerHTML = ""; items = buildItems(list); reg.total = items.length; reg.score = null;
      verif.disabled = false; warned = false; msg.textContent = ""; sc.textContent = "— / " + reg.total;
      document.dispatchEvent(new CustomEvent("exos:update"));
    }
    verif.addEventListener("click", function () {
      var vides = items.filter(function (it) { return !it.answered(); }).length;
      if (vides && !warned) { msg.textContent = "Il reste " + vides + " question(s) sans réponse. Touchez encore « Vérifier » pour corriger quand même."; warned = true; return; }
      msg.textContent = "";
      var p = 0; items.forEach(function (it) { if (it.check()) p++; });
      reg.score = p; verif.disabled = true;
      sc.textContent = "Score : " + p + " / " + reg.total;
      document.dispatchEvent(new CustomEvent("exos:update"));
    });
    reset.addEventListener("click", build);
    build();
  }
  function fbOk(it) { return '<b class="t">Correct !</b> ' + (it.ok || ""); }

  /* Ancien bloc (correction immédiate), conservé pour Exos.conj */
  function shell(root, cfg) {
    root.classList.add("ex");
    root.innerHTML = "";
    var head = el("div", "ex-head");
    var h = el("h3", null, (cfg.num ? '<span class="num ' + (cfg.color || "c-bleu") + '">' + esc(cfg.num) + "</span>" : "") + esc(cfg.titre));
    var sc = el("div", "score");
    sc.setAttribute("aria-live", "polite");
    head.appendChild(h); head.appendChild(sc);
    root.appendChild(head);
    if (cfg.consigne) root.appendChild(el("p", "consigne", cfg.consigne));
    var list = el("div", "items");
    root.appendChild(list);
    var state = { total: 0, done: 0, firstOk: 0 };
    function update() {
      sc.textContent = "Score : " + state.firstOk + " / " + state.total + (state.done === state.total && state.total ? " ✓ terminé" : "");
    }
    var row = el("div", "btn-row");
    var reset = el("button", "btn small", "Recommencer");
    reset.type = "button";
    row.appendChild(reset);
    root.appendChild(row);
    return { list: list, state: state, update: update, reset: reset };
  }

  /* ---------- QCM ---------- */
  function qcm(root, cfg) {
    vshell(root, cfg, function (list) {
      return cfg.items.map(function (it, idx) {
        var box = el("div", "item");
        box.appendChild(el("p", "q", '<span class="n">' + (idx + 1) + ".</span> " + it.q));
        var opts = el("div", "opts"), fb = el("p", "fb"); fb.setAttribute("aria-live", "polite");
        var sel = null, btns = [];
        var order = it.options.map(function (_, i) { return i; });
        if (cfg.melanger && !it.fixe) order = shuffle(order);
        order.forEach(function (oi, pos) {
          var b = el("button", "opt", '<span class="lettre" aria-hidden="true">' + "abcdefgh".charAt(pos) + ')</span> ' + it.options[oi]);
          b.setAttribute("aria-label", "abcdefgh".charAt(pos) + ") " + it.options[oi].replace(/<[^>]+>/g, ""));
          b.type = "button"; b._oi = oi; btns.push(b);
          b.addEventListener("click", function () {
            btns.forEach(function (x) { x.classList.remove("is-sel"); x.setAttribute("aria-pressed", "false"); });
            b.classList.add("is-sel"); b.setAttribute("aria-pressed", "true"); sel = oi;
          });
          opts.appendChild(b);
        });
        box.appendChild(opts); box.appendChild(fb); list.appendChild(box);
        return {
          answered: function () { return sel !== null; },
          check: function () {
            var ok = sel === it.answer;
            btns.forEach(function (x) { x.disabled = true; x.classList.remove("is-sel"); if (x._oi === it.answer) x.classList.add("is-ok"); else if (x._oi === sel) x.classList.add("is-ko"); });
            if (ok) { fb.className = "fb ok"; fb.innerHTML = fbOk(it); }
            else {
              fb.className = "fb ko";
              fb.innerHTML = '<b class="t">' + (sel === null ? "Pas de réponse." : "Pas tout à fait.") + "</b> " +
                ((sel !== null && it.fb && it.fb[sel]) ? it.fb[sel] + " " : "") +
                ((it.ok && it.ok.replace(/<[^>]+>/g, "").indexOf(it.options[it.answer].replace(/<[^>]+>/g, "")) === 0) ? it.ok
                  : "Réponse : <em>" + it.options[it.answer] + "</em>." + (it.ok ? " " + it.ok : ""));
            }
            return ok;
          }
        };
      });
    });
  }

  /* ---------- Conjugaison avec diagnostic ---------- */
  function expected(it) {
    var aux = (it.tense === "pc" ? PRES : IMP)[it.aux][it.p];
    return (it.pron || "") + aux + " " + it.pp + (it.acc || "");
  }

  function diagnose(raw, it) {
    var ans = norm(it.answer || expected(it));
    var v = norm(raw);
    var tenseName = it.tense === "pc" ? "passé composé" : "plus-que-parfait";
    var auxName = it.aux === "etre" ? "être" : "avoir";
    var want = (it.tense === "pc" ? PRES : IMP)[it.aux][it.p];
    if (!v) return { ok: false, msg: "Écrivez votre réponse dans la case." };
    if (/^j'/.test(v) && !/^j'/.test(ans)) v = v.slice(2).trim(); // « j' » déjà écrit dans la phrase
    var accepted = [ans].concat((it.alts || []).map(norm));
    if (accepted.indexOf(v) > -1) return { ok: true };
    if (accepted.map(noAcc).indexOf(noAcc(v)) > -1) return { ok: false, msg: "Presque ! La forme est juste, mais vérifiez les <b>accents</b>." };

    var rest = v;
    if (it.pron) {
      var pr = norm(it.pron).replace(/\s+$/, "");
      if (rest.indexOf(pr) === 0) {
        rest = rest.slice(pr.length).trim();
      } else if (/^(se |me |te |s'|m'|t'|nous |vous )/.test(rest)) {
        return { ok: false, msg: "Vérifiez le pronom : devant une voyelle, on écrit « " + esc(it.pron.trim()) + " » (élision)." };
      } else {
        return { ok: false, msg: "« " + esc(it.verb) + " » est un verbe pronominal : n'oubliez pas le pronom « " + esc(it.pron.trim()) + " »." };
      }
    }
    var parts = rest.split(" ");
    if (parts.length < 2) {
      return { ok: false, msg: "Au " + tenseName + ", il faut <b>deux mots</b> : l'auxiliaire (avoir ou être) " + (it.tense === "pc" ? "au présent" : "à l'imparfait") + " + le participe passé." };
    }
    var a = noAcc(parts[0]);
    var part = noAcc(parts.slice(1).join(" "));
    function idx(list) { return list.map(noAcc).indexOf(a); }
    var why = it.why ? " (" + it.why + ")" : "";
    var auxMsg = it.aux === "etre"
      ? "« " + esc(it.verb) + " » se conjugue avec <b>être</b>" + why + "."
      : "« " + esc(it.verb) + " » se conjugue avec <b>avoir</b>" + why + ".";
    var other = it.aux === "avoir" ? "etre" : "avoir";

    if (it.tense !== "pc" && (idx(PRES.avoir) > -1 || idx(PRES.etre) > -1)) {
      var m = "« " + esc(parts[0]) + " » est au <b>présent</b> : c'est la forme du passé composé. Au plus-que-parfait, l'auxiliaire est à l'<b>imparfait</b>.";
      if (idx(PRES[other]) > -1) m += " Et attention : " + auxMsg;
      if (it.ctx) m += " " + it.ctx;
      return { ok: false, msg: m };
    }
    if (it.tense === "pc" && (idx(IMP.avoir) > -1 || idx(IMP.etre) > -1)) {
      var m2 = "Vous avez mis l'auxiliaire à l'imparfait : c'est un plus-que-parfait. Ici, cette action est le <b>repère</b> → <b>passé composé</b> (auxiliaire au présent).";
      if (idx(IMP[other]) > -1) m2 += " Et attention : " + auxMsg;
      if (it.ctx) m2 += " " + it.ctx;
      return { ok: false, msg: m2 };
    }
    var famOther = (it.tense === "pc" ? PRES : IMP)[other];
    if (famOther.map(noAcc).indexOf(a) > -1) return { ok: false, msg: auxMsg };
    var fam = (it.tense === "pc" ? PRES : IMP)[it.aux];
    if (fam.map(noAcc).indexOf(a) > -1 && a !== noAcc(want)) {
      return { ok: false, msg: "Vérifiez la <b>personne</b> : avec « " + esc(it.subj) + " », l'auxiliaire est « " + esc(want) + " »." };
    }
    if (a !== noAcc(want)) {
      return { ok: false, msg: "Le premier mot doit être l'auxiliaire " + auxName + " " + (it.tense === "pc" ? "au présent" : "à l'imparfait") + "." };
    }
    // L'auxiliaire est correct : on regarde le participe.
    var pp = noAcc(it.pp), acc = it.acc || "";
    if (it.aux === "etre") {
      if (part === pp && acc) return { ok: false, msg: "Avec <b>être</b>, le participe s'accorde avec le sujet (« " + esc(it.subj) + " ») : ajoutez <b>-" + esc(acc) + "</b>." };
      if (part.indexOf(pp) === 0) {
        return { ok: false, msg: acc ? "Vérifiez l'<b>accord</b> : avec le sujet « " + esc(it.subj) + " », le participe se termine par <b>-" + esc(acc) + "</b>." : "Le sujet « " + esc(it.subj) + " » est masculin singulier : pas de -e ni de -s." };
      }
    } else if (part.indexOf(pp) === 0 && part.length > pp.length) {
      return { ok: false, msg: "Avec <b>avoir</b>, le participe passé ne s'accorde pas avec le sujet." };
    }
    return { ok: false, msg: "Vérifiez le <b>participe passé</b> de « " + esc(it.verb) + " »" + (it.hint ? " : " + it.hint : ".") };
  }

  function addAccents(container, input) {
    var bar = el("div", "accents");
    ["é", "è", "ê", "à", "ç", "î", "û", "'"].forEach(function (ch) {
      var b = el("button", null, ch);
      b.type = "button";
      b.setAttribute("aria-label", "Insérer " + ch);
      b.addEventListener("mousedown", function (e) { e.preventDefault(); });
      b.addEventListener("click", function () {
        var st = input.selectionStart != null ? input.selectionStart : input.value.length;
        var en = input.selectionEnd != null ? input.selectionEnd : input.value.length;
        input.value = input.value.slice(0, st) + ch + input.value.slice(en);
        input.focus();
        try { input.setSelectionRange(st + 1, st + 1); } catch (e) {}
      });
      bar.appendChild(b);
    });
    container.appendChild(bar);
  }

  function conj(root, cfg) {
    var s = shell(root, cfg);
    function build() {
      s.list.innerHTML = "";
      s.state.total = cfg.items.length; s.state.done = 0; s.state.firstOk = 0;
      cfg.items.forEach(function (it, idx) {
        var box = el("div", "item");
        var parts = it.text.split("___");
        var line = el("div", "conj-line");
        line.appendChild(el("span", "n", (idx + 1) + "."));
        if (parts[0]) line.appendChild(el("span", null, parts[0]));
        var input = el("input");
        input.type = "text"; input.lang = "fr";
        input.setAttribute("autocomplete", "off"); input.setAttribute("autocapitalize", "none");
        input.setAttribute("autocorrect", "off"); input.setAttribute("spellcheck", "false");
        input.setAttribute("aria-label", "Réponse " + (idx + 1));
        line.appendChild(input);
        if (parts[1]) line.appendChild(el("span", null, parts[1]));
        box.appendChild(line);
        addAccents(box, input);
        var row = el("div", "btn-row");
        var check = el("button", "btn primary small", "Vérifier"); check.type = "button";
        var show = el("button", "btn small", "Voir la réponse"); show.type = "button"; show.hidden = true;
        row.appendChild(check); row.appendChild(show);
        box.appendChild(row);
        var fb = el("p", "fb"); fb.setAttribute("aria-live", "polite");
        box.appendChild(fb);
        var tries = 0, solved = false;
        function finish(byUser) {
          solved = true; input.readOnly = true; check.disabled = true; show.hidden = true;
          s.state.done++;
          if (byUser && tries === 1) s.state.firstOk++;
          s.update();
        }
        function verify() {
          if (solved) return;
          var r = diagnose(input.value, it);
          if (!norm(input.value)) { fb.className = "fb ko"; fb.innerHTML = r.msg; return; }
          tries++;
          if (r.ok) {
            input.classList.remove("is-ko"); input.classList.add("is-ok");
            fb.className = "fb ok";
            fb.innerHTML = '<b class="t">' + (tries === 1 ? "Bravo !" : "Oui, c'est ça.") + "</b> " + (it.ok || "");
            finish(true);
          } else {
            input.classList.add("is-ko");
            fb.className = "fb ko";
            fb.innerHTML = r.msg;
            show.hidden = false;
          }
        }
        check.addEventListener("click", verify);
        input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); verify(); } });
        show.addEventListener("click", function () {
          input.value = it.answer || expected(it);
          input.classList.remove("is-ko");
          fb.className = "fb ok";
          fb.innerHTML = '<b class="t">Réponse :</b> ' + esc(it.answer || expected(it)) + ". " + (it.ok || "");
          finish(false);
        });
        s.list.appendChild(box);
      });
      s.update();
    }
    s.reset.addEventListener("click", build);
    build();
  }

  /* ---------- Ordre (chronologique ou logique) ---------- */
  function ordre(root, cfg) {
    vshell(root, cfg, function (list) {
      return cfg.items.map(function (it, idx) {
        var box = el("div", "item");
        box.appendChild(el("p", "q", '<span class="n">' + (idx + 1) + ".</span> " + it.texte));
        box.appendChild(el("p", "consigne", it.consigne || "Touchez les actions de la <b>plus ancienne</b> à la <b>plus récente</b>."));
        var picked = el("div", "order-picked"), pool = el("div", "order-pool");
        var fb = el("p", "fb"); fb.setAttribute("aria-live", "polite");
        var chosen = [], locked = false, good = null;
        var mix = shuffle(it.etapes.map(function (_, i) { return i; }));
        if (mix.every(function (v, i) { return v === i; })) mix.reverse();
        function render() {
          picked.innerHTML = ""; pool.innerHTML = "";
          chosen.forEach(function (ei, k) {
            var b = el("button", "opt", '<span class="rank">' + (k + 1) + "</span><span>" + it.etapes[ei] + "</span>");
            b.type = "button";
            if (locked) { b.disabled = true; b.classList.add(ei === k ? "is-ok" : "is-ko"); }
            b.addEventListener("click", function () { if (locked) return; chosen.splice(k, 1); render(); });
            picked.appendChild(b);
          });
          if (locked) return;
          mix.forEach(function (ei) {
            if (chosen.indexOf(ei) > -1) return;
            var b = el("button", "opt", it.etapes[ei]); b.type = "button";
            b.addEventListener("click", function () { chosen.push(ei); render(); });
            pool.appendChild(b);
          });
        }
        render();
        var row = el("div", "btn-row");
        var clear = el("button", "btn small", "Effacer"); clear.type = "button";
        clear.addEventListener("click", function () { if (!locked) { chosen = []; render(); } });
        row.appendChild(clear);
        box.appendChild(picked); box.appendChild(pool); box.appendChild(row); box.appendChild(fb);
        list.appendChild(box);
        return {
          answered: function () { return chosen.length === it.etapes.length; },
          check: function () {
            locked = true; clear.disabled = true;
            good = chosen.length === it.etapes.length && chosen.every(function (v, i) { return v === i; });
            render();
            if (good) { fb.className = "fb ok"; fb.innerHTML = fbOk(it); }
            else {
              var nb = chosen.filter(function (v, i) { return v === i; }).length;
              fb.className = "fb ko";
              fb.innerHTML = '<b class="t">' + nb + " / " + it.etapes.length + " à la bonne place.</b> L'ordre correct : " +
                it.etapes.map(function (e, i) { return (i + 1) + ". " + e; }).join(" · ") + (it.ok ? " " + it.ok : "");
            }
            return good;
          }
        };
      });
    });
  }

  /* ---------- Lecteur audio : fichier enregistré, sinon synthèse vocale ---------- */
  function audio(root, cfg) {
    root.innerHTML = "";
    var player = el("audio");
    player.controls = true; player.preload = "metadata"; player.style.width = "100%";
    var tts = el("div");
    tts.hidden = true;
    var note = el("p", "notice");
    root.appendChild(player); root.appendChild(tts); root.appendChild(note);
    function useTTS() {
      player.remove();
      tts.hidden = false;
      if (!("speechSynthesis" in window)) {
        note.innerHTML = "La lecture audio n'est pas disponible sur cet appareil. Demandez l'enregistrement à votre professeur.";
        return;
      }
      tts.innerHTML = '<div class="btn-row"><button type="button" class="btn primary" data-a="play">▶ Écouter</button>' +
        '<button type="button" class="btn" data-a="stop">■ Arrêter</button>' +
        '<label class="btn" style="display:inline-flex;align-items:center;gap:6px">Vitesse ' +
        '<select data-a="rate" style="font:inherit;border:none;background:transparent"><option value="0.82">lente</option><option value="0.95" selected>normale</option></select></label></div>';
      note.innerHTML = "Lecture par la voix de synthèse de votre appareil.";
      var voice = null;
      function pick() {
        var vs = speechSynthesis.getVoices();
        voice = vs.find(function (x) { return /^fr[-_]FR/i.test(x.lang); }) || vs.find(function (x) { return /^fr/i.test(x.lang); }) || null;
        if (!voice && vs.length) note.innerHTML = "Aucune voix française trouvée sur cet appareil : la lecture risque d'être incorrecte. Demandez l'enregistrement à votre professeur.";
      }
      pick();
      if (typeof speechSynthesis.onvoiceschanged !== "undefined") speechSynthesis.onvoiceschanged = pick;
      var rateSel = tts.querySelector("[data-a=rate]");
      tts.querySelector("[data-a=play]").addEventListener("click", function () {
        speechSynthesis.cancel();
        var phrases = cfg.texte.match(/[^.!?…]+[.!?…]+["»]?\s*/g) || [cfg.texte];
        phrases.forEach(function (p) {
          var u = new SpeechSynthesisUtterance(p.trim());
          u.lang = "fr-FR"; if (voice) u.voice = voice;
          u.rate = parseFloat(rateSel.value);
          speechSynthesis.speak(u);
        });
      });
      tts.querySelector("[data-a=stop]").addEventListener("click", function () { speechSynthesis.cancel(); });
    }
    if (cfg.src) {
      player.src = cfg.src;
      player.addEventListener("error", useTTS);
      player.addEventListener("loadedmetadata", function () { note.innerHTML = "Enregistrement audio."; });
    } else {
      useTTS();
    }
  }


  /* ---------- Saisie courte (chiffres, mots entendus) ---------- */
  function normSaisie(s) {
    return noAcc(norm(s)).replace(/\b(metres?|m|morts?|personnes)\b/g, " ").replace(/\./g, ",").replace(/\s+/g, "");
  }
  function saisie(root, cfg) {
    vshell(root, cfg, function (list) {
      return cfg.items.map(function (it, idx) {
        var box = el("div", "item");
        var parts = it.text.split("___");
        var line = el("div", "conj-line");
        line.appendChild(el("span", "n", (idx + 1) + "."));
        if (parts[0]) line.appendChild(el("span", null, parts[0]));
        var input = el("input");
        input.type = "text"; input.lang = "fr";
        if (it.chiffre) input.setAttribute("inputmode", "decimal");
        input.style.width = it.chiffre ? "7em" : "12em";
        input.setAttribute("autocomplete", "off"); input.setAttribute("autocapitalize", "none");
        input.setAttribute("autocorrect", "off"); input.setAttribute("spellcheck", "false");
        input.setAttribute("aria-label", "Réponse " + (idx + 1));
        line.appendChild(input);
        if (parts[1]) line.appendChild(el("span", null, parts[1]));
        box.appendChild(line);
        if (!it.chiffre) addAccents(box, input);
        var fb = el("p", "fb"); fb.setAttribute("aria-live", "polite"); box.appendChild(fb);
        list.appendChild(box);
        var okList = it.answers.map(normSaisie);
        return {
          answered: function () { return !!normSaisie(input.value); },
          check: function () {
            input.readOnly = true;
            var v = normSaisie(input.value), ok = okList.indexOf(v) > -1;
            input.classList.add(ok ? "is-ok" : "is-ko");
            if (ok) { fb.className = "fb ok"; fb.innerHTML = fbOk(it); }
            else {
              var key = v && Object.keys(it.fb || {}).find(function (k) { return normSaisie(k) === v; });
              fb.className = "fb ko";
              fb.innerHTML = '<b class="t">' + (v ? "Pas tout à fait." : "Pas de réponse.") + "</b> " + (key ? it.fb[key] + " " : "") + "Réponse : <em>" + esc(it.answers[0]) + "</em>." + (it.ok ? " " + it.ok : "");
            }
            return ok;
          }
        };
      });
    });
  }

  /* ---------- Tableau récapitulatif ----------
     Exos.bilan(element, { titre: "…", exos: ["id1", "id2"] }) */
  function bilan(root, cfg) {
    root.classList.add("bilan-res");
    function render() {
      var regs = cfg.exos.map(function (id) { return REG.filter(function (r) { return r.root.id === id; })[0]; }).filter(Boolean);
      var pts = 0, max = 0, faits = 0;
      var rows = regs.map(function (r) {
        max += r.total; if (r.score !== null) { pts += r.score; faits++; }
        return "<tr><td>" + (r.cfg.num ? r.cfg.num + ". " : "") + esc(String(r.cfg.titre).replace(/<[^>]+>/g, "")) + "</td><td>" + (r.score === null ? "— / " + r.total : r.score + " / " + r.total) + "</td></tr>";
      }).join("");
      root.innerHTML = "<h3>Récapitulatif" + (cfg.titre ? " · " + esc(cfg.titre) : "") + "</h3>" +
        "<table><tbody>" + rows + '<tr class="tot"><td>Total</td><td>' + pts + " / " + max + "</td></tr></tbody></table>" +
        '<p class="notice">' + (faits === regs.length ? "Tous les exercices sont vérifiés. Faites une capture d'écran de ce tableau et remettez-la dans Classroom."
          : "Exercices vérifiés : " + faits + " / " + regs.length + ".") + "</p>";
    }
    document.addEventListener("exos:update", render);
    render();
  }

  window.Exos = { bilan: bilan, qcm: qcm, conj: conj, ordre: ordre, saisie: saisie, audio: audio, diagnose: diagnose, expected: expected };
})();
