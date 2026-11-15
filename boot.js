// Démarrage de l'interface web : écran de chargement, refus d'être affichée
// dans un cadre (anti-clickjacking) et choix app / navigateur pour les liens
// des e-mails. Fichier séparé (pas de script dans la page) : la politique de
// sécurité du contenu (tool/web_csp.sh) n'autorise que les scripts du site.
(function () {
  function start() {
    var s = document.createElement("script");
    var meta = document.querySelector('meta[name="flutter-bootstrap"]');
    s.src = (meta && meta.content) || "flutter_bootstrap.js";
    s.async = true;
    document.body.appendChild(s);
  }
  // L'écran de chargement disparaît dès la première image de l'app.
  window.addEventListener("flutter-first-frame", function () {
    var l = document.getElementById("loading");
    if (l) l.remove();
  });

  // Anti-clickjacking : jamais dans un cadre d'un autre site (GitHub
  // Pages ne permet pas l'en-tête X-Frame-Options / frame-ancestors).
  if (window.top !== window.self) {
    document.getElementById("loading").hidden = true;
    var framed = document.getElementById("choose");
    framed.hidden = false;
    framed.querySelector(".text").textContent =
      "Field Assistant ne s’affiche pas à l’intérieur d’un autre site.";
    var open = document.getElementById("open-app");
    open.textContent = "Ouvrir Field Assistant";
    open.href = window.location.href;
    open.target = "_top";
    open.rel = "noopener";
    document.getElementById("stay").remove();
    return;
  }

  var hash = window.location.hash || "";
  var phone = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  // Session transmise dans l'adresse (invitation d'un technicien, lien
  // « choisir un mot de passe » envoyé par le serveur).
  if (phone && hash.indexOf("access_token=") !== -1) {
    document.getElementById("loading").hidden = true;
    document.getElementById("choose").hidden = false;
    document.getElementById("open-app").href =
      "fieldassistant://auth-callback" + hash;
    document.getElementById("stay").onclick = function () {
      document.getElementById("choose").hidden = true;
      document.getElementById("loading").hidden = false;
      start();
    };
    return;
  }
  start();
})();

// Invitation à installer l'app sur l'écran d'accueil (téléphone, navigateur).
// iPhone : Safari n'a pas de fenêtre d'installation, on montre comment faire
// (Partager › Sur l'écran d'accueil). Android : vraie fenêtre (Chrome).
(function () {
  var KEY = "fa_install_hint_closed";
  try {
    if (localStorage.getItem(KEY)) return;
  } catch (e) {}
  if (window.location.host.indexOf("admin.") === 0) return;
  if (window.location.hash.indexOf("access_token=") !== -1) return;
  var standalone =
    window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
  if (standalone) return;
  var ua = navigator.userAgent;
  var ios = /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  var deferred = null;

  function close() {
    var el = document.getElementById("install-hint");
    if (el) el.remove();
    try {
      localStorage.setItem(KEY, "1");
    } catch (e) {}
  }

  function show(html, action) {
    if (document.getElementById("install-hint")) return;
    var box = document.createElement("div");
    box.id = "install-hint";
    box.setAttribute("role", "dialog");
    box.style.cssText =
      "position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));" +
      "z-index:2147483647;background:#FCFAF6;color:#24211D;border:1px solid #E4DCCF;" +
      "border-radius:16px;padding:14px 44px 14px 14px;box-shadow:0 8px 28px rgba(0,0,0,.18);" +
      "font:15px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;" +
      "display:flex;gap:12px;align-items:center";
    box.innerHTML =
      '<img src="icons/Icon-192.png" alt="" style="width:44px;height:44px;border-radius:10px;flex:none">' +
      "<div>" + html + "</div>" +
      '<button type="button" aria-label="Fermer" style="position:absolute;top:6px;right:6px;' +
      'border:0;background:none;font-size:22px;line-height:1;color:#6B645B;padding:8px;cursor:pointer">×</button>';
    box.querySelector("button").onclick = close;
    if (action) {
      var b = box.querySelector("[data-install]");
      if (b) b.onclick = action;
    }
    document.body.appendChild(box);
  }

  var share =
    '<svg viewBox="0 0 24 24" width="17" height="17" style="vertical-align:-3px" fill="none" ' +
    'stroke="#E8710A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11v9h12v-9"/></svg>';

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    show(
      "<strong>Installez Field Assistant</strong><br>Elle s'ouvrira comme une app, depuis l'écran d'accueil. " +
        '<button type="button" data-install style="margin-top:8px;display:block;border:0;' +
        'background:#E8710A;color:#24211D;font-weight:600;border-radius:10px;padding:9px 14px">Installer</button>',
      function () {
        if (!deferred) return;
        deferred.prompt();
        deferred.userChoice.then(close, close);
      }
    );
  });

  if (ios) {
    window.addEventListener("flutter-first-frame", function () {
      setTimeout(function () {
        show(
          "<strong>Installez Field Assistant</strong><br>Touchez " + share +
            " <strong>Partager</strong>, puis <strong>« Sur l'écran d'accueil »</strong>."
        );
      }, 2500);
    });
  }
})();
